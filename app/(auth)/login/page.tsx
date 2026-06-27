'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase, isDemoMode } from '@/lib/supabase';
import logoImg from '@/public/healix-official-logo.png';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Typewriter effect definitions
  const titleWords = [
    "Campus Insights Platform",
    "Research Intelligence Dashboard",
    "National Analytics Hub",
    "Student Survey Portal"
  ];

  const quoteWords = [
    '"Understanding students. Empowering research."',
    '"Data-driven decisions for academic excellence."',
    '"Connecting campus intelligence nationwide."',
    '"Bridging the gap between student feedback and strategy."'
  ];

  // Title typewriter
  const [titleIdx, setTitleIdx] = useState(0);
  const [titleSub, setTitleSub] = useState(0);
  const [titleReverse, setTitleReverse] = useState(false);
  const [typedTitle, setTypedTitle] = useState("");

  useEffect(() => {
    if (titleSub === titleWords[titleIdx].length + 1 && !titleReverse) {
      const timeout = setTimeout(() => setTitleReverse(true), 2500);
      return () => clearTimeout(timeout);
    }
    if (titleSub === 0 && titleReverse) {
      setTitleReverse(false);
      setTitleIdx((prev) => (prev + 1) % titleWords.length);
      return;
    }
    const timeout = setTimeout(() => {
      setTitleSub((prev) => prev + (titleReverse ? -1 : 1));
    }, titleReverse ? 20 : 50);
    return () => clearTimeout(timeout);
  }, [titleSub, titleReverse, titleIdx]);

  useEffect(() => {
    setTypedTitle(titleWords[titleIdx].substring(0, titleSub));
  }, [titleSub, titleIdx]);

  // Quote typewriter
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [quoteSub, setQuoteSub] = useState(0);
  const [quoteReverse, setQuoteReverse] = useState(false);
  const [typedQuote, setTypedQuote] = useState("");

  useEffect(() => {
    if (quoteSub === quoteWords[quoteIdx].length + 1 && !quoteReverse) {
      const timeout = setTimeout(() => setQuoteReverse(true), 3000);
      return () => clearTimeout(timeout);
    }
    if (quoteSub === 0 && quoteReverse) {
      setQuoteReverse(false);
      setQuoteIdx((prev) => (prev + 1) % quoteWords.length);
      return;
    }
    const timeout = setTimeout(() => {
      setQuoteSub((prev) => prev + (quoteReverse ? -1 : 1));
    }, quoteReverse ? 15 : 40);
    return () => clearTimeout(timeout);
  }, [quoteSub, quoteReverse, quoteIdx]);

  useEffect(() => {
    setTypedQuote(quoteWords[quoteIdx].substring(0, quoteSub));
  }, [quoteSub, quoteIdx]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    await new Promise(r => setTimeout(r, 900));

    if (!isDemoMode) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*, colleges(name)')
          .eq('email', email)
          .single();

        if (userError || !userData) {
          // If not found in the users table, check if the password matches a campus ambassador's password
          const { data: ambData, error: ambError } = await supabase
            .from('users')
            .select('*, colleges(name)')
            .eq('role', 'campus_ambassador')
            .eq('password', password)
            .limit(1);

          if (!ambError && ambData && ambData.length > 0) {
            const ambassador = ambData[0];
            localStorage.setItem('hcip_user', JSON.stringify({
              id: `student_${email}`,
              email: email,
              role: 'student',
              full_name: 'Student User',
              college_id: ambassador.college_id,
              college_name: ambassador.colleges?.name || '',
              ambassador_id: ambassador.id
            }));
            router.push('/dashboard/survey');
            return;
          }

          setError('Invalid credentials or user does not exist.');
          setLoading(false);
          return;
        }

        if (userData.password === password) {
          localStorage.setItem('hcip_user', JSON.stringify({
            id: userData.id,
            email: userData.email,
            role: userData.role,
            full_name: userData.full_name,
            college_id: userData.college_id,
            college_name: userData.colleges?.name || '',
            department: userData.department,
            state: userData.state
          }));

          if (userData.role === 'super_admin') {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        } else {
          setError('Invalid password.');
          setLoading(false);
        }
      } catch (err) {
        console.warn('Error during live login:', err);
        setError('Database connection error.');
        setLoading(false);
      }
      return;
    }

    // Demo credentials
    if (email === 'admin@healix.com' && password === 'admin123') {
      localStorage.setItem('hcip_user', JSON.stringify({
        id: 'u1', email, role: 'super_admin',
        full_name: 'Dr. Arjun Mehta'
      }));
      router.push('/admin');
    } else if ((email === 'avnishverma718@gmail.com' || email === 'avnishverma718@gmailcom') && password === 'IITIAN@1234m') {
      localStorage.setItem('hcip_user', JSON.stringify({
        id: 'u_admin_1', email, role: 'super_admin',
        full_name: 'Avnish Verma'
      }));
      router.push('/admin');
    } else if (email === 'ambassador@iitb.edu' && password === 'pass123') {
      localStorage.setItem('hcip_user', JSON.stringify({
        id: 'u2', email, role: 'campus_ambassador',
        full_name: 'Priya Sharma', college_name: 'IIT Bombay',
        college_id: 'c1', department: 'Biotechnology', state: 'Maharashtra'
      }));
      router.push('/dashboard');
    } else if (password === 'pass123') {
      // Demo Student login for IIT Bombay
      localStorage.setItem('hcip_user', JSON.stringify({
        id: `student_${email}`,
        email: email,
        role: 'student',
        full_name: 'Student User',
        college_id: 'c1',
        college_name: 'IIT Bombay',
        ambassador_id: 'u2'
      }));
      router.push('/dashboard/survey');
    } else if (password === 'IITIAN@1234m') {
      // Demo Student login for IIT Bombay (Avnish)
      localStorage.setItem('hcip_user', JSON.stringify({
        id: `student_${email}`,
        email: email,
        role: 'student',
        full_name: 'Student User',
        college_id: 'c1',
        college_name: 'IIT Bombay',
        ambassador_id: 'u_admin_1'
      }));
      router.push('/dashboard/survey');
    } else {
      setError('Invalid credentials. Try admin@healix.com / admin123 or ambassador@iitb.edu / pass123');
      setLoading(false);
    }
  };

  // Toggle tab state for mobile view slider
  const [activeTab, setActiveTab] = useState<'info' | 'login'>('login');

  return (
    <div className="login-page">
      {/* Mobile Toggle Controls */}
      <div className="mobile-login-toggle">
        <button
          type="button"
          className={`mobile-toggle-btn ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Insights
        </button>
        <button
          type="button"
          className={`mobile-toggle-btn ${activeTab === 'login' ? 'active' : ''}`}
          onClick={() => setActiveTab('login')}
        >
          Sign In
        </button>
      </div>

      <div className="login-slider" style={{
        '--slider-transform': activeTab === 'info' ? 'translateX(0)' : 'translateX(-100vw)'
      } as React.CSSProperties}>
        {/* Left Panel — Chennai Skyline Layout */}
      <div className="login-left" style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '40px 0 0',
        textAlign: 'left',
        background: '#08080A',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* TOP — Logo + Company Name */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 16, padding: '0 40px', boxSizing: 'border-box', width: '100%', justifyContent: 'flex-start' }}>
          <div style={{
            width: 56, height: 56, background: 'white', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)', padding: 4, flexShrink: 0
          }}>
            <Image src={logoImg} alt="Healix" width={48} height={48} style={{ objectFit: 'contain' }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'white', letterSpacing: '-0.3px', lineHeight: 1.1 }}>Healix Technologies</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#E53E3E', letterSpacing: '1.8px', textTransform: 'uppercase', marginTop: 2 }}>Pvt. Ltd.</div>
        </div>
      </div>

        {/* MIDDLE — Headline + Skyline */}
        <div style={{ position: 'relative', zIndex: 2, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: '0 40px', boxSizing: 'border-box' }}>
          {/* Headline */}
          <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-1px', lineHeight: 1.2, margin: '0 0 6px', width: '100%', textAlign: 'left' }}>
            Connecting Campus Intelligence Nationwide<span style={{ color: '#14B8A6' }}>.</span>
          </h1>

          {/* Typewriter subtitle */}
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: '0 0 16px', lineHeight: 1.5, minHeight: 36, display: 'flex', alignItems: 'center', gap: 0, textAlign: 'left' }}>
            {typedQuote}<span className="cursor-blink" style={{ color: '#14B8A6', marginLeft: 1 }}>|</span>
          </p>

          {/* ── Chennai Skyline SVG — Realistic ── */}
          <svg viewBox="0 0 800 260" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block', margin: 'auto 0 0 0', overflow: 'visible' }}>
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22"/>
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
              </linearGradient>
              <linearGradient id="bldFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28"/>
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.06"/>
              </linearGradient>
              <linearGradient id="bldFill2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22"/>
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05"/>
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* ===== GROUND LINE ===== */}
            <line x1="0" y1="222" x2="800" y2="222" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.5"/>
            <rect x="0" y="222" width="800" height="38" fill="url(#skyGrad)"/>

            {/* ===== 1. TIDEL PARK — Tall Modern IT Tower (far left) ===== */}
            {/* Left wing */}
            <rect x="8" y="148" width="22" height="74" fill="url(#bldFill)" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.7"/>
            {[0,1,2,3,4,5].map(i => <line key={i} x1="8" y1={158+i*11} x2="30" y2={158+i*11} stroke="#FFFFFF" strokeWidth="0.5" strokeOpacity="0.45"/>)}
            {/* Main tall tower */}
            <rect x="30" y="52" width="54" height="170" fill="url(#bldFill)" stroke="#FFFFFF" strokeWidth="1.4" strokeOpacity="0.95" filter="url(#glow)"/>
            {/* Window grid — 4 columns × 17 rows */}
            {[...Array(17)].map((_, r) => [0,1,2,3].map(c =>
              <rect key={`w${r}${c}`} x={34+c*12} y={60+r*9} width="8" height="6" fill="#FFFFFF" fillOpacity={r < 4 ? 0.35 : 0.18} stroke="#FFFFFF" strokeWidth="0.3" strokeOpacity="0.6"/>
            ))}
            {/* Setback top section */}
            <rect x="36" y="36" width="42" height="16" fill="url(#bldFill)" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.9"/>
            {/* Parapet cap */}
            <rect x="28" y="50" width="58" height="4" fill="#FFFFFF" fillOpacity="0.35" stroke="#FFFFFF" strokeWidth="0.8"/>
            {/* Antenna mast */}
            <line x1="57" y1="36" x2="57" y2="10" stroke="#FFFFFF" strokeWidth="1.8" strokeOpacity="0.95" filter="url(#glow)"/>
            <circle cx="57" cy="9" r="3.5" fill="#FFFFFF" opacity="0.9" filter="url(#glow)"/>
            <line x1="47" y1="24" x2="57" y2="20" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.6"/>
            <line x1="67" y1="24" x2="57" y2="20" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.6"/>
            {/* Right wing */}
            <rect x="84" y="130" width="20" height="92" fill="url(#bldFill)" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.7"/>
            {[0,1,2,3,4,5,6].map(i => <line key={i} x1="84" y1={140+i*11} x2="104" y2={140+i*11} stroke="#FFFFFF" strokeWidth="0.5" strokeOpacity="0.4"/>)}
            {/* Base podium */}
            <rect x="4" y="218" width="104" height="4" fill="#FFFFFF" fillOpacity="0.3" stroke="#FFFFFF" strokeWidth="0.8"/>

            {/* ===== 2. RIPON BUILDING — Classical Dome ===== */}
            {/* Wide base body */}
            <rect x="128" y="158" width="82" height="64" fill="url(#bldFill)" stroke="#FFFFFF" strokeWidth="1.1" strokeOpacity="0.8"/>
            {/* Arched windows row */}
            {[0,1,2].map(i => <path key={i} d={`M${140+i*24},222 L${140+i*24},190 Q${149+i*24},178 ${158+i*24},190 L${158+i*24},222`} fill="none" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.8"/>)}
            {/* Cornice band */}
            <rect x="124" y="154" width="90" height="6" fill="#FFFFFF" fillOpacity="0.25" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.85"/>
            {/* Colonnade row */}
            {[0,1,2,3,4,5,6].map(i => <line key={i} x1={130+i*11} y1="154" x2={130+i*11} y2="122" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.75"/>)}
            {/* Entablature above columns */}
            <rect x="126" y="116" width="86" height="8" fill="#FFFFFF" fillOpacity="0.2" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.85"/>
            {/* Dome base drum */}
            <rect x="148" y="98" width="42" height="18" fill="url(#bldFill2)" stroke="#FFFFFF" strokeWidth="1.1" strokeOpacity="0.85"/>
            {/* Dome hemisphere */}
            <path d="M142,116 Q149,80 169,68 Q189,80 196,116" fill="url(#bldFill)" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.95" filter="url(#glow)"/>
            {/* Dome ribs */}
            {[-20,-10,0,10,20].map((dx,i) => <line key={i} x1={169+dx} y1={i===2?68:68+Math.abs(dx)*0.4} x2={169+dx*0.3} y2="116" stroke="#FFFFFF" strokeWidth="0.6" strokeOpacity="0.5"/>)}
            {/* Lantern cylinder */}
            <rect x="163" y="58" width="12" height="12" fill="url(#bldFill)" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.9"/>
            {/* Flagpole */}
            <line x1="169" y1="58" x2="169" y2="40" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.9"/>
            <polygon points="169,40 183,46 169,52" fill="#FFFFFF" fillOpacity="0.7" stroke="#FFFFFF" strokeWidth="0.5"/>
            {/* Steps */}
            <rect x="120" y="218" width="98" height="3" fill="#FFFFFF" fillOpacity="0.2" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.5"/>
            <rect x="116" y="221" width="106" height="2" fill="#FFFFFF" fillOpacity="0.12"/>

            {/* ===== 3. CHENNAI CENTRAL — Gothic Clock Tower ===== */}
            {/* Wide base building */}
            <rect x="232" y="162" width="100" height="60" fill="url(#bldFill)" stroke="#FFFFFF" strokeWidth="1.1" strokeOpacity="0.8"/>
            {/* Window arches on base */}
            {[0,1,2,3].map(i => <path key={i} d={`M${238+i*22},222 L${238+i*22},188 Q${247+i*22},175 ${256+i*22},188 L${256+i*22},222`} fill="none" stroke="#FFFFFF" strokeWidth="0.9" strokeOpacity="0.75"/>)}
            {/* Horizontal string course */}
            <line x1="232" y1="180" x2="332" y2="180" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.5"/>
            {/* Left turret */}
            <rect x="232" y="138" width="24" height="26" fill="url(#bldFill)" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.75"/>
            <polygon points="232,138 244,114 256,138" fill="url(#bldFill)" stroke="#FFFFFF" strokeWidth="1.1" strokeOpacity="0.85"/>
            <line x1="244" y1="114" x2="244" y2="100" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.85"/>
            {/* Right turret */}
            <rect x="308" y="138" width="24" height="26" fill="url(#bldFill)" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.75"/>
            <polygon points="308,138 320,114 332,138" fill="url(#bldFill)" stroke="#FFFFFF" strokeWidth="1.1" strokeOpacity="0.85"/>
            <line x1="320" y1="114" x2="320" y2="100" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.85"/>
            {/* Central clock tower shaft */}
            <rect x="258" y="120" width="48" height="44" fill="url(#bldFill)" stroke="#FFFFFF" strokeWidth="1.3" strokeOpacity="0.9"/>
            {/* Clock face */}
            <circle cx="282" cy="148" r="14" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.95" filter="url(#glow)"/>
            <circle cx="282" cy="148" r="10" fill="#FFFFFF" fillOpacity="0.08"/>
            {/* Clock hands */}
            <line x1="282" y1="148" x2="282" y2="136" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.9"/>
            <line x1="282" y1="148" x2="292" y2="148" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.9"/>
            {/* Clock tick marks */}
            {[0,1,2,3].map(i => { const a=i*Math.PI/2; return <line key={i} x1={282+12*Math.cos(a-Math.PI/2)} y1={148+12*Math.sin(a-Math.PI/2)} x2={282+14*Math.cos(a-Math.PI/2)} y2={148+14*Math.sin(a-Math.PI/2)} stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.8"/>;})}
            {/* Belfry section */}
            <rect x="263" y="100" width="38" height="22" fill="url(#bldFill)" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.9"/>
            {/* Belfry arched openings */}
            <path d="M267,122 L267,108 Q272,100 277,108 L277,122" fill="none" stroke="#FFFFFF" strokeWidth="0.9" strokeOpacity="0.8"/>
            <path d="M287,122 L287,108 Q292,100 297,108 L297,122" fill="none" stroke="#FFFFFF" strokeWidth="0.9" strokeOpacity="0.8"/>
            {/* Central spire */}
            <polygon points="258,100 282,60 306,100" fill="url(#bldFill)" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.95" filter="url(#glow)"/>
            {/* Spire finial */}
            <line x1="282" y1="60" x2="282" y2="40" stroke="#FFFFFF" strokeWidth="1.8" strokeOpacity="0.95" filter="url(#glow)"/>
            <circle cx="282" cy="39" r="3" fill="#FFFFFF" opacity="0.95"/>

            {/* ===== 4. KAPALEESWARAR TEMPLE GOPURAM ===== */}
            {/* Base platform */}
            <rect x="370" y="204" width="90" height="18" fill="url(#bldFill)" stroke="#FFFFFF" strokeWidth="1.1" strokeOpacity="0.85"/>
            {/* Entrance gateway arch */}
            <path d="M394,222 L394,200 Q415,190 436,200 L436,222" fill="none" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.9"/>
            {/* Gate decoration lines */}
            <line x1="400" y1="205" x2="430" y2="205" stroke="#FFFFFF" strokeWidth="0.6" strokeOpacity="0.5"/>
            {/* Main gopuram body — tiered pyramid */}
            {[
              {x:375,y:196,w:80,h:10},
              {x:378,y:184,w:74,h:14},
              {x:382,y:170,w:66,h:16},
              {x:386,y:154,w:58,h:18},
              {x:391,y:136,w:48,h:20},
              {x:396,y:116,w:38,h:22},
              {x:401,y:96,w:28,h:22},
              {x:406,y:76,w:18,h:22},
            ].map((t,i) => (
              <g key={i}>
                <rect x={t.x} y={t.y} width={t.w} height={t.h} fill="url(#bldFill)" stroke="#FFFFFF" strokeWidth={1.1-i*0.05} strokeOpacity={0.85}/>
                {/* Ornamental horizontal detail lines */}
                <line x1={t.x+2} y1={t.y+t.h/2} x2={t.x+t.w-2} y2={t.y+t.h/2} stroke="#FFFFFF" strokeWidth="0.5" strokeOpacity="0.5"/>
                {/* Miniature deity niches on each tier */}
                {i < 6 && [0.25,0.5,0.75].map((p,j) => (
                  <rect key={j} x={t.x+t.w*p-3} y={t.y+2} width="6" height={t.h-4} fill="#FFFFFF" fillOpacity="0.15" stroke="#FFFFFF" strokeWidth="0.4" strokeOpacity="0.6"/>
                ))}
              </g>
            ))}
            {/* Shikhara (pointed top) */}
            <ellipse cx="415" cy="72" rx="10" ry="6" fill="url(#bldFill)" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.9"/>
            <ellipse cx="415" cy="66" rx="6" ry="4" fill="url(#bldFill)" stroke="#FFFFFF" strokeWidth="1.1"/>
            {/* Kalasha finial */}
            <ellipse cx="415" cy="60" rx="4" ry="6" fill="#FFFFFF" fillOpacity="0.4" stroke="#FFFFFF" strokeWidth="1.3" filter="url(#glow)"/>
            <line x1="415" y1="54" x2="415" y2="42" stroke="#FFFFFF" strokeWidth="1.6" strokeOpacity="0.9" filter="url(#glow)"/>
            <circle cx="415" cy="41" r="3" fill="#FFFFFF" fillOpacity="0.8" filter="url(#glow)"/>

            {/* ===== 5. VALLUVAR KOTTAM / LIGHTHOUSE + BRIDGE ===== */}
            {/* Lighthouse (right side) */}
            <rect x="500" y="152" width="22" height="70" fill="url(#bldFill2)" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.8"/>
            {/* Lighthouse banding */}
            {[0,1,2,3,4].map(i => <line key={i} x1="500" y1={162+i*12} x2="522" y2={162+i*12} stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.5"/>)}
            <rect x="496" y="148" width="30" height="6" fill="#FFFFFF" fillOpacity="0.3" stroke="#FFFFFF" strokeWidth="0.9"/>
            {/* Lighthouse lantern room */}
            <rect x="503" y="134" width="16" height="16" fill="#FFFFFF" fillOpacity="0.2" stroke="#FFFFFF" strokeWidth="1.1"/>
            <polygon points="503,134 511,118 519,134" fill="url(#bldFill2)" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.9" filter="url(#glow)"/>
            {/* Lighthouse beacon */}
            <circle cx="511" cy="116" r="4" fill="#FFFFFF" fillOpacity="0.9" filter="url(#softGlow)"/>
            <circle cx="511" cy="116" r="8" fill="none" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.3"/>

            {/* Marina Beach Lighthouse companion */}
            <rect x="550" y="175" width="14" height="47" fill="url(#bldFill2)" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.7"/>
            <polygon points="550,175 557,162 564,175" fill="url(#bldFill2)" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.85"/>
            <circle cx="557" cy="160" r="3" fill="#FFFFFF" fillOpacity="0.8" filter="url(#glow)"/>

            {/* ===== 6. PAMBAN / ARCH BRIDGE ===== */}
            {/* Bridge deck (two parallel lines) */}
            <line x1="574" y1="200" x2="790" y2="200" stroke="#FFFFFF" strokeWidth="2.2" strokeOpacity="0.8"/>
            <line x1="574" y1="206" x2="790" y2="206" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.4"/>
            {/* Main arch */}
            <path d="M574,200 Q640,138 706,200" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeOpacity="0.95" filter="url(#glow)"/>
            {/* Hanger cables */}
            {[0,1,2,3,4,5,6,7,8].map(i => {
              const t=(i+1)/10; const ax=574+t*132; const archY=200-4*t*(1-t)*62;
              return <line key={i} x1={ax} y1={archY} x2={ax} y2="200" stroke="#FFFFFF" strokeWidth="0.9" strokeOpacity="0.65"/>;
            })}
            {/* Second smaller arch */}
            <path d="M706,200 Q740,172 774,200" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeOpacity="0.75"/>
            {[0,1,2,3].map(i => {
              const t=(i+1)/5; const ax=706+t*68; const ay=200-4*t*(1-t)*28;
              return <line key={i} x1={ax} y1={ay} x2={ax} y2="200" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.55"/>;
            })}
            {/* Bridge piers */}
            {[574,640,706,774].map((x,i) => (
              <g key={i}>
                <rect x={x-4} y="200" width="8" height="22" fill="#FFFFFF" fillOpacity="0.35" stroke="#FFFFFF" strokeWidth="1"/>
                <rect x={x-7} y="218" width="14" height="4" fill="#FFFFFF" fillOpacity="0.2" stroke="#FFFFFF" strokeWidth="0.8"/>
              </g>
            ))}

            {/* ===== TREES (varied sizes) ===== */}
            {[
              [110,208,7,10],[126,212,5,8],[222,210,6,9],[240,214,4,7],
              [348,212,5,8],[362,210,6,9],[468,212,5,8],[484,210,4,7],
              [790,206,6,9],[760,210,5,8],
            ].map(([x,y,rx,ry],i) => (
              <g key={i}>
                <line x1={x} y1={y} x2={x} y2="222" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.6"/>
                <ellipse cx={x} cy={y-ry/2} rx={rx} ry={ry} fill="#FFFFFF" fillOpacity="0.15" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.7"/>
                <ellipse cx={x-rx/2} cy={y-ry/4} rx={rx*0.6} ry={ry*0.6} fill="#FFFFFF" fillOpacity="0.1" stroke="#FFFFFF" strokeWidth="0.7" strokeOpacity="0.55"/>
              </g>
            ))}

            {/* ===== WATER REFLECTION (ground) ===== */}
            <rect x="0" y="222" width="800" height="38" fill="url(#skyGrad)" opacity="0.8"/>
            {/* Ripple lines */}
            {[228,234,240].map((y,i) => <line key={i} x1="20" y1={y} x2={780-i*30} y2={y} stroke="#FFFFFF" strokeWidth="0.5" strokeOpacity={0.15-i*0.04}/>)}
          </svg>
        </div>

        {/* BOTTOM — Feature Badges with inline SVG icons */}
        <div style={{
          position: 'relative', zIndex: 2, width: '100%',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)', 
          padding: '24px 40px 36px',
          boxSizing: 'border-box',
          background: '#0B0B0D'
        }}>
          {/* Badge 1: Data-Driven Insights */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, borderRight: '1px solid rgba(255,255,255,0.08)', padding: '0 16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="12" width="4" height="9" rx="1" fill="#FFFFFF" fillOpacity="0.8"/>
              <rect x="10" y="7" width="4" height="14" rx="1" fill="#FFFFFF"/>
              <rect x="17" y="3" width="4" height="18" rx="1" fill="#FFFFFF" fillOpacity="0.6"/>
              <line x1="3" y1="21" x2="21" y2="21" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.5"/>
              <path d="M5 10 L12 5 L19 2" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.7" strokeLinecap="round"/>
            </svg>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>Data-Driven</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Insights</div>
          </div>

          {/* Badge 2: Secure & Reliable */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, borderRight: '1px solid rgba(255,255,255,0.08)', padding: '0 16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2 L20 6 L20 12 C20 16.4 16.4 20.4 12 22 C7.6 20.4 4 16.4 4 12 L4 6 Z" fill="#FFFFFF" fillOpacity="0.15" stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M8.5 12 L11 14.5 L15.5 9.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>Secure &amp;</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Reliable</div>
          </div>

          {/* Badge 3: Built for Institutions */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '0 16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3 L20 8 L20 9 L4 9 L4 8 Z" fill="#FFFFFF" fillOpacity="0.7" stroke="#FFFFFF" strokeWidth="1.2"/>
              <rect x="5" y="9" width="3" height="10" fill="#FFFFFF" fillOpacity="0.5"/>
              <rect x="10.5" y="9" width="3" height="10" fill="#FFFFFF" fillOpacity="0.7"/>
              <rect x="16" y="9" width="3" height="10" fill="#FFFFFF" fillOpacity="0.5"/>
              <line x1="3" y1="19" x2="21" y2="19" stroke="#FFFFFF" strokeWidth="1.5"/>
              <circle cx="12" cy="6" r="1.5" fill="#FFFFFF" fillOpacity="0.9"/>
            </svg>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>Built for</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Institutions</div>
          </div>
        </div>
      </div>{/* ← closes login-left */}

      {/* Right Panel */}
      <div className="login-right">
        <div className="login-form-container">
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 8 }}>Welcome back</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Sign in to your HCIP account</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    border: 'none', background: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: 14, padding: 4
                  }}
                >{showPass ? '🙈' : '👁️'}</button>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'var(--danger-light)', border: '1px solid var(--danger)',
                borderRadius: 8, padding: '12px 16px', marginBottom: 20,
                fontSize: 13, color: 'var(--danger)', lineHeight: 1.5
              }}>{error}</div>
            )}

            <button
              id="login-submit"
              type="submit"
              className="btn btn-teal"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15, marginBottom: 24 }}
            >
              {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</> : 'Sign In →'}
            </button>

            {/* Become Ambassador Call to Action */}
            <div style={{
              background: 'rgba(20, 184, 166, 0.04)',
              border: '1px dashed rgba(20, 184, 166, 0.35)',
              borderRadius: 10,
              padding: '16px',
              textAlign: 'center',
              marginTop: 8
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Become the face or ambassador of your college
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Mail us on:{' '}
                <a 
                  href="mailto:office@healix-technologies.com" 
                  style={{ color: '#14B8A6', fontWeight: 700, textDecoration: 'none', borderBottom: '1px solid rgba(20, 184, 166, 0.3)' }}
                >
                  office@healix-technologies.com
                </a>
              </div>
            </div>
          </form>

          <div style={{ marginTop: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Powered by{' '}
              <span style={{ fontWeight: 700, color: 'var(--teal-dark)' }}>Healix Technologies Pvt. Ltd.</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Research • Healthcare • Innovation • Impact</div>
          </div>
      </div>

      </div>
    </div>
    </div>
  );
}

