'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import Topbar from '@/components/ui/Topbar';
import { Search, Filter, Edit3, Trash2, Eye, BookOpen } from 'lucide-react';
import { MOCK_RESPONSES } from '@/lib/mockData';
import { SurveyResponse } from '@/lib/supabase';
import { dataService } from '@/lib/dataService';

export default function ResponsesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; full_name:string; email:string; college_name?:string; college_id?: string; role:string }|null>(null);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string|null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('hcip_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role === 'student') { router.push('/dashboard/survey'); return; }
    setUser(u);

    // Fetch survey responses for the college
    dataService.getSurveyResponses(u.college_id).then(data => {
      setResponses(data);
    }).catch(err => console.warn('Error fetching survey responses:', err));
  }, [router]);

  if (!user) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}><div className="spinner" style={{width:40,height:40}} /></div>;

  const depts = [...new Set(MOCK_RESPONSES.map(r => r.student_department))];

  const filtered = responses.filter(r => {
    const matchSearch = search === '' ||
      r.student_department.toLowerCase().includes(search.toLowerCase()) ||
      r.career_goal.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === '' || r.student_department === filterDept;
    return matchSearch && matchDept;
  });

  const selected = responses.find(r => r.id === selectedId);

  const scoreColor = (s: number) => s >= 75 ? '#059669' : s >= 60 ? '#0E8C8C' : s >= 40 ? '#D97706' : '#DC2626';

  return (
    <div className="app-layout">
      <Sidebar role="campus_ambassador" user={user as { full_name:string; email:string; college_name?:string }} />
      <div className="main-content">
        <Topbar title="Responses" subtitle={`${filtered.length} records`} />
        <div className="page-content">
          <div className="page-header-row" style={{ marginBottom:24 }}>
            <div>
              <h1 className="page-title">Survey Responses</h1>
              <p className="page-subtitle">All collected student responses for {user.college_name}</p>
            </div>
            <button className="btn btn-teal" onClick={() => router.push('/dashboard/survey')}>
              + New Response
            </button>
          </div>

          <div className="filter-bar" style={{ marginBottom:20 }}>
            <div className="search-bar" style={{ maxWidth:280 }}>
              <Search size={15} color="var(--text-muted)" />
              <input placeholder="Search responses..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-select" style={{ maxWidth:200 }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="">All Departments</option>
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className={selected ? "grid-responsive-sidebar" : ""} style={{ display: selected ? "grid" : "block", gap: 24 }}>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Department</th>
                    <th>Year</th>
                    <th>Gender</th>
                    <th>Career Goal</th>
                    <th>Awareness</th>
                    <th>Readiness</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign:'center',padding:48,color:'var(--text-muted)' }}>No responses found.</td></tr>
                  ) : filtered.map((r, i) => (
                    <tr key={r.id} style={{ cursor:'pointer', background:selectedId===r.id?'rgba(14,140,140,0.04)':'' }}>
                      <td style={{ color:'var(--text-muted)',fontWeight:500 }}>{i+1}</td>
                      <td style={{ fontWeight:500 }}>{r.student_department}</td>
                      <td><span className="badge badge-navy">{r.student_year}</span></td>
                      <td style={{ color:'var(--text-muted)' }}>{r.student_gender}</td>
                      <td><span className="badge badge-teal">{r.career_goal}</span></td>
                      <td>
                        <div style={{ display:'flex',gap:2 }}>
                          {[1,2,3,4,5].map(n => (
                            <div key={n} style={{ width:6,height:6,borderRadius:2,background:n<=r.awareness_rating?'#0E8C8C':'var(--border)' }} />
                          ))}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight:700,color:scoreColor(r.research_readiness_score) }}>{r.research_readiness_score}</span>
                      </td>
                      <td style={{ color:'var(--text-muted)',fontSize:12 }}>{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                      <td>
                        <div style={{ display:'flex',gap:4 }}>
                          <button className="btn btn-ghost btn-sm" title="View" onClick={() => setSelectedId(selectedId===r.id?null:r.id)} style={{ padding:'4px 8px' }}>
                            <Eye size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selected && (
              <div className="card" style={{ height:'fit-content',position:'sticky',top:'calc(var(--topbar-height) + 32px)' }}>
                <div className="card-header">
                  <div className="card-title"><BookOpen size={16} color="#0E8C8C" /> Response Detail</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedId(null)} style={{ padding:'4px 8px',marginLeft:'auto',fontWeight:700 }}>✕</button>
                </div>
                <div className="card-body" style={{ display:'flex',flexDirection:'column',gap:16 }}>
                  <div>
                    <div style={{ fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.8,marginBottom:6 }}>Student Info</div>
                    <div className="grid-responsive-2" style={{ gap: 8 }}>
                      {[['Department',selected.student_department],['Year',selected.student_year],['Gender',selected.student_gender],['Career',selected.career_goal]].map(([k,v]) => (
                        <div key={k}>
                          <div style={{ fontSize:11,color:'var(--text-muted)' }}>{k}</div>
                          <div style={{ fontSize:13,fontWeight:600,color:'var(--text-primary)' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {selected.student_email && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize:11,color:'var(--text-muted)' }}>Email Address</div>
                        <div style={{ fontSize:13,fontWeight:600,color:'var(--text-primary)',wordBreak:'break-all' }}>{selected.student_email}</div>
                      </div>
                    )}
                  </div>
                  <div className="divider" style={{ margin:'4px 0' }} />
                  <div>
                    <div style={{ fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.8,marginBottom:8 }}>Research Awareness</div>
                    <div style={{ display:'flex',gap:6,alignItems:'center',marginBottom:6 }}>
                      {[1,2,3,4,5].map(n => <div key={n} style={{ width:28,height:28,borderRadius:6,background:n<=selected.awareness_rating?'#0E8C8C':'var(--grey-100)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:n<=selected.awareness_rating?'white':'var(--text-muted)' }}>{n}</div>)}
                    </div>
                    <div style={{ display:'flex',gap:8,marginTop:8 }}>
                      <span className={`badge ${selected.has_done_research?'badge-success':'badge-danger'}`}>{selected.has_done_research?'Has done research':'No research'}</span>
                      <span className={`badge ${selected.knows_publication?'badge-success':'badge-danger'}`}>{selected.knows_publication?'Knows publication':'Unaware of publication'}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.8,marginBottom:8 }}>Interests</div>
                    <div className="chips-grid">{selected.research_interests.map(i => <span key={i} className="chip selected" style={{ fontSize:11,padding:'4px 10px' }}>{i}</span>)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.8,marginBottom:8 }}>Challenges</div>
                    <div className="chips-grid">{selected.challenges.map(c => <span key={c} className="badge badge-warning" style={{ fontSize:11 }}>{c}</span>)}</div>
                  </div>
                  {selected.recommendation_text && (
                    <div>
                      <div style={{ fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.8,marginBottom:6 }}>Recommendation</div>
                      <div style={{ fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,fontStyle:'italic' }}>"{selected.recommendation_text}"</div>
                    </div>
                  )}
                  <div style={{ padding:'12px 14px',background:'rgba(14,140,140,0.06)',border:'1px solid rgba(14,140,140,0.15)',borderRadius:10 }}>
                    <div style={{ fontSize:11,color:'var(--text-muted)' }}>Readiness Score</div>
                    <div style={{ fontSize:28,fontWeight:900,color:scoreColor(selected.research_readiness_score),letterSpacing:-1 }}>{selected.research_readiness_score}<span style={{ fontSize:14,fontWeight:400 }}>/100</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
