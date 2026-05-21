'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine, 
  ResponsiveContainer 
} from 'recharts';
import { manzanillaP, tomateDefectos, aguacatePeso, aloeAltura } from '../../lib/data';
import { analyzeNelsonRules, getNelsonDiagnostic } from '../../lib/nelson';
import { 
  Printer, 
  AlertTriangle, 
  FileText, 
  Check, 
  Settings, 
  X, 
  Info,
  RefreshCw,
  TrendingUp,
  LayoutGrid
} from 'lucide-react';

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

// Carga segura de registros sin auto-siembra de demostración
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
      .filter(r => !r.isDemo && !r.id.startsWith('demo_') && !r.id.startsWith('seeded_')); // Filtrar siempre demos y datos sembrados

    return clean;
  } catch (e) {
    console.error('Error al parsear localStorage:', e);
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

// Renderizador personalizado de puntos inestables
const CustomDot = (props) => {
  const { cx, cy, payload, oocKey, normalColor = "var(--green-light)" } = props;
  
  if (payload?.rulesViolated && payload.rulesViolated.length > 0) {
    const hasRule1 = payload.rulesViolated.includes(1);
    const color = hasRule1 ? "#ef4444" : "#f59e0b";
    const radius = hasRule1 ? 6 : 5.5;
    return (
      <g key={`dot-g-${payload.sg}`}>
        <circle cx={cx} cy={cy} r={radius + 3} fill={color} opacity={0.25} />
        <circle cx={cx} cy={cy} r={radius} fill={color} stroke="#ffffff" strokeWidth={1.5} />
        <text 
          x={cx} 
          y={cy - 10} 
          textAnchor="middle" 
          fill={color} 
          fontSize={9} 
          fontWeight="bold" 
          stroke="var(--bg-card)" 
          strokeWidth={2.5} 
          paintOrder="stroke"
        >
          R{payload.rulesViolated.join(',')}
        </text>
      </g>
    );
  }
  
  const isOoc = oocKey ? payload[oocKey] : payload?.ooc;
  if (isOoc) {
    return (
      <g key={`dot-g-ooc-${payload.sg}`}>
        <circle cx={cx} cy={cy} r={9} fill="#ef4444" opacity={0.25} />
        <circle cx={cx} cy={cy} r={6} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} />
      </g>
    );
  }
  return <circle key={`dot-c-normal-${payload.sg}`} cx={cx} cy={cy} r={4.5} fill={normalColor} stroke="var(--bg-card)" strokeWidth={1.5} />;
};

