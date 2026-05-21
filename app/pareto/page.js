'use client';
import { useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

function buildPareto(defectos) {
  const total = defectos.reduce((a, d) => a + d.count, 0);
  const sorted = [...defectos].sort((a, b) => b.count - a.count);
  let cumulative = 0;
  return sorted.map(d => {
    cumulative += d.count;
    return { ...d, porcentaje: +(d.count / total * 100).toFixed(1), acumulado: +(cumulative / total * 100).toFixed(1) };
  });
}

const CustomBar = (props) => {
  const { x, y, width, height, acumulado } = props;
  const isVital = acumulado <= 80.5;
  return <rect x={x} y={y} width={width} height={height} fill={isVital ? 'var(--green-primary)' : 'var(--border-light)'} rx={3} />;
};

export default function ParetoPage() {
  const [selected, setSelected] = useState('custom');
  const [customMode, setCustomMode] = useState(true);
  const [customRows, setCustomRows] = useState([{ tipo: '', count: '' }]);
  const [data, setData] = useState([]);
  const [producto, setProducto] = useState('');

  const handleCustom = () => {
    const rows = customRows.filter(r => r.tipo && !isNaN(+r.count) && +r.count > 0);
    if (rows.length < 2) return alert('Ingrese al menos 2 categorías con conteos');
    setData(buildPareto(rows.map(r => ({ tipo: r.tipo, count: +r.count }))));
  };

  const vital = data.filter(d => d.acumulado <= 80.5);
  const trivial = data.filter(d => d.acumulado > 80.5);
  const total = data.reduce((a, d) => a + d.count, 0);

  return (
    <>
      <div className="header">
        <div>
          <div className="header-title">Diagrama de Pareto</div>
          <div className="header-subtitle">Regla 80/20 — Identificar defectos vitales</div>
        </div>
        <button className="btn btn-secondary no-print" onClick={() => window.print()}>
          Imprimir Reporte
        </button>
      </div>
      <div className="page-content fade-in">

        {/* Selector */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Ingresar Datos de Defectos</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nombre del Producto / Proceso</label>
              <input type="text" className="form-input" style={{ width: 300 }} value={producto} onChange={e => setProducto(e.target.value)} placeholder="Ej: Manzanilla Alemana" />
            </div>
          </div>
        </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>Ingresar Datos de Defectos</div>
            <div className="table-container data-table-input" style={{ marginBottom: 12 }}>
              <table><thead><tr><th>#</th><th>Tipo de Defecto</th><th>Frecuencia (conteo)</th><th></th></tr></thead>
              <tbody>
                {customRows.map((row, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td><input type="text" value={row.tipo} placeholder="Ej: Manchas"
                      onChange={e => { const r = [...customRows]; r[i].tipo = e.target.value; setCustomRows(r); }} /></td>
                    <td><input type="number" value={row.count} placeholder="0"
                      onChange={e => { const r = [...customRows]; r[i].count = e.target.value; setCustomRows(r); }} /></td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => setCustomRows(r => r.filter((_, j) => j !== i))}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody></table>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setCustomRows(r => [...r, { tipo: '', count: '' }])}>+ Agregar fila</button>
              <button className="btn btn-primary" onClick={handleCustom}>Generar Pareto</button>
            </div>
          </div>

        {/* KPIs Pareto */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Defectos', val: total },
            { label: 'Defectos Vitales (≤80%)', val: vital.length, color: 'var(--green-light)' },
            { label: 'Defectos Triviales (>80%)', val: trivial.length, color: 'var(--text-muted)' },
            { label: '% Defectos Vitales', val: vital.length ? `${(vital.reduce((a, d) => a + d.count, 0) / total * 100).toFixed(1)}%` : '0%', color: 'var(--green-light)' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ flex: 1, minWidth: 130, textAlign: 'center', padding: '12px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color || 'var(--text-primary)' }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Gráfico */}
        {(() => {
          const maxCount = Math.max(...data.map(d => d.count));
          const domainLeftY = [0, +(maxCount * 1.2).toFixed(0)];

          return (
            <div className="chart-wrapper">
              <div className="chart-title">Diagrama de Pareto — {producto}</div>
              <div className="chart-desc">
                <span style={{ display: 'inline-block', width: 12, height: 12, background: 'var(--green-primary)', borderRadius: 2, marginRight: 6 }} />Defectos Vitales (≤80%)
                <span style={{ display: 'inline-block', width: 12, height: 12, background: 'var(--border-light)', borderRadius: 2, marginRight: 6, marginLeft: 16 }} />Defectos Triviales (&gt;80%)
                <span style={{ marginLeft: 16, color: '#f59e0b' }}>— Línea acumulada</span>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={data} margin={{ top: 15, right: 60, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="tipo" stroke="var(--text-muted)" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} angle={-25} textAnchor="end" height={60} />
                  <YAxis yAxisId="left" stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={domainLeftY} allowDataOverflow={true} label={{ value: 'Frecuencia', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} label={{ value: 'Acumulado (%)', angle: 90, position: 'insideRight', fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    formatter={(val, name) => name === 'acumulado' ? [`${val}%`, 'Acumulado'] : [val, 'Frecuencia']} />
                  <ReferenceLine yAxisId="right" y={80} stroke="#ef4444" strokeWidth={3} strokeDasharray="4 2" label={{ value: '80%', fill: '#ef4444', fontSize: 11, position: 'right' }} />
                  <Bar yAxisId="left" dataKey="count" shape={<CustomBar />} name="Frecuencia" />
                  <Line yAxisId="right" type="monotone" dataKey="acumulado" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} name="acumulado" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* Tabla */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>Tabla de Frecuencias</div>
          <div className="table-container">
            <table>
              <thead><tr>
                <th>#</th><th>Tipo de Defecto</th><th>Frecuencia</th><th>%</th><th>% Acumulado</th><th>Clasificación</th>
              </tr></thead>
              <tbody>
                {data.map((d, i) => (
                  <tr key={i} style={d.acumulado <= 80.5 ? { background: 'rgba(16,185,129,0.05)' } : {}}>
                    <td style={{ fontWeight: 600 }}>{i + 1}</td>
                    <td>{d.tipo}</td>
                    <td className="td-num">{d.count}</td>
                    <td className="td-num">{d.porcentaje}%</td>
                    <td className="td-num">{d.acumulado}%</td>
                    <td>
                      <span className={`badge ${d.acumulado <= 80.5 ? 'badge-green' : 'badge-yellow'}`}>
                        {d.acumulado <= 80.5 ? 'Vital' : 'Trivial'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

        {/* ── DIAGNÓSTICO PARETO ── */}
        {(() => {
          const vitalNames = vital.map(d => d.tipo);
          const trivialNames = trivial.map(d => d.tipo);
          const vitalCount = vital.reduce((a, d) => a + d.count, 0);
          const vitalPct = (vitalCount / total * 100).toFixed(1);
          const top1 = data[0];
          const top2 = data[1];

          return (
            <div className="card" style={{ border: '1px solid var(--green-primary)', borderLeft: '4px solid var(--green-primary)', marginTop: 16 }}>
              <div className="section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                Diagnóstico Técnico — Análisis de Pareto
                <span className="badge badge-green" style={{ fontSize: 11 }}>Principio 80/20</span>
              </div>

              {/* Conclusión principal */}
              <div style={{ padding: '14px 16px', borderRadius: 8, marginBottom: 14, background: 'rgba(16,185,129,0.08)', border: '1px solid var(--green-primary)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--green-light)', marginBottom: 4 }}>
                  Hallazgo Principal — Principio de Pareto (80/20)
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  De <strong>{data.length}</strong> tipos de defectos identificados, solo <strong style={{ color: 'var(--green-light)' }}>{vital.length} ({vital.length === 1 ? 'el vital few' : 'los vitales few'})</strong> representan el <strong style={{ color: 'var(--green-light)' }}>{vitalPct}%</strong> del total de defectos (<strong>{vitalCount}</strong> de <strong>{total}</strong>).
                  Esto confirma el <strong>Principio de Pareto</strong>: concentrar los esfuerzos de mejora en {vital.length === 1 ? 'este defecto' : 'estos defectos'} eliminará la mayoría de la no conformidad.
                </div>
              </div>

              {/* Vitales vs Triviales */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.06)', border: '1px solid var(--green-primary)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-light)', marginBottom: 8 }}>Defectos Vitales (≤80%)</div>
                  {vital.map((d, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{i + 1}. {d.tipo}</strong> — {d.count} ocurrencias ({d.porcentaje}%) · Acum: {d.acumulado}%
                    </div>
                  ))}
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Defectos Triviales ({'>'}80%)</div>
                  {trivial.length === 0
                    ? <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Todos los defectos son vitales en este análisis.</div>
                    : trivial.map((d, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                        {d.tipo} — {d.count} ({d.porcentaje}%)
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Análisis del top defecto */}
              {top1 && (
                <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 14, background: 'rgba(245,158,11,0.06)', border: '1px solid #f59e0b' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>Defecto Prioritario #1: "{top1.tipo}"</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Con <strong>{top1.count} ocurrencias ({top1.porcentaje}%)</strong> del total, este es el defecto con mayor impacto.
                    {top2 && ` Junto con "${top2.tipo}" (${top2.porcentaje}%), los dos primeros defectos representan el ${(top1.porcentaje + top2.porcentaje).toFixed(1)}% de todos los problemas.`}
                    {' '}Eliminar este defecto tendría el mayor retorno de inversión en calidad.
                  </div>
                </div>
              )}

              {/* Recomendaciones */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-light)', marginBottom: 8 }}>Plan de Acción Recomendado:</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.8 }}>
                  <li><strong style={{ color: 'var(--text-primary)' }}>Prioridad Alta:</strong> Enfoque el 80% de los recursos de mejora en eliminar {vital.length === 1 ? `"${vitalNames[0]}"` : vitalNames.slice(0, 2).map(n => `"${n}"`).join(' y ')}. Use análisis de causa raíz (5 Porqués, Ishikawa) para cada uno.</li>
                  <li><strong style={{ color: 'var(--text-primary)' }}>Estrategia:</strong> No intente resolver todos los defectos a la vez. El Principio de Pareto indica que resolver los vitales generará el mayor impacto en calidad con el menor esfuerzo.</li>
                  {trivial.length > 0 && <li><strong style={{ color: 'var(--text-primary)' }}>Defectos Triviales:</strong> Los {trivial.length} defecto(s) restante(s) representan solo el {(100 - parseFloat(vitalPct)).toFixed(1)}% del problema. Abórdelos después de resolver los vitales.</li>}
                  <li><strong style={{ color: 'var(--text-primary)' }}>Seguimiento:</strong> Después de implementar mejoras, repita el Análisis de Pareto para verificar que la distribución de defectos cambió favorablemente.</li>
                  <li>Documente todas las acciones correctivas con responsable, fecha de implementación y métricas de seguimiento.</li>
                </ul>
              </div>
            </div>
          );
        })()}
    </>
  );
}
