'use client';
import React, { useState, useEffect } from 'react';
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line, ScatterChart, Scatter, ReferenceLine
} from 'recharts';
import { normalityTest, histogram, optimizeBoxCox, aguacatePeso, aloeAltura, manzanillaP, tomateDefectos } from '../../lib/data';
import { Printer, X, RefreshCw } from 'lucide-react';

const STORAGE_KEY = 'agrometric_registros';

// Sanitización de registros con valores por defecto ultra-seguros
function safeSanitize(r) {
  if (!r || typeof r !== 'object') return null;
  
  const id = r.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const producto = typeof r.producto === 'string' ? r.producto.trim() : 'Sin Nombre';
  const tipo = typeof r.tipo === 'string' ? r.tipo.trim() : 'General';
  const variableName = typeof r.variableName === 'string' ? r.variableName.trim() : (typeof r.variable === 'string' ? r.variable.split('(')[0].trim() : 'Variable');
  const unidad = typeof r.unidad === 'string' ? r.unidad.trim() : '';
  const variable = unidad ? `${variableName} (${unidad})` : variableName;
  const analista = typeof r.analista === 'string' ? r.analista.trim() : 'Analista';
  const fecha = typeof r.fecha === 'string' ? r.fecha : new Date().toISOString().split('T')[0];
  const isAtributo = !!r.isAtributo;
  const tipoGrafico = typeof r.tipoGrafico === 'string' ? r.tipoGrafico : 'p';
  const lse = r.lse !== undefined && r.lse !== null ? String(r.lse).trim() : '-';
  const lie = r.lie !== undefined && r.lie !== null ? String(r.lie).trim() : '-';
  const lseNum = lse !== '-' ? parseFloat(lse) : null;
  const lieNum = lie !== '-' ? parseFloat(lie) : null;
  const estado = typeof r.estado === 'string' ? r.estado : 'Analizado';
  
  let subgruposData = [];
  if (Array.isArray(r.subgruposData)) {
    subgruposData = r.subgruposData.map(row => {
      if (isAtributo) {
        if (tipoGrafico === 'p' || tipoGrafico === 'np') {
          return {
            n: row && typeof row === 'object' ? (parseInt(row.n) || 100) : 100,
            np: row && typeof row === 'object' ? (parseInt(row.np) || 0) : 0
          };
        } else if (tipoGrafico === 'u') {
          return {
            n: row && typeof row === 'object' ? (parseInt(row.n) || 100) : 100,
            c: row && typeof row === 'object' ? (parseInt(row.c) || 0) : 0
          };
        } else {
          return {
            c: row && typeof row === 'object' ? (parseInt(row.c) || 0) : 0
          };
        }
      } else {
        if (Array.isArray(row)) {
          return row.map(v => parseFloat(v) || 0);
        }
        return [0, 0, 0, 0, 0];
      }
    });
  }

  const subgrupos = subgruposData.length;
  const tam = isAtributo ? '-' : (subgruposData[0]?.length || 5);

  return {
    id,
    producto: producto || 'Sin Nombre',
    tipo,
    variable,
    variableName: variableName || 'Variable',
    unidad,
    analista: analista || 'Analista',
    fecha,
    subgrupos,
    tam,
    lse,
    lie,
    lseNum: isNaN(lseNum) ? null : lseNum,
    lieNum: isNaN(lieNum) ? null : lieNum,
    estado,
    subgruposData,
    notes: typeof r.notas === 'string' ? r.notas.trim() : (typeof r.notes === 'string' ? r.notes.trim() : ''),
    isAtributo,
    tipoGrafico,
    isDemo: !!r.isDemo
  };
}

