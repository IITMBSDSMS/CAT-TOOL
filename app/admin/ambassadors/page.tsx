'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import Topbar from '@/components/ui/Topbar';
import { Users, Plus, Search, Mail, BookOpen, Building2, CheckCircle } from 'lucide-react';
import { MOCK_USERS, MOCK_COLLEGES } from '@/lib/mockData';
import { dataService } from '@/lib/dataService';

export default function AmbassadorsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ full_name:string; email:string; role:string }|null>(null);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ambassadors, setAmbassadors] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [form, setForm] = useState({ full_name:'', email:'', password:'', college_id:'', department:'' });

  useEffect(() => {
    const s = localStorage.getItem('hcip_user');
    if (!s) { router.push('/login'); return; }
    const u = JSON.parse(s);
    if (u.role !== 'super_admin') { router.push('/dashboard'); return; }
    setUser(u);

    // Fetch live ambassadors and colleges
    Promise.all([
      dataService.getAmbassadors(),
      dataService.getColleges()
    ]).then(([ambData, colData]) => {
      setAmbassadors(ambData);
      setColleges(colData);
    }).catch(err => console.warn('Error fetching admin data:', err));
  }, [router]);

  if (!user) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}><div className="spinner" style={{width:40,height:40}} /></div>;

  const filtered = ambassadors.filter(a =>
    (a.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const college = colleges.find(c => c.id === form.college_id);
      const newAmb = await dataService.createAmbassador({
        email: form.email,
        role: 'campus_ambassador',
        full_name: form.full_name,
        college_id: form.college_id,
        college_name: college?.name ?? '',
        state: college?.state ?? '',
        country: 'India',
        department: form.department,
        password: form.password
      });
      setAmbassadors(prev => [...prev, newAmb]);
      setForm({ full_name:'',email:'',password:'',college_id:'',department:'' });
      setSaved(true);
      setTimeout(() => { setSaved(false); setShowAdd(false); }, 1500);
    } catch (err) {
      console.warn('Error creating ambassador:', err);
    } finally {
      setSaving(false);
    }
  };

  const DEPARTMENTS = ['Biotechnology','Computer Science','Mechanical Engineering','Medicine','Psychology','Data Science','Chemical Engineering','Public Health','Economics','Environmental Science'];

  return (
    <div className="app-layout">
      <Sidebar role="super_admin" user={user as { full_name:string; email:string }} />
      <div className="main-content">
        <Topbar title="Ambassadors" subtitle="Management" />
        <div className="page-content">
          <div className="page-header-row" style={{ marginBottom:24 }}>
            <div>
              <h1 className="page-title">Campus Ambassadors</h1>
              <p className="page-subtitle">{ambassadors.length} ambassadors across {colleges.length} colleges</p>
            </div>
            <button id="add-ambassador-btn" className="btn btn-teal" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Add Ambassador
            </button>
          </div>

          {showAdd && (
            <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)' }}>
              <div className="card" style={{ width:520 }}>
                <div className="card-header">
                  <div className="card-title"><Users size={16} color="#0E8C8C" /> Create Ambassador Account</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)} style={{ marginLeft:'auto',fontWeight:700,padding:'4px 8px' }}>✕</button>
                </div>
                {saved ? (
                  <div className="card-body" style={{ textAlign:'center',padding:48 }}>
                    <CheckCircle size={48} color="#059669" style={{ margin:'0 auto 16px' }} />
                    <h3 style={{ fontSize:18,fontWeight:700,color:'var(--text-primary)' }}>Ambassador Created!</h3>
                    <p style={{ fontSize:14,color:'var(--text-muted)',marginTop:8 }}>Credentials have been sent to the ambassador&apos;s email.</p>
                  </div>
                ) : (
                  <form className="card-body" onSubmit={handleAdd} style={{ display:'flex',flexDirection:'column',gap:0 }}>
                    <div className="grid-responsive-2" style={{ gap: '0 20px' }}>
                      <div className="form-group">
                        <label className="form-label">Full Name <span className="required">*</span></label>
                        <input id="amb-name" className="form-input" placeholder="e.g. Priya Sharma" value={form.full_name} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email <span className="required">*</span></label>
                        <input id="amb-email" type="email" className="form-input" placeholder="priya@college.edu" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Password <span className="required">*</span></label>
                        <input id="amb-password" type="password" className="form-input" placeholder="Secure password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Department</label>
                        <select id="amb-dept" className="form-select" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}>
                          <option value="">Select</option>
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ gridColumn:'span 2' }}>
                        <label className="form-label">Assign College <span className="required">*</span></label>
                        <select id="amb-college" className="form-select" value={form.college_id} onChange={e=>setForm(f=>({...f,college_id:e.target.value}))} required>
                          <option value="">Select college</option>
                          {colleges.length === 0 ? (
                            <option value="" disabled>No colleges available. Add a college first!</option>
                          ) : (
                            colleges.map(c => <option key={c.id} value={c.id}>{c.name} — {c.state}</option>)
                          )}
                        </select>
                      </div>
                    </div>
                    <div style={{ display:'flex',gap:12,justifyContent:'flex-end',marginTop:8 }}>
                      <button type="button" className="btn btn-outline" onClick={()=>setShowAdd(false)}>Cancel</button>
                      <button id="save-ambassador" type="submit" className="btn btn-teal" disabled={saving}>
                        {saving?<><div className="spinner" style={{width:14,height:14,borderWidth:2}} /> Creating...</>:'Create Account'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          <div className="search-bar" style={{ marginBottom:20,maxWidth:320 }}>
            <Search size={15} color="var(--text-muted)" />
            <input placeholder="Search ambassadors..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Name</th><th>Email</th><th>Password</th><th>College</th><th>State</th><th>Department</th><th>Joined</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.map((a,i) => (
                  <tr key={a.id}>
                    <td style={{ color:'var(--text-muted)',fontWeight:500 }}>{i+1}</td>
                    <td>
                      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                        <div style={{ width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#0E8C8C,#2563EB)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'white',flexShrink:0 }}>
                          {(a.full_name || '').split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                        </div>
                        <span style={{ fontWeight:600 }}>{a.full_name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display:'flex',alignItems:'center',gap:6,color:'var(--text-muted)',fontSize:13 }}>
                        <Mail size={12} />{a.email}
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize:12,background:'var(--grey-100)',padding:'2px 6px',borderRadius:4,color:'var(--text-primary)' }}>
                        {a.password || 'pass123'}
                      </code>
                    </td>
                    <td>
                      <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                        <Building2 size={12} color="var(--text-muted)" />
                        <span style={{ fontSize:13 }}>{(a as { college_name?:string }).college_name||'—'}</span>
                      </div>
                    </td>
                    <td style={{ color:'var(--text-muted)',fontSize:13 }}>{(a as { state?:string }).state||'—'}</td>
                    <td style={{ color:'var(--text-muted)',fontSize:13 }}>{(a as { department?:string }).department||'—'}</td>
                    <td style={{ color:'var(--text-muted)',fontSize:12 }}>{new Date(a.created_at).toLocaleDateString('en-IN')}</td>
                    <td><span className="badge badge-success">Active</span></td>
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
