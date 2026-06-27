'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import Topbar from '@/components/ui/Topbar';
import { Building2, Plus, Search, Edit3, Trash2, MapPin, Users } from 'lucide-react';
import { MOCK_COLLEGES } from '@/lib/mockData';
import { dataService } from '@/lib/dataService';

export default function CollegesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ full_name:string; email:string; role:string }|null>(null);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:'', state:'', country:'India', city:'', type:'Engineering' });
  const [colleges, setColleges] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('hcip_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role !== 'super_admin') { router.push('/dashboard'); return; }
    setUser(u);

    // Fetch live colleges
    dataService.getColleges().then(data => {
      setColleges(data);
    }).catch(err => console.warn('Error fetching colleges:', err));
  }, [router]);

  if (!user) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}><div className="spinner" style={{width:40,height:40}} /></div>;

  const filtered = colleges.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.state || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newCol = await dataService.addCollege({
        name: form.name,
        state: form.state,
        country: form.country,
        city: form.city,
        type: form.type,
        total_students: 0
      });
      setColleges(prev => [...prev, newCol]);
      setForm({ name:'',state:'',country:'India',city:'',type:'Engineering' });
      setShowAdd(false);
    } catch (err) {
      console.warn('Error adding college:', err);
    } finally {
      setSaving(false);
    }
  };

  const COLLEGE_TYPES = ['Engineering', 'Medical', 'Arts & Science', 'Management', 'Deemed University', 'Autonomous', 'Government'];
  const STATES = ['Maharashtra','Delhi','Karnataka','Tamil Nadu','Telangana','West Bengal','Rajasthan','Gujarat','Punjab','Kerala','Uttar Pradesh','Madhya Pradesh'];

  return (
    <div className="app-layout">
      <Sidebar role="super_admin" user={user as { full_name:string; email:string }} />
      <div className="main-content">
        <Topbar title="Colleges" subtitle="Management" />
        <div className="page-content">
          <div className="page-header-row" style={{ marginBottom:24 }}>
            <div>
              <h1 className="page-title">College Management</h1>
              <p className="page-subtitle">{filtered.length} colleges registered on HCIP</p>
            </div>
            <button id="add-college-btn" className="btn btn-teal" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Add College
            </button>
          </div>

          {showAdd && (
            <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)' }}>
              <div className="card" style={{ width:520,maxHeight:'90vh',overflowY:'auto' }}>
                <div className="card-header">
                  <div className="card-title"><Building2 size={16} color="#0E8C8C" /> Add New College</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)} style={{ marginLeft:'auto',fontWeight:700,padding:'4px 8px' }}>✕</button>
                </div>
                <form className="card-body" onSubmit={handleAdd} style={{ display:'flex',flexDirection:'column',gap:0 }}>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px' }}>
                    <div className="form-group" style={{ gridColumn:'span 2' }}>
                      <label className="form-label">College Name <span className="required">*</span></label>
                      <input id="college-name" className="form-input" placeholder="e.g. IIT Bombay" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input id="college-city" className="form-input" placeholder="e.g. Mumbai" value={form.city} onChange={e => setForm(f=>({...f,city:e.target.value}))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State <span className="required">*</span></label>
                      <select id="college-state" className="form-select" value={form.state} onChange={e => setForm(f=>({...f,state:e.target.value}))} required>
                        <option value="">Select state</option>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <select id="college-type" className="form-select" value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}>
                        {COLLEGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <input id="college-country" className="form-input" value={form.country} onChange={e => setForm(f=>({...f,country:e.target.value}))} />
                    </div>
                  </div>
                  <div style={{ display:'flex',gap:12,justifyContent:'flex-end',marginTop:8 }}>
                    <button type="button" className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
                    <button id="save-college" type="submit" className="btn btn-teal" disabled={saving}>
                      {saving ? <><div className="spinner" style={{width:14,height:14,borderWidth:2}} /> Saving...</> : 'Add College'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="search-bar" style={{ marginBottom:20, maxWidth:320 }}>
            <Search size={15} color="var(--text-muted)" />
            <input placeholder="Search colleges..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20 }}>
            {filtered.map(c => (
              <div key={c.id} className="card" style={{ overflow:'visible',transition:'all 0.2s' }}>
                <div className="card-body">
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14 }}>
                    <div style={{ width:48,height:48,background:'rgba(14,140,140,0.10)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <Building2 size={22} color="#0E8C8C" />
                    </div>
                    <div style={{ display:'flex',gap:6 }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding:'4px 8px' }}><Edit3 size={13} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ padding:'4px 8px',color:'var(--danger)' }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <h3 style={{ fontSize:16,fontWeight:700,color:'var(--text-primary)',marginBottom:6 }}>{c.name}</h3>
                  <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:6 }}>
                    <MapPin size={13} color="var(--text-muted)" />
                    <span style={{ fontSize:13,color:'var(--text-muted)' }}>{c.city ? `${c.city}, `:''}{c.state}</span>
                  </div>
                  <div style={{ display:'flex',gap:8,marginTop:12 }}>
                    <span className="badge badge-teal">{c.type}</span>
                    <span className="badge badge-navy">{c.country}</span>
                    {c.total_students ? <span className="badge badge-info"><Users size={10} /> {c.total_students.toLocaleString()}</span> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
