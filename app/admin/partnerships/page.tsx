'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import Topbar from '@/components/ui/Topbar';
import { Handshake, Plus, Search, Building2, Edit3 } from 'lucide-react';
import { MOCK_PARTNERSHIPS } from '@/lib/mockData';
import { dataService } from '@/lib/dataService';

const STATUS_PIPELINE = ['Meeting','Proposal','MoU','Partnership','Completed'];
const TYPE_COLORS: Record<string,string> = {
  University:'badge-info', Hospital:'badge-danger', NGO:'badge-success',
  Company:'badge-teal', 'Research Institute':'badge-warning'
};
const STATUS_COLORS: Record<string,string> = {
  Meeting:'badge-navy', Proposal:'badge-warning', MoU:'badge-info',
  Partnership:'badge-teal', Completed:'badge-success'
};

export default function PartnershipsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ full_name:string; email:string; role:string }|null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [partners, setPartners] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:'',type:'University',state:'',contact:'',status:'Meeting',notes:'' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('hcip_user');
    if (!s) { router.push('/login'); return; }
    const u = JSON.parse(s);
    if (u.role !== 'super_admin') { router.push('/dashboard'); return; }
    setUser(u);

    // Fetch live partnerships
    dataService.getPartnerships().then(data => {
      setPartners(data);
    }).catch(err => console.warn('Error fetching partnerships:', err));
  }, [router]);

  if (!user) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}><div className="spinner" style={{width:40,height:40}} /></div>;

  const filtered = partners.filter(p => {
    const matchS = search===''||(p.name || '').toLowerCase().includes(search.toLowerCase())||(p.contact||'').toLowerCase().includes(search.toLowerCase());
    const matchT = filterType===''||p.type===filterType;
    const matchSt = filterStatus===''||p.status===filterStatus;
    return matchS && matchT && matchSt;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newPartner = await dataService.addPartnership({
        name: form.name,
        type: form.type,
        state: form.state,
        contact: form.contact,
        status: form.status,
        notes: form.notes
      });
      setPartners(prev => [newPartner, ...prev]);
      setForm({ name:'',type:'University',state:'',contact:'',status:'Meeting',notes:'' });
      setShowAdd(false);
    } catch (err) {
      console.warn('Error adding partnership:', err);
    } finally {
      setSaving(false);
    }
  };

  const statusCounts = STATUS_PIPELINE.reduce((acc,s) => ({ ...acc,[s]:partners.filter(p=>p.status===s).length }), {} as Record<string,number>);

  return (
    <div className="app-layout">
      <Sidebar role="super_admin" user={user as { full_name:string; email:string }} />
      <div className="main-content">
        <Topbar title="Partnerships" subtitle="Module" />
        <div className="page-content">
          <div className="page-header-row" style={{ marginBottom:24 }}>
            <div>
              <h1 className="page-title">Partnership Management</h1>
              <p className="page-subtitle">Track Healix&apos;s institutional relationships and MoUs</p>
            </div>
            <button id="add-partner-btn" className="btn btn-teal" onClick={()=>setShowAdd(true)}>
              <Plus size={16} /> Add Partner
            </button>
          </div>

          {/* Pipeline overview */}
          <div style={{ display:'flex',gap:0,marginBottom:28,background:'var(--bg-card)',borderRadius:'var(--radius-lg)',border:'1px solid var(--border)',overflow:'hidden' }}>
            {STATUS_PIPELINE.map((s,i) => (
              <div key={s} style={{ flex:1,padding:'16px 20px',borderRight:i<STATUS_PIPELINE.length-1?'1px solid var(--border)':'none',textAlign:'center' }}>
                <div style={{ fontSize:28,fontWeight:900,color:'var(--text-primary)',letterSpacing:-1 }}>{statusCounts[s]}</div>
                <div style={{ fontSize:12,color:'var(--text-muted)',fontWeight:600,marginTop:4 }}>{s}</div>
                <div style={{ width:30,height:3,background:s==='Completed'?'#059669':s==='Partnership'?'#0E8C8C':s==='MoU'?'#2563EB':s==='Proposal'?'#D97706':'#94A3B8',borderRadius:99,margin:'8px auto 0' }} />
              </div>
            ))}
          </div>

          {showAdd && (
            <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)' }}>
              <div className="card" style={{ width:560,maxHeight:'90vh',overflowY:'auto' }}>
                <div className="card-header">
                  <div className="card-title"><Handshake size={16} color="#0E8C8C" /> Add Partnership</div>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setShowAdd(false)} style={{ marginLeft:'auto',fontWeight:700,padding:'4px 8px' }}>✕</button>
                </div>
                <form className="card-body" onSubmit={handleAdd}>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px' }}>
                    <div className="form-group" style={{ gridColumn:'span 2' }}>
                      <label className="form-label">Organization Name <span className="required">*</span></label>
                      <input id="partner-name" className="form-input" placeholder="e.g. AIIMS Delhi" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <select id="partner-type" className="form-select" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                        {['University','Hospital','NGO','Company','Research Institute'].map(t=><option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select id="partner-status" className="form-select" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                        {STATUS_PIPELINE.map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">State</label>
                      <input id="partner-state" className="form-input" placeholder="e.g. Delhi" value={form.state} onChange={e=>setForm(f=>({...f,state:e.target.value}))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contact Person</label>
                      <input id="partner-contact" className="form-input" placeholder="Dr. Priya Rao" value={form.contact} onChange={e=>setForm(f=>({...f,contact:e.target.value}))} />
                    </div>
                    <div className="form-group" style={{ gridColumn:'span 2' }}>
                      <label className="form-label">Notes</label>
                      <textarea id="partner-notes" className="form-textarea" style={{ minHeight:80 }} placeholder="Meeting notes, proposal details..." value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
                    </div>
                  </div>
                  <div style={{ display:'flex',gap:12,justifyContent:'flex-end' }}>
                    <button type="button" className="btn btn-outline" onClick={()=>setShowAdd(false)}>Cancel</button>
                    <button id="save-partner" type="submit" className="btn btn-teal" disabled={saving}>
                      {saving?<><div className="spinner" style={{width:14,height:14,borderWidth:2}} /> Saving...</>:'Add Partnership'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="filter-bar" style={{ marginBottom:20 }}>
            <div className="search-bar" style={{ maxWidth:280 }}>
              <Search size={15} color="var(--text-muted)" />
              <input placeholder="Search partners..." value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <select className="form-select" style={{ maxWidth:180 }} value={filterType} onChange={e=>setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {['University','Hospital','NGO','Company','Research Institute'].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            <select className="form-select" style={{ maxWidth:180 }} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUS_PIPELINE.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Organization</th><th>Type</th><th>State</th><th>Contact</th><th>Status</th><th>Since</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((p,i) => (
                  <tr key={p.id}>
                    <td style={{ color:'var(--text-muted)',fontWeight:500 }}>{i+1}</td>
                    <td style={{ fontWeight:600 }}>{p.name}</td>
                    <td><span className={`badge ${TYPE_COLORS[p.type]||'badge-navy'}`}>{p.type}</span></td>
                    <td style={{ color:'var(--text-muted)',fontSize:13 }}>{p.state}</td>
                    <td style={{ fontSize:13,color:'var(--text-secondary)' }}>{p.contact}</td>
                    <td><span className={`badge ${STATUS_COLORS[p.status]||'badge-navy'}`}>{p.status}</span></td>
                    <td style={{ color:'var(--text-muted)',fontSize:12 }}>{p.created_at}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{ padding:'4px 8px' }}><Edit3 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