// Carga segura de registros con auto-siembra eagerly de inmediato
function getSafeRecords() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let parsed = [];
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        parsed = [];
      }
    }
    if (!Array.isArray(parsed)) parsed = [];
    
    let clean = parsed
      .map(safeSanitize)
      .filter(Boolean)
      .filter(r => !r.isDemo && !r.id.startsWith('demo_')); // Filtrar siempre demos de presets antiguos

    // Sembramos los registros predeterminados individuales si faltan
    const seededKeys = ['seeded_aguacate', 'seeded_aloe', 'seeded_manzanilla', 'seeded_tomate'];
    const missingKeys = seededKeys.filter(key => !clean.some(r => r && r.id === key));
    if (missingKeys.length > 0) {
      const seededRecordsMap = {
        seeded_aguacate: {
          id: 'seeded_aguacate',
          producto: 'Aguacate Hass',
          tipo: 'Fruta',
          variableName: 'Peso',
          unidad: 'g',
          analista: 'Carlos Mendoza',
          fecha: '2026-05-01',
          lse: '280',
          lie: '180',
          lseNum: 280,
          lieNum: 180,
          subgruposData: aguacatePeso.subgrupos,
          isAtributo: false,
          tipoGrafico: 'XR',
          estado: 'Analizado',
          notes: 'Muestra histórica de control de variables (peso de frutos).'
        },
        seeded_aloe: {
          id: 'seeded_aloe',
          producto: 'Aloe Vera',
          tipo: 'Planta Medicinal',
          variableName: 'Altura de Planta',
          unidad: 'cm',
          analista: 'Laura Gómez',
          fecha: '2026-05-05',
          lse: '55',
          lie: '25',
          lseNum: 55,
          lieNum: 25,
          subgruposData: aloeAltura.subgrupos,
          isAtributo: false,
          tipoGrafico: 'XR',
          estado: 'Analizado',
          notes: 'Muestra histórica de control de variables (altura de plantas).'
        },
        seeded_manzanilla: {
          id: 'seeded_manzanilla',
          producto: 'Manzanilla Alemana',
          tipo: 'Planta Medicinal',
          variableName: 'Flores con defectos',
          unidad: '',
          analista: 'Ana Torres',
          fecha: '2026-05-10',
          lse: '-',
          lie: '-',
          lseNum: null,
          lieNum: null,
          subgruposData: manzanillaP.subgrupos,
          isAtributo: true,
          tipoGrafico: 'p',
          estado: 'Analizado',
          notes: 'Muestra histórica de control de atributos (flores defectuosas).'
        },
        seeded_tomate: {
          id: 'seeded_tomate',
          producto: 'Tomate Chonto',
          tipo: 'Hortaliza',
          variableName: 'Manchas / Lesiones',
          unidad: '',
          analista: 'Pedro Rivas',
          fecha: '2026-05-12',
          lse: '-',
          lie: '-',
          lseNum: null,
          lieNum: null,
          subgruposData: tomateDefectos.subgrupos,
          isAtributo: true,
          tipoGrafico: 'c',
          estado: 'Analizado',
          notes: 'Muestra histórica de control de atributos (defectos por lote).'
        }
      };

      const newSeeded = missingKeys.map(k => seededRecordsMap[k]).map(safeSanitize).filter(Boolean);
      clean = [...clean, ...newSeeded];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    }
    return clean;
  } catch (e) {
    console.error('Error al parsear/sembrar localStorage:', e);
    return [];
  }
}

