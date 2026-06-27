'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import Topbar from '@/components/ui/Topbar';
import { Download, FileText, Globe, Building2, CheckCircle } from 'lucide-react';
import { dataService } from '@/lib/dataService';
import { calculateResearchReadiness, generateAIInsights } from '@/lib/researchReadiness';

export default function AdminReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ full_name: string; email: string; role: string } | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [colleges, setColleges] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('hcip_user');
    if (!s) { router.push('/login'); return; }
    const u = JSON.parse(s);
    if (u.role !== 'super_admin') { router.push('/dashboard'); return; }
    setUser(u);

    // Fetch colleges and all survey responses
    Promise.all([
      dataService.getColleges(),
      dataService.getSurveyResponses()
    ]).then(([colList, resList]) => {
      setColleges(colList);
      setResponses(resList);
      setMounted(true);
    }).catch(err => {
      console.warn('Error loading admin reports data:', err);
      setMounted(true);
    });
  }, [router]);

  if (!mounted || !user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  const handleDownload = async (id: string) => {
    setGenerating(id);
    setDone(null);
    await new Promise(r => setTimeout(r, 1500));

    let targetResponses = responses;
    let collegeName = 'National';
    let fileType = '';

    if (id.startsWith('national-')) {
      fileType = id.split('-')[1];
    } else {
      const parts = id.split('-');
      const colId = parts.slice(0, -1).join('-');
      fileType = parts[parts.length - 1];
      const colObj = colleges.find(c => c.id === colId);
      collegeName = colObj ? colObj.name : 'College';
      targetResponses = responses.filter(r => r.college_id === colId);
    }

    const sanitizeFilename = (name?: string) => name ? name.replace(/\s/g, '_') : 'National';

    if (fileType === 'csv') {
      const headers = ['ID','College','Department','Year','Gender','Career Goal','Awareness Rating','Has Research','Knows Publication','Readiness Score','Created At'];
      const rows = targetResponses.map(r => [
        r.id, r.college_name, r.student_department, r.student_year, r.student_gender, r.career_goal,
        r.awareness_rating, r.has_done_research ? 'Yes' : 'No', r.knows_publication ? 'Yes' : 'No', r.research_readiness_score,
        new Date(r.created_at).toLocaleDateString()
      ]);
      const csv = [headers, ...rows].map(row => row.map(val => `"${val}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `HCIP_Report_${sanitizeFilename(collegeName)}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } 
    
    else if (fileType === 'excel') {
      const headers = ['ID','College','Department','Year','Gender','Career Goal','Awareness Rating','Has Research','Knows Publication','Readiness Score','Created At'];
      let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
      html += '<head><meta charset="utf-8"/><style>table { border-collapse: collapse; } th { background-color: #0E8C8C; color: white; } th, td { border: 1px solid #CBD5E1; padding: 8px; text-align: left; }</style></head><body>';
      html += `<h2>Healix Campus Insights Platform — Survey Responses Report</h2>`;
      html += `<h3>College/Scope: ${collegeName}</h3>`;
      html += `<h3>Date Generated: ${new Date().toLocaleDateString()}</h3>`;
      html += '<br/><table><tr>';
      headers.forEach(h => { html += `<th>${h}</th>`; });
      html += '</tr>';
      targetResponses.forEach(r => {
        html += `<tr>
          <td>${r.id}</td>
          <td>${r.college_name}</td>
          <td>${r.student_department}</td>
          <td>${r.student_year}</td>
          <td>${r.student_gender}</td>
          <td>${r.career_goal}</td>
          <td>${r.awareness_rating}</td>
          <td>${r.has_done_research ? 'Yes' : 'No'}</td>
          <td>${r.knows_publication ? 'Yes' : 'No'}</td>
          <td>${r.research_readiness_score}</td>
          <td>${new Date(r.created_at).toLocaleDateString()}</td>
        </tr>`;
      });
      html += '</table></body></html>';
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `HCIP_Report_${sanitizeFilename(collegeName)}_${new Date().toISOString().split('T')[0]}.xls`;
      a.click(); URL.revokeObjectURL(url);
    } 
    
    else if (fileType === 'pdf') {
      const readiness = calculateResearchReadiness(targetResponses.map(r => ({
        awareness_rating:r.awareness_rating, has_done_research:r.has_done_research,
        knows_publication:r.knows_publication, challenges:r.challenges,
        research_interests:r.research_interests, programs_requested:r.programs_requested,
      })));

      const insights = generateAIInsights(targetResponses.map(r => ({
        research_interests:r.research_interests, challenges:r.challenges, career_goal:r.career_goal,
        programs_requested:r.programs_requested, has_done_research:r.has_done_research,
        knows_publication:r.knows_publication, awareness_rating:r.awareness_rating, student_department:r.student_department,
      })));

      const avgAwareness = targetResponses.length > 0
        ? (targetResponses.reduce((s,r)=>s+r.awareness_rating,0)/targetResponses.length).toFixed(1)
        : '0.0';
      const depts = [...new Set(targetResponses.map(r=>r.student_department))].length;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        let pdfHtml = `
          <html>
            <head>
              <title>Healix HCIP Survey Insights Report — ${collegeName}</title>
              <style>
                body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1E293B; padding: 40px; line-height: 1.6; }
                .header { text-align: center; border-bottom: 2px solid #0E8C8C; padding-bottom: 20px; margin-bottom: 40px; }
                .logo-text { font-size: 24px; font-weight: bold; color: #0E8C8C; }
                .title { font-size: 32px; font-weight: 800; margin-top: 10px; }
                .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                .meta-table td { padding: 10px; border-bottom: 1px solid #E2E8F0; }
                .meta-label { font-weight: bold; color: #64748B; width: 150px; }
                .section { margin-bottom: 30px; page-break-inside: avoid; }
                .section-title { font-size: 20px; font-weight: 700; border-left: 4px solid #0E8C8C; padding-left: 10px; margin-bottom: 15px; }
                .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
                .stat-card { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 15px; border-radius: 8px; text-align: center; }
                .stat-val { font-size: 24px; font-weight: bold; color: #0E8C8C; margin-top: 5px; }
                .insight-item { border-left: 2px solid #2563EB; padding-left: 12px; margin-bottom: 10px; font-size: 14px; }
                .data-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                .data-table th { background: #0E8C8C; color: white; padding: 8px; text-align: left; }
                .data-table td { padding: 8px; border-bottom: 1px solid #E2E8F0; }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="logo-text">HEALIX TECHNOLOGIES PVT. LTD.</div>
                <div class="title">Campus Research Intelligence Report</div>
                <div>${collegeName} Overview</div>
              </div>
              <div class="section">
                <table class="meta-table">
                  <tr>
                    <td class="meta-label">College/Scope</td>
                    <td>${collegeName}</td>
                    <td class="meta-label">Generated By</td>
                    <td>Super Admin Profile</td>
                  </tr>
                  <tr>
                    <td class="meta-label">Generated On</td>
                    <td>${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</td>
                    <td class="meta-label">Readiness Index</td>
                    <td style="font-weight: bold; color: #2563EB;">${readiness.score}/100 (${readiness.label})</td>
                  </tr>
                </table>
              </div>
              
              <div class="section">
                <div class="stat-grid">
                  <div class="stat-card">
                    <div>Total Responses</div>
                    <div class="stat-val">${targetResponses.length}</div>
                  </div>
                  <div class="stat-card">
                    <div>Departments Covered</div>
                    <div class="stat-val">${depts}</div>
                  </div>
                  <div class="stat-card">
                    <div>Avg. Research Awareness</div>
                    <div class="stat-val">${avgAwareness}/5.0</div>
                  </div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Key AI-Generated Insights</div>
                ${insights.map(ins => `<div class="insight-item">${ins}</div>`).join('')}
              </div>
              
              <div class="section" style="page-break-before: always;">
                <div class="section-title">Survey Raw Response Summary (Sample)</div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>College</th>
                      <th>Department</th>
                      <th>Year</th>
                      <th>Goal</th>
                      <th>Rating</th>
                      <th>Has Research</th>
                      <th>Readiness</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${targetResponses.slice(0, 20).map(r => `
                      <tr>
                        <td>${r.college_name}</td>
                        <td>${r.student_department}</td>
                        <td>${r.student_year}</td>
                        <td>${r.career_goal}</td>
                        <td>${r.awareness_rating}/5</td>
                        <td>${r.has_done_research ? 'Yes' : 'No'}</td>
                        <td><strong>${r.research_readiness_score}</strong></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                ${targetResponses.length > 20 ? `<p style="font-size:11px; color:#64748B; text-align:center; margin-top:10px;">Showing sample of first 20 responses of ${targetResponses.length} total records.</p>` : ''}
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  window.close();
                };
              </script>
            </body>
          </html>
        `;
        printWindow.document.write(pdfHtml);
        printWindow.document.close();
      }
    }

    setGenerating(null);
    setDone(id);
    setTimeout(() => setDone(null), 3000);
  };

  const bulkOptions = [
    { id: 'national-pdf', icon: FileText, label: 'National PDF Report', sub: 'All colleges, all data, AI insights', color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
    { id: 'national-excel', icon: Download, label: 'National Excel', sub: 'Complete multi-sheet dataset', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
    { id: 'national-csv', icon: Download, label: 'National CSV', sub: 'Raw data export for analysis', color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
  ];

  return (
    <div className="app-layout">
      <Sidebar role="super_admin" user={user as { full_name: string; email: string }} />
      <div className="main-content">
        <Topbar title="Reports" subtitle="National & College" />
        <div className="page-content">
          <div className="page-header" style={{ marginBottom: 28 }}>
            <h1 className="page-title">Report Center</h1>
            <p className="page-subtitle">Download national, state, or college-specific research intelligence reports</p>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header"><div className="card-title"><Globe size={16} color="#0E8C8C" /> Bulk Downloads</div></div>
            <div className="card-body">
              <div className="grid-responsive-3">
                {bulkOptions.map(opt => (
                  <div key={opt.id} style={{ border: '1px solid var(--border)', background: opt.bg, borderRadius: 12, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: opt.bg, border: `1px solid ${opt.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: opt.color }}>
                      <opt.icon size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>{opt.sub}</div>
                      <button
                        id={`dl-${opt.id}`}
                        className="btn btn-outline btn-sm"
                        onClick={() => handleDownload(opt.id)}
                        disabled={!!generating}
                        style={{ borderColor: opt.color, color: opt.color }}
                      >
                        {generating === opt.id
                          ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: opt.color }} /> Generating...</>
                          : done === opt.id
                          ? <><CheckCircle size={14} /> Downloaded</>
                          : <><Download size={14} /> Download</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title"><Building2 size={16} color="#0E8C8C" /> College Reports</div></div>
            <div className="data-table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>College</th>
                    <th>State</th>
                    <th>Responses</th>
                    <th>Last Generated</th>
                    <th>PDF</th>
                    <th>Excel</th>
                    <th>CSV</th>
                  </tr>
                </thead>
                <tbody>
                  {colleges.map((c, i) => {
                    const colResCount = responses.filter(r => r.college_id === c.id).length;
                    return (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.state}</td>
                        <td><span className="badge badge-teal">{colResCount}</span></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          {new Date(Date.now() - (i + 1) * 86400000).toLocaleDateString('en-IN')}
                        </td>
                        {(['pdf', 'excel', 'csv'] as const).map(type => (
                          <td key={type}>
                            <button
                              id={`dl-${c.id}-${type}`}
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleDownload(`${c.id}-${type}`)}
                              disabled={!!generating}
                              style={{ padding: '4px 10px', fontSize: 12 }}
                            >
                              {generating === `${c.id}-${type}`
                                ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                                : done === `${c.id}-${type}`
                                ? <CheckCircle size={12} color="#059669" />
                                : <Download size={12} />}
                            </button>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
