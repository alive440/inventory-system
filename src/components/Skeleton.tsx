function Bone({ w, h = 16, style }: { w?: number | string; h?: number; style?: Record<string, unknown> }) {
  return (
    <div style={{
      width: w || '100%', height: h, borderRadius: 6,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      ...style,
    }} />
  )
}

export function DashboardSkeleton() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}><Bone w={120} h={24} style={{marginBottom:4}} /><Bone w={180} h={14} /></div>
      <div className="stats-grid">{[1,2,3,4].map(i => <div key={i} className="stat-card"><Bone w={80} h={28} style={{marginBottom:4}} /><Bone w={50} h={12} /></div>)}</div>
      <div className="card" style={{ marginBottom: 16 }}><Bone w={140} h={14} style={{ marginBottom: 12 }} /><Bone h={140} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{[1,2].map(i => <div key={i} className="dash-section">{[1,2,3,4].map(j => <Bone key={j} h={32} style={{marginBottom:8}} />)}</div>)}</div>
    </div>
  )
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}><div><Bone w={120} h={24} style={{marginBottom:4}} /><Bone w={80} h={14} /></div><Bone w={100} h={36} style={{borderRadius:20}} /></div>
      <div className="card">{Array.from({ length: rows }, (_, i) => (<Bone key={i} h={44} style={{ marginBottom: i < rows - 1 ? 4 : 0 }} />))}</div>
    </div>
  )
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}><div><Bone w={120} h={24} style={{marginBottom:4}} /><Bone w={80} h={14} /></div><Bone w={100} h={36} style={{borderRadius:20}} /></div>
      <div className="cards-grid">{Array.from({ length: count }, (_, i) => (<div key={i} className="card"><Bone w="70%" h={18} style={{marginBottom:8}} /><Bone w="50%" h={13} style={{marginBottom:12}} /><Bone h={30} style={{marginBottom:6}} /><Bone h={30} /></div>))}</div>
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}><div><Bone w={120} h={24} style={{marginBottom:4}} /><Bone w={200} h={14} /></div><div style={{display:'flex',gap:8}}><Bone w={70} h={36} style={{borderRadius:20}} /><Bone w={100} h={36} style={{borderRadius:20}} /></div></div>
      <div className="card" style={{marginBottom:16}}><Bone w={60} h={12} style={{marginBottom:8}} /><Bone h={44} /></div>
      <div className="card"><Bone w={100} h={14} style={{marginBottom:16}} />{[1,2,3].map(i => <Bone key={i} h={44} style={{marginBottom:8}} />)}</div>
    </div>
  )
}