// Tooltip interactivo premium para gráficos de atributos
const CustomTooltip = ({ active, payload, label, tipo }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    let value = 0;
    let valueLabel = '';
    
    if (tipo === 'p') {
      value = data.p;
      valueLabel = 'Proporción (p)';
    } else if (tipo === 'np') {
      value = data.np;
      valueLabel = 'Defectuosos (np)';
    } else if (tipo === 'u') {
      value = data.u;
      valueLabel = 'Defectos/Unidad (u)';
    } else {
      value = data.c;
      valueLabel = 'Defectos (c)';
    }
    
    const ucl = data.ucl;
    const lcl = data.lcl;
    const lc = data.pbar ?? data.npbar ?? data.ubar ?? data.cbar ?? 0;

    const formatVal = (v) => {
      if (typeof v !== 'number') return '-';
      if (tipo === 'p') return `${(v * 100).toFixed(2)}%`;
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
          {lcl !== undefined && lcl !== null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
              <span style={{ color: lcl > 0 ? '#ef4444' : 'var(--text-muted)' }}>LCI (Inf):</span>
              <span style={{ fontFamily: 'JetBrains Mono', color: lcl > 0 ? '#ef4444' : 'var(--text-muted)' }}>{formatVal(lcl)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function AtributosPage() {
  const [mounted, setMounted] = useState(false);
  const [preset, setPreset] = useState('custom');
  const [customMode, setCustomMode] = useState(true);
  const [ds, setDs] = useState(null);
  const [tipo, setTipo] = useState('p');
  const [result, setResult] = useState(null);
  
  // Datos personalizados manuales
  const [customRows, setCustomRows] = useState(15);
  const [customN, setCustomN] = useState(100); 
  const [customValues, setCustomValues] = useState([]);

  // Registros de usuario cargados
  const [userRecords, setUserRecords] = useState([]);

  // Control de Reporte PDF
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    info: true,
    chart: true,
    nelson: true,
    table: true,
  });

  // Carga segura y prevencion de hydration mismatches
  useEffect(() => {
    setMounted(true);
    try {
      const loaded = getSafeRecords();
      saveSafeRecords(loaded); // Reescribir de inmediato para limpiar localStorage
      const attrRecords = loaded.filter(r => !!r.isAtributo);
      setUserRecords(attrRecords);

      const selectedId = localStorage.getItem('agrometric_selected_id');
      if (selectedId) {
        const foundIndex = attrRecords.findIndex(r => r.id === selectedId);
        if (foundIndex !== -1) {
          setPreset(`user_${foundIndex}`);
          setCustomMode(false);
          localStorage.removeItem('agrometric_selected_id');
          return;
        }
      }

      if (attrRecords.length > 0) {
        setPreset('user_0');
        setCustomMode(false);
      }
    } catch (e) {
      console.error('Error al inicializar AtributosPage:', e);
      setUserRecords([]);
    }
  }, []);

  // Motor matemático de análisis y Nelson Rules sobre Atributos
  function computeChartResults(subgrupos, tipoGrafico) {
    if (!subgrupos || subgrupos.length === 0) return null;
    
    let chartData = [];
    let lcVal = 0, uclVal = 0, lclVal = 0;
    
    if (tipoGrafico === 'p') {
      const totalN = subgrupos.reduce((sum, s) => sum + (parseInt(s.n) || 100), 0);
      const totalNP = subgrupos.reduce((sum, s) => sum + (parseInt(s.np) || 0), 0);
      const pbar = totalN > 0 ? totalNP / totalN : 0;
      
      chartData = subgrupos.map((s, i) => {
        const n = Math.max(1, parseInt(s.n) || 100);
        const np = Math.max(0, parseInt(s.np) || 0);
        const p = np / n;
        const stdDev = Math.sqrt((pbar * (1 - pbar)) / n);
        const ucl = pbar + 3 * stdDev;
        const lcl = Math.max(0, pbar - 3 * stdDev);
        const z = stdDev > 0 ? (p - pbar) / stdDev : 0;
        
        return { 
          sg: i + 1, 
          p, 
          n, 
          np, 
          ucl, 
          lcl, 
          pbar, 
          ooc: p > ucl || p < lcl,
          z
        };
      });
      
      lcVal = pbar;
      uclVal = chartData[0]?.ucl || 0;
      lclVal = chartData[0]?.lcl || 0;
    } else if (tipoGrafico === 'np') {
      const totalN = subgrupos.reduce((sum, s) => sum + (parseInt(s.n) || 100), 0);
      const totalNP = subgrupos.reduce((sum, s) => sum + (parseInt(s.np) || 0), 0);
      const pbar = totalN > 0 ? totalNP / totalN : 0;
      const k = subgrupos.length;
      const averageN = k > 0 ? totalN / k : 100;
      const npbar = pbar * averageN;
      
      chartData = subgrupos.map((s, i) => {
        const n = Math.max(1, parseInt(s.n) || 100);
        const np = Math.max(0, parseInt(s.np) || 0);
        const stdDev = Math.sqrt(n * pbar * (1 - pbar));
        const centerLine = n * pbar;
        const ucl = centerLine + 3 * stdDev;
        const lcl = Math.max(0, centerLine - 3 * stdDev);
        const z = stdDev > 0 ? (np - centerLine) / stdDev : 0;
        
        return { 
          sg: i + 1, 
          n, 
          np, 
          ucl, 
          lcl, 
          npbar: centerLine, 
          ooc: np > ucl || np < lcl,
          z
        };
      });
      
      lcVal = npbar;
      uclVal = chartData[0]?.ucl || 0;
      lclVal = chartData[0]?.lcl || 0;
    } else if (tipoGrafico === 'u') {
      const totalN = subgrupos.reduce((sum, s) => sum + (parseInt(s.n) || 100), 0);
      const totalC = subgrupos.reduce((sum, s) => sum + (parseInt(s.c) || 0), 0);
      const ubar = totalN > 0 ? totalC / totalN : 0;
      
      chartData = subgrupos.map((s, i) => {
        const n = Math.max(1, parseInt(s.n) || 100);
        const c = Math.max(0, parseInt(s.c) || 0);
        const u = c / n;
        const stdDev = Math.sqrt(ubar / n);
        const ucl = ubar + 3 * stdDev;
        const lcl = Math.max(0, ubar - 3 * stdDev);
        const z = stdDev > 0 ? (u - ubar) / stdDev : 0;
        
        return { 
          sg: i + 1, 
          n, 
          c, 
          u, 
          ucl, 
          lcl, 
          ubar, 
          ooc: u > ucl || u < lcl,
          z
        };
      });
      
      lcVal = ubar;
      uclVal = chartData[0]?.ucl || 0;
      lclVal = chartData[0]?.lcl || 0;
    } else {
      const k = subgrupos.length;
      const totalC = subgrupos.reduce((sum, s) => sum + (parseInt(s.c) || 0), 0);
      const cbar = k > 0 ? totalC / k : 0;
      
      const stdDev = Math.sqrt(cbar);
      const ucl = cbar + 3 * stdDev;
      const lcl = Math.max(0, cbar - 3 * stdDev);
      
      chartData = subgrupos.map((s, i) => {
        const c = Math.max(0, parseInt(s.c) || 0);
        const z = stdDev > 0 ? (c - cbar) / stdDev : 0;
        
        return { 
          sg: i + 1, 
          c, 
          ucl, 
          lcl, 
          cbar, 
          ooc: c > ucl || c < lcl,
          z
        };
      });
      
      lcVal = cbar;
      uclVal = chartData[0]?.ucl || 0;
      lclVal = chartData[0]?.lcl || 0;
    }

    // Aplicación del Motor de Reglas de Nelson (Matemática Real)
    const zScores = chartData.map(d => d.z);
    const nelsonAnalysis = analyzeNelsonRules(zScores);
    const nelsonDiagnostic = getNelsonDiagnostic(nelsonAnalysis);
    
    // Inyectar resultados de alertas en cada punto
    chartData.forEach((d, i) => {
      d.rulesViolated = nelsonAnalysis[i]?.rulesViolated || [];
    });
    
    return { 
      tipo: tipoGrafico, 
      data: chartData, 
      lcVal, 
      uclVal, 
      lclVal, 
      nelsonDiagnostic 
    };
  }

  const handleCustomCalc = () => {
    try {
      if (tipo === 'p') {
        const sgs = Array.from({ length: customRows }, (_, i) => {
          const npVal = parseInt(customValues[i]) || 0;
          return { n: customN, np: npVal };
        });
        setResult(computeChartResults(sgs, 'p'));
      } else if (tipo === 'np') {
        const sgs = Array.from({ length: customRows }, (_, i) => {
          const npVal = parseInt(customValues[i]) || 0;
          return { n: customN, np: npVal };
        });
        setResult(computeChartResults(sgs, 'np'));
      } else if (tipo === 'u') {
        const sgs = Array.from({ length: customRows }, (_, i) => {
          const cVal = parseInt(customValues[i]) || 0;
          return { n: customN, c: cVal };
        });
        setResult(computeChartResults(sgs, 'u'));
      } else {
        const sgs = Array.from({ length: customRows }, (_, i) => {
          const cVal = parseInt(customValues[i]) || 0;
          return { c: cVal };
        });
        setResult(computeChartResults(sgs, 'c'));
      }
    } catch (err) {
      console.error(err);
      alert('Error en el formato de los datos manuales');
    }
  };

  // Escuchar cambios de preset o datos
  useEffect(() => {
    if (!mounted) return;
    
    if (preset === 'custom') {
      setCustomMode(true);
      setDs(null);
      handleCustomCalc();
    } else if (preset.startsWith('user_')) {
      setCustomMode(false);
      const idx = parseInt(preset.replace('user_', ''));
      const rec = userRecords[idx];
      if (rec && Array.isArray(rec.subgruposData)) {
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
  }, [preset, userRecords, mounted, customRows, customN]);

  // Recalcular custom al cambiar tipo
  useEffect(() => {
    if (mounted && preset === 'custom') {
      handleCustomCalc();
    }
  }, [tipo, mounted]);

  const handlePrint = () => {
    setIsReportModalOpen(false);
    setTimeout(() => {
      if (typeof window !== 'undefined') window.print();
    }, 200);
  };

  // Prevenir Hydration Mismatches
  if (!mounted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <RefreshCw className="animate-spin" size={40} style={{ color: 'var(--green-light)' }} />
        <div style={{ color: 'var(--text-muted)', fontSize: 14, fontFamily: 'Outfit, sans-serif' }}>Iniciando entorno interactivo seguro...</div>
      </div>
    );
  }

  const totalAlerts = result ? result.data.filter(d => d.ooc || (d.rulesViolated && d.rulesViolated.length > 0)).length : 0;

  return (
    <>
      <div className="header no-print" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(4, 120, 87, 0.02) 100%)',
        padding: '24px 32px',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <LayoutGrid style={{ color: 'var(--green-light)' }} size={22} />
            <h1 className="header-title" style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>Control de Atributos</h1>
          </div>
          <p className="header-subtitle" style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>
            Monitoreo y análisis de defectos en lotes agrícolas mediante gráficos P, NP, C y U con Nelson Rules activas.
          </p>
        </div>
        {result && (
          <button className="btn btn-primary" onClick={() => setIsReportModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Printer size={16} /> Generar Reporte PDF
          </button>
        )}
      </div>

      <div className="page-content fade-in">
        {/* Panel de selección */}
        <div className="card no-print" style={{ marginBottom: 16, border: '1px solid var(--border)', borderRadius: '12px' }}>
          <div className="section-title" style={{ marginBottom: 12, fontSize: '14.5px', fontWeight: 700 }}>
            📦 Seleccionar Lote o Matriz de Datos
          </div>
          
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: userRecords.length === 0 ? 0 : 12 }}>
            {[
              ...userRecords.map((r, i) => ({ key: `user_${i}`, label: `${r.producto} (${r.variableName || r.variable}) — Gráfico ${r.tipoGrafico?.toUpperCase() || 'P'}` })),
              { key: 'custom', label: '📊 Entrar Datos Manuales (Borrador)' },
            ].map(opt => (
              <button 
                key={opt.key} 
                className={`btn ${preset === opt.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPreset(opt.key)}
                style={{ fontSize: '12.5px', padding: '8px 16px' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          
          {userRecords.length === 0 && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)',
              padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: '#f59e0b', marginTop: 8
            }}>
              💡 No hay registros de atributos de usuario creados. Registra muestras marcando la opción <strong>Atributos (Gráfico P o C)</strong> en la pestaña Muestras para ver tus lotes aquí.
            </div>
          )}
        </div>

        {/* Carga Manual */}
        {customMode && (
          <div className="card no-print" style={{ marginBottom: 16, border: '1px solid var(--border)', borderRadius: '12px' }}>
            <div className="section-title" style={{ marginBottom: 12, fontSize: '14px', fontWeight: 700 }}>Configuración de Muestreo Manual</div>
            
            <div className="grid-3" style={{ gap: 12, marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tipo de Gráfica</label>
                <select className="form-select" value={tipo} onChange={e => { setTipo(e.target.value); setCustomValues([]); }}>
                  <option value="p">Gráfico P (Proporción Defectuosa)</option>
                  <option value="np">Gráfico NP (Número de Defectuosos)</option>
                  <option value="c">Gráfico C (Cantidad Total de Defectos)</option>
                  <option value="u">Gráfico U (Tasa de Defectos por Unidad)</option>
                </select>
              </div>
              
              {(tipo === 'p' || tipo === 'np' || tipo === 'u') && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tamaño muestra (n)</label>
                  <input type="number" min={1} className="form-input" value={customN} onChange={e => setCustomN(Math.max(1, parseInt(e.target.value) || 100))} />
                </div>
              )}
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Número de subgrupos</label>
                <input type="number" min={2} max={100} className="form-input" value={customRows} onChange={e => { setCustomRows(Math.max(2, Math.min(100, parseInt(e.target.value) || 15))); setCustomValues([]); }} />
              </div>
            </div>

            <div className="table-container" style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: 16 }}>
              <table style={{ width: '100%', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'center', width: '90px' }}>Subgrupo</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>
                      {tipo === 'p' && `Unidades Defectuosas np (de n = ${customN})`}
                      {tipo === 'np' && `Unidades Defectuosas np (de n = ${customN})`}
                      {tipo === 'u' && `Cantidad de Defectos c (de n = ${customN})`}
                      {tipo === 'c' && 'Recuento de Defectos (c)'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: customRows }, (_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ padding: '4px 8px' }}>
                        <input 
                          type="number" 
                          min={0}
                          placeholder="0"
                          value={customValues[i] !== undefined ? customValues[i] : ''}
                          onChange={e => { 
                            const v = [...customValues]; 
                            v[i] = e.target.value; 
                            setCustomValues(v); 
                          }}
                          style={{
                            width: '100%', background: 'var(--bg-secondary)', color: '#fff',
                            border: '1px solid var(--border)', padding: '5px 10px', borderRadius: '4px',
                            fontFamily: 'JetBrains Mono', textAlign: 'right'
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleCustomCalc} style={{ padding: '8px 20px' }}>
                ⚡ Calcular Estadísticas
              </button>
            </div>
          </div>
        )}

        {/* Tarjetas de Información del Lote */}
        {!customMode && (
          <div className={`${!printConfig.info ? 'no-print' : ''}`} style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Producto Evaluado', val: ds?.producto || 'General' },
              { label: 'Atributo Auditado', val: ds?.atributo || 'Atributo' },
              { label: 'Modelo Gráfico', val: `Tipo ${result?.tipo?.toUpperCase() || 'P'}` },
              { label: 'Alertas Totales', val: totalAlerts, color: totalAlerts > 0 ? '#ef4444' : 'var(--green-light)' },
            ].map((item, i) => (
              <div key={i} className="card print-inline-card" style={{ padding: '12px 18px', flex: 1, minWidth: 150, border: '1px solid var(--border)', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{item.label}</div>
                <div className="print-text-dark" style={{ fontSize: '15px', fontWeight: 800, color: item.color || 'var(--text-primary)' }}>{item.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Límites de Control */}
        {result && result.data.length > 0 && (
          <div className={`grid-3 ${!printConfig.info ? 'no-print' : ''}`} style={{ marginBottom: 16, gap: 12 }}>
            {(() => {
              let cards = [];
              if (result.tipo === 'p') {
                cards = [
                  { label: 'p̄ (Tasa de Defecto Promedio)', val: `${(result.lcVal * 100).toFixed(2)}%` },
                  { label: 'Línea de Control Superior (LCS)', val: `${(result.uclVal * 100).toFixed(2)}%`, color: '#ef4444' },
                  { label: 'Línea de Control Inferior (LCI)', val: `${(result.lclVal * 100).toFixed(2)}%`, color: '#ef4444' }
                ];
              } else if (result.tipo === 'np') {
                cards = [
                  { label: 'n̄p̄ (Promedio Unidades Defectuosas)', val: result.lcVal?.toFixed(2) },
                  { label: 'Línea de Control Superior (LCS)', val: result.uclVal?.toFixed(2), color: '#ef4444' },
                  { label: 'Línea de Control Inferior (LCI)', val: result.lclVal?.toFixed(2), color: '#ef4444' }
                ];
              } else if (result.tipo === 'u') {
                cards = [
                  { label: 'ū (Promedio Defectos por Unidad)', val: result.lcVal?.toFixed(4) },
                  { label: 'Línea de Control Superior (LCS)', val: result.uclVal?.toFixed(4), color: '#ef4444' },
                  { label: 'Línea de Control Inferior (LCI)', val: result.lclVal?.toFixed(4), color: '#ef4444' }
                ];
              } else { // 'c'
                cards = [
                  { label: 'c̄ (Promedio de Defectos)', val: result.lcVal?.toFixed(2) },
                  { label: 'Línea de Control Superior (LCS)', val: result.uclVal?.toFixed(2), color: '#ef4444' },
                  { label: 'Línea de Control Inferior (LCI)', val: result.lclVal?.toFixed(2), color: '#ef4444' }
                ];
              }
              return cards.map((s, i) => (
                <div key={i} className="card" style={{ textAlign: 'center', padding: '14px', border: '1px solid var(--border)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                  <div className="print-text-dark" style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'JetBrains Mono', color: s.color || 'var(--green-light)' }}>{s.val}</div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* Gráfico Recharts */}
        {result && (() => {
          const chartVals = result.data.map(d => {
            if (result.tipo === 'p') return d.p;
            if (result.tipo === 'np') return d.np;
            if (result.tipo === 'u') return d.u;
            return d.c;
          });
          const uclVal = result.uclVal || 0;
          const lclVal = result.lclVal || 0;
          const lcVal = result.lcVal || 0;
          const yMin = Math.min(...chartVals, lclVal);
          const yMax = Math.max(...chartVals, uclVal);
          const pad = (yMax - yMin) * 0.15 || 0.05;
          const domainAttr = [Math.max(0, +(yMin - pad).toFixed(4)), +(yMax + pad).toFixed(4)];

          return (
            <div className={`card chart-wrapper ${!printConfig.chart ? 'no-print' : ''}`} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: 16 }}>
              <div className="chart-title print-text-dark" style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
                {result.tipo === 'p' && '📉 Gráfico P — Fracción de Unidades Defectuosas'}
                {result.tipo === 'np' && '📉 Gráfico NP — Número de Unidades Defectuosas'}
                {result.tipo === 'c' && '📊 Gráfico C — Cantidad Total de Defectos'}
                {result.tipo === 'u' && '📊 Gráfico U — Tasa de Defectos por Unidad'}
              </div>
              <div className="chart-desc print-text-muted" style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 16 }}>
                Bandas estadísticas de control sigma ±3σ y Nelson Rules. LCS: {uclVal?.toFixed(4)} | LC: {lcVal?.toFixed(4)} | LCI: {lclVal?.toFixed(4)}
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={result.data} margin={{ top: 15, right: 80, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                  <XAxis 
                    dataKey="sg" 
                    stroke="var(--text-muted)" 
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }} 
                    label={{ value: 'Subgrupo (Orden Temporal)', position: 'insideBottom', offset: -5, fill: 'var(--text-muted)', fontSize: 11 }} 
                  />
                  <YAxis 
                    stroke="var(--text-muted)" 
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }} 
                    domain={domainAttr} 
                    allowDataOverflow={true} 
                  />
                  <Tooltip content={<CustomTooltip tipo={result.tipo} />} />
                  <ReferenceLine y={uclVal} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" />
                  <ReferenceLine y={lcVal} stroke="var(--green-primary)" strokeWidth={2} />
                  {lclVal > 0 && <ReferenceLine y={lclVal} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" />}
                  
                  <Line 
                    type="monotone" 
                    dataKey={
                      result.tipo === 'p' ? 'p' : 
                      result.tipo === 'np' ? 'np' : 
                      result.tipo === 'u' ? 'u' : 'c'
                    } 
                    stroke="var(--green-light)" 
                    strokeWidth={2.5}
                    dot={<CustomDot oocKey="ooc" normalColor="var(--green-light)" />}
                    name={
                      result.tipo === 'p' ? 'Proporción (p)' : 
                      result.tipo === 'np' ? 'Unidades Defectuosas (np)' : 
                      result.tipo === 'u' ? 'Defectos por Unidad (u)' : 'Defectos (c)'
                    } 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* Diagnóstico Nelson Rules */}
        {result && (() => {
          const oocPts = result.data.filter(d => d.ooc);
          const activeNelsonAlerts = result.nelsonDiagnostic.activeAlerts;
          const isControlled = result.nelsonDiagnostic.isControlled && oocPts.length === 0;
          const totalPts = result.data.length;
          const rate = result.tipo === 'p' ? (result.lcVal * 100).toFixed(2) : result.lcVal?.toFixed(2);
          let rateLabel = '';
          if (result.tipo === 'p') {
            rateLabel = `${rate}% unidades defectuosas`;
          } else if (result.tipo === 'np') {
            rateLabel = `${rate} unidades defectuosas promedio`;
          } else if (result.tipo === 'u') {
            rateLabel = `${result.lcVal?.toFixed(4)} defectos por unidad promedio`;
          } else {
            rateLabel = `${rate} defectos por lote`;
          }

          return (
            <div className={`card ${!printConfig.nelson ? 'no-print' : ''}`} style={{ 
              border: `1px solid ${isControlled ? 'var(--green-primary)' : 'rgba(239, 68, 68, 0.4)'}`, 
              borderLeft: `5px solid ${isControlled ? 'var(--green-primary)' : '#ef4444'}`, 
              borderRadius: '12px',
              marginTop: 16,
              padding: '20px'
            }}>
              
              <div className="section-title print-text-dark" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🛡️ Diagnóstico de Calidad y Estabilidad del Lote
                </span>
                <span className={`badge ${isControlled ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 11, padding: '4px 10px', borderRadius: '6px' }}>
                  {isControlled ? 'Proceso Estable' : 'Causas Especiales Activas'}
                </span>
              </div>

              {/* Caja de Estado */}
              <div style={{ 
                padding: '14px 16px', borderRadius: 8, marginBottom: 16,
                background: isControlled ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)',
                border: `1px solid ${isControlled ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}` 
              }}>
                <div className="print-text-dark" style={{ fontWeight: 700, fontSize: 14.5, color: isControlled ? 'var(--green-light)' : '#ef4444', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isControlled
                    ? 'Proceso agrícola operando bajo control estadístico'
                    : `Lote inestable fuera de control — ${activeNelsonAlerts.length} patrones detectados`}
                </div>
                
                <p className="print-text-muted" style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                  Gráfico <strong>{result.tipo.toUpperCase()}</strong> · {totalPts} muestras analizadas · Tasa central: {rateLabel}.<br />
                  {isControlled
                    ? 'El lote presenta exclusivamente fluctuaciones de variación natural (causas comunes). No hay patrones anormales y el comportamiento es predecible.'
                    : `Se han detectado indicios de causas especiales de variación. Se requiere evaluar cambios repentinos, desgaste de equipos o fallas en selección manual.`}
                </p>
              </div>

              {/* Alertas Nelson detalladas */}
              {activeNelsonAlerts.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div className="print-text-dark" style={{ fontSize: '12.5px', fontWeight: 700, color: '#f59e0b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={15} /> Patrones identificados (Nelson Rules):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                    {activeNelsonAlerts.map((alert) => (
                      <div key={alert.ruleId} className="print-card-border" style={{
                        background: 'rgba(245,158,11,0.03)',
                        border: '1px solid rgba(245,158,11,0.15)',
                        borderLeft: '4px solid #f59e0b',
                        borderRadius: 8,
                        padding: '12px 14px',
                      }}>
                        <div className="print-text-dark" style={{ fontWeight: 700, fontSize: 12.5, color: '#f59e0b' }}>
                          Regla {alert.ruleId}: {alert.name}
                        </div>
                        <div className="print-text-muted" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                          {alert.desc}
                        </div>
                        <div className="print-text-dark" style={{ fontSize: 11, marginTop: 8, fontWeight: 600 }}>
                          Subgrupos críticos: <span style={{ fontFamily: 'JetBrains Mono', color: '#f59e0b', background: 'rgba(255,255,255,0.04)', padding: '1px 5px', borderRadius: 4 }}>{alert.subgrupos.join(', ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Puntos OOC */}
              {oocPts.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div className="print-text-dark" style={{ fontSize: '12.5px', fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>Puntos con desviación superior a 3σ (Límites):</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {oocPts.map((d, i) => (
                      <div key={i} className="print-card-border" style={{ fontSize: '11.5px', color: 'var(--text-muted)', background: 'rgba(239,68,68,0.03)', padding: '6px 12px', borderRadius: 6, borderLeft: '3px solid #ef4444' }}>
                        <strong style={{ color: '#ef4444' }}>Subgrupo {d.sg}:</strong>{' '}
                        {result.tipo === 'p' && `Medido = ${(d.p * 100).toFixed(2)}% vs LCS (${(d.ucl * 100).toFixed(2)}%)`}
                        {result.tipo === 'np' && `Defectuosos = ${d.np} vs LCS (${d.ucl.toFixed(2)})`}
                        {result.tipo === 'u' && `Defectos/Unidad = ${d.u?.toFixed(4)} vs LCS (${d.ucl.toFixed(4)})`}
                        {result.tipo === 'c' && `Defectos = ${d.c} vs LCS (${d.ucl.toFixed(2)})`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sugerencias Agrónomas */}
              <div>
                <div className="print-text-dark" style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--green-light)', marginBottom: 6 }}>Acción Recomendada:</div>
                <ul className="print-text-muted" style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: '12.5px', lineHeight: 1.8 }}>
                  {isControlled ? (
                    <>
                      <li>El lote demuestra un estándar estable y predecible. Puede autorizar su empaque o distribución.</li>
                      <li>Utilice el <strong>Diagrama de Pareto</strong> de AgroMetric para priorizar el análisis de las causas de defectos más frecuentes detectadas en los controles manuales.</li>
                    </>
                  ) : (
                    <>
                      <li><strong style={{ color: '#ef4444' }}>Contención Inmediata:</strong> Examine los subgrupos marcados fuera de control. Evite la liberación de lotes si la tasa de defectos supera la especificación tolerada del cliente.</li>
                      <li>Inicie un <strong>Diagrama de Ishikawa</strong> con el equipo técnico para evaluar causas: ¿Hubo calibración defectuosa en separadores ópticos, plagas activas en el cuartel o fatiga en operarios de selección manual?</li>
                    </>
                  )}
                </ul>
              </div>

            </div>
          );
        })()}

        {/* Tabla tabular completa */}
        {result && (
          <div className={`card ${!printConfig.table ? 'no-print' : ''}`} style={{ marginTop: 16, border: '1px solid var(--border)', borderRadius: '12px' }}>
            <div className="section-title print-text-dark" style={{ marginBottom: 12, fontSize: '14.5px', fontWeight: 700 }}>🔍 Detalle Tabular del Control Estadístico</div>
            
            <div className="table-container" style={{ overflowX: 'auto', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Subgrupo</th>
                    {result.tipo === 'p' && (
                      <>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>n</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>np</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Proporción (p)</th>
                      </>
                    )}
                    {result.tipo === 'np' && (
                      <>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>n</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>np</th>
                      </>
                    )}
                    {result.tipo === 'u' && (
                      <>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>n</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>c (Defectos)</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Defectos/Unidad (u)</th>
                      </>
                    )}
                    {result.tipo === 'c' && (
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Defectos (c)</th>
                    )}
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>LCS</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>LC</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>LCI</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Estado</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Reglas Nelson</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((d, i) => {
                    const hasNelson = d.rulesViolated && d.rulesViolated.length > 0;
                    return (
                      <tr 
                        key={i} 
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: d.ooc || hasNelson ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                          borderLeft: d.ooc || hasNelson ? '3px solid #ef4444' : '3px solid transparent'
                        }}
                      >
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>{d.sg}</td>
                        {result.tipo === 'p' && (
                          <>
                            <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'JetBrains Mono' }}>{d.n}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'JetBrains Mono' }}>{d.np}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{d.p?.toFixed(4)}</td>
                          </>
                        )}
                        {result.tipo === 'np' && (
                          <>
                            <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'JetBrains Mono' }}>{d.n}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{d.np}</td>
                          </>
                        )}
                        {result.tipo === 'u' && (
                          <>
                            <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'JetBrains Mono' }}>{d.n}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'JetBrains Mono' }}>{d.c}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{d.u?.toFixed(4)}</td>
                          </>
                        )}
                        {result.tipo === 'c' && (
                          <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{d.c}</td>
                        )}
                        
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'JetBrains Mono', color: '#ef4444' }}>{d.ucl?.toFixed(4)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'JetBrains Mono', color: 'var(--green-primary)' }}>
                          {(() => {
                            if (result.tipo === 'p') return d.pbar?.toFixed(4);
                            if (result.tipo === 'np') return d.npbar?.toFixed(4);
                            if (result.tipo === 'u') return d.ubar?.toFixed(4);
                            return d.cbar?.toFixed(4);
                          })()}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'JetBrains Mono', color: '#ef4444' }}>{d.lcl?.toFixed(4)}</td>
                        
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span className={`badge ${d.ooc ? 'badge-red' : 'badge-green'}`} style={{ fontSize: '10px' }}>
                            {d.ooc ? 'F. CONTROL' : 'ESTABLE'}
                          </span>
                        </td>
                        
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          {hasNelson ? (
                            <span className="badge badge-yellow" style={{ fontSize: '10px', fontWeight: 700 }}>
                              Reglas: {d.rulesViolated.join(', ')}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>—</span>
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

      {/* MODAL CONFIGURACIÓN IMPRESIÓN */}
      {isReportModalOpen && (
        <div className="modal-overlay no-print" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: 20, backdropFilter: 'blur(3px)'
        }}>
          <div className="card modal-content" style={{
            width: '100%', maxWidth: '500px',
            border: '1px solid var(--border)', background: 'var(--bg-card)',
            padding: '24px', borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={18} style={{ color: 'var(--green-light)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--green-light)', margin: 0 }}>
                  Personalizar Reporte PDF
                </h3>
              </div>
              <button className="btn btn-secondary" style={{ padding: '6px', borderRadius: '50%', minWidth: 'auto' }} onClick={() => setIsReportModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
              Seleccione los elementos que formarán parte del diagnóstico imprimible del control de atributos.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                { key: 'info', title: 'Metadatos y Resumen General', desc: 'Ficha técnica del lote, inspector, tasa central y límites calculados.' },
                { key: 'chart', title: 'Gráfica Interactiva de Control', desc: 'Visualización de la tendencia temporal de defectos con límites sigma.' },
                { key: 'nelson', title: 'Diagnóstico Nelson Rules y Consejos', desc: 'Alertas de inestabilidad activa y sugerencias de acciones correctivas.' },
                { key: 'table', title: 'Matriz Tabular Completa', desc: 'Tabulación detallada de todos los subgrupos e infracciones.' }
              ].map(opt => (
                <label key={opt.key} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px',
                  background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border)',
                  borderRadius: 8, cursor: 'pointer'
                }}>
                  <input 
                    type="checkbox" 
                    checked={printConfig[opt.key]} 
                    onChange={e => setPrintConfig(c => ({ ...c, [opt.key]: e.target.checked }))} 
                    style={{ marginTop: 3, accentColor: 'var(--green-primary)' }}
                  />
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>{opt.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <button className="btn btn-secondary" onClick={() => setIsReportModalOpen(false)}>
                Cancelar
              </button>
              
              <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Printer size={15} /> Confirmar e Imprimir / PDF
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
      `}</style>
    </>
  );
}
