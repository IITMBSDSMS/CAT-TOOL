'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import Topbar from '@/components/ui/Topbar';
import { Bell, Plus, Send, BookOpen, Calendar, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { MOCK_NOTIFICATIONS } from '@/lib/mockData';
import { dataService } from '@/lib/dataService';

const TYPE_ICONS: Record<string, React.ElementType> = {
  survey: BookOpen, workshop: Calendar, report: Download,
  deadline: AlertCircle, general: Bell
};
const TYPE_COLORS: Record<string,string> = {
  survey:'rgba(37,99,235,0.10)', workshop:'rgba(14,140,140,0.10)',
  report:'rgba(124,58,237,0.10)', deadline:'rgba(217,119,6,0.10)', general:'rgba(148,163,184,0.10)'
};
const TYPE_FG: Record<string,string> = {
  survey:'#2563EB', workshop:'#0E8C8C', report:'#7C3AED',
  deadline:'#D97706', general:'#94A3B8'
};

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ full_name:string; email:string; role:string }|null>(null);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ title:'',message:'',type:'general',target_role:'campus_ambassador' });

  useEffect(() => {
    const s = localStorage.getItem('hcip_user');
    if (!s) { router.push('/login'); return; }
    const u = JSON.parse(s);
    if (u.role !== 'super_admin') { router.push('/dashboard'); return; }
    setUser(u);

    // Fetch live notifications
    dataService.getNotifications().then(data => {
      setNotifs(data);
    }).catch(err => console.warn('Error fetching notifications:', err));
  }, [router]);

  if (!user) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}><div className="spinner" style={{width:40,height:40}} /></div>;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const newNotif = await dataService.addNotification({
        title: form.title,
        message: form.message,
        type: form.type,
        target_role: form.target_role
      });
      setNotifs(prev => [newNotif, ...prev]);
      setForm({ title:'',message:'',type:'general',target_role:'campus_ambassador' });
      setSent(true);
      setTimeout(()=>{ setSent(false); setShowCompose(false); },1500);
    } catch (err) {
      console.warn('Error sending notification:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar role="super_admin" user={user as { full_name:string; email:string }} />
      <div className="main-content">
        <Topbar title="Notifications" subtitle="Broadcast" notifCount={notifs.filter(n=>!n.read).length} />
        <div className="page-content">
          <div className="page-header-row" style={{ marginBottom:24 }}>
            <div>
              <h1 className="page-title">Notifications</h1>
              <p className="page-subtitle">Send announcements to campus ambassadors</p>
            </div>
            <button id="compose-notif-btn" className="btn btn-teal" onClick={()=>setShowCompose(true)}>
              <Plus size={16} /> Compose Notification
            </button>
          </div>

          {/* Stats */}
          <div className="grid-responsive-4" style={{ marginBottom: 24 }}>
            {[{label:'Total Sent',value:notifs.length,color:'#0E8C8C'},{label:'Unread',value:notifs.filter(n=>!n.read).length,color:'#2563EB'},{label:'This Week',value:3,color:'#059669'},{label:'Ambassadors Reached',value:10000,color:'#D97706'}].map(s=>(
              <div key={s.label} style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'20px 22px' }}>
                <div style={{ fontSize:30,fontWeight:900,color:s.color,letterSpacing:-1 }}>{typeof s.value==='number'&&s.value>999?'10K+':s.value}</div>
                <div style={{ fontSize:12,color:'var(--text-muted)',fontWeight:600,marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {showCompose && (
            <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)' }}>
              <div className="card" style={{ width:520 }}>
                <div className="card-header">
                  <div className="card-title"><Bell size={16} color="#0E8C8C" /> Compose Notification</div>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setShowCompose(false)} style={{ marginLeft:'auto',fontWeight:700,padding:'4px 8px' }}>✕</button>
                </div>
                {sent ? (
                  <div className="card-body" style={{ textAlign:'center',padding:48 }}>
                    <CheckCircle size={48} color="#059669" style={{ margin:'0 auto 16px' }} />
                    <h3 style={{ fontSize:18,fontWeight:700 }}>Notification Sent!</h3>
                    <p style={{ fontSize:14,color:'var(--text-muted)',marginTop:8 }}>All ambassadors have been notified.</p>
                  </div>
                ) : (
                  <form className="card-body" onSubmit={handleSend}>
                    <div className="form-group">
                      <label className="form-label">Title <span className="required">*</span></label>
                      <input id="notif-title" className="form-input" placeholder="e.g. New Survey Available" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Message <span className="required">*</span></label>
                      <textarea id="notif-message" className="form-textarea" style={{ minHeight:100 }} placeholder="Write your announcement..." value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} required />
                    </div>
                    <div className="grid-responsive-2" style={{ gap: '0 20px' }}>
                      <div className="form-group">
                        <label className="form-label">Type</label>
                        <select id="notif-type" className="form-select" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                          {Object.keys(TYPE_ICONS).map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Audience</label>
                        <select id="notif-audience" className="form-select" value={form.target_role} onChange={e=>setForm(f=>({...f,target_role:e.target.value}))}>
                          <option value="campus_ambassador">All Ambassadors</option>
                          <option value="super_admin">Admins Only</option>
                          <option value="all">Everyone</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display:'flex',gap:12,justifyContent:'flex-end',marginTop:8 }}>
                      <button type="button" className="btn btn-outline" onClick={()=>setShowCompose(false)}>Cancel</button>
                      <button id="send-notif" type="submit" className="btn btn-teal" disabled={sending}>
                        {sending?<><div className="spinner" style={{width:14,height:14,borderWidth:2}} /> Sending...</>:<><Send size={14} /> Send Now</>}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header"><div className="card-title"><Bell size={16} color="#0E8C8C" /> All Notifications ({notifs.length})</div></div>
            <div style={{ padding:0 }}>
              {notifs.map(n => {
                const Icon = TYPE_ICONS[n.type] || Bell;
                return (
                  <div key={n.id} className={`notification-item ${!n.read?'unread':''}`}>
                    <div className="notification-icon" style={{ background:TYPE_COLORS[n.type]||'var(--grey-100)',color:TYPE_FG[n.type]||'var(--text-muted)' }}>
                      <Icon size={18} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div className="notification-title">{n.title}</div>
                      <div className="notification-message">{n.message}</div>
                      <div className="notification-time">{new Date(n.created_at).toLocaleDateString('en-IN',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                    {!n.read && <div style={{ width:8,height:8,borderRadius:'50%',background:'#0E8C8C',flexShrink:0,marginTop:6 }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