// Guardado seguro de registros
function saveSafeRecords(records) {
  if (typeof window === 'undefined') return;
  try {
    const clean = Array.isArray(records) ? records.map(safeSanitize).filter(Boolean) : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch (e) {
    console.error('Error al escribir en localStorage:', e);
  }
}

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
  const [selected, setSelected] = useState('custom');
  const [customMode, setCustomMode] = useState(true);
  const [customInput, setCustomInput] = useState('');
  const [result, setResult] = useState(null);
  const [histData, setHistData] = useState([]);
  const [qqData, setQqData] = useState([]);
  const [originalValues, setOriginalValues] = useState([]);
  const [isBoxCoxApplied, setIsBoxCoxApplied] = useState(false);
  const [optLambda, setOptLambda] = useState(1.0);
  const [error, setError] = useState(null);
  const [userRecords, setUserRecords] = useState([]);

  // Report print settings
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    descriptive: true,
    diagnostic: true,
    histogram: true,
    qqplot: true,
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
      const loaded = getSafeRecords();
      saveSafeRecords(loaded); // Reescribir de inmediato para limpiar localStorage
      const variables = loaded.filter(r => !r.isAtributo);
      setUserRecords(variables);

      const selectedId = localStorage.getItem('agrometric_selected_id');
      if (selectedId) {
        const foundIndex = variables.findIndex(r => r.id === selectedId);
        if (foundIndex !== -1) {
          setSelected(`user_${foundIndex}`);
          setCustomMode(false);
          const rec = variables[foundIndex];
          const vals = rec.subgruposData.flat().map(v => parseFloat(v)).filter(v => !isNaN(v));
          if (vals.length >= 4) runAnalysis(vals);
          localStorage.removeItem('agrometric_selected_id');
          return;
        }
      }

      if (variables.length > 0 && variables[0]?.subgruposData) {
        setSelected('user_0');
        setCustomMode(false);
        const vals = variables[0].subgruposData.flat().map(v => parseFloat(v)).filter(v => !isNaN(v));
        if (vals.length >= 4) runAnalysis(vals);
      }
    } catch (err) {
      console.error(err);
      setUserRecords([]);
    }
  }, []);

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

  const handleSelectUser = (key) => {
    setSelected(key);
    setCustomMode(false);
    if (key === 'custom') {
      setCustomMode(true);
      return;
    }
    const idx = parseInt(key.replace('user_', ''));
    const rec = userRecords[idx];
    if (rec && rec.subgruposData) {
      const vals = rec.subgruposData.flat().map(v => parseFloat(v)).filter(v => !isNaN(v));
      if (vals.length >= 4) runAnalysis(vals);
      else alert('Este registro no tiene suficientes datos para analizar (mínimo 4 valores).');
    }
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
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => { setError(null); setResult(null); }}>Reintentar</button>
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
        <button className="btn btn-primary no-print" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setIsReportModalOpen(true)}>
          <Printer size={16} /> Generar Reporte PDF
        </button>
      </div>
      <div className="page-content fade-in">
        {/* Selector */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Seleccionar Datos</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {userRecords.map((r, i) => (
              <button key={`user_${i}`} className={`btn ${selected === `user_${i}` ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderColor: 'var(--green-primary)', color: selected === `user_${i}` ? undefined : 'var(--green-light)' }}
                onClick={() => handleSelectUser(`user_${i}`)}>
                {r.producto} — {r.variableName || r.variable}
              </button>
            ))}
            <button className={`btn ${customMode ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleSelectUser('custom')}>Mis datos (manual)</button>
          </div>
          {userRecords.length === 0 && !customMode && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              Guarda un registro de <strong>Variables</strong> en Muestras para analizarlo aquí.
            </div>
          )}
          {customMode && (
            <div style={{ marginTop: 16 }}>
              <label className="form-label">Ingrese los datos (separados por coma, espacio, punto y coma o Enter)</label>
              <textarea className="form-textarea" rows={4} value={customInput} onChange={(e) => setCustomInput(e.target.value)} placeholder="Ej: 225, 230, 220, 235, 228..." />
              <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={handleCustom}>Analizar</button>
            </div>
          )}
        </div>

        {/* Box‑Cox tabs */}
        {originalValues.length > 0 && (
          <>
            <div className="tabs no-print" style={{ marginBottom: 12 }}>
              <button 
                className={`tab ${!isBoxCoxApplied ? 'active' : ''}`} 
                onClick={() => runAnalysis(originalValues, false)}
              >
                Datos Originales
              </button>
              {Math.min(...originalValues) > 0 ? (
                <button 
                  className={`tab ${isBoxCoxApplied ? 'active' : ''}`} 
                  onClick={() => runAnalysis(originalValues, true)}
                >
                  Transformación Box‑Cox (λ = {optLambda.toFixed(1)})
                </button>
              ) : (
                <button 
                  className="tab" 
                  disabled 
                  style={{ opacity: 0.5, cursor: 'not-allowed', position: 'relative' }}
                  title="No aplicable: requiere valores estrictamente positivos (>0)"
                >
                  Transformación Box‑Cox (No Aplicable)
                </button>
              )}
            </div>

            {/* Ficha explicativa si no es aplicable Box-Cox */}
            {Math.min(...originalValues) <= 0 && (
              <div className="no-print" style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: 16,
                fontSize: '13px',
                color: 'var(--text-muted)',
                lineHeight: '1.5'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                  ⚠️ Transformación Box‑Cox No Disponible
                </div>
                Matemáticamente, la transformación Box‑Cox requiere que todos los valores sean **estrictamente mayores a cero (&gt; 0)**, ya que utiliza logaritmos naturales y potencias complejas. 
                El valor mínimo actual en su conjunto de datos es <strong>{Math.min(...originalValues)}</strong>.
              </div>
            )}
          </>
        )}

        {/* Estadísticos descriptivos */}
        {result && (
          <div className={`grid-3 ${!printConfig.descriptive ? 'no-print' : ''}`} style={{ marginBottom: 16 }}>
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
            <div className={`card ${!printConfig.diagnostic ? 'no-print' : ''}`} style={{ border: '1px solid var(--green-primary)', borderLeft: `4px solid ${result.normal ? 'var(--green-primary)' : '#f59e0b'}`, marginBottom: 16 }}>
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
          <div className={`chart-wrapper ${!printConfig.histogram ? 'no-print' : ''}`}>
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
          <div className={`chart-wrapper ${!printConfig.qqplot ? 'no-print' : ''}`}>
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
                📋 Configurar Reporte de Normalidad
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
                { key: 'descriptive', title: 'Estadísticos Descriptivos', desc: 'Ficha con media, desviación estándar, asimetría y curtosis.' },
                { key: 'diagnostic', title: 'Diagnóstico de Normalidad', desc: 'Interpretación de la prueba Anderson-Darling e implicaciones.' },
                { key: 'histogram', title: 'Histograma con Curva Normal', desc: 'Gráfico con la comparación de frecuencias observadas y teóricas.' },
                { key: 'qqplot', title: 'Q-Q Plot (Probabilidad Normal)', desc: 'Gráfico de dispersión frente a la diagonal teórica.' },
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
