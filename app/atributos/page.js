'use client';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { calcP, calcC, manzanillaP, tomateDefectos } from '../../lib/data';
import { analyzeNelsonRules, getNelsonDiagnostic } from '../../lib/nelson';
import { Printer, AlertTriangle, FileText, Check, Settings, X, Info } from 'lucide-react';

const STORAGE_KEY = 'agrometric_registros';

const PRESETS = {
  manzanilla_p: { label: 'Manzanilla — Gráfico P', ds: manzanillaP, tipo: 'p' },
  tomate_c: { label: 'Tomate — Gráfico C', ds: tomateDefectos, tipo: 'c' },
};

const CustomDot = (props) => {
  const { cx, cy, payload, oocKey, normalColor = "#10b981" } = props;
  
  if (payload.rulesViolated && payload.rulesViolated.length > 0) {
    const hasRule1 = payload.rulesViolated.includes(1);
    const color = hasRule1 ? "#ef4444" : "#f59e0b";
    const radius = hasRule1 ? 6 : 5.5;
    return (
      <g key={`dot-g-${payload.sg}`}>
        <circle cx={cx} cy={cy} r={radius + 3} fill={color} opacity={0.25} />
        <circle cx={cx} cy={cy} r={radius} fill={color} stroke="#ffffff" strokeWidth={1.5} />
        <text x={cx} y={cy - 10} textAnchor="middle" fill={color} fontSize={9} fontWeight="bold" stroke="#000" strokeWidth={2} paintOrder="stroke">
          R{payload.rulesViolated.join(',')}
        </text>
      </g>
    );
  }
  
  const isOoc = oocKey ? payload[oocKey] : payload.ooc;
  if (isOoc) {
    return (
      <g key={`dot-g-ooc-${payload.sg}`}>
        <circle cx={cx} cy={cy} r={9} fill="#ef4444" opacity={0.25} />
        <circle cx={cx} cy={cy} r={6} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} />
      </g>
    );
  }
  return <circle key={`dot-c-normal-${payload.sg}`} cx={cx} cy={cy} r={4} fill={normalColor} stroke={normalColor} strokeWidth={1.5} />;
};

