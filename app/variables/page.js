'use client';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts';
import { calcXbarR, calcXbarS, aguacatePeso, aloeAltura, manzanillaP, tomateDefectos } from '../../lib/data';
import { analyzeNelsonRules, getNelsonDiagnostic } from '../../lib/nelson';
import { Printer, AlertTriangle, FileText, Check, Settings, X, Info, RefreshCw } from 'lucide-react';

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

const CustomDot = (props) => {
  const { cx, cy, payload, oocKey, normalColor = "#10b981", isXChart = false } = props;
  
  if (isXChart && payload.rulesViolated && payload.rulesViolated.length > 0) {
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

// Tooltip interactivo premium para gráficos de variables (Xbar y R/S)
const CustomTooltip = ({ active, payload, label, isXBar = true }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = isXBar ? data.media : data.rango;
    const ucl = isXBar ? data.UCL_X : data.UCL_R;
    const lcl = isXBar ? data.LCL_X : data.LCL_R;
    const lc = isXBar ? data.Xbarbar : data.Rbar;
    const valueLabel = isXBar ? 'Media (X̄)' : (payload[0].name || 'Variación');

    const formatVal = (v) => {
      if (typeof v !== 'number') return '-';
      return v.toFixed(4);
    };

    return (
      <div className="custom-tooltip" style={{
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        fontSize: '12px',
        fontFamily: 'Outfit, sans-serif'
      }}>
        <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 4 }}>
          Subgrupo {label}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
            <span style={{ color: 'var(--green-light)', fontWeight: 600 }}>{valueLabel}:</span>
            <span style={{ fontFamily: 'JetBrains Mono', color: '#ffffff', fontWeight: 700 }}>{formatVal(value)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginTop: 4 }}>
            <span style={{ color: '#ef4444' }}>LCS (Sup):</span>
            <span style={{ fontFamily: 'JetBrains Mono', color: '#ef4444' }}>{formatVal(ucl)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
            <span style={{ color: 'var(--green-primary)' }}>LC (Centro):</span>
            <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--green-primary)' }}>{formatVal(lc)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
            <span style={{ color: lcl > 0 ? '#ef4444' : 'var(--text-muted)' }}>LCI (Inf):</span>
            <span style={{ fontFamily: 'JetBrains Mono', color: lcl > 0 ? '#ef4444' : 'var(--text-muted)' }}>{formatVal(lcl)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function VariablesPage() {
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState('custom');
  const [customData, setCustomData] = useState({ n: 5, rows: 25, values: [] });
  const [chartType, setChartType] = useState('XR'); // 'XR' (Rangos) o 'XS' (Desviación)
  const [result, setResult] = useState(null);
  const [dataset, setDataset] = useState(null);
  const [userRecords, setUserRecords] = useState([]);
  
  // State for Customizable Report PDF Builder
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    info: true,
    xbar: true,
    rs: true,
    nelson: true,
    table: true,
  });

  useEffect(() => {
    setMounted(true);
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
          localStorage.removeItem('agrometric_selected_id');
          return;
        }
      }

      if (variables.length > 0) {
        setSelected('user_0');
      }
    } catch { setUserRecords([]); }
  }, []);

  // Centralized calculator function that integrates Nelson Rules
  function computeChartResults(subgrupos, isXS) {
    if (!subgrupos || subgrupos.length === 0) return null;
    const r = isXS ? calcXbarS(subgrupos) : calcXbarR(subgrupos);
    
    // Estimate standard deviation of the subgroups means for Nelson Z-scores
    const sigmaX = (r.UCL_X - r.Xbarbar) / 3;
    const zScores = r.stats.map(s => sigmaX > 0 ? (s.mean - r.Xbarbar) / sigmaX : 0);
    const nelsonAnalysis = analyzeNelsonRules(zScores);
    const nelsonDiagnostic = getNelsonDiagnostic(nelsonAnalysis);
    
    const chartData = r.stats.map((s, i) => {
      const zVal = sigmaX > 0 ? (s.mean - r.Xbarbar) / sigmaX : 0;
      const nelsonPt = nelsonAnalysis[i];
      return {
        sg: i + 1,
        media: +s.mean.toFixed(3),
        rango: +s.range.toFixed(3),
        UCL_X: +r.UCL_X.toFixed(3),
        LCL_X: +r.LCL_X.toFixed(3),
        Xbarbar: +r.Xbarbar.toFixed(3),
        UCL_R: isXS ? +r.UCL_S.toFixed(3) : +r.UCL_R.toFixed(3),
        LCL_R: isXS ? +r.LCL_S.toFixed(3) : +r.LCL_R.toFixed(3),
        Rbar: isXS ? +r.Sbar.toFixed(3) : +r.Rbar.toFixed(3),
        ooc_x: s.mean > r.UCL_X || s.mean < r.LCL_X,
        ooc_r: isXS ? s.range > r.UCL_S || s.range < r.LCL_S : s.range > r.UCL_R || s.range < r.LCL_R,
        zScore: +zVal.toFixed(3),
        rulesViolated: nelsonPt ? nelsonPt.rulesViolated : [],
      };
    });
    
    return {
      ...r,
      Rbar: isXS ? r.Sbar : r.Rbar,
      UCL_R: isXS ? r.UCL_S : r.UCL_R,
      LCL_R: isXS ? r.LCL_S : r.LCL_R,
      chartData,
      isXS,
      nelsonDiagnostic,
      sigmaX,
    };
  }

  useEffect(() => {
    if (selected === 'custom') {
      handleCustomCalc();
    } else if (selected.startsWith('user_')) {
      const idx = parseInt(selected.replace('user_', ''));
      const rec = userRecords[idx];
      if (rec && rec.subgruposData) {
        const fakeDs = {
          producto: rec.producto,
          variable: rec.variableName || rec.variable,
          unidad: rec.unidad || '',
          analista: rec.analista,
          subgrupos: rec.subgruposData,
          n: rec.tam,
        };
        setDataset(fakeDs);
        try {
          const isXS = chartType === 'XS';
          const r = computeChartResults(rec.subgruposData, isXS);
          setResult(r);
        } catch { alert('Error al calcular. Verifica que los datos sean numéricos.'); }
      }
    }
  }, [selected, userRecords, chartType]);

  const handleCustomCalc = () => {
    if (customData.values.length === 0) return;
    try {
      const rows = customData.values;
      const isXS = chartType === 'XS';
      const r = computeChartResults(rows, isXS);
      setResult(r);
    } catch { alert('Error procesando datos. Verifique el formato.'); }
  };

  useEffect(() => {
    if (selected === 'custom') {
      handleCustomCalc();
    }
  }, [chartType]);

  const handleManualInput = (row, col, val) => {
    const newVal = [...customData.values];
    if (!newVal[row]) newVal[row] = [];
    newVal[row][col] = val;
    setCustomData({ ...customData, values: newVal });
  };

  const handlePrint = () => {
    setIsReportModalOpen(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const nelsonViolationsCount = result?.nelsonDiagnostic?.totalViolations || 0;
  const classicOocCountX = result ? result.chartData.filter(d => d.ooc_x).length : 0;
  const classicOocCountR = result ? result.chartData.filter(d => d.ooc_r).length : 0;
  const totalAlerts = nelsonViolationsCount + Math.max(classicOocCountX, classicOocCountR);

  if (!mounted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <RefreshCw className="animate-spin" size={40} style={{ color: 'var(--green-light)' }} />
        <div style={{ color: 'var(--text-muted)', fontSize: 14, fontFamily: 'Outfit, sans-serif' }}>Iniciando entorno interactivo seguro...</div>
      </div>
    );
  }

  return (
    <>
      <div className="header no-print">
        <div>
          <div className="header-title">Control de Variables — Gráficos X̄-R / X̄-S</div>
          <div className="header-subtitle">Análisis avanzado de estabilidad y capacidad con diagnóstico automático Nelson Rules</div>
        </div>
        <button className="btn btn-primary" onClick={() => setIsReportModalOpen(true)}>
          <Printer size={16} /> Generar Reporte PDF
        </button>
      </div>
      
      {/* Header specifically formatted for Print Layout */}
      <div className="print-only" style={{ display: 'none', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #10b981', paddingBottom: 10 }}>
          <div>
            <h1 style={{ fontSize: '22pt', fontWeight: 800, color: '#0f172a', margin: 0 }}>AGROMETRIC PRECISION</h1>
            <p style={{ fontSize: '10pt', color: '#475569', margin: '4px 0 0 0' }}>Reporte Analítico del Proceso de Calidad</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '9pt', color: '#64748b', margin: 0 }}>Generado: {new Date().toLocaleDateString()}</p>
            <p style={{ fontSize: '10pt', fontWeight: 700, color: '#10b981', margin: '2px 0 0 0' }}>Gráficos Control de Variables</p>
          </div>
        </div>
      </div>

      <div className="page-content fade-in">

        {/* Dataset selector (No print) */}
        <div className="card no-print" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Seleccionar Conjunto de Datos</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              ...userRecords.map((r, i) => ({ key: `user_${i}`, label: `${r.producto} — ${r.variableName || r.variable}`, user: true })),
              { key: 'custom', label: 'Ingresar mis datos' },
            ].map(opt => (
              <button key={opt.key} className={`btn ${selected === opt.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelected(opt.key)}
                style={opt.user ? { borderColor: 'var(--green-primary)', color: selected === opt.key ? undefined : 'var(--green-light)' } : {}}>
                {opt.label}
              </button>
            ))}
          </div>
          {userRecords.length === 0 && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              Guarda un registro en <strong>Muestras</strong> para analizarlo aquí.
            </div>
          )}
        </div>

        {/* Tipo de Gráfico (No print) */}
        <div className="tabs no-print">
          <button className={`tab ${chartType === 'XR' ? 'active' : ''}`} onClick={() => setChartType('XR')}>
            Carta X̄-R (Rangos)
          </button>
          <button className={`tab ${chartType === 'XS' ? 'active' : ''}`} onClick={() => setChartType('XS')}>
            Carta X̄-S (Desviaciones)
          </button>
        </div>

        {/* Custom data entry (No print) */}
        {selected === 'custom' && (
          <div className="card no-print" style={{ marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>Ingreso Manual de Datos</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tamaño de subgrupo (n)</label>
                <select className="form-select" style={{ width: 120 }} value={customData.n}
                  onChange={e => setCustomData(d => ({ ...d, n: +e.target.value, values: [] }))}>
                  {[2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Número de subgrupos</label>
                <input type="number" className="form-input" style={{ width: 120 }} value={customData.rows} min={2}
                  onChange={e => setCustomData(d => ({ ...d, rows: +e.target.value, values: [] }))} />
              </div>
            </div>
            <div className="table-container data-table-input" style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 16 }}>
              <table><thead><tr>
                <th>Subgrupo</th>
                {Array.from({ length: customData.n }, (_, i) => <th key={i}>X{i+1}</th>)}
              </tr></thead>
              <tbody>
                {Array.from({ length: customData.rows }, (_, sgIdx) => (
                  <tr key={sgIdx}>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{sgIdx + 1}</td>
                    {Array.from({ length: customData.n }, (_, vi) => (
                      <td key={vi}>
                        <input type="number" step="any"
                          value={customData.values[sgIdx]?.[vi] ?? ''}
                          onChange={e => handleManualInput(sgIdx, vi, e.target.value)}
                          placeholder="0" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody></table>
            </div>
            <button className="btn btn-primary" onClick={handleCustomCalc}>Calcular Gráficos de Control</button>
          </div>
        )}

        {/* Info del dataset (Printable conditionally) */}
        {result && selected !== 'custom' && (
          <div className={`${!printConfig.info ? 'no-print' : ''}`} style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Producto', val: dataset.producto },
              { label: 'Variable', val: `${dataset.variable} (${dataset.unidad || ''})` },
              { label: 'Analista', val: dataset.analista },
              { label: 'Subgrupos', val: dataset.subgrupos.length },
              { label: 'n (tamaño)', val: dataset.n },
              { label: 'Alertas Totales', val: totalAlerts, color: totalAlerts > 0 ? '#f59e0b' : 'var(--green-light)' },
            ].map((item, i) => (
              <div key={i} className="card print-inline-card" style={{ padding: '10px 16px', flex: '1', minWidth: 120 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                <div className="print-text-dark" style={{ fontSize: 14, fontWeight: 700, color: item.color || 'var(--text-primary)' }}>{item.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Límites calculados (Printable conditionally) */}
        {result && (
          <div className={`grid-3 ${!printConfig.info ? 'no-print' : ''}`} style={{ marginBottom: 16 }}>
            {[
              { label: 'X̄ (Gran Media)', val: result.Xbarbar.toFixed(4) },
              { label: 'LCS (X̄)', val: result.UCL_X.toFixed(4), color: '#ef4444' },
              { label: 'LCI (X̄)', val: result.LCL_X.toFixed(4), color: '#ef4444' },
              { label: result.isXS ? 'S̄ (Desviación Media)' : 'R̄ (Rango Medio)', val: result.Rbar.toFixed(4) },
              { label: result.isXS ? 'LCS (S)' : 'LCS (R)', val: result.UCL_R.toFixed(4), color: '#ef4444' },
              { label: result.isXS ? 'LCI (S)' : 'LCI (R)', val: result.LCL_R.toFixed(4), color: result.LCL_R > 0 ? '#ef4444' : undefined },
            ].map((s, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: '12px 10px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>{s.label}</div>
                <div className="print-text-dark" style={{ fontSize: 20, fontWeight: 800, fontFamily: 'JetBrains Mono', color: s.color || 'var(--green-light)' }}>{s.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Gráfico X̄ */}
        {result && (() => {
          const mediaVals = result.chartData.map(d => d.media);
          const xMin = Math.min(...mediaVals, result.LCL_X);
          const xMax = Math.max(...mediaVals, result.UCL_X);
          const padX = (xMax - xMin) * 0.15 || 0.1;
          const domainX = [+(xMin - padX).toFixed(3), +(xMax + padX).toFixed(3)];
          const sigmaX = result.sigmaX;

          return (
            <div className={`chart-wrapper ${!printConfig.xbar ? 'no-print' : ''}`}>
              <div className="chart-title print-text-dark">Gráfico de Control X̄ (Media)</div>
              <div className="chart-desc print-text-muted">
                Puntos de alarma e inestabilidad señalados. LCS = {result.UCL_X.toFixed(3)} | LC = {result.Xbarbar.toFixed(3)} | LCI = {result.LCL_X.toFixed(3)}
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={result.chartData} margin={{ top: 20, right: 90, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="sg" label={{ value: 'Subgrupo', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }} stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={domainX} allowDataOverflow={true} />
                  <Tooltip content={<CustomTooltip isXBar={true} />} />
                  
                  {/* Nelson zones boundaries (faint dashed lines) */}
                  {sigmaX > 0 && (
                    <>
                      <ReferenceLine y={result.Xbarbar + sigmaX} stroke="rgba(16,185,129,0.2)" strokeDasharray="2 2" strokeWidth={1} label={{ value: '+1σ', fill: 'var(--text-muted)', fontSize: 7, position: 'right', offset: 5 }} />
                      <ReferenceLine y={result.Xbarbar - sigmaX} stroke="rgba(16,185,129,0.2)" strokeDasharray="2 2" strokeWidth={1} label={{ value: '-1σ', fill: 'var(--text-muted)', fontSize: 7, position: 'right', offset: 5 }} />
                      <ReferenceLine y={result.Xbarbar + 2 * sigmaX} stroke="rgba(16,185,129,0.2)" strokeDasharray="2 2" strokeWidth={1} label={{ value: '+2σ', fill: 'var(--text-muted)', fontSize: 7, position: 'right', offset: 5 }} />
                      <ReferenceLine y={result.Xbarbar - 2 * sigmaX} stroke="rgba(16,185,129,0.2)" strokeDasharray="2 2" strokeWidth={1} label={{ value: '-2σ', fill: 'var(--text-muted)', fontSize: 7, position: 'right', offset: 5 }} />
                    </>
                  )}

                  <ReferenceLine y={result.UCL_X} stroke="#ef4444" strokeWidth={2} />
                  <ReferenceLine y={result.Xbarbar} stroke="var(--green-primary)" strokeWidth={2} />
                  <ReferenceLine y={result.LCL_X} stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="media" stroke="var(--green-light)" strokeWidth={2} dot={<CustomDot isXChart={true} normalColor="var(--green-light)" />} name="X̄" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* Gráfico R / S */}
        {result && (() => {
          const rangoVals = result.chartData.map(d => d.rango);
          const rMin = Math.min(...rangoVals, result.LCL_R);
          const rMax = Math.max(...rangoVals, result.UCL_R);
          const padR = (rMax - rMin) * 0.15 || 0.1;
          const domainR = [Math.max(0, +(rMin - padR).toFixed(3)), +(rMax + padR).toFixed(3)];

          return (
            <div className={`chart-wrapper ${!printConfig.rs ? 'no-print' : ''}`}>
              <div className="chart-title print-text-dark">{result.isXS ? 'Gráfico de Control S (Desviación Estándar)' : 'Gráfico de Control R (Rango)'}</div>
              <div className="chart-desc print-text-muted">
                LCS = {result.UCL_R.toFixed(3)} | LC = {result.Rbar.toFixed(3)} | LCI = {result.LCL_R.toFixed(3)}
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={result.chartData} margin={{ top: 15, right: 90, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="sg" stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={domainR} allowDataOverflow={true} />
                  <Tooltip content={<CustomTooltip isXBar={false} />} />
                  <ReferenceLine y={result.UCL_R} stroke="#ef4444" strokeWidth={2} />
                  <ReferenceLine y={result.Rbar} stroke="#f59e0b" strokeWidth={2} />
                  {result.LCL_R > 0 && <ReferenceLine y={result.LCL_R} stroke="#ef4444" strokeWidth={2} />}
                  <Line type="monotone" dataKey="rango" stroke="#f59e0b" strokeWidth={2} dot={<CustomDot oocKey="ooc_r" normalColor="#f59e0b" />} name={result.isXS ? 'S' : 'R'} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* ── DIAGNÓSTICO TÉCNICO Y REGLAS DE NELSON (Printable conditionally) ── */}
        {result && (() => {
          const oocX = result.chartData.filter(d => d.ooc_x);
          const oocR = result.chartData.filter(d => d.ooc_r);
          const activeNelsonAlerts = result.nelsonDiagnostic.activeAlerts;
          const isControlled = result.nelsonDiagnostic.isControlled && oocR.length === 0;
          const ampRel = ((result.UCL_X - result.LCL_X) / result.Xbarbar * 100).toFixed(1);

          return (
            <div className={`card ${!printConfig.nelson ? 'no-print' : ''}`} style={{ border: '1px solid var(--green-primary)', borderLeft: '4px solid var(--green-primary)', marginBottom: 16 }}>
              <div className="section-title print-text-dark" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                Diagnóstico Técnico — Nelson & Western Electric Rules
                <span className={`badge ${isControlled ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 11 }}>
                  {isControlled ? 'Proceso Controlado y Estable' : 'Inestabilidad Detectada'}
                </span>
              </div>

              {/* Estado general */}
              <div style={{ padding: '14px 16px', borderRadius: 8, marginBottom: 14,
                background: isControlled ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${isControlled ? 'var(--green-primary)' : '#ef4444'}` }}>
                <div className="print-text-dark" style={{ fontWeight: 700, fontSize: 15, color: isControlled ? 'var(--green-light)' : '#ef4444', marginBottom: 4 }}>
                  {isControlled 
                    ? 'Proceso Bajo Control Estadístico Completo' 
                    : `Desviaciones Estadísticas Activas — ${totalAlerts} alerta(s) de inestabilidad`}
                </div>
                <div className="print-text-muted" style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {isControlled
                    ? `Los subgrupos analizados se comportan conforme a la distribución aleatoria típica (variación de causa común). No hay indicios de inestabilidad según los tests de rachas o desviaciones de Nelson.`
                    : `Se han detectado desviaciones que violan las reglas de Nelson de inestabilidad o puntos fuera de los límites (±3σ). Esto confirma la presencia de causas asignables (especiales) en el sistema.`}
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

              {/* Detalle OOC en R/S */}
              {oocR.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div className="print-text-dark" style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>Variación de Rango / Desviación Fuera de Control:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 6 }}>
                    {oocR.map((d, i) => (
                      <div key={`r-${i}`} className="print-card-border" style={{ fontSize: 12, color: 'var(--text-muted)', background: 'rgba(245,158,11,0.06)', padding: '6px 10px', borderRadius: 6, borderLeft: '3px solid #f59e0b' }}>
                        <strong style={{ color: '#f59e0b' }}>Sg. {d.sg} — Gráfico {result.isXS ? 'S' : 'R'}:</strong> {result.isXS ? 'Desv. Estándar' : 'Rango'} = {d.rango} &gt; LCS ({d.UCL_R})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumen estadístico consolidado */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginBottom: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                {[
                  { label: 'Gran Media (X̄̄)', val: result.Xbarbar.toFixed(4) },
                  { label: result.isXS ? 'Desviación Media (S̄)' : 'Rango Medio (R̄)', val: result.Rbar.toFixed(4) },
                  { label: 'Amplitud de Banda X̄', val: `${(result.UCL_X - result.LCL_X).toFixed(4)}` },
                  { label: 'Banda Relativa (%X̄̄)', val: `${ampRel}%` },
                  { label: 'Puntos Evaluados', val: result.chartData.length },
                  { label: 'Alertas Nelson', val: nelsonViolationsCount, color: nelsonViolationsCount > 0 ? '#f59e0b' : 'var(--green-light)' },
                ].map((s, i) => (
                  <div key={i} style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{s.label}: </span>
                    <span className="print-text-dark" style={{ fontWeight: 700, color: s.color || 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>{s.val}</span>
                  </div>
                ))}
              </div>

              {/* Recomendaciones de control industrial */}
              <div>
                <div className="print-text-dark" style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-light)', marginBottom: 8 }}>Recomendaciones y Acciones de Control:</div>
                <ul className="print-text-muted" style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.8 }}>
                  {isControlled ? (<>
                    <li>El proceso se encuentra estable y predecible. <strong className="print-text-dark" style={{ color: 'var(--text-primary)' }}>Es seguro proceder con la Capacidad del Proceso (Cp y Cpk)</strong>.</li>
                    <li>Mantenga los límites de control actuales en las próximas corridas de producción.</li>
                    <li>Siga auditando el proceso con la periodicidad regular para asegurar la estabilidad a largo plazo.</li>
                  </>) : (<>
                    <li><strong style={{ color: '#ef4444' }}>Detenga el cálculo de Cp/Cpk</strong>: El proceso es inestable y los índices de capacidad pueden arrojar estimaciones no confiables.</li>
                    <li>Investigue las causas asignables en los subgrupos marcados. Los patrones Nelson sugieren el origen:</li>
                    {activeNelsonAlerts.some(a => a.ruleId === 2) && <li><strong>Racha de Media (Regla 2):</strong> Indica un cambio súbito en el promedio. Investigue cambios en operarios, lotes de materia prima o nuevas máquinas.</li>}
                    {activeNelsonAlerts.some(a => a.ruleId === 3) && <li><strong>Tendencia (Regla 3):</strong> Apunta a cambios paulatinos. Investigue desgaste de cuchillas, descalibración lenta de sensores, acumulación de calor o fatiga.</li>}
                    {activeNelsonAlerts.some(a => a.ruleId === 5 || a.ruleId === 6) && <li><strong>Desviaciones de Sigma (Reglas 5 y 6):</strong> Indican un aumento de la dispersión general. Verifique inestabilidad en las condiciones iniciales del proceso.</li>}
                  </>)}
                </ul>
              </div>
            </div>
          );
        })()}

        {/* Tabla de datos (Printable conditionally) */}
        {result && (
          <div className={`card ${!printConfig.table ? 'no-print' : ''}`}>
            <div className="section-title print-text-dark" style={{ marginBottom: 12 }}>Tabla de Resultados por Subgrupo</div>
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>Subgrupo</th><th>X̄</th><th>{result.isXS ? 'S' : 'R'}</th><th>LCS(X̄)</th><th>LC(X̄)</th><th>LCI(X̄)</th><th>Estado X̄</th><th>Nelson Violadas</th>
                </tr></thead>
                <tbody>
                  {result.chartData.map((d, i) => {
                    const hasNelson = d.rulesViolated && d.rulesViolated.length > 0;
                    return (
                      <tr key={i} style={d.ooc_x || hasNelson || d.ooc_r ? { background: 'rgba(239,68,68,0.04)' } : {}}>
                        <td style={{ fontWeight: 600 }}>{d.sg}</td>
                        <td className="td-num">{d.media}</td>
                        <td className="td-num">{d.rango}</td>
                        <td className="td-num" style={{ color: '#ef4444' }}>{d.UCL_X}</td>
                        <td className="td-num" style={{ color: 'var(--green-primary)' }}>{d.Xbarbar}</td>
                        <td className="td-num" style={{ color: '#ef4444' }}>{d.LCL_X}</td>
                        <td>
                          <span className={`badge ${d.ooc_x ? 'badge-red' : 'badge-green'}`}>
                            {d.ooc_x ? 'OOC' : 'OK'}
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
              Selecciona los elementos que deseas incluir en tu reporte PDF imprimible. La vista previa e impresión respetarán esta selección de forma dinámica.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
              {[
                { key: 'info', title: 'Metadatos del Proceso y Límites', desc: 'Información general de la muestra, analista, fecha y límites de control calculados.' },
                { key: 'xbar', title: 'Gráfico de Control X̄ (Medias)', desc: 'Representación visual de la media de los subgrupos con límites LCS, LC, LCI y alertas Nelson.' },
                { key: 'rs', title: result?.isXS ? 'Gráfico de Control S (Desviaciones)' : 'Gráfico de Control R (Rangos)', desc: 'Representación de la variabilidad interna de los subgrupos.' },
                { key: 'nelson', title: 'Diagnóstico Estadístico de Nelson Rules', desc: 'Consolidado analítico con la descripción de patrones no aleatorios e inestabilidades.' },
                { key: 'table', title: 'Tabla de Resultados y Datos del Proceso', desc: 'Matriz tabular por subgrupos con los valores numéricos y el estado individual.' }
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

      {/* Global CSS adjustments for perfect dark modes and high-end printing outputs */}
      <style jsx global>{`
        /* Styles used strictly during browser print trigger */
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
