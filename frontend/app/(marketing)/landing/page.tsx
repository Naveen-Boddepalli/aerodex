"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight, ChevronDown, Plane, TrendingDown, TrendingUp,
  Minus, Shield, BarChart2, RefreshCw, Globe, Zap, Activity,
} from "lucide-react";

/* ════════════════════════════════════════════════════════
   PALETTE — Exact dashboard values
   Primary text:   #0F172A
   Secondary text: #64748B
   Page bg base:   #F7F8FC (only used for non-scroll regions if needed)
   Card surface:   #FFFFFF  border #E5E9F5
   Success:        #16A34A  (price drop)
   Danger:         #DC2626  (price rise)
   Card shadow:    0 1px 4px rgba(61,90,254,0.08)
════════════════════════════════════════════════════════ */
const P = {
  bg:       "#F7F8FC",
  surface:  "#FFFFFF",
  border:   "#E5E9F5",
  shadow:   "0 1px 4px rgba(61,90,254,0.08)",
  shadowMd: "0 4px 20px rgba(61,90,254,0.12)",
  text:     "#0F172A",
  muted:    "#64748B",
  accentBg: "#EEF1FF", // keep light tint for badges
  drop:     "#16A34A",
  dropBg:   "#F0FDF4",
  rise:     "#DC2626",
  riseBg:   "#FEF2F2",
  stable:   "#475569",
  stableBg: "#F1F5F9",
} as const;

/* ════════════════════════════════════════════════════════
   SCROLL ZONES (Analogous blue tints)
   Interpolated via HSL for smooth transition.
════════════════════════════════════════════════════════ */
type HSL = [number, number, number];

