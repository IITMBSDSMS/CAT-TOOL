'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import Topbar from '@/components/ui/Topbar';
import { Building2, Users, BookOpen, BarChart3, Brain, TrendingUp, Globe, Download } from 'lucide-react';
import KPICard from '@/components/ui/KPICard';
import { MOCK_COLLEGES, MOCK_RESPONSES } from '@/lib/mockData';
import { dataService } from '@/lib/dataService';
import { calculateResearchReadiness } from '@/lib/researchReadiness';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid
} from 'recharts';

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ full_name: string; email: string; role: string } | null>(null);
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
      setColleges(colList.length > 0 ? colList : MOCK_COLLEGES);
      setResponses(resList.length > 0 ? resList : MOCK_RESPONSES);
      setMounted(true);
    }).catch(err => {
      console.warn('Error loading admin analytics data:', err);
      setColleges(MOCK_COLLEGES);
      setResponses(MOCK_RESPONSES);
      setMounted(true);
    });
  }, [router]);

  if (!mounted || !user) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>;

  const tooltipStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 };

  const readiness = calculateResearchReadiness(responses.map(r => ({
    awareness_rating: r.awareness_rating, has_done_research: r.has_done_research,
    knows_publication: r.knows_publication, challenges: r.challenges,
    research_interests: r.research_interests, programs_requested: r.programs_requested,
  })));

  const collegeCompare = colleges.map((c, i) => {
    const colResponses = responses.filter(r => r.college_id === c.id);
    const colReadiness = calculateResearchReadiness(colResponses.map(r => ({
      awareness_rating: r.awareness_rating, has_done_research: r.has_done_research,
      knows_publication: r.knows_publication, challenges: r.challenges,
      research_interests: r.research_interests, programs_requested: r.programs_requested,
    })));
    return {
      name: c.name.length > 12 ? c.name.slice(0, 12) + '...' : c.name,
      responses: colResponses.length,
      readiness: colReadiness.score,
    };
  });

  const monthlyData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => {
    const factor = i + 1;
    return {
      month: m,
      responses: Math.min(responses.length, Math.floor((responses.length / 6) * factor) + (responses.length % 6 > i ? 1 : 0)),
    };
  });

  const interestCounts: Record<string, number> = {};
  responses.forEach(r => r.research_interests.forEach((interest: string) => {
    interestCounts[interest] = (interestCounts[interest] || 0) + 1;
  }));
  const interestData = Object.entries(interestCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({
    name: name.length > 16 ? name.slice(0, 16) + '...' : name, value
  }));

  const challengeCounts: Record<string, number> = {};
  responses.forEach(r => r.challenges.forEach((c: string) => {
    challengeCounts[c] = (challengeCounts[c] || 0) + 1;
  }));
  const challengeData = Object.entries(challengeCounts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({
    name: name.length > 18 ? name.slice(0, 18) + '...' : name, value
  }));

  const statesCovered = new Set(colleges.map(c => c.state).filter(Boolean)).size;

  return (
    <div className="app-layout">
      <Sidebar role="super_admin" user={user as { full_name: string; email: string }} />
      <div className="main-content">
        <Topbar title="National Analytics" subtitle="All Colleges" />
        <div className="page-content">
          <div className="page-header" style={{ marginBottom: 28 }}>
            <h1 className="page-title">National Research Analytics</h1>
            <p className="page-subtitle">Aggregated insights across all {colleges.length} colleges</p>
          </div>

          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 28 }}>
            <KPICard label="Total Responses" value={responses.length} icon={<BookOpen size={20} />} iconBg="rgba(14,140,140,0.10)" iconColor="#0E8C8C" trend={12} delay={0} />
            <KPICard label="National Readiness" value={readiness.score} suffix="/100" icon={<Brain size={20} />} iconBg="rgba(124,58,237,0.10)" iconColor="#7C3AED" trend={5} delay={100} />
            <KPICard label="Colleges Active" value={colleges.length} icon={<Building2 size={20} />} iconBg="rgba(37,99,235,0.10)" iconColor="#2563EB" trend={3} delay={200} />
            <KPICard label="States Covered" value={statesCovered} icon={<Globe size={20} />} iconBg="rgba(217,119,6,0.10)" iconColor="#D97706" trend={1} delay={300} />
          </div>

          {/* College comparison */}
          <div className="chart-card" style={{ marginBottom: 24 }}>
            <div className="chart-title"><BarChart3 size={16} color="#0E8C8C" /> College Comparison — Responses & Readiness</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={collegeCompare} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="responses" fill="#0E8C8C" radius={[4, 4, 0, 0]} name="Responses" />
                <Bar dataKey="readiness" fill="#2563EB" radius={[4, 4, 0, 0]} name="Readiness Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="charts-grid" style={{ marginBottom: 24 }}>
            <div className="chart-card">
              <div className="chart-title">Research Interests — National</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={interestData} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={130} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#0E8C8C" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <div className="chart-title">National Survey Growth</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="natGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0E8C8C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0E8C8C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="responses" stroke="#0E8C8C" fill="url(#natGradient)" strokeWidth={2.5} name="Responses" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-title">Top Challenges — National</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={challengeData} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={120} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#DC2626" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </div>
  );
}
