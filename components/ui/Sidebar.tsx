'use client';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard, FileText, BarChart3, Download, Bell,
  Users, Building2, Globe, Settings, LogOut, ChevronRight,
  PlusCircle, BookOpen, Handshake
} from 'lucide-react';

interface SidebarProps {
  role: 'super_admin' | 'campus_ambassador' | 'student';
  user: { full_name: string; email: string; college_name?: string };
}

const AMBASSADOR_NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'main' },
  { href: '/dashboard/survey', icon: PlusCircle, label: 'New Survey', section: 'main' },
  { href: '/dashboard/responses', icon: BookOpen, label: 'Responses', section: 'main' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', section: 'analytics' },
  { href: '/dashboard/report', icon: Download, label: 'Reports', section: 'analytics' },
];

const ADMIN_NAV = [
  { href: '/admin', icon: LayoutDashboard, label: 'Overview', section: 'main' },
  { href: '/admin/colleges', icon: Building2, label: 'Colleges', section: 'main' },
  { href: '/admin/ambassadors', icon: Users, label: 'Ambassadors', section: 'main' },
  { href: '/admin/analytics', icon: BarChart3, label: 'National Analytics', section: 'analytics' },
  { href: '/admin/reports', icon: Download, label: 'Reports', section: 'analytics' },
  { href: '/admin/partnerships', icon: Handshake, label: 'Partnerships', section: 'modules' },
  { href: '/admin/notifications', icon: Bell, label: 'Notifications', section: 'modules' },
];

export default function Sidebar({ role, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  let nav = AMBASSADOR_NAV;
  if (role === 'super_admin') {
    nav = ADMIN_NAV;
  } else if (role === 'student') {
    nav = [
      { href: '/dashboard/survey', icon: PlusCircle, label: 'Submit Survey', section: 'main' }
    ];
  }

  const sections = [
    { key: 'main', label: role === 'super_admin' ? 'Management' : 'Main' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'modules', label: 'Modules' },
  ].filter(s => nav.some(n => n.section === s.key));

  const handleLogout = () => {
    localStorage.removeItem('hcip_user');
    router.push('/login');
  };

  const initials = user.full_name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

  const closeMobileSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.remove('open');
    }
  };

  return (
    <aside className="sidebar">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <a className="sidebar-logo" href="#" style={{ flex: 1 }}>
          <img src="/healix-official-logo.png" alt="Healix" />
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">Healix Technologies</span>
            <span className="sidebar-logo-sub">Pvt. Ltd.</span>
          </div>
        </a>
        <button 
          className="mobile-sidebar-close" 
          onClick={closeMobileSidebar}
          style={{ display: 'none' }}
          title="Close navigation menu"
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {sections.map(section => (
          <div key={section.key} className="sidebar-section">
            <div className="sidebar-section-label">{section.label}</div>
            <nav className="sidebar-nav">
              {nav.filter(n => n.section === section.key).map(item => {
                const isActive = item.href === '/admin' || item.href === '/dashboard'
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <item.icon className="sidebar-link-icon" size={18} />
                    {item.label}
                    {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {(role === 'campus_ambassador' || role === 'student') && user.college_name && (
        <div style={{ padding: '12px 16px', margin: '0 12px 8px', background: 'rgba(14,140,140,0.12)', borderRadius: 10, border: '1px solid rgba(14,140,140,0.20)' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Your College</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{user.college_name}</div>
        </div>
      )}

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.full_name}</div>
            <div className="sidebar-user-role">{role === 'super_admin' ? 'Super Admin' : role === 'student' ? 'Student' : 'Ambassador'}</div>
          </div>
          <button onClick={handleLogout} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4, borderRadius: 6, transition: 'all 0.15s' }} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
