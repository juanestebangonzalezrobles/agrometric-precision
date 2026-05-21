'use client';
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { calcCapability } from '../../lib/data';
import { Printer, X } from 'lucide-react';

const STORAGE_KEY = 'agrometric_registros';

function normalCDF(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))));
  return z > 0 ? 1 - p : p;
}

function buildDistCurve(mean, sigma, lse, lie) {
  const lo = Math.min(lie, mean - 4 * sigma);
  const hi = Math.max(lse, mean + 4 * sigma);
  const steps = 80;
  const w = (hi - lo) / steps;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const x = lo + i * w;
    const y = Math.exp(-0.5 * ((x - mean) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
    return { x: +x.toFixed(3), y: +y.toFixed(6) };
  });
}

function interpCp(cp) {
  if (cp >= 1.67) return { text: 'Proceso Excelente (Cp ≥ 1.67) — Clase mundial', type: 'good' };
  if (cp >= 1.33) return { text: 'Proceso Capaz (Cp ≥ 1.33) — Satisfactorio', type: 'good' };
  if (cp >= 1.00) return { text: 'Proceso Marginalmente Capaz (1.00 ≤ Cp < 1.33)', type: 'warning' };
  return { text: 'Proceso No Capaz (Cp < 1.00) — Requiere mejora urgente', type: 'danger' };
}

