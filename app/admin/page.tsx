'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import Topbar from '@/components/ui/Topbar';
import KPICard from '@/components/ui/KPICard';
import GaugeChart from '@/components/ui/GaugeChart';
import {
  Building2, Users, BookOpen, BarChart3, Brain,
  TrendingUp, Globe, Download, AlertCircle
} from 'lucide-react';
import { MOCK_COLLEGES, MOCK_RESPONSES, MOCK_USERS } from '@/lib/mockData';
import { dataService } from '@/lib/dataService';
import { calculateResearchReadiness, generateAIInsights } from '@/lib/researchReadiness';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid, LineChart, Line
} from 'recharts';

const COLORS = ['#0E8C8C','#2563EB','#059669','#D97706','#DC2626','#7C3AED','#0891B2','#BE185D'];

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ full_name: string; email: string; role: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [colleges, setColleges] = useState<any[]>([]);
  const [ambassadors, setAmbassadors] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('hcip_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role === 'student') { router.push('/dashboard/survey'); return; }
    if (u.role !== 'super_admin') { router.push('/dashboard'); return; }
    setUser(u);

    // Fetch live dashboard data
    Promise.all([
      dataService.getColleges(),
      dataService.getAmbassadors(),
      dataService.getSurveyResponses()
    ]).then(([colData, ambData, resData]) => {
      setColleges(colData.length > 0 ? colData : MOCK_COLLEGES);
      setAmbassadors(ambData.length > 0 ? ambData : MOCK_USERS.filter(u => u.role === 'campus_ambassador'));
      setResponses(resData.length > 0 ? resData : MOCK_RESPONSES);
      setMounted(true);
    }).catch(err => {
      console.warn('Error fetching admin dashboard data:', err);
      setColleges(MOCK_COLLEGES);
      setAmbassadors(MOCK_USERS.filter(u => u.role === 'campus_ambassador'));
      setResponses(MOCK_RESPONSES);
      setMounted(true);
    });
  }, [router]);

  if (!mounted || !user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  const readiness = calculateResearchReadiness(responses.map(r => ({
    awareness_rating: r.awareness_rating, has_done_research: r.has_done_research,
    knows_publication: r.knows_publication, challenges: r.challenges,
    research_interests: r.research_interests, programs_requested: r.programs_requested,
  })));

  const insights = generateAIInsights(responses.map(r => ({
    research_interests: r.research_interests, challenges: r.challenges, career_goal: r.career_goal,
    programs_requested: r.programs_requested, has_done_research: r.has_done_research,
    knows_publication: r.knows_publication, awareness_rating: r.awareness_rating, student_department: r.student_department,
  })));

  // College comparison
  const collegeData = colleges.map(c => {
    const collegeResponses = responses.filter(r => r.college_id === c.id);
    const collegeReadiness = calculateResearchReadiness(collegeResponses.map(r => ({
      awareness_rating: r.awareness_rating, has_done_research: r.has_done_research,
      knows_publication: r.knows_publication, challenges: r.challenges,
      research_interests: r.research_interests, programs_requested: r.programs_requested,
    })));
    return {
      id: c.id,
      name: c.name.length > 15 ? c.name.slice(0,15)+'...' : c.name,
      fullName: c.name,
      state: c.state,
      responses: collegeResponses.length,
      readiness: collegeReadiness.score
    };
  });

  // State-wise distribution
  const stateData = colleges.reduce((acc, c) => {
    acc[c.state] = (acc[c.state] || 0) + 1;
    return acc;
  }, {} as Record<string,number>);
  const statePieData = Object.entries(stateData).map(([name, value]) => ({ name, value }));

  // Department across all colleges
  const deptCounts: Record<string,number> = {};
  responses.forEach(r => { deptCounts[r.student_department] = (deptCounts[r.student_department]||0)+1; });
  const deptData = Object.entries(deptCounts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,value]) => ({ name: name.length>14?name.slice(0,14)+'...':name, value }));

  // Monthly growth progression
  const monthlyData = ['Jan','Feb','Mar','Apr','May','Jun'].map((m,i) => {
    const factor = i + 1;
    return {
      month: m,
      responses: Math.min(responses.length, Math.floor((responses.length / 6) * factor) + (responses.length % 6 > i ? 1 : 0)),
      colleges: Math.min(colleges.length, Math.floor((colleges.length / 6) * factor) + (colleges.length % 6 > i ? 1 : 0)),
    };
  });

  const tooltipStyle = { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, fontSize:13 };
  const totalResponses = responses.length;
  const totalAmbassadorsCount = ambassadors.length;

  return (
    <div className="app-layout">
      <Sidebar role="super_admin" user={user as { full_name: string; email: string }} />
      <div className="main-content">
        <Topbar title="National Dashboard" subtitle="Healix HQ" notifCount={3} />
        <div className="page-content">

          {/* Welcome Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #07102A 0%, #0D1B3E 60%, #0A6B6B 100%)',
            borderRadius: 'var(--radius-xl)', padding: '28px 36px', marginBottom: 32,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: -50, right: 100, width: 180, height: 180, background: 'radial-gradient(circle, rgba(14,140,140,0.25) 0%, transparent 70%)', borderRadius: '50%' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>Healix HQ — Super Admin</div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', marginBottom: 6 }}>Welcome, {user.full_name}</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>National Research Intelligence Dashboard · Real-time insights across all colleges</p>
            </div>
            <div style={{ display: 'flex', gap: 24, position: 'relative', zIndex: 1 }}>
              {[
                { label:'Colleges', value:colleges.length },
                { label:'Responses', value:totalResponses },
                { label:'Ambassadors', value:totalAmbassadorsCount },
              ].map(s => (
                <div key={s.label} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:36,fontWeight:900,color:'#14B8A6',letterSpacing:-2,lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:4,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
            <KPICard label="Total Colleges" value={colleges.length} icon={<Building2 size={20} />} iconBg="rgba(14,140,140,0.10)" iconColor="#0E8C8C" trend={8} delay={0} />
            <KPICard label="All Responses" value={totalResponses} icon={<BookOpen size={20} />} iconBg="rgba(37,99,235,0.10)" iconColor="#2563EB" trend={15} delay={100} />
            <KPICard label="Ambassadors" value={totalAmbassadorsCount} icon={<Users size={20} />} iconBg="rgba(5,150,105,0.10)" iconColor="#059669" trend={3} delay={200} />
            <KPICard label="Avg Readiness" value={readiness.score} suffix="/100" icon={<Brain size={20} />} iconBg="rgba(124,58,237,0.10)" iconColor="#7C3AED" trend={5} delay={300} />
            <KPICard label="States Covered" value={Object.keys(stateData).length} icon={<Globe size={20} />} iconBg="rgba(217,119,6,0.10)" iconColor="#D97706" trend={2} delay={400} />
          </div>

          {/* College Comparison + Readiness */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 320px',gap:24,marginBottom:24 }}>
            <div className="chart-card">
              <div className="chart-title"><BarChart3 size={16} color="#0E8C8C" /> College Comparison — Responses</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={collegeData} margin={{ top:0,right:0,left:-20,bottom:0 }}>
                  <XAxis dataKey="name" tick={{ fontSize:11,fill:'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize:11,fill:'var(--text-muted)' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="responses" fill="#0E8C8C" radius={[4,4,0,0]} name="Responses" />
                  <Bar dataKey="readiness" fill="#2563EB" radius={[4,4,0,0]} name="Readiness Score" />
                  <Legend wrapperStyle={{ fontSize:12 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <div className="card-header"><div className="card-title"><Brain size={16} color="#0E8C8C" /> National Readiness</div></div>
              <div className="card-body">
                <GaugeChart score={readiness.score} label={readiness.label} color={readiness.color} bgColor={readiness.bgColor} />
              </div>
            </div>
          </div>

          <div className="charts-grid" style={{ marginBottom:24 }}>
            {/* Growth */}
            <div className="chart-card">
              <div className="chart-title"><TrendingUp size={16} color="#2563EB" /> National Growth</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData} margin={{ top:0,right:0,left:-20,bottom:0 }}>
                  <defs>
                    <linearGradient id="adminGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0E8C8C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0E8C8C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize:11,fill:'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize:11,fill:'var(--text-muted)' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="responses" stroke="#0E8C8C" fill="url(#adminGradient)" strokeWidth={2.5} name="Responses" />
                  <Line type="monotone" dataKey="colleges" stroke="#2563EB" strokeWidth={2} name="Active Colleges" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* State Pie */}
            <div className="chart-card">
              <div className="chart-title"><Globe size={16} color="#D97706" /> State Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statePieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0)*100).toFixed(0)}%`} labelLine={false}>
                    {statePieData.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Insights + College Table */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:24 }}>
            <div className="insights-panel">
              <div className="insights-header">
                <Brain size={20} color="#14B8A6" />
                <div className="insights-title">National AI Insights</div>
                <div className="insights-badge">Auto-generated</div>
              </div>
              {insights.map((insight,i) => (
                <div key={i} className="insight-item">
                  <div className="insight-dot" />
                  <div className="insight-text">{insight}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title"><Building2 size={16} color="#0E8C8C" /> College Overview</div>
                <button className="btn btn-teal btn-sm" onClick={() => router.push('/admin/colleges')}>Manage All</button>
              </div>
              <div className="data-table-wrap" style={{ border:'none',borderRadius:0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>College</th>
                      <th>State</th>
                      <th>Responses</th>
                      <th>Readiness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collegeData.map((c,i) => (
                      <tr key={i}>
                        <td style={{ fontWeight:600 }}>{c.name}</td>
                        <td style={{ color:'var(--text-muted)' }}>{c.state}</td>
                        <td><span className="badge badge-teal">{c.responses}</span></td>
                        <td>
                          <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                            <div style={{ flex:1,height:6,background:'var(--grey-100)',borderRadius:99 }}>
                              <div style={{ width:`${c.readiness}%`,height:'100%',background:c.readiness>=75?'#059669':c.readiness>=60?'#0E8C8C':'#D97706',borderRadius:99 }} />
                            </div>
                            <span style={{ fontSize:12,fontWeight:700,color:'var(--text-muted)',width:28 }}>{c.readiness}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
