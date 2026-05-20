'use client';

export function PageHeader({ icon, title, subtitle, actions }) {
  return (
    <div className="header">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <div className="header-title">{title}</div>
        </div>
        {subtitle && <div className="header-subtitle" style={{ marginLeft: 30 }}>{subtitle}</div>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, unit, color = 'green', interpretation }) {
  const colors = {
    green: 'var(--green-light)',
    red: '#ef4444',
    yellow: '#eab308',
    blue: '#60a5fa',
  };
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: colors[color], fontFamily: 'JetBrains Mono, monospace' }}>
        {typeof value === 'number' ? value.toFixed(3) : value}
        {unit && <span style={{ fontSize: 13, marginLeft: 4, color: 'var(--text-muted)', fontWeight: 500 }}>{unit}</span>}
      </div>
      {interpretation && (
        <div style={{ marginTop: 6, fontSize: 11, color: colors[color] }}>{interpretation}</div>
      )}
    </div>
  );
}

export function Interpretation({ text, type = 'good' }) {
  return <div className={`interpretation ${type}`}>{text}</div>;
}

export function DataTable({ headers, rows, highlightFn }) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={highlightFn?.(row, i) ? { background: 'rgba(239,68,68,0.08)' } : {}}>
              {row.map((cell, j) => (
                <td key={j} className="td-num">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SectionCard({ title, subtitle, children, action }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="section-header">
        <div>
          <div className="section-title">{title}</div>
          {subtitle && <div className="section-subtitle">{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
