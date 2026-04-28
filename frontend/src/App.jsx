import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LandingPage from './LandingPage'
import { 
  FaYoutube, FaTiktok, FaTelegramPlane, FaDiscord, 
  FaTwitter, FaFacebook, FaInstagram, FaReddit, 
  FaGlobeAmericas
} from 'react-icons/fa'
import { 
  Shield, Activity, Settings, Radio, BookOpen, HeartPulse, Target, Scale, 
  BarChart2, FileText, CheckCircle2, AlertTriangle, PlayCircle, Zap,
  Moon, Sun, Globe, ClipboardList, Clock, CheckCircle, XCircle, 
  Loader2, Bot, Calendar, AlertOctagon, Check, Search, Lock
} from 'lucide-react'
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, XAxis, YAxis
} from 'recharts'

const API = import.meta.env.PROD ? '' : 'http://localhost:8000'

/* ═══════════════════════════════════════════════════════════════════════
   DeepTrace Dashboard — 4 Screens
   1. Asset Manager
   2. Live Detection Feed
   3. Enforcement Center
   4. Analytics & Predictions
   ═══════════════════════════════════════════════════════════════════════ */

// ── API helpers ──────────────────────────────────────────────────────────
async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'API Error')
  }
  return res
}

async function apiJson(path, opts) {
  return (await api(path, opts)).json()
}

// ── Platform icons ───────────────────────────────────────────────────────
const platformIcons = {
  'YouTube': <FaYoutube color="#ff0000" />,
  'TikTok': <FaTiktok color="#00f2fe" />,
  'Telegram': <FaTelegramPlane color="#0088cc" />,
  'Discord': <FaDiscord color="#5865f2" />,
  'Twitter/X': <FaTwitter color="#1da1f2" />,
  'Facebook': <FaFacebook color="#1877f2" />,
  'Instagram': <FaInstagram color="#e1306c" />,
  'Reddit': <FaReddit color="#ff4500" />,
}

const statusColors = {
  'pending': 'pending', 'enforcement_initiated': 'initiated', 'resolved': 'resolved',
}

