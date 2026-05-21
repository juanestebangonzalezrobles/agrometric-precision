'use client';
import React, { useState, useEffect } from 'react';
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line, ScatterChart, Scatter, ReferenceLine
} from 'recharts';
import { normalityTest, histogram, optimizeBoxCox, aguacatePeso, aloeAltura } from '../../lib/data';

const PRESETS = {
  aguacate: {
    label: 'Aguacate — Peso (g)',
    values: aguacatePeso.subgrupos.flat(),
    producto: 'Aguacate Hass',
    variable: 'Peso',
    unidad: 'g',
  },
  aloe: {
    label: 'Aloe Vera — Altura (cm)',
    values: aloeAltura.subgrupos.flat(),
    producto: 'Aloe Vera',
    variable: 'Altura',
    unidad: 'cm',
  },
};

function normalPDF(x, mean, sigma) {
  return Math.exp(-0.5 * ((x - mean) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
}

function inverseNormalCDF(p) {
  const pAdj = p < 0.5 ? p : 1 - p;
  const t = Math.sqrt(-2 * Math.log(Math.max(pAdj, 1e-10)));
  const c0 = 2.515517, c1 = 0.802853, c2 = 0.010328;
  const d1 = 1.432788, d2 = 0.189269, d3 = 0.001308;
  const zAbs = t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
  return p < 0.5 ? -zAbs : zAbs;
}

export default function NormalidadClient() {
  const [selected, setSelected] = useState('aguacate');
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [result, setResult] = useState(null);
  const [histData, setHistData] = useState([]);
  const [qqData, setQqData] = useState([]);
  const [originalValues, setOriginalValues] = useState([]);
  const [isBoxCoxApplied, setIsBoxCoxApplied] = useState(false);
  const [optLambda, setOptLambda] = useState(1.0);
  const [error, setError] = useState(null);

  const runAnalysis = (values, applyBoxCox = false) => {
    try {
      let finalValues = [...values];
      let lam = 1.0;

      if (!applyBoxCox) {
        setOriginalValues(values);
        setIsBoxCoxApplied(false);
      } else {
        const minVal = Math.min(...values);
        if (minVal <= 0) {
          alert('La transformación Box‑Cox requiere valores > 0');
          return;
        }
        const box = optimizeBoxCox(values);
        finalValues = box.transformed;
        lam = box.lambda;
        setOriginalValues(values);
        setIsBoxCoxApplied(true);
        setOptLambda(lam);
      }

      const r = normalityTest(finalValues);
      const hist = histogram(finalValues, 10);

      const histWithCurve = hist.map((h) => ({
        ...h,
        label: `${h.lo}–${h.hi}`,
        normal: +(normalPDF(h.mid, r.mean, r.s) * finalValues.length * (hist[0].hi - hist[0].lo)).toFixed(2),
      }));

      const n = r.sorted.length;
      const qq = r.sorted.map((val, i) => {
        const p = (i + 1 - 0.375) / (n + 0.25);
        const theoreticalZ = inverseNormalCDF(p);
        return {
          theoretical: +theoreticalZ.toFixed(3),
          sample: +((val - r.mean) / r.s).toFixed(3),
        };
      });

      setResult({ ...r, isBoxCoxApplied: applyBoxCox, optLambda: lam });
      setHistData(histWithCurve);
      setQqData(qq);
      setError(null);
    } catch (err) {
      console.error('Error en runAnalysis:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    runAnalysis(PRESETS.aguacate.values);
  }, []);

  const handlePreset = (key) => {
    setSelected(key);
    setCustomMode(false);
    runAnalysis(PRESETS[key].values);
  };

  const handleCustom = () => {
    const vals = customInput.split(/[\n,;\t ]+/).map((v) => parseFloat(v)).filter((v) => !isNaN(v));
    if (vals.length < 4) return alert('Ingrese al menos 4 valores numéricos');
    runAnalysis(vals);
  };

  if (error) {
    return (
      <>
        <div className="header">
          <div>
            <div className="header-title">Prueba de Normalidad</div>
            <div className="header-subtitle">Error en el análisis</div>
          </div>
        </div>
        <div className="page-content fade-in">
          <div className="card" style={{ border: '1px solid #ef4444', padding: 20 }}>
            <h3 style={{ color: '#ef4444' }}>Error: {error}</h3>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => { setError(null); runAnalysis(PRESETS.aguacate.values); }}>Reintentar</button>
          </div>
        </div>
      </>
    );
  }

  // Compute YAxis max safely
  const yMax = histData.length > 0
    ? Math.max(...histData.map((h) => Math.max(h.count || 0, h.normal || 0))) * 1.1
    : 10;

  // Compute QQ bounds safely
  const qqMinT = qqData.length > 0 ? Math.min(...qqData.map((d) => d.theoretical)) - 0.5 : -3;
  const qqMaxT = qqData.length > 0 ? Math.max(...qqData.map((d) => d.theoretical)) + 0.5 : 3;
  const qqMinS = qqData.length > 0 ? Math.min(...qqData.map((d) => d.sample)) - 0.5 : -3;
  const qqMaxS = qqData.length > 0 ? Math.max(...qqData.map((d) => d.sample)) + 0.5 : 3;

  return (
    <>
      <div className="header">
        <div>
          <div className="header-title">Prueba de Normalidad</div>
          <div className="header-subtitle">Anderson‑Darling · Histograma · Q‑Q Plot · Estadísticos Descriptivos</div>
        </div>
        <button className="btn btn-secondary no-print" onClick={() => window.print()}>Imprimir Reporte</button>
      </div>
      <div className="page-content fade-in">
        {/* Selector */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Seleccionar Datos</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Object.entries(PRESETS).map(([k, v]) => (
              <button key={k} className={`btn ${selected === k && !customMode ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handlePreset(k)}>{v.label}</button>
            ))}
            <button className={`btn ${customMode ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCustomMode(true)}>Mis datos</button>
          </div>
          {customMode && (
            <div style={{ marginTop: 16 }}>
              <label className="form-label">Ingrese los datos (separados por coma, espacio, punto y coma o Enter)</label>
              <textarea className="form-textarea" rows={4} value={customInput} onChange={(e) => setCustomInput(e.target.value)} placeholder="Ej: 225, 230, 220, 235, 228..." />
              <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={handleCustom}>Analizar</button>
            </div>
          )}
        </div>

        {/* Box‑Cox tabs */}
        {originalValues.length > 0 && Math.min(...originalValues) > 0 && (
          <div className="tabs no-print">
            <button className={`tab ${!isBoxCoxApplied ? 'active' : ''}`} onClick={() => runAnalysis(originalValues, false)}>Datos Originales</button>
            <button className={`tab ${isBoxCoxApplied ? 'active' : ''}`} onClick={() => runAnalysis(originalValues, true)}>Transformación Box‑Cox (λ = {optLambda.toFixed(1)})</button>
          </div>
        )}

        {/* Estadísticos descriptivos */}
        {result && (
          <div className="grid-3" style={{ marginBottom: 16 }}>
            {[
              { label: 'N (Datos)', val: result.n },
              { label: 'Media (X̄)', val: result.mean.toFixed(4) },
              { label: 'Desv. Estándar (S)', val: result.s.toFixed(4) },
              { label: 'Asimetría', val: result.skew.toFixed(4), color: Math.abs(result.skew) > 1 ? 'yellow' : 'green' },
              { label: 'Curtosis', val: result.kurt.toFixed(4), color: Math.abs(result.kurt) > 1 ? 'yellow' : 'green' },
              { label: 'Est. A² (And‑Darling)', val: result.A2.toFixed(4), color: result.normal ? 'green' : 'red' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: '12px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                <div style={{
                  fontSize: 20, fontWeight: 800, fontFamily: 'JetBrains Mono',
                  color: { green: 'var(--green-light)', red: '#ef4444', yellow: '#eab308' }[s.color] || 'var(--green-light)'
                }}>{s.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Diagnóstico Técnico */}
        {result && (() => {
          const skewType = Math.abs(result.skew) < 0.5 ? 'Simétrica' : result.skew > 0 ? 'Asimetría positiva' : 'Asimetría negativa';
          const kurtType = Math.abs(result.kurt) < 0.5 ? 'Mesocúrtica' : result.kurt > 0 ? 'Leptocúrtica' : 'Platicúrtica';
          const skewOk = Math.abs(result.skew) < 1;
          const kurtOk = Math.abs(result.kurt) < 1;
          return (
            <div className="card" style={{ border: '1px solid var(--green-primary)', borderLeft: `4px solid ${result.normal ? 'var(--green-primary)' : '#f59e0b'}`, marginBottom: 16 }}>
              <div className="section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                Diagnóstico Técnico — {result.isBoxCoxApplied ? `Datos Transformados (Box‑Cox, λ = ${result.optLambda.toFixed(1)})` : 'Prueba de Normalidad'}
                <span className={`badge ${result.normal ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: 11 }}>{result.normal ? 'Distribución Normal' : 'No Normal'}</span>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 8, marginBottom: 14, background: result.normal ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${result.normal ? 'var(--green-primary)' : '#f59e0b'}` }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: result.normal ? 'var(--green-light)' : '#f59e0b', marginBottom: 4 }}>
                  {result.normal ? 'Los datos siguen una distribución Normal (H₀ aceptada)' : 'Los datos NO siguen una distribución Normal (H₀ rechazada)'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <strong>Prueba Anderson‑Darling:</strong> A² = {result.A2.toFixed(4)} · p ≈ {result.pvalue.toFixed(3)} · α = 0.05
                  <br />
                  {result.normal
                    ? `Como p (${result.pvalue.toFixed(3)}) > α, no hay evidencia suficiente para rechazar la normalidad. µ = ${result.mean.toFixed(3)}, σ = ${result.s.toFixed(3)}`
                    : `Como p (${result.pvalue.toFixed(3)}) ≤ α, se rechaza H₀. La distribución difiere significativamente de la Normal.`}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: `1px solid ${skewOk ? 'var(--border)' : '#f59e0b'}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: skewOk ? 'var(--text-primary)' : '#f59e0b', marginBottom: 6 }}>Asimetría (Skewness): {result.skew.toFixed(4)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}><strong>{skewType}</strong><br />{Math.abs(result.skew) < 0.5 ? 'Distribución aproximadamente simétrica' : result.skew > 0 ? 'Cola larga a la derecha' : 'Cola larga a la izquierda'}</div>
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: `1px solid ${kurtOk ? 'var(--border)' : '#f59e0b'}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: kurtOk ? 'var(--text-primary)' : '#f59e0b', marginBottom: 6 }}>Curtosis (Kurtosis): {result.kurt.toFixed(4)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}><strong>{kurtType}</strong><br />{Math.abs(result.kurt) < 0.5 ? 'Similar a la normal' : result.kurt > 0 ? 'Colas pesadas' : 'Colas ligeras'}</div>
                </div>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Interpretación del Q‑Q Plot:</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {result.normal
                    ? `Los puntos del Q‑Q Plot ${result.isBoxCoxApplied ? 'transformado' : ''} se alinean aproximadamente sobre la diagonal, confirmando la distribución normal.`
                    : 'Los puntos del Q‑Q Plot muestran desviaciones sistemáticas de la diagonal, indicando no normalidad.'}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-light)', marginBottom: 8 }}>Implicaciones y Recomendaciones:</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.8 }}>
                {result.normal ? (
                  <>
                    <li><strong>{result.isBoxCoxApplied ? 'Transformación exitosa:' : 'Gráficos X̄‑R/X̄‑S válidos:'}</strong> El supuesto de normalidad se cumple.</li>
                    {result.isBoxCoxApplied && <li><strong>Uso en Gráficos de Control:</strong> Aplique la misma transformación λ = {result.optLambda.toFixed(1)} al ingresar datos.</li>}
                    <li><strong>Capacidad aplicable:</strong> Proceda con análisis de capacidad del proceso.</li>
                  </>
                ) : (
                  <>
                    <li><strong>Gráficos de control afectados:</strong> Los límites tradicionales pueden estar sesgados.</li>
                    <li><strong>Índices Cp/Cpk sesgados:</strong> Los valores pueden no reflejar la realidad.</li>
                    {originalValues.length > 0 && Math.min(...originalValues) > 0 && !result.isBoxCoxApplied && (
                      <li style={{ color: 'var(--green-light)', fontWeight: 600 }}>Utilice la pestaña &quot;Transformación Box‑Cox&quot; para normalizar los datos.</li>
                    )}
                    <li>Considere métodos no paramétricos (Pp, Ppk) si la transformación no es suficiente.</li>
                  </>
                )}
              </ul>
            </div>
          );
        })()}

        {/* Histograma */}
        {histData.length > 0 && (
          <div className="chart-wrapper">
            <div className="chart-title">Histograma con Curva Normal Superpuesta</div>
            <div className="chart-desc">Barras = frecuencia observada · Línea naranja = frecuencia teórica normal</div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={histData} margin={{ top: 15, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--text-muted)" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} angle={-30} textAnchor="end" />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={[0, yMax]} allowDataOverflow />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="var(--green-dark)" opacity={0.8} name="Frecuencia" radius={[3, 3, 0, 0]} />
                <Line type="monotone" dataKey="normal" stroke="#f59e0b" strokeWidth={2.5} dot={false} name="Normal teórica" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Q‑Q Plot */}
        {qqData.length > 0 && (
          <div className="chart-wrapper">
            <div className="chart-title">Q‑Q Plot (Gráfico de Probabilidad Normal)</div>
            <div className="chart-desc">Si los puntos se alinean sobre la diagonal, los datos son normales</div>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 15, right: 30, left: 10, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="theoretical" type="number" name="Cuantiles Teóricos (Z)" stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={[qqMinT, qqMaxT]} allowDataOverflow label={{ value: 'Cuantiles Teóricos', position: 'insideBottom', offset: -5, fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis dataKey="sample" type="number" name="Cuantiles Muestrales" stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={[qqMinS, qqMaxS]} allowDataOverflow label={{ value: 'Cuantiles Muestrales', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <ReferenceLine segment={[{ x: qqMinT, y: qqMinS }, { x: qqMaxT, y: qqMaxS }]} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 3" label={{ value: 'Diagonal Teórica', fill: '#ef4444', fontSize: 10, position: 'insideTopLeft' }} />
                <Scatter data={qqData} fill="var(--green-light)" opacity={0.8} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </>
  );
}
