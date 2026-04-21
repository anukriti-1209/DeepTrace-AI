import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Shield, Activity, Target, Lock, PlayCircle, Zap, ArrowRight } from 'lucide-react'

// Array of sports imagery for the background
const SPORTS_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1000&auto=format&fit=crop', top: '10%', left: '5%', size: 400, delay: 0 },
  { url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1000&auto=format&fit=crop', top: '40%', left: '70%', size: 500, delay: 2 },
  { url: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=1000&auto=format&fit=crop', top: '70%', left: '10%', size: 400, delay: 4 },
  { url: 'https://images.unsplash.com/photo-1532906371510-dc7573663a75?q=80&w=1000&auto=format&fit=crop', top: '20%', left: '40%', size: 300, delay: 1 },
  { url: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?q=80&w=1000&auto=format&fit=crop', top: '80%', left: '60%', size: 450, delay: 3 }
]

export default function LandingPage({ onEnter }) {
  const containerRef = useRef(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Background parallax movement
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)', transition: { duration: 0.8, ease: "easeInOut" } }}
      style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        background: '#0F172A',
        color: '#FFF',
        overflowX: 'hidden',
        overflowY: 'auto',
        zIndex: 9999,
        height: '100vh',
      }}
    >
      {/* ── CINEMATIC SPORTS BACKGROUND ── */}
      <motion.div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 0, pointerEvents: 'none',
        y: bgY
      }}>
        {SPORTS_IMAGES.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0.15, 0.4, 0.15], 
              rotate: [0, 10, -10, 0],
              y: [0, -30, 30, 0]
            }}
            transition={{ 
              duration: 20 + i * 2, 
              repeat: Infinity, 
              repeatType: 'reverse',
              delay: img.delay 
            }}
            style={{
              position: 'absolute',
              top: img.top,
              left: img.left,
              width: img.size,
              height: img.size,
              backgroundImage: `url(${img.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%', /* Blob shape */
              filter: 'grayscale(50%) contrast(120%) blur(4px)',
              mixBlendMode: 'luminosity'
            }}
          />
        ))}

        {/* Global Dark Gradient Overlay for readability */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to bottom, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.95) 100%)',
          backdropFilter: 'blur(3px)'
        }} />
      </motion.div>


      {/* ── CONTENT (Normally Scrolling DOM) ── */}
      <div style={{ position: 'relative', zIndex: 1, paddingBottom: 100 }}>
        
        {/* HERO SECTION */}
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column', 
          alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          padding: '0 20px'
        }}>
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}
            style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}
          >
            <Shield size={72} color="#FF5500" />
            <h1 style={{ fontSize: '6rem', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, textShadow: '0 10px 40px rgba(255,85,0,0.5)' }}>
              DEEP<span style={{color: '#FF5500'}}>TRACE</span>
            </h1>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
            style={{ fontSize: '1.8rem', fontWeight: 600, color: '#0FA986', textTransform: 'uppercase', letterSpacing: '0.1em', maxWidth: 800 }}
          >
            Live Media & Sports Broadcast Protection Platform
          </motion.h2>

          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }}
            style={{ position: 'absolute', bottom: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16, color: '#94A3B8' }}>Scroll to Explore Features</div>
            <motion.div 
              animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ width: 2, height: 60, background: 'linear-gradient(to bottom, #FF5500, transparent)' }}
            />
          </motion.div>
        </div>

        {/* FEATURES SECTIONS */}
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20vh' }}>
          
          <FeatureBlock 
            icon={<Lock size={48} color="#FF5500" />}
            title="Cryptographic Embedding"
            desc="Inject invisible DWT-DCT dual-layer watermarks into your highly valuable sports feeds. DeepTrace guarantees survival against heavy camcording, severe compression, and high network degradation."
            align="left"
          />

          <FeatureBlock 
            icon={<Target size={48} color="#0FA986" />}
            title="Live Velocity Scanning"
            desc="Autonomous bots perpetually patrol YouTube, Twitch, Telegram, and Discord, instantly ingesting and attempting to decode frames from thousands of live suspect streams concurrently."
            align="right"
          />

          <FeatureBlock 
            icon={<Zap size={48} color="#3B82F6" />}
            title="Instant Airborne Takedowns"
            desc="Matches trigger the instantaneous generation of AI-mediated DMCA briefs, allowing automated legal dispatch before the broadcast window even closes."
            align="left"
          />

        </div>

        {/* MASSIVE CTA SECTION */}
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '10vh' }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: 'spring', stiffness: 100 }}
            style={{
              background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 85, 0, 0.3)',
              padding: '80px 40px', borderRadius: 32, backdropFilter: 'blur(20px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
              boxShadow: '0 20px 80px rgba(0,0,0,0.8), inset 0 0 40px rgba(255,85,0,0.1)',
              maxWidth: 800, width: '100%'
            }}
          >
            <PlayCircle size={80} color="#FF5500" style={{ marginBottom: 32 }} />
            <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: 16, lineHeight: 1 }}>System Initialized</h2>
            <p style={{ fontSize: '1.2rem', color: '#CBD5E1', marginBottom: 48, maxWidth: 500 }}>
              The DeepTrace neural grid is armed. Initialize your session to secure the global sports network matrix.
            </p>
            
            <button 
              onClick={onEnter}
              className="enter-btn-massive"
              style={{
                background: '#FF5500', color: '#FFF', border: 'none',
                padding: '24px 64px', fontSize: '1.5rem', fontWeight: 900,
                cursor: 'pointer', borderRadius: 16, textTransform: 'uppercase',
                letterSpacing: '0.1em', boxShadow: '0 10px 40px rgba(255,85,0,0.6)',
                display: 'flex', alignItems: 'center', gap: 16,
                transform: 'translateZ(0)', transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 15px 50px rgba(255,85,0,0.8)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(255,85,0,0.6)'
              }}
            >
              <Activity size={32} /> ENTER SECURE DASHBOARD <ArrowRight size={32} />
            </button>
          </motion.div>
        </div>

      </div>
    </motion.div>
  )
}

function FeatureBlock({ icon, title, desc, align }) {
  const isLeft = align === 'left'
  return (
    <motion.div 
      initial={{ opacity: 0, x: isLeft ? -100 : 100 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-20%" }}
      transition={{ type: "spring", stiffness: 60, damping: 15 }}
      style={{
        display: 'flex', 
        justifyContent: isLeft ? 'flex-start' : 'flex-end',
        padding: '0 40px'
      }}
    >
      <div style={{
        background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.1)',
        padding: 56, borderRadius: 24, backdropFilter: 'blur(20px)',
        width: '100%', maxWidth: 700, display: 'flex', gap: 32,
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: 24, borderRadius: 20, height: 'fit-content' }}>
          {icon}
        </div>
        <div>
          <h3 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>{title}</h3>
          <p style={{ fontSize: '1.25rem', color: '#94A3B8', lineHeight: 1.7 }}>{desc}</p>
        </div>
      </div>
    </motion.div>
  )
}