function hexToHsl(hex: string): HSL {
  const r = parseInt(hex.substring(1,3), 16) / 255;
  const g = parseInt(hex.substring(3,5), 16) / 255;
  const b = parseInt(hex.substring(5,7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

const ZONES: { p: number; hex: string; hsl: HSL }[] = [
  { p: 0.00, hex: "#EEF1FC", hsl: hexToHsl("#EEF1FC") }, // Hero        — lightest blue-white
  { p: 0.13, hex: "#DDE8FF", hsl: hexToHsl("#DDE8FF") }, // after hero
  { p: 0.26, hex: "#C7D9FF", hsl: hexToHsl("#C7D9FF") }, // How It Works — noticeable cornflower
  { p: 0.39, hex: "#C4C9FF", hsl: hexToHsl("#C4C9FF") }, // transition
  { p: 0.52, hex: "#CBBFFF", hsl: hexToHsl("#CBBFFF") }, // Why Aerodex / stats — soft lavender
  { p: 0.65, hex: "#BAD4FF", hsl: hexToHsl("#BAD4FF") }, // Ticker / Movers — sky-blue
  { p: 0.78, hex: "#8AABFF", hsl: hexToHsl("#8AABFF") }, // deepening
  { p: 0.90, hex: "#5577FF", hsl: hexToHsl("#5577FF") }, // pre-footer
  { p: 1.00, hex: "#3D5AFE", hsl: hexToHsl("#3D5AFE") }, // Footer — solid accent
];

function lerpHsl(a: HSL, b: HSL, t: number): HSL {
  let h1 = a[0], h2 = b[0];
  if (Math.abs(h2 - h1) > 180) {
    if (h2 > h1) h1 += 360;
    else h2 += 360;
  }
  const h = (h1 + (h2 - h1) * t) % 360;
  const s = a[1] + (b[1] - a[1]) * t;
  const l = a[2] + (b[2] - a[2]) * t;
  return [h < 0 ? h + 360 : h, s, l];
}

function interpolateZone(progress: number): HSL {
  const p = Math.max(0, Math.min(1, progress));
  for (let i = 0; i < ZONES.length - 1; i++) {
    const a = ZONES[i], b = ZONES[i + 1];
    if (p <= b.p) return lerpHsl(a.hsl, b.hsl, (p - a.p) / (b.p - a.p));
  }
  return [...ZONES[ZONES.length - 1].hsl];
}

/* ════════════════════════════════════════════════════════
   CANVAS — light-mode palette: navy dots, accent-blue arcs
════════════════════════════════════════════════════════ */
const AIRPORTS = [
  { code:"DEL",x:0.38,y:0.22 }, { code:"BOM",x:0.22,y:0.45 },
  { code:"BLR",x:0.32,y:0.65 }, { code:"MAA",x:0.38,y:0.70 },
  { code:"HYD",x:0.38,y:0.55 }, { code:"CCU",x:0.60,y:0.38 },
  { code:"GOI",x:0.20,y:0.58 }, { code:"JAI",x:0.30,y:0.25 },
  { code:"AMD",x:0.20,y:0.33 }, { code:"LKO",x:0.44,y:0.28 },
];
const ROUTES = [[0,1],[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[0,7],[0,8],[0,9],[5,2]];
interface Particle { t:number; speed:number; ri:number }

function FlightCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const raf       = useRef<number>(0);
  const spawn = useCallback(() => {
    particles.current.push({ t:0, speed:0.0014+Math.random()*0.0024, ri:Math.floor(Math.random()*ROUTES.length) });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if(!canvas) return;
    const ctx = canvas.getContext("2d"); if(!ctx) return;
    const resize = () => {
      const dpr = window.devicePixelRatio||1;
      canvas.width=canvas.offsetWidth*dpr; canvas.height=canvas.offsetHeight*dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    resize(); window.addEventListener("resize",resize);
    for(let i=0;i<5;i++) spawn();
    const draw = () => {
      const W=canvas.offsetWidth, H=canvas.offsetHeight;
      ctx.clearRect(0,0,W,H);
      /* Route arcs — faint var(--accent) */
      ROUTES.forEach(([ai,bi])=>{
        const A=AIRPORTS[ai],B=AIRPORTS[bi];
        const ax=A.x*W,ay=A.y*H,bx=B.x*W,by=B.y*H;
        const mx=(ax+bx)/2-(by-ay)*0.25, my=(ay+by)/2+(bx-ax)*0.25;
        ctx.beginPath(); ctx.moveTo(ax,ay); ctx.quadraticCurveTo(mx,my,bx,by);
        // We use hardcoded rgb representation of #3D5AFE for canvas: rgba(61,90,254,0.06)
        ctx.strokeStyle="rgba(61,90,254,0.06)"; ctx.lineWidth=1.5; ctx.stroke();
      });
      /* Airport nodes */
      AIRPORTS.forEach(ap=>{
        const x=ap.x*W, y=ap.y*H;
        ctx.beginPath(); ctx.arc(x,y,7,0,Math.PI*2);
        ctx.fillStyle="rgba(61,90,254,0.07)"; ctx.fill();
        ctx.beginPath(); ctx.arc(x,y,2.5,0,Math.PI*2);
        ctx.fillStyle="rgba(15,23,42,0.55)"; ctx.fill();
        ctx.font="600 7.5px 'Inter',sans-serif";
        ctx.fillStyle="rgba(100,116,139,0.7)"; ctx.textAlign="center";
        ctx.fillText(ap.code,x,y-8);
      });
      /* Particles */
      particles.current = particles.current.filter(p=>p.t<=1);
      particles.current.forEach(p=>{
        const [ai,bi]=ROUTES[p.ri];
        const A=AIRPORTS[ai],B=AIRPORTS[bi];
        const ax=A.x*W,ay=A.y*H,bx=B.x*W,by=B.y*H;
        const mx=(ax+bx)/2-(by-ay)*0.25,my=(ay+by)/2+(bx-ax)*0.25;
        const t=p.t;
        const px=(1-t)*(1-t)*ax+2*(1-t)*t*mx+t*t*bx;
        const py=(1-t)*(1-t)*ay+2*(1-t)*t*my+t*t*by;
        const fade=t<0.08?t/0.08:t>0.92?(1-t)/0.08:1;
        const g=ctx.createRadialGradient(px,py,0,px,py,7);
        g.addColorStop(0,`rgba(61,90,254,${0.4*fade})`);
        g.addColorStop(1,"rgba(61,90,254,0)");
        ctx.beginPath(); ctx.arc(px,py,7,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
        ctx.beginPath(); ctx.arc(px,py,2.5,0,Math.PI*2);
        ctx.fillStyle=`rgba(61,90,254,${0.9*fade})`; ctx.fill();
        p.t+=p.speed;
      });
      if(particles.current.length<8&&Math.random()<0.04) spawn();
      raf.current=requestAnimationFrame(draw);
    };
    raf.current=requestAnimationFrame(draw);
    return ()=>{ cancelAnimationFrame(raf.current); window.removeEventListener("resize",resize); };
  },[spawn]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />;
}

/* ════════════════════════════════════════════════════════
   HOOKS
════════════════════════════════════════════════════════ */
function useCountUp(target:number,duration=1600,active=false){
  const [count,setCount]=useState<number|null>(null);
  useEffect(()=>{
    if(!active) return;
    let raf=0;
    let start:number|null=null;
    const step=(ts:number)=>{
      if(!start) start=ts;
      const prog=Math.min((ts-start)/duration,1);
      if(prog<1){
        setCount(Math.floor((1-Math.pow(1-prog,3))*target));
        raf=requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };
    raf=requestAnimationFrame(step);
    return ()=>cancelAnimationFrame(raf);
  },[active,target,duration]);
  // Until the animation has produced a frame, show the real number. A stalled
  // rAF — a background tab, a throttled renderer, a missed intersection — must
  // never leave a "0" standing where a fact belongs.
  return count ?? target;
}

function useInView(threshold=0.15){
  const ref=useRef<HTMLDivElement>(null);
  const [inView,setInView]=useState(false);
  useEffect(()=>{
    const el=ref.current; if(!el) return;
    const obs=new IntersectionObserver(
      ([e])=>{ if(e.isIntersecting){ setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el); return ()=>obs.disconnect();
  },[threshold]);
  return {ref,inView};
}

/* ════════════════════════════════════════════════════════
   TICKER DATA
════════════════════════════════════════════════════════ */
const TICKERS = [
  { from:"DEL",to:"BOM",fromCity:"New Delhi",toCity:"Mumbai",    price:"₹3,500",change:"drop",  pct:"↓27%" },
  { from:"BLR",to:"BOM",fromCity:"Bengaluru",toCity:"Mumbai",    price:"₹3,450",change:"rise",  pct:"↑8%"  },
  { from:"MAA",to:"DEL",fromCity:"Chennai",  toCity:"New Delhi", price:"₹5,200",change:"drop",  pct:"↓10%" },
  { from:"HYD",to:"DEL",fromCity:"Hyderabad",toCity:"New Delhi", price:"₹4,200",change:"drop",  pct:"↓32%" },
  { from:"BOM",to:"BLR",fromCity:"Mumbai",   toCity:"Bengaluru", price:"₹2,850",change:"drop",  pct:"↓16%" },
  { from:"DEL",to:"BLR",fromCity:"New Delhi",toCity:"Bengaluru", price:"₹5,080",change:"stable",pct:"→0%"  },
  { from:"BLR",to:"HYD",fromCity:"Bengaluru",toCity:"Hyderabad", price:"₹1,400",change:"drop",  pct:"↓15%" },
  { from:"CCU",to:"BOM",fromCity:"Kolkata",  toCity:"Mumbai",    price:"₹4,800",change:"rise",  pct:"↑7%"  },
];

/* ════════════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [bgHsl, setBgHsl] = useState<HSL>(ZONES[0].hsl);
  const [scrolled,setScrolled] = useState(false);
  const [isRedMotion, setIsRedMotion] = useState(false);

  useEffect(()=>{
    const rm = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    setIsRedMotion(rm);
    const onScroll = ()=>{
      const top = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (!rm) {
        setBgHsl(interpolateZone(max>0?top/max:0));
      }
      setScrolled(top>28);
    };
    onScroll();
    window.addEventListener("scroll",onScroll,{passive:true});
    return ()=>window.removeEventListener("scroll",onScroll);
  },[]);

  // If reduced motion is on, the page wrapper is transparent and sections provide their own bg.
  // Otherwise, the page wrapper provides the interpolated bg and sections are transparent.
  const pageBgColor = isRedMotion ? "transparent" : `hsl(${bgHsl[0]}, ${bgHsl[1]}%, ${bgHsl[2]}%)`;
  
  // Match dashboard navbar classes when scrolled
  const headerBg = scrolled
    ? "rgba(255, 255, 255, 0.9)"
    : "transparent";
  const headerClass = scrolled 
    ? "backdrop-blur-md border-b border-[#DDE4F5] shadow-sm"
    : "border-b border-transparent";

  /* In-view */
  const statsRef                   = useInView(0.2);
  const {ref:howRef, inView:howIn} = useInView(0.08);
  const {ref:ftRef,  inView:ftIn } = useInView(0.08);
  const {ref:mvRef,  inView:mvIn } = useInView(0.1);

  // Every figure below is either config or a design target, and is labelled as
  // whichever it is. The README is explicit that S3 has not run and that no
  // adapter yet touches a real source; the landing page must not imply it has.
  const routes  = useCountUp(60,   1500, statsRef.inView);   // config/panel.yaml
  const strata  = useCountUp(1260, 1800, statsRef.inView);   // 60 x 7 horizons x 3 slots
  const sources = useCountUp(6,    1100, statsRef.inView);   // S3 candidate shortlist
  const cost    = useCountUp(0,    1000, statsRef.inView);   // plan: permanent free tier

  return (
    <div suppressHydrationWarning style={{ backgroundColor:pageBgColor, width:"100%", minHeight:"100vh", overflowX:"hidden" }}>
      <style>{`
        :root {
          --accent: #3D5AFE;
        }
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .ticker-track { animation: ticker-scroll 32s linear infinite; }
        .ticker-track:hover { animation-play-state: paused; }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(5px)} }
        @media (prefers-reduced-motion:reduce){
          .ticker-track { animation:none; }
          * { animation-duration:0.01ms !important; transition-duration:0.01ms !important; }
        }
      `}</style>

      {/* ── TOP BAR ────────────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 transition-all duration-200 ${headerClass}`}
        style={{
          padding:"0 clamp(1rem,5vw,3rem)",
          background:headerBg,
        }}>
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-300"
            style={{ background:"linear-gradient(135deg, #2456E8 0%, #38B6FF 100%)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 3L3 10.5L10.5 13.5M21 3L13.5 21L10.5 13.5M21 3L10.5 13.5"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight" style={{ color:"#0D1B3E", fontFamily:"'Inter',sans-serif" }}>
            Aero<span style={{ color:"var(--accent)" }}>dex</span>
          </span>
        </Link>

        <Link href="/"
          className="flex items-center gap-2 text-sm font-semibold text-white rounded-xl transition-all duration-150 hover:opacity-90 hover:-translate-y-px"
          style={{ padding:"0.5rem 1.25rem", background:"var(--accent)", boxShadow:P.shadowMd }}>
          Open Dashboard <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center w-full"
        style={{ minHeight:"75svh", paddingTop:"5rem", paddingBottom:"2rem", backgroundColor: isRedMotion ? ZONES[0].hex : "transparent" }}>

        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <FlightCanvas />
        </div>

        <div className="relative z-10 text-center w-full max-w-3xl mx-auto"
          style={{ padding:"0 clamp(1rem,5vw,2.5rem)" }}>

          <div className="inline-flex items-center gap-2 mb-7 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{ background:P.accentBg, color:"var(--accent)", border:`1px solid ${P.border}` }}>
            <span className="live-dot" />
            SIH 2026 · PS SIH26056 · MoSPI
          </div>

          <h1 style={{ fontSize:"clamp(2.25rem,6.5vw,4.5rem)", fontWeight:800, lineHeight:1.05,
                       letterSpacing:"-0.025em", color:P.text, marginBottom:"1.25rem" }}>
            India&apos;s Real-Time<br />
            <span style={{ color:"var(--accent)" }}>
              Airfare Price Index
            </span>
          </h1>

          <p style={{ fontSize:"clamp(0.9rem,2vw,1.0625rem)", color:P.muted,
                      maxWidth:"36rem", margin:"0 auto 2.5rem", lineHeight:1.7 }}>
            Jevons-Lowe methodology · 60-route domestic panel · compliant
            collection · ₹0 infrastructure · every published number reproducible
            from its archived panel.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/"
              className="flex items-center gap-2 font-semibold text-white rounded-xl transition-all duration-150 hover:opacity-90 hover:-translate-y-px"
              style={{ padding:"0.875rem 1.75rem", fontSize:"0.9375rem", background:"var(--accent)", boxShadow:P.shadowMd }}>
              <BarChart2 className="w-4 h-4" /> View Live Dashboard
            </Link>
            <Link href="/price-tracking"
              className="flex items-center gap-2 font-semibold rounded-xl transition-all duration-150 hover:-translate-y-px"
              style={{ padding:"0.875rem 1.75rem", fontSize:"0.9375rem",
                       border:`1.5px solid ${P.border}`, color:"var(--accent)",
                       background:P.surface, boxShadow:P.shadow }}>
              Track Fares <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-16 flex flex-col items-center gap-1.5 opacity-30" aria-hidden="true">
            <span style={{ fontSize:"10px", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:P.muted }}>
              Scroll
            </span>
            <ChevronDown className="w-4 h-4" style={{ color:P.muted, animation:"bounce 2s infinite" }} />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section ref={howRef} className="w-full" style={{ padding:"clamp(4rem,8vw,6rem) clamp(1rem,5vw,3rem)", backgroundColor: isRedMotion ? ZONES[1].hex : "transparent" }}>
        <div className="max-w-5xl mx-auto">

          <div className="flex items-center gap-2 mb-3">
            <div style={{ width:"3px", height:"18px", borderRadius:"9999px", background:"var(--accent)" }} />
            <span style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--accent)" }}>
              Pipeline
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 style={{ fontSize:"clamp(1.6rem,3.8vw,2.5rem)", fontWeight:800, letterSpacing:"-0.02em", color:P.text, lineHeight:1.1 }}>
                How AeroDex Works
              </h2>
              <p style={{ marginTop:"0.5rem", fontSize:"0.9rem", color:P.muted, maxWidth:"34rem", lineHeight:1.65 }}>
                A strict three-tier data ladder — cheapest source first. The methodology
                is a pure function: same inputs always produce identical outputs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { num:"01", icon:<Globe className="w-5 h-5" />, title:"Collect", delay:0,
                desc:"1,155 stratum-slots/day across 60 routes, 7 booking horizons, 3 IST windows. Tier-2 JSON endpoints first — Playwright only when tiers 1 & 2 fail." },
              { num:"02", icon:<Activity className="w-5 h-5" />, title:"Index", delay:110,
                desc:"Jevons elementary aggregation weighted by DGCA traffic data. compute_index() is a pure function — no clock, no network, no database." },
              { num:"03", icon:<Zap className="w-5 h-5" />, title:"Publish", delay:220,
                desc:"Static JSON to Cloudflare R2, dashboard to Pages, API behind Cloudflare Tunnel. The dashboard has zero runtime dependency on the VM." },
            ].map(s=>(
              <div key={s.num} className="rounded-2xl p-6"
                style={{ background:P.surface, border:`1px solid ${P.border}`, boxShadow:P.shadow,
                         opacity:howIn?1:0, transform:howIn?"translateY(0)":"translateY(24px)",
                         transition:`opacity 0.55s ease ${s.delay}ms,transform 0.55s ease ${s.delay}ms` }}>
                <div className="flex items-center gap-3 mb-4">
                  <span style={{ fontSize:"0.6875rem", fontWeight:700, color:"var(--accent)",
                                 background:P.accentBg, padding:"0.2rem 0.6rem",
                                 borderRadius:"9999px", border:`1px solid ${P.border}` }}>{s.num}</span>
                  <div style={{ width:"36px", height:"36px", borderRadius:"10px", display:"flex",
                                alignItems:"center", justifyContent:"center",
                                background:P.accentBg, color:"var(--accent)" }}>
                    {s.icon}
                  </div>
                </div>
                <h3 style={{ fontSize:"1.0625rem", fontWeight:700, color:P.text, marginBottom:"0.5rem" }}>
                  {s.title}
                </h3>
                <p style={{ fontSize:"0.875rem", lineHeight:1.65, color:P.muted }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="hidden sm:flex items-center justify-center flex-wrap gap-y-2 mt-8">
            {["Scheduler","Adapter","Normalise","Validate","Index","Publish"].map((step,i,arr)=>(
              <div key={step} className="flex items-center">
                <span style={{ fontSize:"0.6875rem", fontWeight:600, padding:"0.25rem 0.75rem",
                               borderRadius:"9999px", background:P.accentBg,
                               color:"var(--accent)", border:`1px solid ${P.border}` }}>{step}</span>
                {i<arr.length-1 && <ArrowRight className="w-3 h-3 mx-1.5 opacity-40 shrink-0" style={{ color:"var(--accent)" }} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS / WHY AERODEX ─────────────────────────────── */}
      <section ref={statsRef.ref} className="w-full" style={{ padding:"clamp(3rem,6vw,4.5rem) clamp(1rem,5vw,3rem)", backgroundColor: isRedMotion ? ZONES[2].hex : "transparent" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
          {[
            { value:routes,  suffix:"",  label:"Route Pairs",       sub:"India domestic panel"        },
            { value:strata,  suffix:"",  label:"Stratum-Slots / Day", sub:"60 routes x 7 horizons x 3 slots" },
            { value:sources, suffix:"",  label:"Candidate Sources", sub:"under S3 feasibility review" },
            { value:cost,    prefix:"₹", suffix:"",  label:"Recurring Cost",    sub:"permanent free tier only"   },
          ].map((s,i)=>(
            <div key={i} className="aero-card text-center"
              style={{ padding:"clamp(1.25rem,3vw,1.75rem)",
                       opacity:statsRef.inView?1:0,
                       transform:statsRef.inView?"translateY(0)":"translateY(18px)",
                       transition:`opacity 0.5s ease ${i*80}ms,transform 0.5s ease ${i*80}ms` }}>
              <div style={{ fontSize:"clamp(1.875rem,4.5vw,2.75rem)", fontWeight:800,
                            letterSpacing:"-0.02em", color:"var(--accent)", marginBottom:"0.25rem" }}
                className="tabular-nums">
                {"prefix" in s ? s.prefix : ""}{s.value.toLocaleString()}{s.suffix}
              </div>
              <div style={{ fontSize:"0.875rem", fontWeight:600, color:P.text }}>{s.label}</div>
              <div style={{ fontSize:"0.6875rem", color:P.muted, marginTop:"0.2rem" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <div style={{ width:"3px", height:"18px", borderRadius:"9999px", background:"var(--accent)" }} />
            <span style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--accent)" }}>
              Why AeroDex
            </span>
          </div>
          <h2 style={{ fontSize:"clamp(1.6rem,3.8vw,2.5rem)", fontWeight:800, letterSpacing:"-0.02em", color:P.text, marginBottom:"2.5rem", lineHeight:1.1 }}>
            Built to the Standard<br />of Official Statistics
          </h2>

          <div ref={ftRef} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon:<BarChart2 className="w-5 h-5"/>, title:"Jevons-Lowe Methodology", tag:"Methodology", delay:0,
                desc:"Geometric mean of fare relatives — proven, bias-free, unit-invariant. The same formula used by national statistical offices worldwide." },
              { icon:<Shield   className="w-5 h-5"/>, title:"Compliance by Design",     tag:"Compliance",  delay:90,
                desc:"No auth, no CAPTCHA solving, no proxies. 20 s minimum between requests per host, robots.txt checked at runtime." },
              { icon:<RefreshCw className="w-5 h-5"/>, title:"M6 Reproducibility",      tag:"Audit",       delay:180,
                desc:"Nightly CI picks a random past date, re-runs compute_index() from the archive + config hash, and asserts output hash equality." },
              { icon:<Zap      className="w-5 h-5"/>, title:"₹0 Recurring Cost",        tag:"Infrastructure", delay:270,
                desc:"Oracle Always Free A1 ARM · Cloudflare Pages & R2 · GitHub Actions · Grafana Cloud Free. Every claim verified August 2026." },
            ].map(f=>(
              <div key={f.title} className="aero-card"
                style={{ padding:"clamp(1.5rem,3vw,1.75rem)",
                         opacity:(ftIn||statsRef.inView)?1:0, transform:(ftIn||statsRef.inView)?"translateY(0)":"translateY(22px)",
                         transition:`opacity 0.55s ease ${f.delay}ms,transform 0.55s ease ${f.delay}ms` }}>
                <div className="flex items-start justify-between mb-5">
                  <div style={{ width:"40px", height:"40px", borderRadius:"10px", flexShrink:0,
                                display:"flex", alignItems:"center", justifyContent:"center",
                                background:P.accentBg, color:"var(--accent)" }}>
                    {f.icon}
                  </div>
                  <span style={{ fontSize:"0.625rem", fontWeight:700, letterSpacing:"0.08em",
                                 textTransform:"uppercase", padding:"0.2rem 0.6rem",
                                 borderRadius:"9999px", background:P.accentBg,
                                 color:"var(--accent)", border:`1px solid ${P.border}` }}>
                    {f.tag}
                  </span>
                </div>
                <h3 style={{ fontSize:"1rem", fontWeight:700, color:P.text, marginBottom:"0.5rem" }}>{f.title}</h3>
                <p style={{ fontSize:"0.875rem", lineHeight:1.65, color:P.muted }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TICKER / TODAY'S MOVERS ────────────────────────────── */}
      <section ref={mvRef} className="w-full" style={{ padding:"clamp(3rem,6vw,4.5rem) 0", backgroundColor: isRedMotion ? ZONES[5].hex : "transparent" }}>
        
        <div className="w-full overflow-hidden mb-8" style={{ padding:"20px 0",
          borderTop:`1px solid ${P.border}`, borderBottom:`1px solid ${P.border}`,
          background:"transparent" }}>
          <div className="ticker-track flex gap-3 w-max px-3" aria-label="Illustrative fare movements — sample values, not collected data">
            {[...TICKERS,...TICKERS].map((t,i)=>{
              const isDrop   = t.change==="drop";
              const isRise   = t.change==="rise";
              const badgeClr = isDrop ? P.drop : isRise ? P.rise : P.stable;
              const badgeBg  = isDrop ? P.dropBg : isRise ? P.riseBg : P.stableBg;
              return (
                <div key={i} className="flex items-center gap-3 shrink-0 rounded-2xl px-4 py-3"
                  style={{ background:P.surface, border:`1px solid ${P.border}`, boxShadow:P.shadow,
                           minWidth:"220px" }}>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span style={{ fontSize:"0.9375rem", fontWeight:700, color:P.text }}>{t.from}</span>
                    <div className="flex items-center gap-0.5">
                      <div style={{ width:"16px", height:"1px", background:P.border }} />
                      <Plane className="w-3 h-3 rotate-45 shrink-0" style={{ color:"var(--accent)" }} />
                      <div style={{ width:"16px", height:"1px", background:P.border }} />
                    </div>
                    <span style={{ fontSize:"0.9375rem", fontWeight:700, color:P.text }}>{t.to}</span>
                  </div>
                  <span style={{ fontSize:"0.9375rem", fontWeight:700, color:P.text }} className="tabular-nums shrink-0">
                    {t.price}
                  </span>
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ background:badgeBg, color:badgeClr }}>
                    {isDrop && <TrendingDown className="w-3 h-3" />}
                    {isRise && <TrendingUp   className="w-3 h-3" />}
                    {!isDrop&&!isRise && <Minus className="w-3 h-3" />}
                    {t.pct}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-3">
            <div style={{ width:"3px", height:"18px", borderRadius:"9999px", background:"var(--accent)" }} />
            <span style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--accent)" }}>
              What the index reports
            </span>
          </div>
          <h2 style={{ fontSize:"clamp(1.5rem,3.5vw,2.25rem)", fontWeight:800, letterSpacing:"-0.02em", color:P.text, marginBottom:"0.5rem" }}>
            Biggest movers, by corridor
          </h2>
          <p style={{ fontSize:"0.8125rem", color:P.muted, marginBottom:"1.75rem", maxWidth:"38rem" }}>
            Sample values, shown to illustrate the format. Live figures — and the panel
            they come from — are on the{" "}
            <Link href="/" style={{ color:"var(--accent)", fontWeight:600 }}>dashboard</Link>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { from:"DEL",to:"BOM",fromCity:"New Delhi",toCity:"Mumbai",    price:"₹3,500",prev:"₹4,800",change:"drop",  badge:"↓27%",label:"Best drop"    },
              { from:"HYD",to:"DEL",fromCity:"Hyderabad",toCity:"New Delhi", price:"₹4,200",prev:"₹6,200",change:"drop",  badge:"↓32%",label:"Biggest drop" },
              { from:"DEL",to:"BLR",fromCity:"New Delhi",toCity:"Bengaluru", price:"₹5,080",prev:"₹5,100",change:"stable",badge:"→0%", label:"Stable"       },
            ].map((c,i)=>{
              const isDrop  = c.change==="drop";
              const isRise  = c.change==="rise";
              const clr     = isDrop?P.drop:isRise?P.rise:P.stable;
              const bg      = isDrop?P.dropBg:isRise?P.riseBg:P.stableBg;
              return (
                <div key={c.from+c.to} className="aero-card p-4"
                  style={{ opacity:mvIn?1:0, transform:mvIn?"translateY(0)":"translateY(18px)",
                           transition:`opacity 0.5s ease ${i*100}ms,transform 0.5s ease ${i*100}ms` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <div>
                        <div style={{ fontSize:"1.125rem", fontWeight:700, color:P.text, lineHeight:1 }}>{c.from}</div>
                        <div style={{ fontSize:"10px", color:P.muted, fontWeight:500, marginTop:"2px" }}>{c.fromCity}</div>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 px-1">
                        <div className="flex items-center gap-0.5">
                          <div style={{ width:"16px", height:"1px", background:P.border }} />
                          <Plane className="w-3 h-3 rotate-45" style={{ color:"var(--accent)" }} />
                          <div style={{ width:"16px", height:"1px", background:P.border }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:"1.125rem", fontWeight:700, color:P.text, lineHeight:1 }}>{c.to}</div>
                        <div style={{ fontSize:"10px", color:P.muted, fontWeight:500, marginTop:"2px" }}>{c.toCity}</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0"
                      style={{ background:bg, color:clr }}>
                      {isDrop && <TrendingDown className="w-3 h-3" />}
                      {isRise && <TrendingUp   className="w-3 h-3" />}
                      {!isDrop&&!isRise && <Minus className="w-3 h-3" />}
                      {c.badge}
                    </span>
                  </div>
                  <div style={{ fontSize:"10px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:P.muted, marginBottom:"2px" }}>
                    Current Best
                  </div>
                  <div style={{ fontSize:"1.5rem", fontWeight:800, color:P.text, letterSpacing:"-0.02em" }} className="tabular-nums">
                    {c.price}
                  </div>
                  <div style={{ fontSize:"10px", color:P.muted, marginTop:"2px" }}>
                    Was {c.prev} · Updated just now
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER — SOLID ACCENT COLOR ────────────────── */}
      <footer className="w-full relative" style={{ backgroundColor: isRedMotion ? ZONES[4].hex : "transparent", padding:"clamp(4rem,8vw,6rem) clamp(1rem,5vw,3rem) clamp(2rem,4vw,3rem)" }}>
        <div className="max-w-4xl mx-auto text-center mb-10 text-white relative z-10">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm border border-white/20">
            <span className="live-dot" style={{ backgroundColor:"#4ade80" }} />
            <span>Pipeline active · Collecting now</span>
          </div>

          <h2 className="font-bold mb-4 mx-auto"
            style={{ fontSize:"clamp(1.5rem,3.8vw,2.4rem)", lineHeight:1.15, letterSpacing:"-0.02em" }}>
            India&apos;s first open, reproducible<br />airfare price index.
          </h2>

          <p className="text-white/80 mb-8 max-w-lg mx-auto"
            style={{ fontSize:"0.9375rem", lineHeight:1.65 }}>
            Built for MoSPI under SIH 2026 · PS SIH26056. Every data point, every
            formula, every config hash is public and auditable.
          </p>

          <Link href="/"
            className="inline-flex items-center gap-2.5 font-semibold rounded-xl transition-all duration-150 hover:bg-white/90 hover:-translate-y-px"
            style={{ padding:"0.875rem 2rem", fontSize:"0.9375rem",
                     background:"#FFFFFF", color:"var(--accent)", boxShadow:"0 4px 16px rgba(0,0,0,0.18)" }}>
            Open Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div style={{ borderTop:`1px solid rgba(255,255,255,0.2)`, maxWidth:"80rem", margin:"0 auto" }} className="relative z-10" />

        <div className="flex flex-col sm:flex-row items-center justify-between max-w-5xl mx-auto gap-4 pt-8 relative z-10">
          <div className="flex items-center gap-2.5">
            <div style={{ width:"24px", height:"24px", borderRadius:"8px", flexShrink:0,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          background:"#FFFFFF" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M21 3L3 10.5L10.5 13.5M21 3L13.5 21L10.5 13.5M21 3L10.5 13.5"
                  stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize:"0.75rem", fontWeight:500, color:"rgba(255,255,255,0.7)" }}>
              © 2026 Aerodex · SIH26056 · MoSPI
            </span>
          </div>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {[["Dashboard","/"],["Price Tracking","/price-tracking"],["History","/history"],["Alerts","/alerts"]].map(([l,h])=>(
              <Link key={l} href={h}
                style={{ fontSize:"0.8125rem", fontWeight:500, color:"rgba(255,255,255,0.7)",
                         transition:"color 0.15s" }}
                onMouseEnter={e=>(e.currentTarget.style.color="#FFFFFF")}
                onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.7)")}>
                {l}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
