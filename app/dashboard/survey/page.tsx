'use client';
import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import Topbar from '@/components/ui/Topbar';
import { CheckCircle, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { dataService } from '@/lib/dataService';
import { calculateResearchReadiness } from '@/lib/researchReadiness';

const STEPS = [
  { id: 1, title: 'Student Details', subtitle: 'Basic information about the student.' },
  { id: 2, title: 'Research Awareness', subtitle: 'Gauge the student\'s awareness of research.' },
  { id: 3, title: 'Research Interests', subtitle: 'Select all applicable research domains.' },
  { id: 4, title: 'Challenges', subtitle: 'What barriers does the student face?' },
  { id: 5, title: 'Career Goals', subtitle: 'What is the student\'s career aspiration?' },
  { id: 6, title: 'Programs Requested', subtitle: 'What programs would the student like?' },
  { id: 7, title: 'Recommendations', subtitle: 'Open-ended feedback from the student.' },
];

const INTERESTS = ['Artificial Intelligence','Medical Research','Biotechnology','Mental Health','Healthcare','Engineering','Robotics','Business','Economics','Public Health','Psychology','Data Science','Environmental Science','Other'];
const CHALLENGES = ['No mentors','No opportunities','No funding','Lack of awareness','No laboratory','No faculty support','Time constraints','Research guidance','Other'];
const CAREER_GOALS = ['MS','MTech','MBA','PhD','Industry','Government','Startup','Undecided'];
const PROGRAMS = ['Research Workshop','Publication Guidance','Internship','Mentorship','Innovation Program','Healthcare Workshop','Mental Health Session','Entrepreneurship','Fellowship'];
const DEPARTMENTS = ['Biotechnology','Computer Science','Mechanical Engineering','Medicine','Psychology','Data Science','Chemical Engineering','Public Health','Economics','Environmental Science','Physics','Mathematics','Architecture','Law','Other'];
const YEARS = ['1st Year','2nd Year','3rd Year','4th Year','5th Year','Postgraduate','PhD'];
const GENDERS = ['Male','Female','Non-binary','Prefer not to say'];

interface FormData {
  department: string;
  year: string;
  gender: string;
  age: string;
  email: string;
  has_done_research: string;
  knows_publication: string;
  awareness_rating: number;
  research_interests: string[];
  challenges: string[];
  career_goal: string;
  programs_requested: string[];
  recommendation_text: string;
}

const initial: FormData = {
  department: '',year: '',gender: '',age: '',email: '',
  has_done_research: '',knows_publication: '',awareness_rating: 0,
  research_interests: [],challenges: [],career_goal: '',
  programs_requested: [],recommendation_text: '',
};

export default function SurveyPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ full_name: string; email: string; college_name?: string; role: string } | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('hcip_user');
    if (!saved) { router.push('/login'); return; }
    setUser(JSON.parse(saved));
  }, [router]);

  const toggleMulti = (key: 'research_interests'|'challenges'|'programs_requested', val: string) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(v => v !== val) : [...f[key], val]
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const score = calculateResearchReadiness([{
        awareness_rating: form.awareness_rating,
        has_done_research: form.has_done_research === 'yes',
        knows_publication: form.knows_publication === 'yes',
        challenges: form.challenges,
        research_interests: form.research_interests,
        programs_requested: form.programs_requested,
      }]).score;

      const savedUser = localStorage.getItem('hcip_user');
      const u = savedUser ? JSON.parse(savedUser) : null;

      await dataService.addSurveyResponse({
        college_id: u?.college_id || 'c1',
        college_name: u?.college_name || 'IIT Bombay',
        ambassador_id: u?.id || 'u2',
        student_department: form.department,
        student_year: form.year,
        student_gender: form.gender,
        student_age: Number(form.age) || 20,
        student_email: form.email || undefined,
        has_done_research: form.has_done_research === 'yes',
        knows_publication: form.knows_publication === 'yes',
        awareness_rating: form.awareness_rating,
        research_interests: form.research_interests,
        challenges: form.challenges,
        career_goal: form.career_goal,
        programs_requested: form.programs_requested,
        recommendation_text: form.recommendation_text,
        research_readiness_score: score
      });
      setSubmitted(true);
    } catch (err) {
      console.warn('Error saving survey response:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh' }}><div className="spinner" style={{width:40,height:40}} /></div>;

  if (submitted) {
    return (
      <div className="app-layout">
        <Sidebar role="campus_ambassador" user={user as { full_name: string; email: string; college_name?: string }} />
        <div className="main-content">
          <Topbar title="Survey" subtitle="Submit Response" />
          <div className="page-content" style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'calc(100vh - 64px)' }}>
            <div style={{ textAlign:'center',maxWidth:480 }}>
              <div style={{ width:96,height:96,background:'rgba(5,150,105,0.12)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px' }}>
                <CheckCircle size={48} color="#059669" />
              </div>
              <h2 style={{ fontSize:28,fontWeight:800,color:'var(--text-primary)',letterSpacing:'-0.5px',marginBottom:12 }}>Survey Submitted!</h2>
              <p style={{ fontSize:15,color:'var(--text-muted)',lineHeight:1.6,marginBottom:32 }}>
                Thank you for collecting this response. The data has been saved to your college&apos;s research intelligence dashboard.
              </p>
              <div style={{ display:'flex',gap:12,justifyContent:'center' }}>
                <button className="btn btn-outline" onClick={() => { setForm(initial); setStep(1); setSubmitted(false); }}>+ Add Another</button>
                <button className="btn btn-teal" onClick={() => router.push('/dashboard')}>View Dashboard</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar role="campus_ambassador" user={user as { full_name: string; email: string; college_name?: string }} />
      <div className="main-content">
        <Topbar title="New Survey" subtitle={`Step ${step} of 7`} />
        <div className="page-content">
          <div className="survey-wizard">

            {/* Step Indicators */}
            <div className="survey-progress">
              <div className="survey-step-indicator">
                {STEPS.map((s, i) => (
                  <Fragment key={s.id}>
                    <div className={`step-dot ${step === s.id ? 'active' : step > s.id ? 'completed' : ''}`}>
                      {step > s.id ? '✓' : s.id}
                    </div>
                    {i < STEPS.length - 1 && <div className={`step-line ${step > s.id ? 'completed' : ''}`} />}
                  </Fragment>
                ))}
              </div>
            </div>

            <div className="survey-card animate-fade-in-up">
              <h2 className="survey-section-title">{STEPS[step-1].title}</h2>
              <p className="survey-section-subtitle">{STEPS[step-1].subtitle}</p>

              {/* SECTION 1 */}
              {step === 1 && (
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 24px' }}>
                  <div className="form-group">
                    <label className="form-label">Department <span className="required">*</span></label>
                    <select id="dept-select" className="form-select" value={form.department} onChange={e => setForm(f => ({...f,department:e.target.value}))} required>
                      <option value="">Select department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year <span className="required">*</span></label>
                    <select id="year-select" className="form-select" value={form.year} onChange={e => setForm(f => ({...f,year:e.target.value}))} required>
                      <option value="">Select year</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender <span className="required">*</span></label>
                    <select id="gender-select" className="form-select" value={form.gender} onChange={e => setForm(f => ({...f,gender:e.target.value}))} required>
                      <option value="">Select gender</option>
                      {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <input id="age-input" type="number" className="form-input" placeholder="e.g. 21" min={15} max={35} value={form.age} onChange={e => setForm(f => ({...f,age:e.target.value}))} />
                  </div>
                  <div className="form-group" style={{ gridColumn:'span 2' }}>
                    <label className="form-label">Student Email <span style={{ color:'var(--text-muted)',fontWeight:400 }}>(Optional)</span></label>
                    <input id="email-input" type="email" className="form-input" placeholder="student@college.edu" value={form.email} onChange={e => setForm(f => ({...f,email:e.target.value}))} />
                  </div>
                </div>
              )}

              {/* SECTION 2 */}
              {step === 2 && (
                <div style={{ display:'flex',flexDirection:'column',gap:28 }}>
                  <div>
                    <label className="form-label" style={{ marginBottom:12,display:'block' }}>Has the student done any research? <span className="required">*</span></label>
                    <div className="radio-group" style={{ flexDirection:'row',gap:12 }}>
                      {['yes','no'].map(v => (
                        <div key={v} className={`radio-option ${form.has_done_research===v?'selected':''}`} style={{ flex:1 }} onClick={() => setForm(f => ({...f,has_done_research:v}))}>
                          <input type="radio" name="hasResearch" value={v} checked={form.has_done_research===v} readOnly />
                          <div className="radio-dot" />
                          <span className="radio-label">{v === 'yes' ? '✅ Yes' : '❌ No'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="form-label" style={{ marginBottom:12,display:'block' }}>Does the student know how to publish research? <span className="required">*</span></label>
                    <div className="radio-group" style={{ flexDirection:'row',gap:12 }}>
                      {['yes','no'].map(v => (
                        <div key={v} className={`radio-option ${form.knows_publication===v?'selected':''}`} style={{ flex:1 }} onClick={() => setForm(f => ({...f,knows_publication:v}))}>
                          <input type="radio" name="knowsPub" value={v} checked={form.knows_publication===v} readOnly />
                          <div className="radio-dot" />
                          <span className="radio-label">{v === 'yes' ? '✅ Yes' : '❌ No'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="form-label" style={{ marginBottom:12,display:'block' }}>Rate the student&apos;s research awareness (1 = Very Low, 5 = Excellent) <span className="required">*</span></label>
                    <div className="rating-group">
                      {[1,2,3,4,5].map(n => (
                        <button id={`rating-${n}`} key={n} type="button" className={`rating-btn ${form.awareness_rating===n?'selected':''}`} onClick={() => setForm(f => ({...f,awareness_rating:n}))}>{n}</button>
                      ))}
                    </div>
                    <div style={{ display:'flex',justifyContent:'space-between',marginTop:8 }}>
                      <span style={{ fontSize:11,color:'var(--text-muted)' }}>1 — Very Low</span>
                      <span style={{ fontSize:11,color:'var(--text-muted)' }}>5 — Excellent</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3 */}
              {step === 3 && (
                <div>
                  <div style={{ fontSize:13,color:'var(--text-muted)',marginBottom:16 }}>Select all that apply ({form.research_interests.length} selected)</div>
                  <div className="chips-grid">
                    {INTERESTS.map(item => (
                      <div id={`interest-${item.replace(/\s+/g,'-').toLowerCase()}`} key={item} className={`chip ${form.research_interests.includes(item)?'selected':''}`} onClick={() => toggleMulti('research_interests',item)}>
                        {form.research_interests.includes(item) && <span className="chip-check">✓</span>}
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 4 */}
              {step === 4 && (
                <div>
                  <div style={{ fontSize:13,color:'var(--text-muted)',marginBottom:16 }}>Select all that apply ({form.challenges.length} selected)</div>
                  <div className="chips-grid">
                    {CHALLENGES.map(item => (
                      <div id={`challenge-${item.replace(/\s+/g,'-').toLowerCase()}`} key={item} className={`chip ${form.challenges.includes(item)?'selected':''}`} onClick={() => toggleMulti('challenges',item)}>
                        {form.challenges.includes(item) && <span className="chip-check">✓</span>}
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 5 */}
              {step === 5 && (
                <div className="radio-group">
                  {CAREER_GOALS.map(g => (
                    <div id={`goal-${g.toLowerCase()}`} key={g} className={`radio-option ${form.career_goal===g?'selected':''}`} onClick={() => setForm(f => ({...f,career_goal:g}))}>
                      <input type="radio" name="careerGoal" value={g} checked={form.career_goal===g} readOnly />
                      <div className="radio-dot" />
                      <span className="radio-label">{g === 'MS' ? '🎓 Master of Science (MS)' : g === 'MTech' ? '⚙️ MTech / ME' : g === 'MBA' ? '💼 MBA' : g === 'PhD' ? '🔬 PhD / Research' : g === 'Industry' ? '🏭 Industry Job' : g === 'Government' ? '🏛️ Government/Civil Services' : g === 'Startup' ? '🚀 Startup / Entrepreneurship' : '🤔 Undecided'}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* SECTION 6 */}
              {step === 6 && (
                <div>
                  <div style={{ fontSize:13,color:'var(--text-muted)',marginBottom:16 }}>Select all programs the student would like ({form.programs_requested.length} selected)</div>
                  <div className="chips-grid">
                    {PROGRAMS.map(item => (
                      <div id={`program-${item.replace(/\s+/g,'-').toLowerCase()}`} key={item} className={`chip ${form.programs_requested.includes(item)?'selected':''}`} onClick={() => toggleMulti('programs_requested',item)}>
                        {form.programs_requested.includes(item) && <span className="chip-check">✓</span>}
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 7 */}
              {step === 7 && (
                <div className="form-group">
                  <label className="form-label">What would improve research opportunities in your college?</label>
                  <textarea id="recommendation-text" className="form-textarea" style={{ minHeight:180 }} placeholder="Share the student's perspective on improving research opportunities, infrastructure, mentorship, or any other aspects..." value={form.recommendation_text} onChange={e => setForm(f => ({...f,recommendation_text:e.target.value}))} />
                  <div className="form-hint">{form.recommendation_text.length} characters. Aim for at least 50 characters for a meaningful response.</div>
                </div>
              )}

              {/* Navigation */}
              <div className="survey-nav">
                <button id="survey-prev" className="btn btn-outline" onClick={() => setStep(s => Math.max(1,s-1))} disabled={step===1}>
                  <ChevronLeft size={16} /> Previous
                </button>
                <div style={{ display:'flex',gap:6 }}>
                  {STEPS.map(s => (
                    <div key={s.id} style={{ width:8,height:8,borderRadius:'50%',background:step===s.id?'var(--teal)':step>s.id?'var(--success)':'var(--border)',transition:'all 0.2s' }} />
                  ))}
                </div>
                {step < 7 ? (
                  <button id="survey-next" className="btn btn-teal" onClick={() => setStep(s => Math.min(7,s+1))}>
                    Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button id="survey-submit" className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                    {saving ? <><div className="spinner" style={{width:16,height:16,borderWidth:2}} /> Saving...</> : <><Save size={16} /> Submit Survey</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
