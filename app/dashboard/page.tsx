'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import Topbar from '@/components/ui/Topbar';
import KPICard from '@/components/ui/KPICard';
import {
  Users, BookOpen, Building2, Brain, Zap,
  PlusCircle, BarChart3, Download, Mail,
  TrendingUp, Clock, CheckCircle, AlertCircle, Globe
} from 'lucide-react';
import { supabase, isDemoMode } from '@/lib/supabase';
import { MOCK_RESPONSES, MOCK_NOTIFICATIONS } from '@/lib/mockData';
import { calculateResearchReadiness, generateAIInsights } from '@/lib/researchReadiness';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const TEAL = '#0E8C8C';
const NAVY = '#0D1B3E';
const COLORS = ['#0E8C8C', '#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#BE185D'];

import { dataService } from '@/lib/dataService';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; full_name: string; email: string; college_name?: string; college_id?: string; role: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('hcip_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role === 'student') { router.push('/dashboard/survey'); return; }
    if (u.role !== 'campus_ambassador') { router.push('/admin'); return; }
    setUser(u);

    // Fetch live responses, notifications, and user password
    Promise.all([
      dataService.getSurveyResponses(u.college_id),
      dataService.getNotifications(),
      !isDemoMode ? supabase.from('users').select('password').eq('id', u.id).single() : Promise.resolve({ data: { password: 'pass123' } })
    ]).then(([resData, notifData, profileRes]) => {
      setResponses(resData.length > 0 ? resData : MOCK_RESPONSES);
      setNotifications(notifData.length > 0 ? notifData : MOCK_NOTIFICATIONS);
      setUser(prev => prev ? { ...prev, password: (profileRes as any)?.data?.password || 'pass123' } : null);
      setMounted(true);
    }).catch(err => {
      console.error('Error fetching dashboard data:', err);
      setResponses(MOCK_RESPONSES);
      setNotifications(MOCK_NOTIFICATIONS);
      setMounted(true);
    });
  }, [router]);

  if (!mounted || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  const readiness = calculateResearchReadiness(responses.map(r => ({
    awareness_rating: r.awareness_rating,
    has_done_research: r.has_done_research,
    knows_publication: r.knows_publication,
    challenges: r.challenges,
    research_interests: r.research_interests,
    programs_requested: r.programs_requested,
  })));

  const insights = generateAIInsights(responses.map(r => ({
    research_interests: r.research_interests,
    challenges: r.challenges,
    career_goal: r.career_goal,
    programs_requested: r.programs_requested,
    has_done_research: r.has_done_research,
    knows_publication: r.knows_publication,
    awareness_rating: r.awareness_rating,
    student_department: r.student_department,
  })));

  // Chart data: Department distribution
  const deptCounts: Record<string, number> = {};
  responses.forEach(r => { deptCounts[r.student_department] = (deptCounts[r.student_department] || 0) + 1; });
  const deptData = Object.entries(deptCounts).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,value]) => ({ name: name.length > 14 ? name.slice(0,14)+'...' : name, value }));

  // Career goals pie
  const goalCounts: Record<string, number> = {};
  responses.forEach(r => { goalCounts[r.career_goal] = (goalCounts[r.career_goal] || 0) + 1; });
  const goalData = Object.entries(goalCounts).map(([name, value]) => ({ name, value }));

  // Workshop demand
  const workshopCounts: Record<string, number> = {};
  responses.forEach(r => (r.programs_requested || []).forEach((p: string) => { workshopCounts[p] = (workshopCounts[p] || 0) + 1; }));
  const workshopData = Object.entries(workshopCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const depts = [...new Set(responses.map(r => r.student_department))].length;
  const avgAwareness = responses.length > 0
    ? (responses.reduce((s,r)=>s+r.awareness_rating,0)/responses.length).toFixed(1)
    : '0.0';
  const unreadNotifs = notifications.filter(n => !n.read && !n.is_read).length;

  const activityFeed = [
    { icon: CheckCircle, color: '#059669', bg: 'rgba(5,150,105,0.10)', text: `Survey submitted for ${responses[0]?.student_department || 'Biotechnology'}`, time: '5 mins ago' },
    { icon: BarChart3, color: '#2563EB', bg: 'rgba(37,99,235,0.10)', text: 'Analytics report updated', time: '1 hour ago' },
    { icon: Download, color: TEAL, bg: 'rgba(14,140,140,0.10)', text: 'June report downloaded', time: '3 hours ago' },
    { icon: AlertCircle, color: '#D97706', bg: 'rgba(217,119,6,0.10)', text: 'Deadline reminder: 3 responses needed', time: '1 day ago' },
    { icon: CheckCircle, color: '#059669', bg: 'rgba(5,150,105,0.10)', text: 'Workshop registration confirmed', time: '2 days ago' },
  ];

  return (
    <div className="app-layout">
      <Sidebar role="campus_ambassador" user={user as { full_name: string; email: string; college_name?: string }} />
      <div className="main-content">
        <Topbar title="Dashboard" subtitle={user.college_name} notifCount={unreadNotifs} />
        <div className="page-content">

          {/* Welcome Banner */}
          <div style={{
            background: `linear-gradient(135deg, ${NAVY} 0%, #162447 60%, #0A6B6B 100%)`,
            borderRadius: 'var(--radius-xl)', padding: '28px 36px', marginBottom: 32,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: -60, right: 60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(14,140,140,0.30) 0%, transparent 70%)', borderRadius: '50%' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Welcome back, Ambassador</div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.7px', marginBottom: 6 }}>{user.full_name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={14} color="rgba(255,255,255,0.5)" />
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>{user.college_name}</span>
              </div>
            </div>
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: '#14B8A6', letterSpacing: -2, lineHeight: 1 }}>{readiness.score}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>Readiness Index</div>
              <div style={{ fontSize: 12, color: '#14B8A6', fontWeight: 700, marginTop: 4 }}>{readiness.label}</div>
            </div>
          </div>

          {/* Student Survey Invite Portal */}
          <div className="card animate-fade-in-up" style={{ marginBottom: 32, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px' }}>
              <div style={{ padding: 8, borderRadius: 8, background: 'rgba(14,140,140,0.1)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Globe size={20} />
              </div>
              <div>
                <h3 className="card-title" style={{ fontSize: 16, margin: 0 }}>Student Survey Invite Portal</h3>
                <p className="card-subtitle" style={{ fontSize: 12, margin: '2px 0 0' }}>Share these credentials with your college students to collect surveys directly.</p>
              </div>
            </div>
            <div className="card-body grid-responsive-2fr-1fr" style={{ padding: '20px 24px' }}>
              <div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Student Survey URL
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="form-input"
                      value={typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login'}
                      readOnly
                      style={{ background: 'var(--grey-50)', color: 'var(--text-muted)' }}
                    />
                    <button
                      className="btn btn-teal"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          navigator.clipboard.writeText(`${window.location.origin}/login`);
                          alert('Survey link copied to clipboard!');
                        }
                      }}
                      style={{ padding: '0 16px', flexShrink: 0 }}
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 6 }}>
                    College Shared Password
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 42, background: 'var(--grey-50)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 12px' }}>
                    <code style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
                      {(user as any).password || 'pass123'}
                    </code>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        navigator.clipboard.writeText((user as any).password || 'pass123');
                        alert('Password copied to clipboard!');
                      }}
                      style={{ padding: '4px 8px', height: 'auto', color: 'var(--text-muted)', fontSize: 12 }}
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="kpi-grid">
            <KPICard label="Total Responses" value={responses.length} icon={<Users size={20} />} iconBg="rgba(14,140,140,0.10)" iconColor={TEAL} trend={12} delay={0} />
            <KPICard label="Departments Covered" value={depts} icon={<Building2 size={20} />} iconBg="rgba(37,99,235,0.10)" iconColor="#2563EB" trend={2} delay={100} />
            <KPICard label="Students Surveyed" value={responses.length} icon={<BookOpen size={20} />} iconBg="rgba(5,150,105,0.10)" iconColor="#059669" trend={8} delay={200} />
            <KPICard label="Awareness Score" value={avgAwareness} suffix="/5" icon={<Brain size={20} />} iconBg="rgba(124,58,237,0.10)" iconColor="#7C3AED" trend={5} delay={300} />
          </div>

          <div className="charts-grid" style={{ marginBottom: 24 }}>
            {/* Department Chart */}
            <div className="chart-card">
              <div className="chart-title"><Building2 size={16} color={TEAL} /> Department Participation</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                  <Bar dataKey="value" fill={TEAL} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Career Goals */}
            <div className="chart-card">
              <div className="chart-title"><TrendingUp size={16} color="#2563EB" /> Career Goals Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={goalData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0)*100).toFixed(0)}%`} labelLine={false}>
                    {goalData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid-responsive-3" style={{ marginBottom: 24 }}>
            {/* Workshop Demand */}
            <div className="card col-span-2">
              <div className="card-header">
                <div className="card-title"><Zap size={16} color={TEAL} /> Workshop Demand</div>
              </div>
              <div className="card-body">
                {workshopData.map(([label, count], i) => (
                  <div key={label} className="progress-item">
                    <div className="progress-header">
                      <span className="progress-label">{label}</span>
                      <span className="progress-value">{count} requests</span>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${responses.length > 0 ? (count / responses.length) * 100 : 0}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><Zap size={16} color={TEAL} /> Quick Actions</div>
              </div>
              <div className="card-body">
                <div className="quick-actions">
                  {[
                    { href: '/dashboard/survey', icon: PlusCircle, label: 'Add Survey', sub: 'New response', bg: 'rgba(14,140,140,0.10)', color: TEAL },
                    { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', sub: 'View charts', bg: 'rgba(37,99,235,0.10)', color: '#2563EB' },
                    { href: '/dashboard/report', icon: Download, label: 'Download', sub: 'PDF report', bg: 'rgba(124,58,237,0.10)', color: '#7C3AED' },
                    { href: 'mailto:support@healix.com', icon: Mail, label: 'Contact', sub: 'Healix HQ', bg: 'rgba(5,150,105,0.10)', color: '#059669' },
                  ].map(a => (
                    <a key={a.href} href={a.href} className="quick-action-btn">
                      <div className="quick-action-icon" style={{ background: a.bg, color: a.color }}><a.icon size={18} /></div>
                      <div className="quick-action-label">{a.label}</div>
                      <div className="quick-action-sub">{a.sub}</div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights + Activity */}
          <div className="grid-responsive-2">
            <div className="insights-panel">
              <div className="insights-header">
                <Brain size={20} color="#14B8A6" />
                <div className="insights-title">AI Insights</div>
                <div className="insights-badge">Auto-generated</div>
              </div>
              {insights.map((insight, i) => (
                <div key={i} className="insight-item">
                  <div className="insight-dot" />
                  <div className="insight-text">{insight}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title"><Clock size={16} color={TEAL} /> Recent Activity</div>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="activity-list" style={{ padding: '8px 0' }}>
                  {activityFeed.map((item, i) => (
                    <div key={i} className="activity-item">
                      <div className="activity-icon" style={{ background: item.bg, color: item.color }}><item.icon size={16} /></div>
                      <div className="activity-content">
                        <div className="activity-text">{item.text}</div>
                        <div className="activity-time">{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
