'use client';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { calcP, calcC, manzanillaP, tomateDefectos } from '../../lib/data';

const PRESETS = {
  manzanilla_p: { label: 'Manzanilla — Gráfico P', ds: manzanillaP, tipo: 'p' },
  tomate_c: { label: 'Tomate — Gráfico C', ds: tomateDefectos, tipo: 'c' },
};

export default function AtributosPage() {
  const [preset, setPreset] = useState('manzanilla_p');
  const [tipo, setTipo] = useState('p');
  const [customMode, setCustomMode] = useState(false);
  const [customRows, setCustomRows] = useState(25);
  const [customN, setCustomN] = useState(100);
  const [customValues, setCustomValues] = useState([]);
  const [result, setResult] = useState(null);
  const [ds, setDs] = useState(manzanillaP);

  const calcPreset = (key) => {
    const { ds: d, tipo: t } = PRESETS[key];
    setDs(d); setTipo(t);
    if (t === 'p') setResult({ tipo: 'p', data: calcP(d.subgrupos) });
    if (t === 'c') setResult({ tipo: 'c', data: calcC(d.subgrupos) });
  };

  const handlePreset = (key) => {
    setPreset(key); setCustomMode(false); calcPreset(key);
  };

  const handleCustomCalc = () => {
    try {
      if (tipo === 'p') {
        const sgs = customValues.map((v, i) => ({ n: customN, np: +v || 0 }));
        setResult({ tipo: 'p', data: calcP(sgs) });
      } else if (tipo === 'c') {
        const sgs = customValues.map(v => ({ c: +v || 0 }));
        setResult({ tipo: 'c', data: calcC(sgs) });
      }
    } catch { alert('Error en los datos'); }
  };

  // Initial load
  useState(() => { calcPreset('manzanilla_p'); }, []);

  const oocCount = result ? result.data.filter(d => d.ooc).length : 0;

  return (
    <>
      <div className="header">
        <div>
          <div className="header-title">Control de Atributos — Gráficos P, NP, C, U</div>
          <div className="header-subtitle">Proporción de defectuosos, número de defectos por unidad</div>
        </div>
        <button className="btn btn-secondary no-print" onClick={() => window.print()}>
          Imprimir Reporte
        </button>
      </div>
      <div className="page-content fade-in">

        {/* Selector */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Seleccionar Tipo de Gráfico y Datos</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Object.entries(PRESETS).map(([key, v]) => (
              <button key={key} className={`btn ${preset === key && !customMode ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handlePreset(key)}>{v.label}</button>
            ))}
            <button className={`btn ${customMode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCustomMode(true)}>Mis datos</button>
          </div>
        </div>

        {/* Custom entry */}
        {customMode && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>Configurar Datos Personalizados</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tipo de Gráfico</label>
                <select className="form-select" style={{ width: 140 }} value={tipo} onChange={e => { setTipo(e.target.value); setCustomValues([]); }}>
                  <option value="p">Gráfico P (proporción)</option>
                  <option value="np">Gráfico NP (número)</option>
                  <option value="c">Gráfico C (defectos)</option>
                  <option value="u">Gráfico U (def/unidad)</option>
                </select>
              </div>
              {(tipo === 'p' || tipo === 'np') && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tamaño de muestra (n)</label>
                  <input type="number" className="form-input" style={{ width: 120 }} value={customN} onChange={e => setCustomN(+e.target.value)} />
                </div>
              )}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Número de subgrupos</label>
                <input type="number" className="form-input" style={{ width: 120 }} value={customRows} onChange={e => { setCustomRows(+e.target.value); setCustomValues([]); }} />
              </div>
            </div>

            <div className="table-container data-table-input" style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 16 }}>
              <table><thead><tr>
                <th>Subgrupo</th>
                <th>{tipo === 'p' || tipo === 'np' ? 'Defectuosos (np)' : 'Defectos (c)'}</th>
              </tr></thead>
              <tbody>
                {Array.from({ length: customRows }, (_, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td><input type="number" value={customValues[i] ?? ''} placeholder="0"
                      onChange={e => { const v = [...customValues]; v[i] = e.target.value; setCustomValues(v); }} /></td>
                  </tr>
                ))}
              </tbody></table>
            </div>
            <button className="btn btn-primary" onClick={handleCustomCalc}>Calcular</button>
          </div>
        )}

        {/* Info cards */}
        {!customMode && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Producto', val: ds.producto },
              { label: 'Atributo', val: ds.atributo },
              { label: 'Tipo Gráfico', val: result?.tipo?.toUpperCase() },
              { label: 'Puntos OOC', val: oocCount, color: oocCount > 0 ? '#ef4444' : 'var(--green-light)' },
            ].map((item, i) => (
              <div key={i} className="card" style={{ padding: '10px 16px', flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: item.color || 'var(--text-primary)' }}>{item.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Límites */}
        {result && result.data.length > 0 && (
          <div className="grid-3" style={{ marginBottom: 16 }}>
            {result.tipo === 'p' && [
              { label: 'p̄ (Proporción Media)', val: result.data[0].pbar?.toFixed(4) },
              { label: 'LCS Promedio', val: result.data[0].ucl?.toFixed(4), color: '#ef4444' },
              { label: 'LCI Promedio', val: result.data[0].lcl?.toFixed(4), color: '#ef4444' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: '12px 10px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'JetBrains Mono', color: s.color || 'var(--green-light)' }}>{s.val}</div>
              </div>
            ))}
            {result.tipo === 'c' && [
              { label: 'c̄ (Defectos Medios)', val: result.data[0].cbar?.toFixed(4) },
              { label: 'LCS', val: result.data[0].ucl?.toFixed(4), color: '#ef4444' },
              { label: 'LCI', val: result.data[0].lcl?.toFixed(4), color: '#ef4444' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: '12px 10px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'JetBrains Mono', color: s.color || 'var(--green-light)' }}>{s.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        {result && (() => {
          const chartVals = result.data.map(d => result.tipo === 'p' ? d.p : d.c);
          const uclVal = result.data[0]?.ucl || 0;
          const lclVal = result.data[0]?.lcl || 0;
          const yMin = Math.min(...chartVals, lclVal);
          const yMax = Math.max(...chartVals, uclVal);
          const pad = (yMax - yMin) * 0.15 || 0.1;
          const domainAttr = [Math.max(0, +(yMin - pad).toFixed(4)), +(yMax + pad).toFixed(4)];
          const lcVal = result.tipo === 'p' ? result.data[0]?.pbar : result.data[0]?.cbar;

          return (
            <div className="chart-wrapper">
              <div className="chart-title">
                {result.tipo === 'p' ? 'Gráfico P — Proporción de Defectuosos' : 'Gráfico C — Defectos por Unidad'}
              </div>
              <div className="chart-desc">
                Puntos rojos = fuera de control. {oocCount > 0 ? `${oocCount} punto(s) OOC detectado(s).` : 'Proceso bajo control estadístico.'}
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={result.data} margin={{ top: 15, right: 90, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="sg" stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} label={{ value: 'Subgrupo', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={domainAttr} allowDataOverflow={true} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                  <ReferenceLine y={uclVal} stroke="#ef4444" strokeWidth={2} label={{ value: `LCS: ${uclVal?.toFixed(4)}`, fill: '#ef4444', fontSize: 10, fontWeight: 'bold', position: 'right' }} />
                  <ReferenceLine y={lcVal} stroke="var(--green-primary)" strokeWidth={2} label={{ value: `LC: ${lcVal?.toFixed(4)}`, fill: 'var(--green-primary)', fontSize: 10, fontWeight: 'bold', position: 'right' }} />
                  {lclVal > 0 && <ReferenceLine y={lclVal} stroke="#ef4444" strokeWidth={2} label={{ value: `LCI: ${lclVal?.toFixed(4)}`, fill: '#ef4444', fontSize: 10, fontWeight: 'bold', position: 'right' }} />}
                  <Line type="monotone" dataKey={result.tipo === 'p' ? 'p' : 'c'} stroke="var(--green-light)" strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      return payload.ooc
                        ? <circle key={`dot-${props.index}`} cx={cx} cy={cy} r={6} fill="#ef4444" stroke="#ef4444" />
                        : <circle key={`dot-${props.index}`} cx={cx} cy={cy} r={4} fill="var(--green-light)" />;
                    }}
                    name={result.tipo === 'p' ? 'p' : 'c'} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* Tabla */}
        {result && (
          <div className="card">
            <div className="section-title" style={{ marginBottom: 12 }}>Tabla de Datos</div>
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>Subgrupo</th>
                  {result.tipo === 'p' ? <><th>n</th><th>np</th><th>p</th></> : <th>c</th>}
                  <th>LCS</th><th>LC</th><th>LCI</th><th>Estado</th>
                </tr></thead>
                <tbody>
                  {result.data.map((d, i) => (
                    <tr key={i} style={d.ooc ? { background: 'rgba(239,68,68,0.06)' } : {}}>
                      <td style={{ fontWeight: 600 }}>{d.sg}</td>
                      {result.tipo === 'p' ? <>
                        <td className="td-num">{d.n}</td>
                        <td className="td-num">{d.np}</td>
                        <td className="td-num">{d.p?.toFixed(4)}</td>
                      </> : <td className="td-num">{d.c}</td>}
                      <td className="td-num" style={{ color: '#ef4444' }}>{d.ucl?.toFixed(4)}</td>
                      <td className="td-num" style={{ color: 'var(--green-primary)' }}>{(result.tipo === 'p' ? d.pbar : d.cbar)?.toFixed(4)}</td>
                      <td className="td-num" style={{ color: '#ef4444' }}>{d.lcl?.toFixed(4)}</td>
                      <td><span className={`badge ${d.ooc ? 'badge-red' : 'badge-green'}`}>{d.ooc ? 'OOC' : 'OK'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DIAGNÓSTICO TÉCNICO ATRIBUTOS ── */}
        {result && (() => {
          const oocPts = result.data.filter(d => d.ooc);
          const isControlled = oocPts.length === 0;
          const totalPts = result.data.length;
          const pbar = result.tipo === 'p' ? result.data[0]?.pbar : null;
          const cbar = result.tipo === 'c' ? result.data[0]?.cbar : null;
          const rate = result.tipo === 'p' ? (pbar * 100).toFixed(2) : cbar?.toFixed(2);
          const rateLabel = result.tipo === 'p' ? `${rate}% defectuosos en promedio` : `${rate} defectos promedio por unidad`;

          return (
            <div className="card" style={{ border: '1px solid var(--green-primary)', borderLeft: '4px solid var(--green-primary)', marginTop: 16 }}>
              <div className="section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                Diagnóstico Técnico — Gráfico {result.tipo.toUpperCase()}
                <span className={`badge ${isControlled ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 11 }}>
                  {isControlled ? 'Proceso Estable' : 'Fuera de Control'}
                </span>
              </div>

              {/* Estado general */}
              <div style={{ padding: '14px 16px', borderRadius: 8, marginBottom: 14,
                background: isControlled ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${isControlled ? 'var(--green-primary)' : '#ef4444'}` }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: isControlled ? 'var(--green-light)' : '#ef4444', marginBottom: 4 }}>
                  {isControlled
                    ? `Proceso de atributos bajo control estadístico`
                    : `Proceso fuera de control — ${oocPts.length} de ${totalPts} subgrupos son OOC`}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Gráfico <strong>{result.tipo.toUpperCase()}</strong> · {totalPts} subgrupos analizados · {rateLabel}<br />
                  {isControlled
                    ? 'La proporción/número de defectos es estable y predecible. La variación observada es aleatoria (causas comunes).'
                    : `Se detectaron causas especiales de variación en ${oocPts.length} subgrupo(s). El proceso no es estadísticamente estable.`}
                </div>
              </div>

              {/* Detalle OOC */}
              {oocPts.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>Subgrupos Fuera de Control:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 6 }}>
                    {oocPts.map((d, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'rgba(239,68,68,0.06)', padding: '6px 10px', borderRadius: 6, borderLeft: '3px solid #ef4444' }}>
                        <strong style={{ color: '#ef4444' }}>Subgrupo {d.sg}:</strong>{' '}
                        {result.tipo === 'p'
                          ? `p = ${(d.p * 100).toFixed(2)}% ${d.p > d.ucl ? `> LCS (${(d.ucl * 100).toFixed(2)}%)` : `< LCI (${(d.lcl * 100).toFixed(2)}%)`}`
                          : `c = ${d.c} defectos ${d.c > d.ucl ? `> LCS (${d.ucl.toFixed(2)})` : `< LCI (${d.lcl.toFixed(2)})`}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interpretación del tipo de gráfico */}
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Interpretación del Gráfico {result.tipo.toUpperCase()}:</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  {result.tipo === 'p' ? (<>
                    <strong>Gráfico P</strong>: Controla la <em>proporción de unidades defectuosas</em> cuando el tamaño de muestra puede variar. La línea central p̄ = <strong>{(pbar * 100).toFixed(3)}%</strong> representa la proporción promedio de defectuosos.<br />
                    Los límites de control se calculan con: LCS/LCI = p̄ ± 3√(p̄(1-p̄)/n). Un punto sobre el LCS indica que la tasa de defectos aumentó significativamente.<br />
                    {pbar > 0.1 ? 'La proporción promedio de defectuosos (>10%) es elevada. Se recomienda investigar las causas raíces con un Diagrama de Pareto.' : 'La proporción de defectuosos es relativamente baja.'}
                  </>) : (<>
                    <strong>Gráfico C</strong>: Controla el <em>número de defectos por unidad de inspección</em> cuando el tamaño de muestra es constante. La línea central c̄ = <strong>{cbar?.toFixed(3)}</strong> defectos por unidad.<br />
                    Los límites de control se calculan con: LCS/LCI = c̄ ± 3√c̄. Este gráfico asume distribución de Poisson para el conteo de defectos.<br />
                    {cbar > 10 ? 'La tasa promedio de defectos por unidad es alta (c̄ > 10). Considere complementar con Diagrama de Pareto para priorizar defectos.' : 'La tasa de defectos por unidad está dentro de niveles manejables.'}
                  </>)}
                </div>
              </div>

              {/* Recomendaciones */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-light)', marginBottom: 8 }}>Recomendaciones:</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.8 }}>
                  {isControlled ? (<>
                    <li>El proceso está bajo control. La variación en defectos/defectuosos es aleatoria y predecible.</li>
                    <li>Para reducir la tasa de defectos, aplique mejora de proceso (no solo control). Use el <strong>Diagrama de Pareto</strong> para identificar los defectos más frecuentes.</li>
                    <li>Revise si el nivel actual de defectos es aceptable para los requisitos del cliente o contrato.</li>
                    <li>Considere implementar controles preventivos (poka-yoke) para las causas de defectos más comunes.</li>
                  </>) : (<>
                    <li><strong style={{ color: '#ef4444' }}>Investigue inmediatamente</strong> los subgrupos OOC para encontrar las causas especiales de variación.</li>
                    <li>Revise los registros del proceso (turno, operador, lote de materia prima, condiciones ambientales) en el momento de los subgrupos OOC.</li>
                    <li>Use el Diagrama de Causa-Efecto (Ishikawa) para analizar sistemáticamente las posibles causas: Máquina, Método, Material, Mano de obra, Medio ambiente, Medición.</li>
                    <li>Una vez identificadas y eliminadas las causas especiales, exluya esos subgrupos y recalcule los límites de control.</li>
                    <li>Implemente acciones correctivas documentadas con fecha de seguimiento.</li>
                  </>)}
                </ul>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}
