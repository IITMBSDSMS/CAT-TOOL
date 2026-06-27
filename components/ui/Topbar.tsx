'use client';
import { Bell, Moon, Sun, Search } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TopbarProps {
  title: string;
  subtitle?: string;
  notifCount?: number;
}

export default function Topbar({ title, subtitle, notifCount = 2 }: TopbarProps) {
  const [dark, setDark] = useState(false);
  const [date, setDate] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('hcip_dark') === 'true';
    setDark(saved);
    document.documentElement.setAttribute('data-theme', saved ? 'dark' : 'light');
    setDate(new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('hcip_dark', String(next));
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  };

  const toggleMobileSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
    }
  };

  return (
    <header className="topbar" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {/* Mobile Sidebar Hamburger Toggle Button */}
      <button 
        className="mobile-menu-toggle" 
        onClick={toggleMobileSidebar}
        style={{ display: 'none' }}
        title="Open navigation menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      <div style={{ flex: 1 }}>
        <div className="topbar-title">
          {title}
          {subtitle && <span className="topbar-subtitle">/ {subtitle}</span>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{date}</div>
      </div>

      <div className="topbar-actions">
        <button id="topbar-dark-toggle" className="icon-btn" onClick={toggleDark} title="Toggle dark mode">
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div style={{ position: 'relative' }}>
          <button id="topbar-notif" className="icon-btn">
            <Bell size={16} />
          </button>
          {notifCount > 0 && <div className="notification-dot" />}
        </div>
      </div>
    </header>
  );
}
