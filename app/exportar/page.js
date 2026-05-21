'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { aguacatePeso, aloeAltura, calcXbarR, calcP, calcCapability, manzanillaP, tomateDefectos } from '../../lib/data';
import { 
  FolderOpen, 
  CheckCircle, 
  Activity, 
  TrendingUp, 
  Sparkles, 
  Clipboard, 
  ArrowRight,
  CheckCircle2,
  Trash2
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
    notas: typeof r.notas === 'string' ? r.notas.trim() : '',
    isAtributo,
    tipoGrafico,
    isDemo: !!r.isDemo
  };
}

// Carga segura de registros
function getSafeRecords() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(safeSanitize)
      .filter(Boolean)
      .filter(r => !r.isDemo && !r.id.startsWith('demo_')); // Filtrar siempre demos de presets antiguos
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

function downloadCSV(data, filename) {
  const csv = data.map(row => row.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
}

export default function ExportarPage() {
  const router = useRouter();
  const [tab, setTab] = useState('exportar');
  const [importFile, setImportFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [parseError, setParseError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  // Formulario y Estados de Mapeo Estadístico
  const [dataType, setDataType] = useState('variable'); // 'variable' o 'atributo'
  const [chartType, setChartType] = useState('p'); // 'p', 'np', 'c', 'u'
  const [form, setForm] = useState({
    producto: '',
    variableName: '',
    unidad: '',
    analista: '',
    lse: '',
    lie: '',
  });

  // Mapeo dinámico de columnas del CSV
  const [variableCols, setVariableCols] = useState([]); // Columnas para variables
  const [colN, setColN] = useState(''); // Tamaño de subgrupo (Atributos)
  const [colNp, setColNp] = useState(''); // Defectuosos / Defectos (Atributos)

  // Éxito de importación
  const [importedRecord, setImportedRecord] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Auto-detección de columnas y nombres al cargar parsedData
  useEffect(() => {
    if (parsedData && parsedData.headers.length > 0) {
      const hs = parsedData.headers;
      
      // Auto-completar nombre de producto por nombre de archivo
      const fileName = importFile ? importFile.name.replace(/\.[^/.]+$/, "") : '';
      setForm(f => ({
        ...f,
        producto: fileName,
        variableName: dataType === 'atributo' ? 'Defectos' : 'Medida',
        analista: 'Importador AgroMetric'
      }));

      // Autodetectar columna N para atributos
      const autoN = hs.find(h => {
        const l = h.toLowerCase();
        return l.includes('n_') || l === 'n' || l.includes('tam') || l.includes('size') || l.includes('inspec') || l.includes('total') || l.includes('muestra');
      }) || hs[0] || '';

      // Autodetectar columna de defectuosos/defectos
      const autoNp = hs.find(h => {
        const l = h.toLowerCase();
        return l.includes('np') || l === 'c' || l === 'u' || l.includes('defect') || l.includes('fail') || l.includes('mal') || l.includes('fall');
      }) || hs[1] || hs[0] || '';

      setColN(autoN);
      setColNp(autoNp);

      // Autodetectar columnas de variables (todas las numéricas que no sean subgrupo o fecha)
      const filtered = hs.filter(h => {
        const l = h.toLowerCase();
        return !l.includes('subgrupo') && !l.includes('fecha') && !l.includes('id') && !l.includes('analista') && !l.includes('producto');
      });
      setVariableCols(filtered);
    }
  }, [parsedData, dataType]);

  const handleExport = (tipo) => {
    if (tipo === 'aguacate_xbarr') {
      const r = calcXbarR(aguacatePeso.subgrupos);
      const rows = [
        ['AgroMetric Precision — Gráfico X̄-R: Aguacate Hass (Peso g)'],
        ['Subgrupo', 'X̄', 'R', 'LCS(X̄)', 'LC(X̄)', 'LCI(X̄)', 'LCS(R)', 'LC(R)', 'LCI(R)', 'Estado X̄', 'Estado R'],
        ...r.stats.map((s, i) => [
          i + 1, s.mean.toFixed(3), s.range.toFixed(3),
          r.UCL_X.toFixed(3), r.Xbarbar.toFixed(3), r.LCL_X.toFixed(3),
          r.UCL_R.toFixed(3), r.Rbar.toFixed(3), r.LCL_R.toFixed(3),
          s.mean > r.UCL_X || s.mean < r.LCL_X ? 'OOC' : 'OK',
          s.range > r.UCL_R || s.range < r.LCL_R ? 'OOC' : 'OK',
        ]),
      ];
      downloadCSV(rows, 'agrometric_aguacate_xbarr.csv');
    } else if (tipo === 'manzanilla_p') {
      const data = calcP(manzanillaP.subgrupos);
      const rows = [
        ['AgroMetric Precision — Gráfico P: Manzanilla Alemana'],
        ['Subgrupo', 'n', 'np', 'p', 'LCS', 'LC', 'LCI', 'Estado'],
        ...data.map(d => [d.sg, d.n, d.np, d.p.toFixed(4), d.ucl.toFixed(4), d.pbar.toFixed(4), d.lcl.toFixed(4), d.ooc ? 'OOC' : 'OK']),
      ];
      downloadCSV(rows, 'agrometric_manzanilla_p.csv');
    } else if (tipo === 'capacidad') {
      const r = calcCapability(aguacatePeso.subgrupos, aguacatePeso.lse, aguacatePeso.lie);
      const rows = [
        ['AgroMetric Precision — Capacidad del Proceso: Aguacate Hass'],
        ['Parámetro', 'Valor'],
        ['Media (X̄)', r.mean.toFixed(4)], ['Desv. Estándar (σ)', r.sigma.toFixed(4)],
        ['LSE', r.lse], ['LIE', r.lie],
        ['Cp', r.Cp.toFixed(4)], ['Cpk', r.Cpk.toFixed(4)],
        ['Cpu', r.Cpu.toFixed(4)], ['Cpl', r.Cpl.toFixed(4)],
        ['Pp', r.Pp.toFixed(4)], ['Ppk', r.Ppk.toFixed(4)],
      ];
      downloadCSV(rows, 'agrometric_capacidad.csv');
    } else if (tipo === 'datos_raw') {
      const rows = [
        ['AgroMetric Precision — Datos Brutos: Aguacate Hass (Peso g)'],
        ['Subgrupo', ...Array.from({ length: 5 }, (_, i) => `X${i + 1}`), 'Media', 'Rango'],
        ...aguacatePeso.subgrupos.map((sg, i) => {
          const m = sg.reduce((a, b) => a + b, 0) / sg.length;
          const r = Math.max(...sg) - Math.min(...sg);
          return [i + 1, ...sg, m.toFixed(2), r.toFixed(2)];
        }),
      ];
      downloadCSV(rows, 'agrometric_datos_aguacate.csv');
    }
  };

  const parseCSV = (text) => {
    try {
      const lines = text.trim().split('\n').map(l => l.split(/[,;\t]/));
      const headers = lines[0].map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(l => {
        const obj = {};
        l.forEach((v, i) => { obj[headers[i]] = v?.trim().replace(/"/g, ''); });
        return obj;
      }).filter(r => Object.values(r).some(v => v));
      setParsedData({ headers, rows }); 
      setParseError('');
      setShowSuccess(false);
      setImportedRecord(null);
    } catch (e) {
      setParseError('Error al parsear el archivo. Verifique el formato.');
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = e => parseCSV(e.target.result);
    reader.readAsText(file, 'UTF-8');
  };

  // Mapeador robusto de filas CSV a subgrupos estadísticos
  const mapCsvToSubgrupos = () => {
    if (!parsedData || !parsedData.rows.length) return [];

    if (dataType === 'variable') {
      const cols = variableCols.length > 0 
        ? variableCols 
        : parsedData.headers.filter(h => {
            const lower = h.toLowerCase();
            return !lower.includes('subgrupo') && !lower.includes('fecha') && !lower.includes('id') && !lower.includes('analista') && !lower.includes('producto');
          });

      if (cols.length === 0) {
        throw new Error('Debe seleccionar al menos una columna de observaciones.');
      }

      return parsedData.rows.map(row => {
        return cols.map(c => {
          const val = parseFloat(row[c]);
          return isNaN(val) ? 0 : val;
        });
      });
    } else {
      const keyN = colN || parsedData.headers[0];
      const keyNp = colNp || parsedData.headers[1] || parsedData.headers[0];

      return parsedData.rows.map(row => {
        const nVal = Math.max(1, parseInt(row[keyN]) || 100);
        const npOrCVal = Math.max(0, parseInt(row[keyNp]) || 0);

        if (chartType === 'p' || chartType === 'np') {
          return { n: nVal, np: npOrCVal };
        } else if (chartType === 'u') {
          return { n: nVal, c: npOrCVal };
        } else { // 'c'
          return { c: npOrCVal };
        }
      });
    }
  };

  const handleSaveImport = () => {
    try {
      const subgrupos = mapCsvToSubgrupos();
      if (subgrupos.length < 2) {
        alert('Se requieren al menos 2 subgrupos para un correcto análisis estadístico.');
        return;
      }

      const lseStr = form.lse && form.lse.trim() !== '' ? form.lse.trim() : '-';
      const lieStr = form.lie && form.lie.trim() !== '' ? form.lie.trim() : '-';

      const isAtrib = dataType === 'atributo';
      const product = form.producto.trim() || 'Muestra Importada';
      const variableName = form.variableName.trim() || (isAtrib ? 'Defectos' : 'Medida');
      const unit = form.unidad.trim() || '';

      const newRecord = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        producto: product,
        tipo: isAtrib ? 'Procesados / Empacados' : 'Fruta',
        variableName: variableName,
        unidad: unit,
        variable: unit ? `${variableName} (${unit})` : variableName,
        analista: form.analista.trim() || 'Importador AgroMetric',
        fecha: new Date().toISOString().split('T')[0],
        lse: lseStr,
        lie: lieStr,
        estado: 'Analizado',
        subgruposData: subgrupos,
        notas: `Muestra importada desde el archivo "${importFile?.name}" de forma segura.`,
        isAtributo: isAtrib,
        tipoGrafico: isAtrib ? chartType : 'p',
        isDemo: false
      };

      const sanitized = safeSanitize(newRecord);
      if (!sanitized) throw new Error('No se pudo sanitizar el registro importado.');

      const current = getSafeRecords();
      const updated = [...current, sanitized];
      saveSafeRecords(updated);

      setImportedRecord(sanitized);
      setShowSuccess(true);
    } catch (err) {
      alert(`Error al procesar e guardar la muestra: ${err.message}`);
    }
  };

  // Navegación con Selección Cruzada
  const handleNavigate = (path) => {
    if (importedRecord) {
      localStorage.setItem('agrometric_selected_id', importedRecord.id);
    }
    router.push(path);
  };

  return (
    <>
      <div className="header">
        <div>
          <div className="header-title">Exportar / Importar Datos</div>
          <div className="header-subtitle">Descargar resultados en CSV · Importar datos desde archivo</div>
        </div>
      </div>
      <div className="page-content fade-in">
        <div className="tabs">
          {[['exportar', 'Exportar'], ['importar', 'Importar Archivo']].map(([k, l]) => (
            <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {tab === 'exportar' && (
          <div className="grid-2">
            {[
              { key: 'aguacate_xbarr', title: 'Gráfico X̄-R — Aguacate', desc: 'Tabla completa con límites de control y estados OOC' },
              { key: 'manzanilla_p', title: 'Gráfico P — Manzanilla', desc: 'Proporción de defectuosos por subgrupo' },
              { key: 'capacidad', title: 'Capacidad — Aguacate', desc: 'Cp, Cpk, Pp, Ppk y parámetros del proceso' },
              { key: 'datos_raw', title: 'Datos Brutos — Aguacate', desc: 'Todas las observaciones con media y rango por subgrupo' },
            ].map(exp => (
              <div key={exp.key} className="card">
                <div className="card-title" style={{ marginBottom: 6 }}>{exp.title}</div>
                <div className="card-subtitle" style={{ marginBottom: 16 }}>{exp.desc}</div>
                <button className="btn btn-primary btn-sm" onClick={() => handleExport(exp.key)}>
                  Descargar CSV
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'importar' && (
          <>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="section-title" style={{ marginBottom: 8 }}>Importar Datos desde CSV / Excel (guardado como CSV)</div>
              <div className="section-subtitle" style={{ marginBottom: 16 }}>
                El archivo debe tener encabezados en la primera fila. Formatos: .csv, .txt separado por comas o punto y coma
              </div>

              <div
                className={`upload-area ${dragging ? 'dragging' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              >
                <div className="upload-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                  <FolderOpen size={36} strokeWidth={1.5} style={{ color: 'var(--green-primary)' }} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                  {importFile ? importFile.name : 'Arrastra tu archivo aquí'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {importFile ? `${(importFile.size / 1024).toFixed(1)} KB` : 'o haz clic para seleccionar · CSV, TXT'}
                </div>
                <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }}
                  onChange={e => handleFile(e.target.files[0])} />
              </div>

              {parseError && (
                <div className="interpretation danger" style={{ marginTop: 12 }}>{parseError}</div>
              )}
            </div>

            {/* Modal de Éxito Multianálisis */}
            {showSuccess && importedRecord && (
              <div className="card fade-in" style={{
                marginBottom: 16,
                border: '1px solid var(--green-primary)',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(4, 120, 87, 0.02) 100%)',
                padding: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <CheckCircle2 size={32} style={{ color: 'var(--green-light)' }} />
                  <div>
                    <h3 className="section-title" style={{ margin: 0, color: '#ffffff', fontSize: '18px', fontWeight: 800 }}>
                      ¡Muestra importada con éxito!
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      El conjunto de datos ha sido sanitizado y guardado en memoria. ¿Qué deseas analizar ahora?
                    </p>
                  </div>
                </div>

                <div className="grid-2" style={{ gap: 12 }}>
                  {/* Gráficos de Control */}
                  <button 
                    onClick={() => handleNavigate(importedRecord.isAtributo ? '/atributos' : '/variables')}
                    className="card interactive-analysis-card"
                    style={{
                      textAlign: 'left', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', transition: 'all 0.2s', padding: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Activity size={20} style={{ color: 'var(--green-light)' }} />
                      <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#ffffff', marginBottom: 4 }}>Gráficos de Control</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      Analiza estabilidad con cartas {importedRecord.isAtributo ? 'P, NP, C o U' : 'X̄-R / X̄-S'} y reglas Nelson de inmediato.
                    </div>
                  </button>

                  {/* Capacidad del Proceso (Solo variables) */}
                  {!importedRecord.isAtributo && (
                    <button 
                      onClick={() => handleNavigate('/capacidad')}
                      className="card interactive-analysis-card"
                      style={{
                        textAlign: 'left', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', transition: 'all 0.2s', padding: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <TrendingUp size={20} style={{ color: 'var(--green-light)' }} />
                        <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#ffffff', marginBottom: 4 }}>Índices de Capacidad</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        Calcula Cp, Cpk, Pp, Ppk y PPM estimados basados en los límites LIE/LSE.
                      </div>
                    </button>
                  )}

                  {/* Pruebas de Normalidad (Solo variables) */}
                  {!importedRecord.isAtributo && (
                    <button 
                      onClick={() => handleNavigate('/normalidad')}
                      className="card interactive-analysis-card"
                      style={{
                        textAlign: 'left', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', transition: 'all 0.2s', padding: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Sparkles size={20} style={{ color: 'var(--green-light)' }} />
                        <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#ffffff', marginBottom: 4 }}>Pruebas de Normalidad</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        Evalúa la distribución con Anderson-Darling, histogramas y Box-Cox.
                      </div>
                    </button>
                  )}

                  {/* Ver Muestra */}
                  <button 
                    onClick={() => handleNavigate('/muestras')}
                    className="card interactive-analysis-card"
                    style={{
                      textAlign: 'left', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', transition: 'all 0.2s', padding: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Clipboard size={20} style={{ color: 'var(--green-light)' }} />
                      <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#ffffff', marginBottom: 4 }}>Registro de Muestras</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      Edita valores numéricos en la cuadrícula o agrega notas e inspectores.
                    </div>
                  </button>
                </div>
              </div>
            )}

            {parsedData && !showSuccess && (
              <>
                <div className="card">
                   <div className="section-header">
                    <div>
                      <div className="section-title">Vista Previa — {parsedData.rows.length} filas, {parsedData.headers.length} columnas</div>
                      <div className="section-subtitle">Primeras 10 filas del archivo importado</div>
                    </div>
                    <div className="interpretation good" style={{ padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={14} /> Archivo cargado
                    </div>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead><tr>{parsedData.headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
                      <tbody>
                        {parsedData.rows.slice(0, 10).map((row, i) => (
                          <tr key={i}>
                            {parsedData.headers.map((h, j) => <td key={j} className="td-num">{row[h]}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedData.rows.length > 10 && (
                    <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                      ... y {parsedData.rows.length - 10} filas más
                    </div>
                  )}
                </div>

                {/* Formulario y Mapeador Premium */}
                <div className="card" style={{ marginTop: 16 }}>
                  <h3 className="section-title" style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                     Configuración y Mapeo Estadístico de la Muestra
                  </h3>
                  
                  <div className="grid-2" style={{ gap: '16px 20px', marginBottom: '24px' }}>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label" style={{ fontWeight: 600 }}>Tipo de Control Estadístico *</label>
                      <select 
                        className="form-select" 
                        value={dataType}
                        onChange={e => setDataType(e.target.value)}
                        style={{ padding: '10px' }}
                      >
                        <option value="variable">Variables Continuas (Mediciones individuales de peso, tamaño, etc.)</option>
                        <option value="atributo">Atributos (Recuentos de golpes, plagas, defectuosos, etc.)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Producto Evaluado *</label>
                      <input 
                        className="form-input" 
                        value={form.producto} 
                        onChange={e => setForm(f => ({ ...f, producto: e.target.value }))} 
                        placeholder="Ej: Aguacate Hass, Arándano Biloxi..."
                        style={{ padding: '9px 12px' }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Inspector / Analista</label>
                      <input 
                        className="form-input" 
                        value={form.analista} 
                        onChange={e => setForm(f => ({ ...f, analista: e.target.value }))} 
                        placeholder="Ingrese analista"
                        style={{ padding: '9px 12px' }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Variable o Atributo *</label>
                      <input 
                        className="form-input" 
                        value={form.variableName} 
                        onChange={e => setForm(f => ({ ...f, variableName: e.target.value }))} 
                        placeholder={dataType === 'atributo' ? "Ej: Golpes en Tránsito, Pudrición..." : "Ej: Peso, Diámetro..."}
                        style={{ padding: '9px 12px' }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Unidad de Medida</label>
                      <input 
                        className="form-input" 
                        value={form.unidad} 
                        onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))} 
                        placeholder={dataType === 'atributo' ? "Ej: defectuosos/subgrupo" : "Ej: g, mm, °Brix..."}
                        style={{ padding: '9px 12px' }}
                      />
                    </div>

                    {/* Controles de Variables */}
                    {dataType === 'variable' && (
                      <>
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 600 }}>Límite Inferior de Especificación (LIE)</label>
                          <input 
                            type="number" step="any"
                            className="form-input" 
                            value={form.lie} 
                            onChange={e => setForm(f => ({ ...f, lie: e.target.value }))} 
                            placeholder="Ej: 150"
                            style={{ padding: '9px 12px' }}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 600 }}>Límite Superior de Especificación (LSE)</label>
                          <input 
                            type="number" step="any"
                            className="form-input" 
                            value={form.lse} 
                            onChange={e => setForm(f => ({ ...f, lse: e.target.value }))} 
                            placeholder="Ej: 250"
                            style={{ padding: '9px 12px' }}
                          />
                        </div>

                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label" style={{ fontWeight: 600, marginBottom: 8 }}>
                            Columnas a utilizar como Observaciones del Subgrupo (Fila) *
                          </label>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                            {parsedData.headers.map((h) => (
                              <label key={h} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', cursor: 'pointer' }}>
                                <input 
                                  type="checkbox"
                                  checked={variableCols.includes(h)}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setVariableCols([...variableCols, h]);
                                    } else {
                                      setVariableCols(variableCols.filter(col => col !== h));
                                    }
                                  }}
                                />
                                <span style={{ fontFamily: 'JetBrains Mono' }}>{h}</span>
                              </label>
                            ))}
                          </div>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 4, display: 'inline-block' }}>
                            Por defecto, se omiten columnas que contienen subgrupo, fecha, producto, analista o id.
                          </span>
                        </div>
                      </>
                    )}

                    {/* Controles de Atributos */}
                    {dataType === 'atributo' && (
                      <>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label" style={{ fontWeight: 600 }}>Carta de Control de Atributos Específica *</label>
                          <select 
                            className="form-select" 
                            value={chartType}
                            onChange={e => setChartType(e.target.value)}
                            style={{ padding: '10px' }}
                          >
                            <option value="p">Carta P — Proporción de Defectuosos (Tamaño de muestra n variable)</option>
                            <option value="np">Carta NP — Número de Defectuosos (Tamaño de muestra n constante)</option>
                            <option value="c">Carta C — Recuento total de defectos por subgrupo (Tamaño n constante)</option>
                            <option value="u">Carta U — Tasa de defectos por unidad (Tamaño n variable)</option>
                          </select>
                        </div>

                        {(chartType === 'p' || chartType === 'np' || chartType === 'u') && (
                          <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 600 }}>Columna de Tamaño de Subgrupo (n) *</label>
                            <select 
                              className="form-select"
                              value={colN}
                              onChange={e => setColN(e.target.value)}
                              style={{ padding: '9px 12px' }}
                            >
                              {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </div>
                        )}

                        <div className="form-group" style={{ gridColumn: chartType === 'c' ? '1 / -1' : undefined }}>
                          <label className="form-label" style={{ fontWeight: 600 }}>
                            Columna de Conteo de {chartType === 'p' || chartType === 'np' ? 'Unidades Defectuosas (np)' : 'Defectos Totales (c)'} *
                          </label>
                          <select 
                            className="form-select"
                            value={colNp}
                            onChange={e => setColNp(e.target.value)}
                            style={{ padding: '9px 12px' }}
                          >
                            {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                      </>
                    )}

                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-primary" onClick={handleSaveImport}>
                       Guardar Muestra y Analizar
                    </button>
                    <button className="btn btn-secondary" onClick={() => { setParsedData(null); setImportFile(null); }}>
                      Limpiar
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="card" style={{ marginTop: 16 }}>
              <div className="section-title" style={{ marginBottom: 8 }}>Plantillas de Importación</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                Descarga una plantilla CSV con el formato correcto para llenar tus datos
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={() => {
                  downloadCSV([
                    ['Subgrupo', 'X1', 'X2', 'X3', 'X4', 'X5'],
                    ['1', '210', '212', '208', '215', '211'],
                    ['2', '213', '209', '211', '214', '207'],
                    ['3', '209', '215', '210', '212', '216'],
                    ['4', '212', '211', '207', '213', '214'],
                    ['5', '214', '210', '215', '209', '212'],
                  ], 'plantilla_variables.csv');
                }}>Plantilla Variables (X̄-R)</button>
                <button className="btn btn-secondary" onClick={() => {
                  downloadCSV([
                    ['Subgrupo', 'n_inspeccionados', 'n_defectuosos'],
                    ['1', '100', '4'],
                    ['2', '100', '3'],
                    ['3', '100', '5'],
                    ['4', '100', '2'],
                    ['5', '100', '6'],
                  ], 'plantilla_atributos_p.csv');
                }}>Plantilla Atributos (P)</button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