export default function CapacidadPage() {
  const [selected, setSelected] = useState('custom');
  const [customMode, setCustomMode] = useState(true);
  const [lse, setLse] = useState('');
  const [lie, setLie] = useState('');
  const [customVals, setCustomVals] = useState('');
  const [result, setResult] = useState(null);
  const [curve, setCurve] = useState([]);
  const [userRecords, setUserRecords] = useState([]);

  // Report print settings
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    indices: true,
    stats: true,
    diagnostic: true,
    curve: true,
  });

  const handlePrint = () => {
    setIsReportModalOpen(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };


  // Load user records from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const records = raw ? JSON.parse(raw) : [];
      const variables = records.filter(r => r.subgruposData && r.subgruposData.length > 0 && !r.isAtributo);
      setUserRecords(variables);
      if (variables.length > 0) {
        const rec = variables[0];
        setSelected('user_0');
        setCustomMode(false);
        const recLse = parseFloat(rec.lse) || 0;
        const recLie = parseFloat(rec.lie) || 0;
        setLse(recLse);
        setLie(recLie);
        if (recLse !== 0 || recLie !== 0) {
          const r = calcCapability(rec.subgruposData, recLse, recLie);
          setResult(r);
          setCurve(buildDistCurve(r.mean, r.sigma, recLse, recLie));
        }
      }
    } catch { setUserRecords([]); }
  }, []);

  const runUserRecord = (key) => {
    const idx = parseInt(key.replace('user_', ''));
    const rec = userRecords[idx];
    if (!rec) return;
    setSelected(key);
    setCustomMode(false);
    const recLse = parseFloat(rec.lse) || 0;
    const recLie = parseFloat(rec.lie) || 0;
    setLse(recLse);
    setLie(recLie);
    if (recLse !== 0 || recLie !== 0) {
      const r = calcCapability(rec.subgruposData, recLse, recLie);
      setResult(r);
      setCurve(buildDistCurve(r.mean, r.sigma, recLse, recLie));
    } else {
      alert('Este registro no tiene LSE/LIE definidos. Ingrésalos manualmente y presiona Recalcular.');
    }
  };

  const runCustom = () => {
    const vals = customVals.split(/[\n,;\t ]+/).map(parseFloat).filter(v => !isNaN(v));
    if (vals.length < 4) return alert('Ingrese al menos 4 valores');
    if (!lse || !lie) return alert('Ingrese LSE y LIE para calcular la capacidad.');
    const r = calcCapability([vals], parseFloat(lse), parseFloat(lie));
    setResult(r);
    setCurve(buildDistCurve(r.mean, r.sigma, parseFloat(lse), parseFloat(lie)));
  };

  const recalculate = () => {
    if (selected.startsWith('user_')) {
      const idx = parseInt(selected.replace('user_', ''));
      const rec = userRecords[idx];
      if (!rec) return;
      if (!lse || !lie) return alert('Ingrese LSE y LIE.');
      const r = calcCapability(rec.subgruposData, parseFloat(lse), parseFloat(lie));
      setResult(r);
      setCurve(buildDistCurve(r.mean, r.sigma, parseFloat(lse), parseFloat(lie)));
    } else {
      runCustom();
    }
  };

  const interpResult = result ? interpCp(result.Cp) : null;

  // PPM estimado
  const ppm = result ? Math.round((1 - (normalCDF((result.lse - result.mean) / result.sigma) - normalCDF((result.lie - result.mean) / result.sigma))) * 1e6) : 0;

  return (
    <>
      <div className="header">
        <div>
          <div className="header-title">Análisis de Capacidad del Proceso</div>
          <div className="header-subtitle">Cp · Cpk · Pp · Ppk · Nivel Sigma · Límites de Especificación</div>
        </div>
        <button className="btn btn-primary no-print" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setIsReportModalOpen(true)}>
          <Printer size={16} /> Generar Reporte PDF
        </button>
      </div>
      <div className="page-content fade-in">

        {/* Selector */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Seleccionar Datos y Especificaciones</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            {userRecords.map((r, i) => (
              <button key={`user_${i}`}
                className={`btn ${selected === `user_${i}` ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderColor: 'var(--green-primary)', color: selected === `user_${i}` ? undefined : 'var(--green-light)' }}
                onClick={() => runUserRecord(`user_${i}`)}
              >
                {r.producto} — {r.variableName || r.variable}
              </button>
            ))}
            <button className={`btn ${customMode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setSelected('custom'); setCustomMode(true); setResult(null); }}>Mis datos</button>
          </div>
          {userRecords.length === 0 && !customMode && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              Guarda un registro de <strong>Variables</strong> en Muestras para analizarlo aquí.
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">LSE (Límite Superior de Especificación)</label>
              <input type="number" className="form-input" style={{ width: 160 }} value={lse}
                onChange={e => setLse(+e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">LIE (Límite Inferior de Especificación)</label>
              <input type="number" className="form-input" style={{ width: 160 }} value={lie}
                onChange={e => setLie(+e.target.value)} />
            </div>
            {!customMode && (
              <button className="btn btn-secondary" onClick={recalculate}>Recalcular</button>
            )}
          </div>

          {customMode && (
            <div style={{ marginTop: 16 }}>
              <label className="form-label">Datos (separados por coma, Enter o espacio)</label>
              <textarea className="form-textarea" rows={3} value={customVals}
                onChange={e => setCustomVals(e.target.value)} placeholder="225, 230, 220, 235, 228..." />
              <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={runCustom}>Calcular</button>
            </div>
          )}
        </div>

        {/* Índices principales */}
        {result && (
          <>
            <div className={`${!printConfig.indices ? 'no-print' : ''}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Cp (Potencial)', val: result.Cp, threshold: 1.33 },
                { label: 'Cpk (Real)', val: result.Cpk, threshold: 1.33 },
                { label: 'Cpu', val: result.Cpu, threshold: 1.33 },
                { label: 'Cpl', val: result.Cpl, threshold: 1.33 },
                { label: 'Pp (Desempeño)', val: result.Pp, threshold: 1.33 },
                { label: 'Ppk', val: result.Ppk, threshold: 1.33 },
              ].map((s, i) => (
                <div key={i} className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'JetBrains Mono', color: s.val >= s.threshold ? 'var(--green-light)' : s.val >= 1 ? '#eab308' : '#ef4444' }}>
                    {s.val.toFixed(3)}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span className={`badge ${s.val >= s.threshold ? 'badge-green' : s.val >= 1 ? 'badge-yellow' : 'badge-red'}`}>
                      {s.val >= s.threshold ? 'Capaz' : s.val >= 1 ? 'Marginal' : 'No capaz'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className={`${!printConfig.stats ? 'no-print' : ''}`} style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Media (X̄)', val: result.mean.toFixed(4) },
                { label: 'Sigma (σ)', val: result.sigma.toFixed(4) },
                { label: 'LIE', val: result.lie },
                { label: 'LSE', val: result.lse },
                { label: 'PPM Estimado', val: ppm.toLocaleString(), color: ppm < 6210 ? 'var(--green-light)' : '#ef4444' },
              ].map((s, i) => (
                <div key={i} className="card" style={{ padding: '10px 16px', flex: 1, minWidth: 100, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'JetBrains Mono', color: s.color || 'var(--text-primary)' }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Diagnóstico Técnico */}
            {(() => {
              const cpOk = result.Cp >= 1.33;
              const cpkOk = result.Cpk >= 1.33;
              const centered = Math.abs(result.Cp - result.Cpk) < 0.1;
              const sigmaLevel = (result.Cpk * 3).toFixed(2);
              const defRate = ppm > 66807 ? 'Alta' : ppm > 6210 ? 'Moderada' : ppm > 233 ? 'Baja' : 'Muy Baja';
              const defColor = ppm > 66807 ? '#ef4444' : ppm > 6210 ? '#f59e0b' : 'var(--green-light)';

              return (
                <div className={`card ${!printConfig.diagnostic ? 'no-print' : ''}`} style={{ border: '1px solid var(--green-primary)', borderLeft: '4px solid var(--green-primary)', marginBottom: 16 }}>
                  <div className="section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    Diagnóstico Técnico — Capacidad del Proceso
                    <span className={`badge ${cpkOk ? 'badge-green' : result.Cpk >= 1 ? 'badge-yellow' : 'badge-red'}`} style={{ fontSize: 11 }}>
                      {cpkOk ? 'Proceso Capaz' : result.Cpk >= 1 ? 'Marginal' : 'No Capaz'}
                    </span>
                  </div>

                  {/* Estado general */}
                  <div style={{ padding: '14px 16px', borderRadius: 8, marginBottom: 14,
                    background: cpkOk ? 'rgba(16,185,129,0.08)' : result.Cpk >= 1 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${cpkOk ? 'var(--green-primary)' : result.Cpk >= 1 ? '#f59e0b' : '#ef4444'}` }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4,
                      color: cpkOk ? 'var(--green-light)' : result.Cpk >= 1 ? '#f59e0b' : '#ef4444' }}>
                      {cpkOk
                        ? 'El proceso es capaz y cumple con las especificaciones del cliente'
                        : result.Cpk >= 1
                          ? 'Proceso marginalmente capaz — requiere monitoreo continuo'
                          : 'El proceso NO es capaz — se generan productos fuera de especificación'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      <strong>Cp = {result.Cp.toFixed(3)}</strong> (potencial) · <strong>Cpk = {result.Cpk.toFixed(3)}</strong> (real) · Nivel sigma ≈ <strong>{sigmaLevel}σ</strong>
                      <br />
                      {centered
                        ? 'El proceso está centrado respecto a los límites de especificación (Cp ≈ Cpk).'
                        : `El proceso está descentrado: Cp (${result.Cp.toFixed(3)}) > Cpk (${result.Cpk.toFixed(3)}). Existe potencial de mejora ajustando la media del proceso.`}
                    </div>
                  </div>

                  {/* Interpretación de cada índice */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Interpretación de Índices:</div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {[
                        { idx: 'Cp', val: result.Cp, desc: 'Potencial del proceso — relación entre tolerancia especificada y variación del proceso (6σ). No considera el centrado.' },
                        { idx: 'Cpk', val: result.Cpk, desc: 'Capacidad real — considera tanto la variación como el centrado del proceso. Es el índice más importante.' },
                        { idx: 'Cpu', val: result.Cpu, desc: 'Capacidad hacia el límite superior. Si Cpu < Cpk, el proceso tiende a superar el LSE.' },
                        { idx: 'Cpl', val: result.Cpl, desc: 'Capacidad hacia el límite inferior. Si Cpl < Cpk, el proceso tiende a caer bajo el LIE.' },
                        { idx: 'Pp', val: result.Pp, desc: 'Desempeño total del proceso (usa desviación global). Útil cuando el proceso no está necesariamente bajo control estadístico.' },
                        { idx: 'Ppk', val: result.Ppk, desc: 'Desempeño real considerando centrado y variación global. Ideal para estudios de larga duración.' },
                      ].map((s, i) => {
                        const ok = s.val >= 1.33; const marginal = s.val >= 1;
                        const color = ok ? 'var(--green-light)' : marginal ? '#f59e0b' : '#ef4444';
                        return (
                          <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12, padding: '6px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                            <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, color, minWidth: 40 }}>{s.val.toFixed(3)}</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', minWidth: 30 }}>{s.idx}</span>
                            <span style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.desc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* PPM y tasa de defectos */}
                  <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                      Estimación de Tasa de Defectos (PPM):
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'JetBrains Mono', color: defColor, marginBottom: 4 }}>
                      {ppm.toLocaleString()} PPM
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Tasa de defectos: <strong style={{ color: defColor }}>{defRate}</strong> — se estiman aproximadamente <strong style={{ color: defColor }}>{ppm.toLocaleString()}</strong> unidades no conformes por cada millón producidas.
                      {ppm > 66807 && ' Esto corresponde a un proceso de 3σ o menos — inaceptable en manufactura moderna.'}
                      {ppm <= 233 && ' Esto corresponde a un proceso de 5σ o más — excelente desempeño.'}
                    </div>
                  </div>

                  {/* Recomendaciones */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-light)', marginBottom: 8 }}>Recomendaciones:</div>
                    <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.8 }}>
                      {cpkOk ? (<>
                        <li>El proceso cumple el estándar mínimo de industria (Cpk ≥ 1.33). Mantenga el control estadístico y monitoreo periódico.</li>
                        {!centered && <li>Aunque Cpk es aceptable, el proceso está ligeramente descentrado. Ajustar la media hacia {((result.lse + result.lie) / 2).toFixed(2)} mejoraría el desempeño.</li>}
                        {result.Cpk < 1.67 && <li>Para procesos críticos (aeroespacial, médico) se requiere Cpk ≥ 1.67. Considere reducir la variabilidad para alcanzar clase mundial.</li>}
                        <li>Implemente cartas de control para mantener el proceso dentro de los límites actuales.</li>
                      </>) : result.Cpk >= 1 ? (<>
                        <li>El proceso es marginalmente capaz. Se producen algunos defectos. Implemente inspección 100% como medida temporal.</li>
                        <li>Priorice la reducción de variabilidad: estandarice parámetros del proceso, calibre equipos de medición.</li>
                        {!centered && <li>Centre el proceso hacia el nominal ({((result.lse + result.lie) / 2).toFixed(2)}) para ganar margen en ambos límites.</li>}
                        <li>Establezca un proyecto de mejora Six Sigma o Kaizen con meta Cpk ≥ 1.33.</li>
                      </>) : (<>
                        <li><strong style={{ color: '#ef4444' }}>Acción inmediata requerida.</strong> El proceso genera productos no conformes que pueden llegar al cliente.</li>
                        <li>Implemente inspección 100% de los productos hasta resolver el problema de capacidad.</li>
                        <li>Investigue y elimine causas de variación excesiva: equipos desgastados, materias primas fuera de especificación, parámetros del proceso inadecuados.</li>
                        {!centered && <li>Centre el proceso hacia {((result.lse + result.lie) / 2).toFixed(2)}. Solo el recentrado podría mejorar el Cpk de {result.Cpk.toFixed(3)} a {result.Cp.toFixed(3)}.</li>}
                        <li>Evalúe si los límites de especificación son realistas para las capacidades actuales del proceso.</li>
                      </>)}
                    </ul>
                  </div>
                </div>
              );
            })()}

            {/* Curva distribución */}
            {(() => {
              const curveMaxY = Math.max(...curve.map(c => c.y));
              const domainCurveY = [0, +(curveMaxY * 1.15).toFixed(6)];
              const curveMinX = Math.min(...curve.map(c => c.x));
              const curveMaxX = Math.max(...curve.map(c => c.x));
              const domainCurveX = [+(curveMinX).toFixed(3), +(curveMaxX).toFixed(3)];

              return (
                <div className={`chart-wrapper ${!printConfig.curve ? 'no-print' : ''}`}>
                  <div className="chart-title">Distribución del Proceso vs. Especificaciones</div>
                  <div className="chart-desc">Área verde = dentro de especificación · Líneas rojas = LSE y LIE</div>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={curve} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorProcess" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--green-primary)" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="var(--green-primary)" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="x" type="number" stroke="var(--text-muted)" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} domain={domainCurveX} allowDataOverflow={true} />
                      <YAxis stroke="var(--text-muted)" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} domain={domainCurveY} allowDataOverflow={true} />
                      <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                      <ReferenceLine x={result.lse} stroke="#ef4444" strokeWidth={2} label={{ value: `LSE: ${result.lse}`, fill: '#ef4444', fontSize: 11, position: 'insideTopRight' }} />
                      <ReferenceLine x={result.lie} stroke="#ef4444" strokeWidth={2} label={{ value: `LIE: ${result.lie}`, fill: '#ef4444', fontSize: 11, position: 'insideTopLeft' }} />
                      <ReferenceLine x={result.mean} stroke="var(--green-primary)" strokeDasharray="4 2" label={{ value: `X̄: ${result.mean.toFixed(2)}`, fill: 'var(--green-primary)', fontSize: 11, position: 'insideTop' }} />
                      <Area type="monotone" dataKey="y" stroke="var(--green-primary)" strokeWidth={2} fill="url(#colorProcess)" name="f(x)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* REPORT CONFIGURATION MODAL */}
      {isReportModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: 20
        }}>
          <div className="card modal-content" style={{
            width: '100%', maxWidth: '480px', border: '1px solid var(--border)', background: 'var(--bg-card)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--green-light)', margin: 0 }}>
                📋 Configurar Reporte de Capacidad
              </h3>
              <button className="btn btn-secondary" style={{ padding: '6px', borderRadius: '50%' }} onClick={() => setIsReportModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Seleccione qué secciones del análisis desea incluir en el reporte imprimible.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                { key: 'indices', title: 'Índices de Capacidad', desc: 'KPIs Cp, Cpk, Pp y Ppk con nivel de suficiencia.' },
                { key: 'stats', title: 'Estadísticos Generales y PPM', desc: 'Media, desviación estándar, límites y partes por millón estimadas.' },
                { key: 'diagnostic', title: 'Diagnóstico y Recomendaciones', desc: 'Análisis explicativo sobre el centrado, sigma y propuestas Kaizen.' },
                { key: 'curve', title: 'Gráfico de Distribución del Proceso', desc: 'Curva normal con áreas rellenas frente a las especificaciones.' },
              ].map(opt => (
                <label key={opt.key} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                  borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s'
                }} className="hover-bg-card-hover">
                  <input type="checkbox" checked={printConfig[opt.key]} style={{ marginTop: 3, accentColor: 'var(--green-primary)' }}
                    onChange={e => setPrintConfig(c => ({ ...c, [opt.key]: e.target.checked }))} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{opt.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsReportModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={handlePrint}>
                <Printer size={14} /> Imprimir / PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
