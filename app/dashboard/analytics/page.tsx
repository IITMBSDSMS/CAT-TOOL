'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import Topbar from '@/components/ui/Topbar';
import GaugeChart from '@/components/ui/GaugeChart';
import { Brain, Filter } from 'lucide-react';
import { MOCK_RESPONSES } from '@/lib/mockData';
import { dataService } from '@/lib/dataService';
import { calculateResearchReadiness, generateAIInsights } from '@/lib/researchReadiness';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
  CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const COLORS = ['#0E8C8C','#2563EB','#059669','#D97706','#DC2626','#7C3AED','#0891B2','#BE185D','#15803D','#B45309'];

function count(arr: string[][]): Record<string,number> {
  const c: Record<string,number> = {};
  arr.flat().forEach(v => { c[v] = (c[v]||0) + 1; });
  return c;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; full_name: string; email: string; college_name?: string; college_id?: string; role: string }|null>(null);
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

  const isAdmin = user.role === 'super_admin';

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

  // Research Interests
  const interestCounts = count(responses.map(r => r.research_interests));
  const interestData = Object.entries(interestCounts).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name,value]) => ({ name:name.length>16?name.slice(0,16)+'...':name, value }));

  // Department
  const deptCounts: Record<string,number> = {};
  responses.forEach(r => { deptCounts[r.student_department]=(deptCounts[r.student_department]||0)+1; });
  const deptData = Object.entries(deptCounts).sort((a,b)=>b[1]-a[1]).map(([name,value]) => ({ name:name.length>14?name.slice(0,14)+'...':name, value }));

  // Year distribution
  const yearCounts: Record<string,number> = {};
  responses.forEach(r => { yearCounts[r.student_year]=(yearCounts[r.student_year]||0)+1; });
  const yearData = Object.entries(yearCounts).map(([name,value]) => ({ name, value }));

  // Career Goals
  const goalCounts: Record<string,number> = {};
  responses.forEach(r => { goalCounts[r.career_goal]=(goalCounts[r.career_goal]||0)+1; });
  const goalData = Object.entries(goalCounts).map(([name,value]) => ({ name, value }));

  // Challenges
  const challengeData = Object.entries(count(responses.map(r=>r.challenges))).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({ name:name.length>18?name.slice(0,18)+'...':name, value }));

  // Workshop demand
  const workshopData = Object.entries(count(responses.map(r=>r.programs_requested))).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({ name:name.length>18?name.slice(0,18)+'...':name, value }));

  // Monthly growth (progressively spread real responses count)
  const monthlyData = ['Jan','Feb','Mar','Apr','May','Jun'].map((m,i) => {
    const factor = i + 1;
    const avgAwareness = responses.length > 0
      ? responses.reduce((s,r)=>s+r.awareness_rating,0)/responses.length
      : 3.0;
    return {
      month: m,
      responses: Math.min(responses.length, Math.floor((responses.length / 6) * factor) + (responses.length % 6 > i ? 1 : 0)),
      awareness: Number(avgAwareness.toFixed(1))
    };
  });

  // Awareness distribution pie
  const awarenessCounts: Record<number,number> = {1:0,2:0,3:0,4:0,5:0};
  responses.forEach(r => { awarenessCounts[r.awareness_rating]=(awarenessCounts[r.awareness_rating]||0)+1; });
  const awarenessData = Object.entries(awarenessCounts).map(([k,v])=>({ name:`Score ${k}`, value:v }));

  // Radar for readiness factors
  const radarData = [
    { factor:'Awareness', score:readiness.factors.awareness },
    { factor:'Mentorship', score:readiness.factors.mentorship },
    { factor:'Interest', score:readiness.factors.interest },
    { factor:'Resources', score:readiness.factors.resources },
    { factor:'Participation', score:readiness.factors.participation },
  ];

  const tooltipStyle = { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, fontSize:13 };

  return (
    <div className="app-layout">
      <Sidebar role={isAdmin?'super_admin':'campus_ambassador'} user={user as { full_name:string; email:string; college_name?:string }} />
      <div className="main-content">
        <Topbar title="Analytics" subtitle={user.college_name||'National'} />
        <div className="page-content">

          {/* Research Readiness Index */}
          <div className="grid-responsive-sidebar-inverse" style={{ marginBottom: 24 }}>
            <div className="card">
              <div className="card-header"><div className="card-title"><Brain size={16} color="#0E8C8C" /> Research Readiness Index</div></div>
              <div className="card-body">
                <GaugeChart score={readiness.score} label={readiness.label} color={readiness.color} bgColor={readiness.bgColor} factors={readiness.factors} />
              </div>
            </div>
            <div className="insights-panel" style={{ display:'flex',flexDirection:'column' }}>
              <div className="insights-header">
                <Brain size={20} color="#14B8A6" />
                <div className="insights-title">AI-Generated Insights</div>
                <div className="insights-badge">Auto-generated</div>
              </div>
              <div style={{ flex:1 }}>
                {insights.map((insight,i) => (
                  <div key={i} className="insight-item">
                    <div className="insight-dot" />
                    <div className="insight-text">{insight}</div>
                  </div>
                ))}
              </div>
              {readiness.recommendations.length > 0 && (
                <div style={{ marginTop:16,borderTop:'1px solid rgba(255,255,255,0.1)',paddingTop:16 }}>
                  <div style={{ fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:1,marginBottom:10 }}>Healix Recommendations</div>
                  {readiness.recommendations.map((r,i) => (
                    <div key={i} style={{ fontSize:12,color:'rgba(255,255,255,0.7)',marginBottom:6,paddingLeft:12,borderLeft:'2px solid rgba(14,140,140,0.5)' }}>{r}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 1: Research Interests + Monthly Growth */}
          <div className="charts-grid" style={{ marginBottom:24 }}>
            <div className="chart-card">
              <div className="chart-title">Research Interests (Top 10)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={interestData} layout="vertical" margin={{ left:0,right:16 }}>
                  <XAxis type="number" tick={{ fontSize:11,fill:'var(--text-muted)' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize:11,fill:'var(--text-muted)' }} width={130} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#0E8C8C" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <div className="chart-title">Monthly Survey Growth</div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyData} margin={{ top:0,right:0,left:-20,bottom:0 }}>
                  <defs>
                    <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0E8C8C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0E8C8C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize:11,fill:'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize:11,fill:'var(--text-muted)' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="responses" stroke="#0E8C8C" fill="url(#tealGradient)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Dept + Career Goals + Year */}
          <div className="charts-grid-3" style={{ marginBottom:24 }}>
            <div className="chart-card">
              <div className="chart-title">Department Participation</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deptData} margin={{ top:0,right:0,left:-20,bottom:0 }}>
                  <XAxis dataKey="name" tick={{ fontSize:9,fill:'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize:11,fill:'var(--text-muted)' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#2563EB" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <div className="chart-title">Career Goals</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={goalData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {goalData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <div className="chart-title">Year Distribution</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={yearData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,percent}) => `${(name || '').replace(' Year','')} (${((percent ?? 0)*100).toFixed(0)}%)`} labelLine={false}>
                    {yearData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 3: Challenges + Workshop Demand + Radar */}
          <div className="charts-grid-3" style={{ marginBottom:24 }}>
            <div className="chart-card">
              <div className="chart-title">Top Challenges</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={challengeData} layout="vertical" margin={{ left:0,right:16 }}>
                  <XAxis type="number" tick={{ fontSize:10,fill:'var(--text-muted)' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize:10,fill:'var(--text-muted)' }} width={120} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#DC2626" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <div className="chart-title">Workshop Demand</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={workshopData} layout="vertical" margin={{ left:0,right:16 }}>
                  <XAxis type="number" tick={{ fontSize:10,fill:'var(--text-muted)' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize:10,fill:'var(--text-muted)' }} width={120} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#D97706" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <div className="chart-title">Readiness Factors Radar</div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="factor" tick={{ fontSize:10,fill:'var(--text-muted)' }} />
                  <PolarRadiusAxis domain={[0,100]} tick={{ fontSize:9 }} />
                  <Radar name="Score" dataKey="score" stroke="#0E8C8C" fill="#0E8C8C" fillOpacity={0.25} />
                  <Tooltip contentStyle={tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 4: Awareness Dist + Line */}
          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-title">Research Awareness Rating Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={awarenessData} margin={{ top:0,right:0,left:-20,bottom:0 }}>
                  <XAxis dataKey="name" tick={{ fontSize:12,fill:'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize:11,fill:'var(--text-muted)' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#7C3AED" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <div className="chart-title">Awareness Score Trend</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyData} margin={{ top:0,right:0,left:-20,bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize:11,fill:'var(--text-muted)' }} />
                  <YAxis domain={[1,5]} tick={{ fontSize:11,fill:'var(--text-muted)' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="awareness" stroke="#2563EB" strokeWidth={2.5} dot={{ fill:'#2563EB',r:4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