export default function AtributosPage() {
  const [preset, setPreset] = useState('custom');
  const [customMode, setCustomMode] = useState(true);
  const [ds, setDs] = useState(null);
  const [tipo, setTipo] = useState('p');
  const [result, setResult] = useState(null);
  
  // Custom form state
  const [customRows, setCustomRows] = useState(25);
  const [customN, setCustomN] = useState(100); // only used for 'p'
  const [customValues, setCustomValues] = useState([]);

  // User records from dashboard
  const [userRecords, setUserRecords] = useState([]);

  // State for Customizable Report PDF Builder
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    info: true,
    chart: true,
    nelson: true,
    table: true,
  });

  // Load user records
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const records = JSON.parse(raw);
        const attrRecords = records.filter(r => r.subgruposData && r.subgruposData.length > 0 && r.isAtributo);
        setUserRecords(attrRecords);
        if (attrRecords.length > 0) {
          setPreset('user_0');
        }
      }
    } catch {
      setUserRecords([]);
    }
  }, []);

  // Compute logic
  function computeChartResults(subgrupos, tipoGrafico) {
    if (!subgrupos || subgrupos.length === 0) return null;
    let chartData = [];
    let lcVal = 0, uclVal = 0, lclVal = 0;
    let nelsonDiagnostic = { totalViolations: 0, analysis: [] };
    
    if (tipoGrafico === 'p') {
      const totalN = subgrupos.reduce((sum, s) => sum + (s.n || 0), 0);
      const totalNP = subgrupos.reduce((sum, s) => sum + (s.np || 0), 0);
      const pbar = totalN > 0 ? totalNP / totalN : 0;
      
      chartData = subgrupos.map((s, i) => {
        const n = s.n || 0;
        const p = n > 0 ? (s.np || 0) / n : 0;
        const stdDev = Math.sqrt((pbar * (1 - pbar)) / n);
        const ucl = pbar + 3 * stdDev;
        const lcl = Math.max(0, pbar - 3 * stdDev);
        return { sg: i + 1, p, n, np: s.np, ucl, lcl, pbar, ooc: p > ucl || p < lcl };
      });
      
      lcVal = pbar;
      uclVal = chartData[0]?.ucl;
      lclVal = chartData[0]?.lcl;
    } else {
      const k = subgrupos.length;
      const totalC = subgrupos.reduce((sum, s) => sum + (s.c || 0), 0);
      const cbar = k > 0 ? totalC / k : 0;
      
      const stdDev = Math.sqrt(cbar);
      const ucl = cbar + 3 * stdDev;
      const lcl = Math.max(0, cbar - 3 * stdDev);
      
      chartData = subgrupos.map((s, i) => {
        const c = s.c || 0;
        return { sg: i + 1, c, ucl, lcl, cbar, ooc: c > ucl || c < lcl };
      });
      
      lcVal = cbar;
      uclVal = chartData[0]?.ucl;
      lclVal = chartData[0]?.lcl;
    }
    
    return { tipo: tipoGrafico, data: chartData, lcVal, uclVal, lclVal, nelsonDiagnostic };
  }

  const handleCustomCalc = () => {
    try {
      if (tipo === 'p') {
        const sgs = customValues.map(v => ({ n: customN, np: +v || 0 }));
        setResult(computeChartResults(sgs, 'p'));
      } else if (tipo === 'c') {
        const sgs = customValues.map(v => ({ c: +v || 0 }));
        setResult(computeChartResults(sgs, 'c'));
      }
    } catch { alert('Error en los datos'); }
  };

  useEffect(() => {
    if (preset === 'custom') {
      setCustomMode(true);
      setDs(null);
      handleCustomCalc();
    } else if (preset.startsWith('user_')) {
      setCustomMode(false);
      const idx = parseInt(preset.replace('user_', ''));
      const rec = userRecords[idx];
      if (rec && rec.subgruposData) {
        const fakeDs = {
          producto: rec.producto,
          atributo: rec.variableName || rec.variable,
          subgrupos: rec.subgruposData,
          tipoGrafico: rec.tipoGrafico || 'p',
        };
        setDs(fakeDs);
        setTipo(rec.tipoGrafico || 'p');
        setResult(computeChartResults(rec.subgruposData, rec.tipoGrafico || 'p'));
      }
    }
  }, [preset, userRecords]);

  const totalAlerts = result ? result.data.filter(d => d.ooc).length : 0;

  return (
    <>
      <div className="header no-print">
        <div>
          <div className="header-title">Control de Atributos</div>
          <div className="header-subtitle">Gráficos de inestabilidad de atributos continuos.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setIsReportModalOpen(true)}>
          <Printer size={16} /> Generar Reporte PDF
        </button>
      </div>

      <div className="page-content fade-in">
        <div className="card no-print" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Seleccionar Tipo de Gráfico y Datos</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              ...userRecords.map((r, i) => ({ key: `user_${i}`, label: `${r.producto} — Gráfico ${r.tipoGrafico?.toUpperCase() || 'P'}` })),
              { key: 'custom', label: 'Mis datos' },
            ].map(opt => (
              <button key={opt.key} className={`btn ${preset === opt.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPreset(opt.key)}>
                {opt.label}
              </button>
            ))}
          </div>
          {userRecords.length === 0 && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              Guarda un registro de <strong>Atributos</strong> en la pestaña Muestras para analizarlo aquí.
            </div>
          )}
        </div>

        {customMode && (
          <div className="card no-print" style={{ marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>Configurar Datos Personalizados</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tipo de Gráfico</label>
                <select className="form-select" style={{ width: 140 }} value={tipo} onChange={e => { setTipo(e.target.value); setCustomValues([]); }}>
                  <option value="p">Gráfico P (proporción)</option>
                  <option value="c">Gráfico C (defectos)</option>
                </select>
              </div>
              {tipo === 'p' && (
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
                <th>{tipo === 'p' ? 'Defectuosos (np)' : 'Defectos (c)'}</th>
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

        {/* Info cards (Printable conditionally) */}
        {!customMode && (
          <div className={`${!printConfig.info ? 'no-print' : ''}`} style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Producto', val: ds?.producto },
              { label: 'Atributo Controlado', val: ds?.atributo },
              { label: 'Tipo Gráfico', val: result?.tipo?.toUpperCase() },
              { label: 'Alertas Estadísticas', val: totalAlerts, color: totalAlerts > 0 ? '#f59e0b' : 'var(--green-light)' },
            ].map((item, i) => (
              <div key={i} className="card print-inline-card" style={{ padding: '10px 16px', flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                <div className="print-text-dark" style={{ fontSize: 14, fontWeight: 700, color: item.color || 'var(--text-primary)' }}>{item.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Límites (Printable conditionally) */}
        {result && result.data.length > 0 && (
          <div className={`grid-3 ${!printConfig.info ? 'no-print' : ''}`} style={{ marginBottom: 16 }}>
            {result.tipo === 'p' && [
              { label: 'p̄ (Proporción Media)', val: result.data[0].pbar?.toFixed(4) },
              { label: 'LCS Promedio', val: result.data[0].ucl?.toFixed(4), color: '#ef4444' },
              { label: 'LCI Promedio', val: result.data[0].lcl?.toFixed(4), color: '#ef4444' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: '12px 10px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                <div className="print-text-dark" style={{ fontSize: 20, fontWeight: 800, fontFamily: 'JetBrains Mono', color: s.color || 'var(--green-light)' }}>{s.val}</div>
              </div>
            ))}
            {result.tipo === 'c' && [
              { label: 'c̄ (Defectos Medios)', val: result.data[0].cbar?.toFixed(4) },
              { label: 'LCS', val: result.data[0].ucl?.toFixed(4), color: '#ef4444' },
              { label: 'LCI', val: result.data[0].lcl?.toFixed(4), color: '#ef4444' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: '12px 10px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                <div className="print-text-dark" style={{ fontSize: 20, fontWeight: 800, fontFamily: 'JetBrains Mono', color: s.color || 'var(--green-light)' }}>{s.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        {result && (() => {
          const chartVals = result.data.map(d => result.tipo === 'p' ? d.p : d.c);
          const uclVal = result.uclVal || 0;
          const lclVal = result.lclVal || 0;
          const lcVal = result.lcVal || 0;
          const yMin = Math.min(...chartVals, lclVal);
          const yMax = Math.max(...chartVals, uclVal);
          const pad = (yMax - yMin) * 0.15 || 0.1;
          const domainAttr = [Math.max(0, +(yMin - pad).toFixed(4)), +(yMax + pad).toFixed(4)];

          return (
            <div className={`chart-wrapper ${!printConfig.chart ? 'no-print' : ''}`}>
              <div className="chart-title print-text-dark">
                {result.tipo === 'p' ? 'Gráfico P — Proporción de Defectuosos' : 'Gráfico C — Defectos por Unidad'}
              </div>
              <div className="chart-desc print-text-muted">
                Detección activa de rachas y causas asignables. LCS = {uclVal?.toFixed(4)} | LC = {lcVal?.toFixed(4)} | LCI = {lclVal?.toFixed(4)}
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={result.data} margin={{ top: 20, right: 90, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="sg" stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} label={{ value: 'Subgrupo', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={domainAttr} allowDataOverflow={true} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                  <ReferenceLine y={uclVal} stroke="#ef4444" strokeWidth={2} label={{ value: `LCS: ${uclVal?.toFixed(4)}`, fill: '#ef4444', fontSize: 10, fontWeight: 'bold', position: 'right' }} />
                  <ReferenceLine y={lcVal} stroke="var(--green-primary)" strokeWidth={2} label={{ value: `LC: ${lcVal?.toFixed(4)}`, fill: 'var(--green-primary)', fontSize: 10, fontWeight: 'bold', position: 'right' }} />
                  {lclVal > 0 && <ReferenceLine y={lclVal} stroke="#ef4444" strokeWidth={2} label={{ value: `LCI: ${lclVal?.toFixed(4)}`, fill: '#ef4444', fontSize: 10, fontWeight: 'bold', position: 'right' }} />}
                  <Line type="monotone" dataKey={result.tipo === 'p' ? 'p' : 'c'} stroke="var(--green-light)" strokeWidth={2}
                    dot={<CustomDot oocKey="ooc" normalColor="var(--green-light)" />}
                    name={result.tipo === 'p' ? 'p' : 'c'} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* ── DIAGNÓSTICO TÉCNICO Y REGLAS DE NELSON (Printable conditionally) ── */}
        {result && (() => {
          const oocPts = result.data.filter(d => d.ooc);
          const activeNelsonAlerts = result.nelsonDiagnostic.activeAlerts;
          const isControlled = result.nelsonDiagnostic.isControlled && oocPts.length === 0;
          const totalPts = result.data.length;
          const rate = result.tipo === 'p' ? (result.lcVal * 100).toFixed(2) : result.lcVal?.toFixed(2);
          const rateLabel = result.tipo === 'p' ? `${rate}% defectuosos en promedio` : `${rate} defectos promedio por unidad`;

          return (
            <div className={`card ${!printConfig.nelson ? 'no-print' : ''}`} style={{ border: '1px solid var(--green-primary)', borderLeft: '4px solid var(--green-primary)', marginTop: 16 }}>
              <div className="section-title print-text-dark" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                Diagnóstico Técnico — Análisis de Atributos & Nelson Rules
                <span className={`badge ${isControlled ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 11 }}>
                  {isControlled ? 'Proceso Estable' : 'Fuera de Control'}
                </span>
              </div>

              {/* Estado general */}
              <div style={{ padding: '14px 16px', borderRadius: 8, marginBottom: 14,
                background: isControlled ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${isControlled ? 'var(--green-primary)' : '#ef4444'}` }}>
                <div className="print-text-dark" style={{ fontWeight: 700, fontSize: 15, color: isControlled ? 'var(--green-light)' : '#ef4444', marginBottom: 4 }}>
                  {isControlled
                    ? 'Proceso de atributos bajo control estadístico completo'
                    : `Inestabilidad en Atributos — ${totalAlerts} patrones de alerta activos`}
                </div>
                <div className="print-text-muted" style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Gráfico <strong>{result.tipo.toUpperCase()}</strong> · {totalPts} subgrupos analizados · {rateLabel}<br />
                  {isControlled
                    ? 'La variación observada responde exclusivamente a causas comunes. La tasa de defectos se encuentra en un estado estable y predecible.'
                    : `Se han identificado patrones sistemáticos de causas especiales. El proceso requiere evaluación inmediata.`}
                </div>
              </div>

              {/* DETALLE DE REGLAS DE NELSON INFRINGIDAS */}
              {activeNelsonAlerts.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div className="print-text-dark" style={{ fontSize: 13, fontWeight: 700, color: 'var(--warning)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={15} /> Patrones de Inestabilidad Detallados (Nelson Rules):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                    {activeNelsonAlerts.map((alert) => (
                      <div key={alert.ruleId} className="print-card-border" style={{
                        background: 'rgba(245,158,11,0.05)',
                        border: '1px solid rgba(245,158,11,0.25)',
                        borderLeft: '4px solid var(--warning)',
                        borderRadius: 8,
                        padding: '12px 14px',
                      }}>
                        <div className="print-text-dark" style={{ fontWeight: 700, fontSize: 13, color: '#f59e0b' }}>
                          Regla {alert.ruleId}: {alert.name}
                        </div>
                        <div className="print-text-muted" style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                          {alert.desc}
                        </div>
                        <div className="print-text-dark" style={{ fontSize: 11, marginTop: 8, fontWeight: 600 }}>
                          Subgrupos infractores: <span style={{ fontFamily: 'JetBrains Mono', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, color: 'var(--warning)' }}>{alert.subgrupos.join(', ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detalle OOC */}
              {oocPts.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div className="print-text-dark" style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>Puntos fuera de los límites de control de 3σ:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 6 }}>
                    {oocPts.map((d, i) => (
                      <div key={i} className="print-card-border" style={{ fontSize: 12, color: 'var(--text-muted)', background: 'rgba(239,68,68,0.06)', padding: '6px 10px', borderRadius: 6, borderLeft: '3px solid #ef4444' }}>
                        <strong style={{ color: '#ef4444' }}>Subgrupo {d.sg}:</strong>{' '}
                        {result.tipo === 'p'
                          ? `Proporción (p) = ${(d.p * 100).toFixed(2)}% > LCS (${(d.ucl * 100).toFixed(2)}%)`
                          : `Defectos (c) = ${d.c} > LCS (${d.ucl.toFixed(2)})`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recomendaciones específicas */}
              <div>
                <div className="print-text-dark" style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-light)', marginBottom: 8 }}>Recomendaciones de Acción:</div>
                <ul className="print-text-muted" style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.8 }}>
                  {isControlled ? (<>
                    <li>El proceso demuestra un nivel estable de calidad.</li>
                    <li>Use la herramienta <strong>Diagrama de Pareto</strong> para priorizar el análisis de las tipologías de defectos e iniciar proyectos Kaizen de mejora continua.</li>
                    <li>Siga recolectando subgrupos con el esquema habitual para confirmar la consistencia.</li>
                  </>) : (<>
                    <li><strong style={{ color: '#ef4444' }}>Detenga e investigue de inmediato</strong> los subgrupos fuera de control.</li>
                    <li>Abra un análisis de Ishikawa (Causa-Efecto) para desglosar la variabilidad: ¿hubo cambios en el lote de materia prima, fatiga en operarios o descalibraciones en las líneas de empaque?</li>
                    <li>Asegúrese de corregir las causas asignables antes de recalcular los límites históricos del proceso.</li>
                  </>)}
                </ul>
              </div>
            </div>
          );
        })()}

        {/* Tabla (Printable conditionally) */}
        {result && (
          <div className={`card ${!printConfig.table ? 'no-print' : ''}`} style={{ marginTop: 16 }}>
            <div className="section-title print-text-dark" style={{ marginBottom: 12 }}>Tabla de Datos y Rachas de Atributos</div>
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>Subgrupo</th>
                  {result.tipo === 'p' ? <><th>n</th><th>np</th><th>p</th></> : <th>c</th>}
                  <th>LCS</th><th>LC</th><th>LCI</th><th>Estado</th><th>Nelson Activas</th>
                </tr></thead>
                <tbody>
                  {result.data.map((d, i) => {
                    const hasNelson = d.rulesViolated && d.rulesViolated.length > 0;
                    return (
                      <tr key={i} style={d.ooc || hasNelson ? { background: 'rgba(239,68,68,0.04)' } : {}}>
                        <td style={{ fontWeight: 600 }}>{d.sg}</td>
                        {result.tipo === 'p' ? <>
                          <td className="td-num">{d.n}</td>
                          <td className="td-num">{d.np}</td>
                          <td className="td-num">{d.p?.toFixed(4)}</td>
                        </> : <td className="td-num">{d.c}</td>}
                        <td className="td-num" style={{ color: '#ef4444' }}>{d.ucl?.toFixed(4)}</td>
                        <td className="td-num" style={{ color: 'var(--green-primary)' }}>{(result.tipo === 'p' ? d.pbar : d.cbar)?.toFixed(4)}</td>
                        <td className="td-num" style={{ color: '#ef4444' }}>{d.lcl?.toFixed(4)}</td>
                        <td>
                          <span className={`badge ${d.ooc ? 'badge-red' : 'badge-green'}`}>
                            {d.ooc ? 'OOC' : 'OK'}
                          </span>
                        </td>
                        <td>
                          {hasNelson ? (
                            <span className="badge badge-yellow" style={{ fontSize: 10 }}>
                              Reglas: {d.rulesViolated.join(', ')}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Ninguna</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── CONSTRUCTOR DE REPORTE PDF MODAL ── */}
      {isReportModalOpen && (
        <div className="modal-overlay no-print" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: 20, backdropFilter: 'blur(4px)'
        }}>
          <div className="card modal-content" style={{
            width: '100%', maxWidth: '520px',
            border: '1px solid var(--border)', background: 'var(--bg-card)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={20} style={{ color: 'var(--green-light)' }} />
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--green-light)', margin: 0 }}>
                  Constructor de Reporte PDF
                </h3>
              </div>
              <button className="btn btn-secondary" style={{ padding: '6px', borderRadius: '50%' }} onClick={() => setIsReportModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Selecciona los componentes que deseas inyectar en tu reporte de control de atributos. Al imprimir se filtrarán de inmediato.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
              {[
                { key: 'info', title: 'Ficha Técnica y Límites de Control', desc: 'Metadatos del producto, atributo auditado, tasa de control media y límites calculados.' },
                { key: 'chart', title: result?.tipo === 'p' ? 'Gráfico de Proporciones (P)' : 'Gráfico de Defectos por Unidad (C)', desc: 'Visualización del comportamiento histórico con bandas de control y alertas.' },
                { key: 'nelson', title: 'Diagnóstico Estadístico de Nelson Rules', desc: 'Identificación detallada de inestabilidades, rachas y recomendaciones de acción.' },
                { key: 'table', title: 'Matriz Tabular y Resultados', desc: 'Listado completo por subgrupos con los valores numéricos y el estado individual.' }
              ].map(opt => (
                <label key={opt.key} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                  borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s'
                }} className="hover-bg-card-hover">
                  <input type="checkbox" checked={printConfig[opt.key]} style={{ marginTop: 3, accentColor: 'var(--green-primary)' }}
                    onChange={e => setPrintConfig(c => ({ ...c, [opt.key]: e.target.checked }))} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{opt.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <button className="btn btn-secondary" onClick={() => setIsReportModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={handlePrint}>
                <Printer size={16} /> Generar PDF / Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS adjustments for high-end printing outputs */}
      <style jsx global>{`
        @media print {
          body, html {
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .page-content {
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          .card, .chart-wrapper {
            background: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            padding: 15px !important;
            margin-bottom: 15px !important;
            border-radius: 6px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-inline-card {
            border: 1px solid #cbd5e1 !important;
            flex: 1 !important;
            padding: 8px 12px !important;
          }
          .print-text-dark {
            color: #0f172a !important;
          }
          .print-text-muted {
            color: #475569 !important;
          }
          .print-card-border {
            border: 1px solid #e2e8f0 !important;
            background: #f8fafc !important;
          }
          .print-only {
            display: block !important;
          }
          svg text {
            fill: #475569 !important;
            font-size: 10px !important;
          }
        }
        
        .hover-bg-card-hover:hover {
          background: var(--bg-card-hover) !important;
          border-color: var(--border-light) !important;
        }
      `}</style>
    </>
  );
}
