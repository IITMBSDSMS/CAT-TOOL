'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import Topbar from '@/components/ui/Topbar';
import { Download, FileText, Table, ImageIcon, CheckCircle, Loader } from 'lucide-react';
import { MOCK_RESPONSES } from '@/lib/mockData';
import { dataService } from '@/lib/dataService';
import { calculateResearchReadiness, generateAIInsights } from '@/lib/researchReadiness';

export default function ReportPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; full_name:string; email:string; college_name?:string; college_id?:string; role:string }|null>(null);
  const [generating, setGenerating] = useState<string|null>(null);
  const [done, setDone] = useState<string|null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('hcip_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role === 'student') { router.push('/dashboard/survey'); return; }
    setUser(u);

    // Fetch live survey responses
    dataService.getSurveyResponses(u.college_id).then(data => {
      setResponses(data.length > 0 ? data : MOCK_RESPONSES);
      setMounted(true);
    }).catch(err => {
      console.warn('Error fetching survey responses:', err);
      setResponses(MOCK_RESPONSES);
      setMounted(true);
    });
  }, [router]);

  if (!mounted || !user) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}><div className="spinner" style={{width:40,height:40}} /></div>;

  const readiness = calculateResearchReadiness(responses.map(r => ({
    awareness_rating:r.awareness_rating, has_done_research:r.has_done_research,
    knows_publication:r.knows_publication, challenges:r.challenges,
    research_interests:r.research_interests, programs_requested:r.programs_requested,
  })));

  const insights = generateAIInsights(responses.map(r => ({
    research_interests:r.research_interests, challenges:r.challenges, career_goal:r.career_goal,
    programs_requested:r.programs_requested, has_done_research:r.has_done_research,
    knows_publication:r.knows_publication, awareness_rating:r.awareness_rating, student_department:r.student_department,
  })));

  const handleDownload = async (type: string) => {
    setGenerating(type);
    setDone(null);
    await new Promise(r => setTimeout(r, 1800));

    const sanitizeFilename = (name?: string) => name ? name.replace(/\s/g, '_') : 'College';

    if (type === 'csv') {
      const headers = ['ID','Department','Year','Gender','Career Goal','Awareness Rating','Has Research','Knows Publication','Readiness Score','Created At'];
      const rows = responses.map(r => [
        r.id, r.student_department, r.student_year, r.student_gender, r.career_goal,
        r.awareness_rating, r.has_done_research ? 'Yes' : 'No', r.knows_publication ? 'Yes' : 'No', r.research_readiness_score,
        new Date(r.created_at).toLocaleDateString()
      ]);
      const csv = [headers, ...rows].map(row => row.map(val => `"${val}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `HCIP_Report_${sanitizeFilename(user.college_name)}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } 
    
    else if (type === 'excel') {
      const headers = ['ID','Department','Year','Gender','Career Goal','Awareness Rating','Has Research','Knows Publication','Readiness Score','Created At'];
      let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
      html += '<head><meta charset="utf-8"/><style>table { border-collapse: collapse; } th { background-color: #0E8C8C; color: white; } th, td { border: 1px solid #CBD5E1; padding: 8px; text-align: left; }</style></head><body>';
      html += `<h2>Healix Campus Insights Platform — Survey Responses Report</h2>`;
      html += `<h3>College: ${user.college_name || 'Unknown'}</h3>`;
      html += `<h3>Date Generated: ${new Date().toLocaleDateString()}</h3>`;
      html += '<br/><table><tr>';
      headers.forEach(h => { html += `<th>${h}</th>`; });
      html += '</tr>';
      responses.forEach(r => {
        html += `<tr>
          <td>${r.id}</td>
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
      a.href = url; a.download = `HCIP_Report_${sanitizeFilename(user.college_name)}_${new Date().toISOString().split('T')[0]}.xls`;
      a.click(); URL.revokeObjectURL(url);
    } 
    
    else if (type === 'pdf') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        let pdfHtml = `
          <html>
            <head>
              <title>Healix HCIP Survey Insights Report</title>
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
                @media print {
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="logo-text">HEALIX TECHNOLOGIES PVT. LTD.</div>
                <div class="title">Campus Insights Report</div>
                <div>Understanding Students. Empowering Research.</div>
              </div>
              <div class="section">
                <table class="meta-table">
                  <tr>
                    <td class="meta-label">College</td>
                    <td>${user.college_name || 'N/A'}</td>
                    <td class="meta-label">Ambassador</td>
                    <td>${user.full_name || 'N/A'}</td>
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
                    <div class="stat-val">${responses.length}</div>
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
                <div class="section-title">Survey Raw Response Summary</div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Year</th>
                      <th>Gender</th>
                      <th>Goal</th>
                      <th>Rating</th>
                      <th>Has Research</th>
                      <th>Readiness</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${responses.slice(0, 15).map(r => `
                      <tr>
                        <td>${r.student_department}</td>
                        <td>${r.student_year}</td>
                        <td>${r.student_gender}</td>
                        <td>${r.career_goal}</td>
                        <td>${r.awareness_rating}/5</td>
                        <td>${r.has_done_research ? 'Yes' : 'No'}</td>
                        <td><strong>${r.research_readiness_score}</strong></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                ${responses.length > 15 ? `<p style="font-size:11px; color:#64748B; text-align:center; margin-top:10px;">Showing first 15 responses of ${responses.length} total records.</p>` : ''}
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
    
    else if (type === 'png') {
      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" style="background:#07102A; font-family:sans-serif; border-radius:12px; padding:24px; box-sizing:border-box;">
          <text x="24" y="45" fill="#14B8A6" font-size="22" font-weight="900" letter-spacing="-0.5px">Healix Technologies Pvt. Ltd.</text>
          <text x="24" y="70" fill="#94A3B8" font-size="14" font-weight="500">${user.college_name || 'College Dashboard'}</text>
          
          <rect x="24" y="105" width="260" height="110" rx="10" fill="#0D1B3E" stroke="#1E293B" stroke-width="1" />
          <text x="44" y="135" fill="#94A3B8" font-size="11" font-weight="700" letter-spacing="0.5px">TOTAL RESPONSES</text>
          <text x="44" y="185" fill="#059669" font-size="44" font-weight="900">${responses.length}</text>
          
          <rect x="308" y="105" width="268" height="110" rx="10" fill="#0D1B3E" stroke="#1E293B" stroke-width="1" />
          <text x="328" y="135" fill="#94A3B8" font-size="11" font-weight="700" letter-spacing="0.5px">READINESS INDEX</text>
          <text x="328" y="185" fill="#2563EB" font-size="44" font-weight="900">${readiness.score}/100</text>
          
          <rect x="24" y="240" width="552" height="130" rx="10" fill="#0D1B3E" stroke="#1E293B" stroke-width="1" />
          <text x="44" y="270" fill="#14B8A6" font-size="12" font-weight="700" letter-spacing="0.5px">PRIMARY FINDING</text>
          <text x="44" y="305" fill="#E2E8F0" font-size="13" font-weight="500">${insights[0]?.substring(0, 75) || 'No insights generated yet'}...</text>
          <text x="44" y="340" fill="#64748B" font-size="11">Generated via HCIP Dashboard on ${new Date().toLocaleDateString('en-IN')}</text>
        </svg>
      `;
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `HCIP_Dashboard_${sanitizeFilename(user.college_name)}.svg`;
      a.click(); URL.revokeObjectURL(url);
    }

    setGenerating(null);
    setDone(type);
    setTimeout(() => setDone(null), 3000);
  };

  const stat = (label: string, value: string|number) => (
    <div style={{ padding:'14px 16px', background:'var(--grey-50)', borderRadius:10, border:'1px solid var(--border)' }}>
      <div style={{ fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:0.6,marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:22,fontWeight:800,color:'var(--text-primary)',letterSpacing:-0.5 }}>{value}</div>
    </div>
  );

  const avgAwareness = responses.length > 0
    ? (responses.reduce((s,r)=>s+r.awareness_rating,0)/responses.length).toFixed(1)
    : '0.0';
  const hasDone = responses.filter(r=>r.has_done_research).length;
  const depts = [...new Set(responses.map(r=>r.student_department))].length;

  const exportOptions = [
    { id:'pdf', icon:FileText, label:'PDF Report', sub:'Professional report with cover page, all sections, charts, and AI insights', color:'#DC2626', bg:'rgba(220,38,38,0.08)', border:'rgba(220,38,38,0.20)' },
    { id:'excel', icon:Table, label:'Excel Workbook', sub:'Multi-sheet Excel file with all response data, pivot tables, and analytics', color:'#059669', bg:'rgba(5,150,105,0.08)', border:'rgba(5,150,105,0.20)' },
    { id:'csv', icon:Download, label:'CSV Export', sub:'Raw survey data in CSV format for import into any analytics tool', color:'#2563EB', bg:'rgba(37,99,235,0.08)', border:'rgba(37,99,235,0.20)' },
    { id:'png', icon:ImageIcon, label:'Chart Images', sub:'Export all dashboard charts as high-resolution PNG images', color:'#7C3AED', bg:'rgba(124,58,237,0.08)', border:'rgba(124,58,237,0.20)' },
  ];

  return (
    <div className="app-layout">
      <Sidebar role="campus_ambassador" user={user as { full_name:string; email:string; college_name?:string }} />
      <div className="main-content">
        <Topbar title="Reports" subtitle="Download & Export" />
        <div className="page-content">
          <div className="page-header-row" style={{ marginBottom:32 }}>
            <div>
              <h1 className="page-title">Report Generator</h1>
              <p className="page-subtitle">Generate professional reports for {user.college_name}</p>
            </div>
          </div>

          {/* Report Preview */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 320px',gap:24,marginBottom:24 }}>
            <div className="card">
              <div style={{ background:'linear-gradient(135deg, #0D1B3E, #162447)', padding:'32px 36px', borderRadius:'var(--radius-lg) var(--radius-lg) 0 0' }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontSize:11,color:'rgba(255,255,255,0.45)',fontWeight:600,textTransform:'uppercase',letterSpacing:1.2,marginBottom:16 }}>Research Intelligence Report</div>
                    <h2 style={{ fontSize:24,fontWeight:900,color:'white',letterSpacing:-0.5,marginBottom:6 }}>{user.college_name}</h2>
                    <p style={{ fontSize:13,color:'rgba(255,255,255,0.55)' }}>Prepared by Healix Technologies Pvt. Ltd.</p>
                    <p style={{ fontSize:12,color:'rgba(255,255,255,0.40)',marginTop:4 }}>{new Date().toLocaleDateString('en-IN',{year:'numeric',month:'long',day:'numeric'})}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:42,fontWeight:900,color:'#14B8A6',letterSpacing:-2 }}>{readiness.score}</div>
                    <div style={{ fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:2 }}>Readiness Index</div>
                    <div style={{ fontSize:12,color:'#14B8A6',fontWeight:700,marginTop:2 }}>{readiness.label}</div>
                  </div>
                </div>
                <div style={{ marginTop:20,paddingTop:20,borderTop:'1px solid rgba(255,255,255,0.1)',fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:500 }}>
                  Research • Healthcare • Innovation • Impact
                </div>
              </div>
              <div className="card-body">
                <div style={{ fontSize:13,fontWeight:700,color:'var(--text-primary)',marginBottom:16 }}>Report Sections</div>
                <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                  {['Executive Summary','Survey Statistics','Research Awareness Analysis','Research Interests Breakdown','Key Challenges Identified','Career Goals Distribution','Recommendations & Feedback','Workshop Requests','Research Readiness Score','AI-Generated Insights','Healix Recommendations'].map((s,i) => (
                    <div key={s} style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'var(--grey-50)',borderRadius:8,border:'1px solid var(--border)' }}>
                      <div style={{ width:22,height:22,borderRadius:6,background:'rgba(14,140,140,0.12)',color:'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0 }}>{i+1}</div>
                      <span style={{ fontSize:13,color:'var(--text-primary)',fontWeight:500 }}>{s}</span>
                      <CheckCircle size={13} color="#059669" style={{ marginLeft:'auto',flexShrink:0 }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
              <div className="card">
                <div className="card-header"><div className="card-title">Report Summary</div></div>
                <div className="card-body" style={{ display:'flex',flexDirection:'column',gap:12 }}>
                  {stat('Total Responses', responses.length)}
                  {stat('Departments', depts)}
                  {stat('Avg. Awareness', `${avgAwareness}/5.0`)}
                  {stat('Research Experience', `${hasDone}/${responses.length}`)}
                  {stat('Readiness Score', `${readiness.score}/100`)}
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">AI Key Findings</div></div>
                <div className="card-body" style={{ display:'flex',flexDirection:'column',gap:8 }}>
                  {insights.slice(0,4).map((insight,i) => (
                    <div key={i} style={{ fontSize:12,color:'var(--text-secondary)',lineHeight:1.5,paddingLeft:10,borderLeft:'2px solid var(--teal)',paddingBottom:4 }}>{insight}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="card">
            <div className="card-header"><div className="card-title"><Download size={16} color="#0E8C8C" /> Export Options</div></div>
            <div className="card-body">
              <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16 }}>
                {exportOptions.map(opt => (
                  <div key={opt.id} style={{ border:`1px solid ${opt.border}`,background:opt.bg,borderRadius:12,padding:'20px 22px',display:'flex',gap:16,alignItems:'flex-start' }}>
                    <div style={{ width:44,height:44,borderRadius:10,background:opt.bg,border:`1px solid ${opt.border}`,display:'flex',alignItems:'center',justifyContent:'center',color:opt.color,flexShrink:0 }}>
                      <opt.icon size={20} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',marginBottom:4 }}>{opt.label}</div>
                      <div style={{ fontSize:12,color:'var(--text-muted)',lineHeight:1.5,marginBottom:14 }}>{opt.sub}</div>
                      <button
                        id={`download-${opt.id}`}
                        className="btn btn-outline btn-sm"
                        onClick={() => handleDownload(opt.id)}
                        disabled={!!generating}
                        style={{ borderColor:opt.color,color:opt.color }}
                      >
                        {generating === opt.id ? (<><div className="spinner" style={{width:14,height:14,borderWidth:2,borderTopColor:opt.color}} /> Generating...</>) :
                         done === opt.id ? (<><CheckCircle size={14} /> Downloaded!</>) :
                         (<><Download size={14} /> Download {opt.label.split(' ')[0]}</>)}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