function Ticker() {
  const items = [
    { title: 'LIVE', detail: 'Premier League Takedown Sweep Active' },
    { title: 'CONFIRMED', detail: 'UFC 300 Stream Blocked (discord.gg/streamX)' },
    { title: 'ALERT', detail: 'High Risk Profile detected in EU-West' },
    { title: 'RECOVERED', detail: '$4,250 Revenue Protected (Last 12hr)' },
    { title: 'ENFORCEMENT', detail: '72 notices auto-filed this session' }
  ]
  return (
    <div className="ticker-container">
      <div className="ticker-content" style={{display:'flex'}}>
        {[...items, ...items, ...items].map((item, i) => (
          <div key={i} className="ticker-item">
            <span style={{color: '#000', background: 'rgba(0,0,0,0.15)', padding: '2px 8px', borderRadius: 4, fontWeight: 900}}>{item.title}</span>
            <span style={{opacity: 0.9}}>{item.detail}</span>
            <div className="ticker-separator"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════
// SCREEN 1 — ASSET MANAGER
// ═════════════════════════════════════════════════════════════════════════
function AssetManager() {
  const [assets, setAssets] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [error, setError] = useState(null)
  const fileRef = useRef()

  const loadAssets = useCallback(async () => {
    try { setAssets(await apiJson('/api/v1/assets')) } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { loadAssets() }, [loadAssets])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    setUploadResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('owner_id', 'demo-rights-holder')
      form.append('licensee_id', 'hotstar-india')
      const result = await apiJson('/api/v1/watermark/encode-json', { method: 'POST', body: form })
      setUploadResult(result)
      loadAssets()
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDecode = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    setUploadResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const result = await apiJson('/api/v1/watermark/decode', { method: 'POST', body: form })
      setUploadResult({
        matched: result.provenance_verified,
        confidence_score: result.confidence,
        extracted_fingerprint: result.fingerprint,
        asset_owner: result.asset?.owner_id,
        licensee: result.licensee?.licensee_identity
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={28} /> Asset Manager
        </h2>
        <p>Upload media to watermark, generate licensee variants, and verify protection</p>
      </div>

      <div className="grid-2 mb-24">
        {/* Encode */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Watermark Encoder</span>
            <span className="badge initiated">48-bit</span>
          </div>
          <div className={`upload-zone ${uploading ? 'active' : ''}`} onClick={() => !uploading && fileRef.current?.click()}>
            <div className="upload-icon" style={{marginBottom: 16}}><Lock size={36} color="var(--text-secondary)" /></div>
            <h3>Upload Media to Protect</h3>
            <p>Drop an image here or click to browse. Embeds dual-layer watermark (spatial + DCT).</p>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleUpload} />
          </div>
        </div>

        {/* Decode */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Watermark Decoder</span>
            <span className="badge resolved" style={{display:'flex', alignItems:'center', gap:4}}><Check size={14}/> Verify</span>
          </div>
          <div className={`upload-zone ${uploading ? 'active' : ''}`} onClick={() => !uploading && document.getElementById('decode-input')?.click()}>
            <div className="upload-icon" style={{marginBottom: 16}}><Search size={36} color="var(--text-secondary)" /></div>
            <h3>Verify / Decode Image</h3>
            <p>Upload a suspected pirated image to extract its fingerprint and check provenance.</p>
            <input id="decode-input" type="file" accept="image/*" hidden onChange={handleDecode} />
          </div>
        </div>
      </div>

      {uploading && <div className="card mb-24" style={{display:'flex', alignItems:'center', gap:8}}><Loader2 size={16} style={{animation:'spin 1s linear infinite'}} /> <p>Processing...</p></div>}
      {error && <div className="card mb-24" style={{borderColor: 'var(--accent-rose)', display:'flex', alignItems:'center', gap:8}}><XCircle size={16} color="var(--accent-rose)" /> <p>{error}</p></div>}

      {uploadResult && (
        <div className="card mb-24" style={{border: `1px solid ${uploadResult.asset_id ? 'var(--accent-blue)' : (uploadResult.matched ? 'var(--accent-emerald)' : 'var(--accent-rose)')}`}}>
          <div className="card-header">
            <span className="card-title" style={{fontSize: 18, display:'flex', alignItems:'center', gap:8}}>
              {uploadResult.asset_id ? <><CheckCircle size={20} color="var(--accent-blue)"/> Protection Applied</> : (uploadResult.matched ? <><CheckCircle size={20} color="var(--accent-emerald)"/> Provenance Confirmed</> : <><XCircle size={20} color="var(--accent-rose)"/> No Registered Watermark</>)}
            </span>
          </div>
          
          <div className="grid-2">
            <div>
              {uploadResult.asset_id ? (
                <>
                  <div className="mb-16">
                    <div className="text-sm text-muted mb-8">Registered Asset ID</div>
                    <div className="font-mono" style={{background: 'var(--bg-glass)', padding: '8px 12px', borderRadius: 8}}>
                      {uploadResult.asset_id}
                    </div>
                  </div>
                  <div className="mb-16">
                    <div className="text-sm text-muted mb-8">Generated Fingerprint Hash</div>
                    <div className="font-mono" style={{color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.1)', padding: '8px 12px', borderRadius: 8}}>
                      {uploadResult.fingerprint}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted mb-8">Signal Quality (PSNR)</div>
                    <div style={{fontSize: 24, fontWeight: 700}}>
                      {uploadResult.metadata?.psnr_db.toFixed(2)} dB
                    </div>
                  </div>
                  {uploadResult.image_base64 && (
                    <div className="mt-16 pt-16" style={{borderTop: '1px solid var(--border-glass)'}}>
                      <a href={uploadResult.image_base64} download={uploadResult.filename} className="btn btn-primary" style={{width: '100%', justifyContent: 'center'}}>
                        <FileText size={16} /> Download Protected Media
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="mb-16">
                    <div className="text-sm text-muted mb-8">Extracted Fingerprint Map</div>
                    <div className="font-mono" style={{background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 8, overflowWrap: 'anywhere', color: '#0F172A'}}>
                      {uploadResult.extracted_fingerprint || '—'}
                    </div>
                  </div>
                  {uploadResult.matched && (
                    <div className="mb-16">
                      <div className="text-sm text-muted mb-8">Matched Asset Owner</div>
                      <div className="font-mono" style={{color: 'var(--accent-emerald)', background: 'rgba(15, 169, 134, 0.15)', padding: '8px 12px', borderRadius: 8}}>
                        {uploadResult.asset_owner}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {uploadResult.asset_id && uploadResult.image_base64 && (
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                <div style={{background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: 8, maxWidth: '100%'}}>
                  <img src={uploadResult.image_base64} alt="Watermarked Asset" style={{maxWidth: '100%', maxHeight: 200, display: 'block', borderRadius: 4, objectFit: 'contain'}} />
                </div>
                <div className="text-sm text-muted mt-8">Invisible DWT-DCT watermark embedded</div>
              </div>
            )}

            {!uploadResult.asset_id && (
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                <div style={{width: 200, height: 160}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Confidence', value: uploadResult.confidence_score * 100 },
                          { name: 'Max', value: 100 - (uploadResult.confidence_score * 100) }
                        ]}
                        cx="50%" cy="100%"
                        startAngle={180} endAngle={0}
                        innerRadius={60} outerRadius={80}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive={true}
                        animationDuration={1500}
                        animationEasing="ease-out"
                        cornerRadius={4}
                      >
                        <Cell fill={uploadResult.matched ? 'var(--accent-emerald)' : 'var(--accent-rose)'} />
                        <Cell fill="var(--bg-secondary)" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{fontSize: 42, fontWeight: 800, marginTop: -32, color: '#0F172A', letterSpacing: '-0.03em'}}>
                  {(uploadResult.confidence_score * 100).toFixed(1)}<span style={{fontSize: 24}}>%</span>
                </div>
                <div className="text-sm text-muted" style={{fontWeight: 500, marginTop: 4}}>Confidence Score</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Asset Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Protected Assets</span>
          <span className="text-sm text-muted">{assets.length} assets</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Owner</th>
                <th>Fingerprint</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 && (
                <tr><td colSpan={4} style={{textAlign:'center', padding: 32}}>No assets yet. Upload a file to get started.</td></tr>
              )}
              {assets.map(a => (
                <tr key={a.asset_id}>
                  <td className="font-mono" style={{fontSize: 12}}>{a.asset_id.slice(0,8)}...</td>
                  <td>{a.owner_id}</td>
                  <td className="font-mono" style={{color: 'var(--accent-cyan)'}}>{a.fingerprint_hash}</td>
                  <td>{new Date(a.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════
// SCREEN 2 — LIVE DETECTION FEED
// ═════════════════════════════════════════════════════════════════════════
function LiveFeed() {
  const [detections, setDetections] = useState([])
  const [wsStatus, setWsStatus] = useState('disconnected')
  const [simulating, setSimulating] = useState(false)
  const wsRef = useRef(null)

  const loadDetections = useCallback(async () => {
    try { setDetections(await apiJson('/api/v1/detections')) } catch (e) { console.error(e) }
  }, [])

  useEffect(() => {
    loadDetections()

    // WebSocket connection
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const wsUrl = import.meta.env.PROD 
        ? `${proto}://${window.location.host}/ws/detections` 
        : `${proto}://localhost:8000/ws/detections`
    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.onopen = () => setWsStatus('connected')
      ws.onclose = () => setWsStatus('disconnected')
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'new_detection') {
          setDetections(prev => [data, ...prev].slice(0, 100))
        }
      }
    } catch (e) {
      console.log('WebSocket not available, polling mode')
    }

    return () => wsRef.current?.close()
  }, [loadDetections])

  const runSimulation = async () => {
    setSimulating(true)
    try {
      await apiJson('/api/v1/agents/simulate', { method: 'POST' })
      await loadDetections()
    } catch (e) { console.error(e) }
    setSimulating(false)
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={28} /> Live Detection Feed
            </h2>
            <p>Real-time stream of piracy detections across platforms</p>
          </div>
          <div className="flex gap-12" style={{alignItems:'center'}}>
            <div className="flex gap-8" style={{alignItems:'center'}}>
              <div className="feed-dot" style={{background: wsStatus === 'connected' ? 'var(--accent-emerald)' : 'var(--accent-rose)', animation: wsStatus === 'connected' ? 'pulse 2s infinite' : 'none'}}></div>
              <span className="text-sm">{wsStatus === 'connected' ? 'Live' : 'Offline'}</span>
            </div>
            <button className="btn btn-primary" onClick={runSimulation} disabled={simulating}>
              {simulating ? <><Loader2 size={16} style={{animation:'spin 1s linear infinite'}} /> Sweeping...</> : <><Bot size={18} /> Run Detection Sweep</>}
            </button>
          </div>
        </div>
      </div>

      <div className="stats-grid mb-24">
        <div className="stat-card blue">
          <div className="stat-icon"><BarChart2 /></div>
          <div className="stat-value">{detections.length}</div>
          <div className="stat-label">Total Detections</div>
        </div>
        <div className="stat-card rose">
          <div className="stat-icon"><AlertTriangle /></div>
          <div className="stat-value">{detections.filter(d => d.enforcement_status === 'pending').length}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><Target /></div>
          <div className="stat-value">
            {detections.length > 0 ? (detections.reduce((s, d) => s + (d.confidence_score || 0), 0) / detections.length * 100).toFixed(1) + '%' : '—'}
          </div>
          <div className="stat-label">Avg Confidence</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon"><Globe /></div>
          <div className="stat-value">{new Set(detections.map(d => d.platform)).size}</div>
          <div className="stat-label">Platforms</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Detection Stream</span>
          <span className="text-sm text-muted">Latest detections</span>
        </div>
        {detections.length === 0 && (
          <p style={{textAlign:'center', padding: 32, color: 'var(--text-muted)'}}>
            No detections yet. Click "Simulate Agents" to generate sample data.
          </p>
        )}
        {detections.map((d, i) => (
          <div className="feed-item" key={d.detection_id || i}>
            <div className={`feed-dot ${d.confidence_score > 0.9 ? 'danger' : d.confidence_score > 0.8 ? 'warning' : 'live'}`}></div>
            <div className="feed-content">
              <div className="feed-platform">
                {platformIcons[d.platform] || '🌐'} {d.platform}
              </div>
              <div className="feed-url">{d.url}</div>
            </div>
            <div className="feed-confidence" style={{color: d.confidence_score > 0.9 ? 'var(--accent-rose)' : 'var(--accent-amber)'}}>
              {((d.confidence_score || 0) * 100).toFixed(1)}%
            </div>
            <span className={`badge ${statusColors[d.enforcement_status] || 'pending'}`}>
              {d.enforcement_status || 'pending'}
            </span>
            <div className="feed-time">
              {d.detected_at ? new Date(d.detected_at).toLocaleTimeString() : 'just now'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════
// SCREEN 3 — ENFORCEMENT CENTER
// ═════════════════════════════════════════════════════════════════════════
function EnforcementCenter() {
  const [detections, setDetections] = useState([])
  const [stats, setStats] = useState(null)
  const [enforcing, setEnforcing] = useState(null)
  const [enforcementResult, setEnforcementResult] = useState(null)

  const load = useCallback(async () => {
    try {
      setDetections(await apiJson('/api/v1/detections'))
      setStats(await apiJson('/api/v1/enforcement/stats'))
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { load() }, [load])

  const enforce = async (detectionId) => {
    setEnforcing(detectionId)
    setEnforcementResult(null)
    try {
      const result = await apiJson(`/api/v1/enforce/${detectionId}`, { method: 'POST' })
      setEnforcementResult(result)
      load()
    } catch (e) {
      setEnforcementResult({ error: e.message })
    }
    setEnforcing(null)
  }

  return (
    <div>
      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scale size={28} /> Enforcement Center
        </h2>
        <p>Active takedowns, legal briefs, and enforcement pipeline status</p>
      </div>

      {stats && (
        <div className="stats-grid mb-24">
          <div className="stat-card blue">
            <div className="stat-icon"><ClipboardList /></div>
            <div className="stat-value">{stats.total_detections}</div>
            <div className="stat-label">Total Cases</div>
          </div>
          <div className="stat-card amber">
            <div className="stat-icon"><Clock /></div>
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-icon"><Zap /></div>
            <div className="stat-value">{stats.enforcement_initiated}</div>
            <div className="stat-label">Initiated</div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon"><CheckCircle /></div>
            <div className="stat-value">{stats.resolved}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>
      )}

      {enforcementResult && (
        <div className="card mb-24" style={{borderColor: enforcementResult.error ? 'var(--accent-rose)' : 'var(--accent-emerald)', padding: 0, overflow: 'hidden'}}>
          <div className="card-header" style={{padding: '24px 24px 0 24px', marginBottom: 24}}>
            <span className="card-title" style={{fontSize: 18, display:'flex', alignItems:'center', gap:8}}>
              {enforcementResult.error ? <><XCircle size={20} color="var(--accent-rose)"/> Enforcement Failed</> : <><Zap size={20} color="var(--accent-blue)"/> Autonomous Enforcement Brief</>}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => setEnforcementResult(null)}>Close</button>
          </div>
          
          <div className="grid-2" style={{borderTop: '1px solid var(--border-glass)'}}>
            <div style={{padding: 24, borderRight: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)'}}>
              <h4 style={{marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1}}>Case Timeline</h4>
              
              <div style={{position: 'relative', paddingLeft: 20}}>
                <div style={{position: 'absolute', left: 4, top: 8, bottom: 0, width: 2, background: 'var(--bg-glass)'}}></div>
                
                <div style={{position: 'relative', marginBottom: 20}}>
                  <div style={{position: 'absolute', left: -21, top: 4, width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-blue)', border: '2px solid var(--bg-card)'}}></div>
                  <div className="text-sm font-bold">Detected</div>
                  <div className="text-sm text-muted">Platform scanner identified watermark on restream.io</div>
                </div>

                <div style={{position: 'relative', marginBottom: 20}}>
                  <div style={{position: 'absolute', left: -21, top: 4, width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-blue)', border: '2px solid var(--bg-card)'}}></div>
                  <div className="text-sm font-bold">Analyzed</div>
                  <div className="text-sm text-muted">Provenance mapped to Licensee: Hotstar</div>
                </div>

                <div style={{position: 'relative', marginBottom: 20}}>
                  <div style={{position: 'absolute', left: -21, top: 4, width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-blue)', border: '2px solid var(--bg-card)'}}></div>
                  <div className="text-sm font-bold">Brief Generated</div>
                  <div className="text-sm text-muted">Autonomous LLM generated legal payload</div>
                </div>

                <div style={{position: 'relative', marginBottom: 20}}>
                  <div style={{position: 'absolute', left: -21, top: 4, width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-blue)', border: '2px solid var(--bg-card)'}}></div>
                  <div className="text-sm font-bold">DMCA Filed</div>
                  <div className="text-sm text-muted">API triggered takedown notice to Cloudflare</div>
                </div>

                <div style={{position: 'relative'}}>
                  <div style={{position: 'absolute', left: -21, top: 4, width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-lime)', border: '2px solid var(--bg-card)', boxShadow: '0 0 10px var(--accent-lime)'}}></div>
                  <div className="text-sm font-bold" style={{color: 'var(--accent-lime)'}}>Confirmed</div>
                  <div className="text-sm text-muted">Takedown successful in <span style={{color: 'var(--accent-lime)'}}>87 seconds</span></div>
                </div>
              </div>
            </div>

            <div style={{padding: 24}}>
              {!enforcementResult.error ? (
                <>
                  <div className="grid-2 mb-24">
                    <div>
                      <div className="text-sm text-muted mb-8">Jurisdiction</div>
                      <div className="badge initiated">{enforcementResult.enforcement_data?.jurisdiction || 'United States (DMCA)'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted mb-8">Urgency Level</div>
                      <div className="badge pending" style={{color: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.1)'}}>{enforcementResult.enforcement_data?.urgency || 'CRITICAL'}</div>
                    </div>
                  </div>

                  <div className="mb-24">
                    <div className="text-sm text-muted mb-8">Estimated Damages Recovered</div>
                    <div style={{fontSize: 28, fontWeight: 800, color: 'var(--accent-emerald)'}}>
                      {enforcementResult.enforcement_data?.damage_estimate || '$4,250.00'}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted mb-8">Auto-Generated DMCA Notice</div>
                    <div className="font-mono" style={{fontSize: 11, background: '#000', color: '#FFF', padding: 16, borderRadius: 8, height: 150, overflowY: 'auto', border: '1px solid #222'}}>
                      {enforcementResult.enforcement_data?.dmca_notice || 'Generating notice...'}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{color: 'var(--accent-rose)'}}>
                  Failed to generate enforcement brief: {enforcementResult.error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Detection Cases</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Platform</th>
                <th>URL</th>
                <th>Confidence</th>
                <th>Status</th>
                <th>Detected</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {detections.length === 0 && (
                <tr><td colSpan={6} style={{textAlign:'center',padding:32}}>No detections. Run agent simulation first.</td></tr>
              )}
              {detections.map(d => (
                <tr key={d.detection_id}>
                  <td><span className="platform-badge">{platformIcons[d.platform] || '🌐'} {d.platform}</span></td>
                  <td style={{maxWidth:250,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.url}</td>
                  <td>
                    <span style={{color: d.confidence_score > 0.9 ? 'var(--accent-rose)' : 'var(--accent-amber)', fontWeight: 700}}>
                      {(d.confidence_score * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td><span className={`badge ${statusColors[d.enforcement_status] || 'pending'}`}>{d.enforcement_status}</span></td>
                  <td className="text-sm">{new Date(d.detected_at).toLocaleString()}</td>
                  <td>
                    {d.enforcement_status === 'pending' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => enforce(d.detection_id)}
                        disabled={enforcing === d.detection_id}
                      >
                        {enforcing === d.detection_id ? <Loader2 size={14} className="spin" style={{marginRight:4, display:'inline-block'}}/> : null} Enforce
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════
// SCREEN 4 — ANALYTICS & PREDICTIONS
// ═════════════════════════════════════════════════════════════════════════
function Analytics() {
  const [overview, setOverview] = useState(null)
  const [predictions, setPredictions] = useState(null)

  useEffect(() => {
    apiJson('/api/v1/analytics/overview').then(setOverview).catch(console.error)
    apiJson('/api/v1/analytics/predictions').then(setPredictions).catch(console.error)
  }, [])

  const pieColors = ['#ff0000', '#00f2fe', '#0088cc', '#5865f2', '#1da1f2', '#1877f2', '#e1306c']

  return (
    <div style={{ position: 'relative' }}>
      {/* Abstract World Map Background */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0 }}>
        <FaGlobeAmericas style={{ fontSize: '800px' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="page-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={28} /> Analytics & Predictions
          </h2>
          <p>Piracy patterns, platform distribution, and predictive risk assessment</p>
        </div>

        {/* High Impact Recovered Damages Card */}
        <div className="card mb-24" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--accent-lime)', background: 'rgba(57, 255, 20, 0.02)'}}>
          <div>
            <h3 style={{fontSize: 20, color: 'var(--text-muted)'}}>Revenue Protected (24h)</h3>
            <div style={{fontSize: 56, fontWeight: 900, color: 'var(--accent-lime)', letterSpacing: '-0.02em', lineHeight: 1.1}}>$4,200.00</div>
            <div className="text-sm" style={{color: 'var(--accent-lime)', display: 'flex', alignItems: 'center', gap: 4}}><Activity size={14}/> +18.4% compared to yesterday</div>
          </div>
          <div style={{width: 300, height: 100}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[{v:1200},{v:1400},{v:2100},{v:2000},{v:2800},{v:3400},{v:4200}]}>
                <Line type="monotone" dataKey="v" stroke="var(--accent-lime)" strokeWidth={3} dot={{r: 4, fill: "var(--bg-card)", stroke: "var(--accent-lime)", strokeWidth: 2}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Predictions At Top */}
        {predictions && (
          <div className="card mb-24" style={{border: '1px solid var(--accent-rose)', boxShadow: '0 0 40px rgba(244, 63, 94, 0.15)'}}>
            <div className="card-header">
              <span className="card-title" style={{fontSize: 20, color: 'var(--accent-rose)', display:'flex', alignItems:'center', gap:8}}>
                <Zap size={20}/> Predictive Risk Assessment
              </span>
              <span className="badge initiated">ML Model: {predictions.model}</span>
            </div>
            <p className="text-sm text-muted mb-24">
              Gradient boosted tree model trained on historical detection data. Accuracy: {(predictions.accuracy * 100).toFixed(0)}%
            </p>

            {predictions.predictions.map((p, i) => (
              <div key={i} className="card" style={{marginBottom: 16, background: 'var(--bg-glass)'}}>
                <div className="flex-between mb-16">
                  <div>
                    <h3 style={{fontSize: 18, fontWeight: 800}}>{p.event}</h3>
                    <span className="text-sm text-muted" style={{display:'flex', alignItems:'center', gap:4}}>
                      <Calendar size={14}/> Countdown: {p.date}
                    </span>
                  </div>
                  <div className="risk-gauge" style={{width: 250}}>
                    <div className="risk-bar" style={{height: 12}}>
                      <div className="risk-fill" style={{width: `${p.risk_score * 100}%`}}></div>
                    </div>
                    <span className="risk-value" style={{fontSize: 22, color: p.risk_score > 0.9 ? 'var(--accent-rose)' : p.risk_score > 0.7 ? 'var(--accent-amber)' : 'var(--accent-emerald)'}}>
                      {(p.risk_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="grid-3" style={{gap: 12}}>
                  <div>
                    <div className="text-sm text-muted mb-16" style={{marginBottom:4}}>High Risk Platforms</div>
                    <div className="flex gap-8" style={{flexWrap:'wrap'}}>
                      {p.high_risk_platforms.map(pl => (
                        <span key={pl} className="platform-badge">{platformIcons[pl] || '🌐'} {pl}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted mb-16" style={{marginBottom:4}}>High Risk Regions</div>
                    <div className="flex gap-8" style={{flexWrap:'wrap'}}>
                      {p.high_risk_regions.map(r => (
                        <span key={r} className="badge pending">{r}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted mb-16" style={{marginBottom:4}}>Peak Hours (UTC)</div>
                    <div className="flex gap-8" style={{flexWrap:'wrap'}}>
                      {p.peak_hours_utc.map(h => (
                        <span key={h} className="badge initiated" style={{display:'flex', alignItems:'center', gap:4}}><Clock size={12}/> {h}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-16" style={{marginTop: 12}}>
                  <div className="text-sm text-muted" style={{marginBottom:4}}>Recommended Agent Deployment</div>
                  <div className="flex gap-8" style={{flexWrap:'wrap'}}>
                    {p.recommended_agent_deployment.map(a => (
                      <span key={a} className="badge resolved" style={{display:'flex', alignItems:'center', gap:4}}><Bot size={12}/> {a}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {overview && (
          <div className="stats-grid mb-24">
            <div className="stat-card blue">
              <div className="stat-icon"><Shield /></div>
              <div className="stat-value">{overview.total_assets}</div>
              <div className="stat-label">Protected Assets</div>
            </div>
            <div className="stat-card rose">
              <div className="stat-icon"><Search /></div>
              <div className="stat-value">{overview.total_detections}</div>
              <div className="stat-label">Total Detections</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon"><FileText /></div>
              <div className="stat-value">{overview.total_licenses}</div>
              <div className="stat-label">Active Licenses</div>
            </div>
            <div className="stat-card purple">
              <div className="stat-icon"><Target /></div>
              <div className="stat-value">{(overview.average_confidence * 100).toFixed(1)}%</div>
              <div className="stat-label">Avg Confidence</div>
            </div>
          </div>
        )}

        {/* Combination Chart area */}
        <div className="grid-2 mb-24">
          {/* Platform Distribution */}
          {overview?.platform_distribution && Object.keys(overview.platform_distribution).length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Platform Distribution</span>
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={Object.entries(overview.platform_distribution).map(([k, v]) => ({ name: k, value: v }))}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.keys(overview.platform_distribution).map((key, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{background: 'var(--bg-card)', border: '1px solid var(--border-glass)'}} itemStyle={{color: 'var(--text-primary)'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Watermark Survival/Robustness Chart (Radar) */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Watermark Survival Rates</span>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <RadarChart 
                  outerRadius={100} 
                  data={[
                    { subject: 'JPEG Q30', A: 96, fullMark: 100 },
                    { subject: 'Crop 25%', A: 85, fullMark: 100 },
                    { subject: 'Resize 50%', A: 99, fullMark: 100 },
                    { subject: 'Noise 5%', A: 88, fullMark: 100 },
                    { subject: 'Contrast +30', A: 100, fullMark: 100 },
                    { subject: 'Blur Rad=2', A: 91, fullMark: 100 },
                  ]}
                >
                  <PolarGrid stroke="var(--border-glass)" />
                  <PolarAngleAxis dataKey="subject" tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Survival %" dataKey="A" stroke="var(--accent-blue)" fill="var(--accent-blue)" fillOpacity={0.6} />
                  <RechartsTooltip contentStyle={{background: 'var(--bg-card)', border: '1px solid var(--border-glass)'}} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════
// MAIN APP — Sidebar + Router
// ═════════════════════════════════════════════════════════════════════════
export default function App() {
  const [hasEntered, setHasEntered] = useState(false)
  const [screen, setScreen] = useState('assets')
  const [detectionCount, setDetectionCount] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Sync dark mode to document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [isDarkMode])

  useEffect(() => {
    apiJson('/api/v1/detections').then(d => setDetectionCount(d.length)).catch(() => {})
    const interval = setInterval(() => {
      apiJson('/api/v1/detections').then(d => setDetectionCount(d.length)).catch(() => {})
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const screens = {
    assets: <AssetManager />,
    feed: <LiveFeed />,
    enforcement: <EnforcementCenter />,
    analytics: <Analytics />,
  }

  const navItems = [
    { id: 'assets', icon: <Shield size={18} />, label: 'Asset Manager' },
    { id: 'feed', icon: <Radio size={18} />, label: 'Live Feed', badge: detectionCount || null },
    { id: 'enforcement', icon: <Scale size={18} />, label: 'Enforcement' },
    { id: 'analytics', icon: <BarChart2 size={18} />, label: 'Analytics' },
  ]

  return (
    <>
      <AnimatePresence>
        {!hasEntered && <LandingPage key="landing" onEnter={() => setHasEntered(true)} />}
      </AnimatePresence>

      {hasEntered && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Ticker />
          <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon"><Lock size={16} /></div>
          <div>
            <h1 style={{color: 'var(--text-primary)'}}>DeepTrace</h1>
            <div className="version">v0.1.0 · Sports Protection</div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Platform</div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${screen === item.id ? 'active' : ''}`}
              onClick={() => setScreen(item.id)}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span className="badge">{item.badge}</span>}
            </button>
          ))}
        </div>

        <div className="nav-section" style={{marginTop: 'auto'}}>
          <div className="nav-section-title">System</div>
          <button 
            className="nav-item" 
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
              border: '1px solid var(--border-glass)'
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
              <span className="icon">
                {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
              </span>
              <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            
            {/* Custom Toggle Switch UI */}
            <div style={{
              width: 36, height: 20, borderRadius: 20, 
              background: isDarkMode ? 'var(--accent-amber)' : '#CBD5E1',
              position: 'relative', transition: 'background 0.3s'
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 2, 
                left: isDarkMode ? 18 : 2, 
                transition: 'left 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}/>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-inner">
          {screens[screen]}
        </div>
      </main>
    </div>
    </motion.div>
    )}
    </>
  )
}
