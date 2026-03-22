import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, prefix = '₹', suffix = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border2)',
      borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
    }}>
      <p style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 700, color: p.color || 'var(--silver)' }}>
          {prefix}{typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}{suffix}
        </p>
      ))}
    </div>
  )
}

// ─── Revenue Area Chart ───────────────────────────────────────────────────────
export function RevenueAreaChart({ data = [], dataKey = 'amount', color = '#c8c8c8', label = 'Revenue', prefix = '₹' }) {
  if (!data.length) return <ChartEmpty />
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad_${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tick={{ fill: 'var(--t3)', fontSize: 10, fontFamily: 'DM Sans' }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--t3)', fontSize: 10, fontFamily: 'DM Sans' }}
          axisLine={false} tickLine={false}
          tickFormatter={v => v >= 1000 ? `${prefix}${(v/1000).toFixed(0)}k` : `${prefix}${v}`}
          width={50}
        />
        <Tooltip content={<CustomTooltip prefix={prefix} />} />
        <Area
          type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2}
          fill={`url(#grad_${dataKey})`}
          dot={{ fill: color, strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
export function EarningsBarChart({ data = [], dataKey = 'amount', color = '#a0a0a0', prefix = '₹' }) {
  if (!data.length) return <ChartEmpty />
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tick={{ fill: 'var(--t3)', fontSize: 10, fontFamily: 'DM Sans' }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--t3)', fontSize: 10, fontFamily: 'DM Sans' }}
          axisLine={false} tickLine={false}
          tickFormatter={v => v >= 1000 ? `${prefix}${(v/1000).toFixed(0)}k` : `${prefix}${v}`}
          width={50}
        />
        <Tooltip content={<CustomTooltip prefix={prefix} />} />
        <Bar
          dataKey={dataKey} fill={color}
          radius={[5, 5, 0, 0]}
          maxBarSize={40}
          animationDuration={700}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Donut / Pie Chart ────────────────────────────────────────────────────────
const PIE_COLORS = ['#c8c8c8', '#707070', '#404040']

export function StatusPieChart({ data = [] }) {
  if (!data.length || data.every(d => !d.value)) return <ChartEmpty />
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data} cx="50%" cy="50%"
          innerRadius="55%" outerRadius="80%"
          paddingAngle={3} dataKey="value"
          animationDuration={700}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip prefix="" />} />
        <Legend
          iconType="circle" iconSize={8}
          formatter={v => <span style={{ fontSize: 11, color: 'var(--t2)', fontFamily: 'DM Sans' }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ─── Chart Empty State ────────────────────────────────────────────────────────
function ChartEmpty() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 24 }}>📈</div>
      <div style={{ fontSize: 12, color: 'var(--t3)' }}>No data yet</div>
    </div>
  )
}

// ─── Chart Card Wrapper ───────────────────────────────────────────────────────
export function ChartCard({ title, sub, children, height = 220, action }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', fontFamily: 'Syne, sans-serif' }}>{title}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>{sub}</div>}
        </div>
        {action}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  )
}
