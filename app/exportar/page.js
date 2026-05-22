'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { calcXbarR, calcXbarS, calcCapability } from '../../lib/data';
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
  const lseNum = lse !== '-' ? parseFloat(lse.replace(',', '.')) : null;
  const lieNum = lie !== '-' ? parseFloat(lie.replace(',', '.')) : null;
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
      .filter(r => !r.isDemo && !r.id.startsWith('demo_') && !r.id.startsWith('seeded_')); // Filtrar siempre demos de presets antiguos y datos sembrados
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
  // Para que Excel lo abra directamente como tabla, añadimos 'sep=;' como primera línea
  // e intercambiamos las comas por punto y coma como delimitador estándar para Excel.
  // Además usamos \r\n para saltos de línea correctos en Windows.
  const csvContent = 'sep=;\r\n' + data.map(row => row.map(cell => {
    const cellStr = String(cell);
    // Si la celda contiene punto y coma, saltos de línea o comillas, la escapamos con comillas dobles
    if (cellStr.includes(';') || cellStr.includes('\n') || cellStr.includes('\r') || cellStr.includes('"')) {
      return `"${cellStr.replace(/"/g, '""')}"`;
    }
    return cellStr;
  }).join(';')).join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
}

function computeAttributeLimits(subgrupos, tipoGrafico) {
  if (!subgrupos || subgrupos.length === 0) return [];
  
  if (tipoGrafico === 'p') {
    const totalN = subgrupos.reduce((sum, s) => sum + (parseInt(s.n) || 100), 0);
    const totalNP = subgrupos.reduce((sum, s) => sum + (parseInt(s.np) || 0), 0);
    const pbar = totalN > 0 ? totalNP / totalN : 0;
    
    return subgrupos.map((s, i) => {
      const n = Math.max(1, parseInt(s.n) || 100);
      const np = Math.max(0, parseInt(s.np) || 0);
      const p = np / n;
      const stdDev = Math.sqrt((pbar * (1 - pbar)) / n);
      const ucl = pbar + 3 * stdDev;
      const lcl = Math.max(0, pbar - 3 * stdDev);
      return { sg: i + 1, val: p, n, count: np, ucl, lc: pbar, lcl, ooc: p > ucl || p < lcl };
    });
  } else if (tipoGrafico === 'np') {
    const totalN = subgrupos.reduce((sum, s) => sum + (parseInt(s.n) || 100), 0);
    const totalNP = subgrupos.reduce((sum, s) => sum + (parseInt(s.np) || 0), 0);
    const pbar = totalN > 0 ? totalNP / totalN : 0;
    
    return subgrupos.map((s, i) => {
      const n = Math.max(1, parseInt(s.n) || 100);
      const np = Math.max(0, parseInt(s.np) || 0);
      const stdDev = Math.sqrt(n * pbar * (1 - pbar));
      const centerLine = n * pbar;
      const ucl = centerLine + 3 * stdDev;
      const lcl = Math.max(0, centerLine - 3 * stdDev);
      return { sg: i + 1, val: np, n, count: np, ucl, lc: centerLine, lcl, ooc: np > ucl || np < lcl };
    });
  } else if (tipoGrafico === 'u') {
    const totalN = subgrupos.reduce((sum, s) => sum + (parseInt(s.n) || 100), 0);
    const totalC = subgrupos.reduce((sum, s) => sum + (parseInt(s.c) || 0), 0);
    const ubar = totalN > 0 ? totalC / totalN : 0;
    
    return subgrupos.map((s, i) => {
      const n = Math.max(1, parseInt(s.n) || 100);
      const c = Math.max(0, parseInt(s.c) || 0);
      const u = c / n;
      const stdDev = Math.sqrt(ubar / n);
      const ucl = ubar + 3 * stdDev;
      const lcl = Math.max(0, ubar - 3 * stdDev);
      return { sg: i + 1, val: u, n, count: c, ucl, lc: ubar, lcl, ooc: u > ucl || u < lcl };
    });
  } else { // 'c'
    const k = subgrupos.length;
    const totalC = subgrupos.reduce((sum, s) => sum + (parseInt(s.c) || 0), 0);
    const cbar = k > 0 ? totalC / k : 0;
    const stdDev = Math.sqrt(cbar);
    const ucl = cbar + 3 * stdDev;
    const lcl = Math.max(0, cbar - 3 * stdDev);
    
    return subgrupos.map((s, i) => {
      const c = Math.max(0, parseInt(s.c) || 0);
      return { sg: i + 1, val: c, n: '-', count: c, ucl, lc: cbar, lcl, ooc: c > ucl || c < lcl };
    });
  }
}

export default function ExportarPage() {
  const router = useRouter();
  const [tab, setTab] = useState('exportar');
  const [importFile, setImportFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [parseError, setParseError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const [records, setRecords] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRecords(getSafeRecords());
  }, []);

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

  const handleExportDataRaw = (rec) => {
    let rows = [];
    const safeProduct = rec.producto.replace(/[\s,]+/g, '_').toLowerCase();
    
    if (rec.isAtributo) {
      if (rec.tipoGrafico === 'p' || rec.tipoGrafico === 'np') {
        rows = [
          [`AgroMetric Precision — Datos Brutos: ${rec.producto} (${rec.variable})`],
          ['Subgrupo', 'Tamaño de Subgrupo (n)', 'Unidades Defectuosas (np)'],
          ...rec.subgruposData.map((row, i) => [
            i + 1,
            row.n,
            row.np
          ])
        ];
      } else if (rec.tipoGrafico === 'u') {
        rows = [
          [`AgroMetric Precision — Datos Brutos: ${rec.producto} (${rec.variable})`],
          ['Subgrupo', 'Tamaño de Subgrupo (n)', 'Conteo de Defectos (c)'],
          ...rec.subgruposData.map((row, i) => [
            i + 1,
            row.n,
            row.c
          ])
        ];
      } else { // 'c'
        rows = [
          [`AgroMetric Precision — Datos Brutos: ${rec.producto} (${rec.variable})`],
          ['Subgrupo', 'Conteo de Defectos (c)'],
          ...rec.subgruposData.map((row, i) => [
            i + 1,
            row.c
          ])
        ];
      }
      downloadCSV(rows, `datos_brutos_${safeProduct}_${rec.tipoGrafico}.csv`);
    } else {
      const maxObs = rec.subgruposData[0]?.length || 0;
      const obsHeaders = Array.from({ length: maxObs }, (_, idx) => `X${idx + 1}`);
      rows = [
        [`AgroMetric Precision — Datos Brutos: ${rec.producto} (${rec.variable})`],
        ['Subgrupo', ...obsHeaders, 'Promedio (Xbar)', 'Rango (R)', 'Desviación Estándar (s)'],
        ...rec.subgruposData.map((row, i) => {
          const mean = row.reduce((a, b) => a + b, 0) / row.length;
          const max = Math.max(...row);
          const min = Math.min(...row);
          const range = max - min;
          const variance = row.reduce((a, b) => a + (b - mean) ** 2, 0) / (row.length - 1 || 1);
          const sd = Math.sqrt(variance);
          return [
            i + 1,
            ...row,
            mean.toFixed(4),
            range.toFixed(4),
            sd.toFixed(4)
          ];
        })
      ];
      downloadCSV(rows, `datos_brutos_${safeProduct}.csv`);
    }
  };

  const handleExportVariableXbarR = (rec) => {
    try {
      const r = calcXbarR(rec.subgruposData);
      const safeProduct = rec.producto.replace(/[\s,]+/g, '_').toLowerCase();
      const rows = [
        [`AgroMetric Precision — Análisis Gráfico X̄-R: ${rec.producto} (${rec.variable})`],
        ['Subgrupo', 'Promedio (X̄)', 'Rango (R)', 'LCS(X̄)', 'LC(X̄)', 'LCI(X̄)', 'LCS(R)', 'LC(R)', 'LCI(R)', 'Estado X̄', 'Estado R'],
        ...r.stats.map((s, i) => [
          i + 1,
          s.mean.toFixed(4),
          s.range.toFixed(4),
          r.UCL_X.toFixed(4),
          r.Xbarbar.toFixed(4),
          r.LCL_X.toFixed(4),
          r.UCL_R.toFixed(4),
          r.Rbar.toFixed(4),
          r.LCL_R.toFixed(4),
          (s.mean > r.UCL_X || s.mean < r.LCL_X) ? 'Fuera de Control (OOC)' : 'Estable (OK)',
          (s.range > r.UCL_R || s.range < r.LCL_R) ? 'Fuera de Control (OOC)' : 'Estable (OK)',
        ])
      ];
      downloadCSV(rows, `grafico_xbar_r_${safeProduct}.csv`);
    } catch (err) {
      alert(`Error al calcular gráfico X̄-R: ${err.message}`);
    }
  };

  const handleExportVariableXbarS = (rec) => {
    try {
      const r = calcXbarS(rec.subgruposData);
      const safeProduct = rec.producto.replace(/[\s,]+/g, '_').toLowerCase();
      const rows = [
        [`AgroMetric Precision — Análisis Gráfico X̄-S: ${rec.producto} (${rec.variable})`],
        ['Subgrupo', 'Promedio (X̄)', 'Desv. Estándar (s)', 'LCS(X̄)', 'LC(X̄)', 'LCI(X̄)', 'LCS(s)', 'LC(s)', 'LCI(s)', 'Estado X̄', 'Estado s'],
        ...r.stats.map((s, i) => [
          i + 1,
          s.mean.toFixed(4),
          s.range.toFixed(4), // En calcXbarS, range contiene la desviación estándar s
          r.UCL_X.toFixed(4),
          r.Xbarbar.toFixed(4),
          r.LCL_X.toFixed(4),
          r.UCL_S.toFixed(4),
          r.Sbar.toFixed(4),
          r.LCL_S.toFixed(4),
          (s.mean > r.UCL_X || s.mean < r.LCL_X) ? 'Fuera de Control (OOC)' : 'Estable (OK)',
          (s.range > r.UCL_S || s.range < r.LCL_S) ? 'Fuera de Control (OOC)' : 'Estable (OK)',
        ])
      ];
      downloadCSV(rows, `grafico_xbar_s_${safeProduct}.csv`);
    } catch (err) {
      alert(`Error al calcular gráfico X̄-S: ${err.message}`);
    }
  };

  const handleExportCapability = (rec) => {
    try {
      const lseVal = rec.lse !== '-' && rec.lse !== '' ? parseFloat(String(rec.lse).replace(',', '.')) : null;
      const lieVal = rec.lie !== '-' && rec.lie !== '' ? parseFloat(String(rec.lie).replace(',', '.')) : null;
      
      const cap = calcCapability(rec.subgruposData, lseVal, lieVal);
      const safeProduct = rec.producto.replace(/[\s,]+/g, '_').toLowerCase();
      
      const rows = [
        [`AgroMetric Precision — Capacidad del Proceso: ${rec.producto} (${rec.variable})`],
        ['Parámetro', 'Valor'],
        ['Media General (X̄)', cap.mean.toFixed(4)],
        ['Desv. Estándar Total (σ_overall)', cap.sigma.toFixed(4)],
        ['Desv. Estándar Corto Plazo (σ_within)', cap.sigmaWithin.toFixed(4)],
        ['Límite Superior Especificación (LSE)', lseVal !== null ? lseVal : '-'],
        ['Límite Inferior Especificación (LIE)', lieVal !== null ? lieVal : '-'],
      ];

      if (lseVal !== null && lieVal !== null) {
        rows.push(['Cp', !isNaN(cap.Cp) ? cap.Cp.toFixed(4) : '-']);
      }
      if (lseVal !== null) {
        rows.push(['Cpu', !isNaN(cap.Cpu) ? cap.Cpu.toFixed(4) : '-']);
      }
      if (lieVal !== null) {
        rows.push(['Cpl', !isNaN(cap.Cpl) ? cap.Cpl.toFixed(4) : '-']);
      }
      rows.push(['Cpk', !isNaN(cap.Cpk) ? cap.Cpk.toFixed(4) : '-']);

      if (lseVal !== null && lieVal !== null) {
        rows.push(['Pp', !isNaN(cap.Pp) ? cap.Pp.toFixed(4) : '-']);
      }
      rows.push(['Ppk', !isNaN(cap.Ppk) ? cap.Ppk.toFixed(4) : '-']);

      downloadCSV(rows, `capacidad_${safeProduct}.csv`);
    } catch (err) {
      alert(`Error al calcular capacidad: ${err.message}`);
    }
  };

  const handleExportAttributeChart = (rec) => {
    try {
      const results = computeAttributeLimits(rec.subgruposData, rec.tipoGrafico);
      const safeProduct = rec.producto.replace(/[\s,]+/g, '_').toLowerCase();
      
      let valHeader = 'Proporción (p)';
      let countHeader = 'Defectuosos (np)';
      
      if (rec.tipoGrafico === 'np') {
        valHeader = 'Defectuosos (np)';
        countHeader = 'Defectuosos (np)';
      } else if (rec.tipoGrafico === 'u') {
        valHeader = 'Tasa de Defectos (u)';
        countHeader = 'Defectos (c)';
      } else if (rec.tipoGrafico === 'c') {
        valHeader = 'Defectos (c)';
        countHeader = 'Defectos (c)';
      }
      
      const rows = [
        [`AgroMetric Precision — Gráfico de Atributos ${rec.tipoGrafico.toUpperCase()}: ${rec.producto} (${rec.variable})`],
        ['Subgrupo', valHeader, 'Tamaño Subgrupo (n)', countHeader, 'LCS', 'LC', 'LCI', 'Estado'],
        ...results.map(r => [
          r.sg,
          rec.tipoGrafico === 'c' || rec.tipoGrafico === 'np' ? r.val : r.val.toFixed(4),
          r.n,
          r.count,
          r.ucl.toFixed(4),
          r.lc.toFixed(4),
          r.lcl.toFixed(4),
          r.ooc ? 'Fuera de Control (OOC)' : 'Estable (OK)'
        ])
      ];
      downloadCSV(rows, `grafico_atributos_${rec.tipoGrafico}_${safeProduct}.csv`);
    } catch (err) {
      alert(`Error al calcular límites del gráfico de atributos: ${err.message}`);
    }
  };

  const parseCSV = (text) => {
    try {
      // 1. Detectar delimitador de forma inteligente buscando la cabecera
      const firstLine = text.split('\n')[0] || '';
      let delimiter = ',';
      
      const countSemicolons = (firstLine.match(/;/g) || []).length;
      const countTabs = (firstLine.match(/\t/g) || []).length;
      const countCommas = (firstLine.match(/,/g) || []).length;
      
      if (countSemicolons > countTabs && countSemicolons > countCommas) {
        delimiter = ';';
      } else if (countTabs > countSemicolons && countTabs > countCommas) {
        delimiter = '\t';
      } else {
        delimiter = ',';
      }
      
      // 2. Parsear celdas respetando comillas dobles y el delimitador
      const parseLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delimiter && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result.map(v => v.replace(/^"|"$/g, ''));
      };

      const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (rawLines.length === 0) {
        setParseError('El archivo CSV está vacío.');
        return;
      }
      
      const headers = parseLine(rawLines[0]);
      const rows = rawLines.slice(1).map(l => {
        const columns = parseLine(l);
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = columns[i] !== undefined ? columns[i] : '';
        });
        return obj;
      }).filter(r => Object.values(r).some(v => v));
      
      setParsedData({ headers, rows }); 
      setParseError('');
      setShowSuccess(false);
      setImportedRecord(null);
    } catch (e) {
      console.error(e);
      setParseError('Error al parsear el archivo CSV. Verifique el formato.');
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    setImportFile(file);
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          if (rows.length === 0) {
            setParseError('El archivo Excel está vacío.');
            return;
          }
          
          const headers = rows[0].map(h => String(h).trim());
          const parsedRows = rows.slice(1).map(r => {
            const obj = {};
            headers.forEach((h, i) => {
              const cellVal = r[i];
              obj[h] = cellVal !== undefined && cellVal !== null ? String(cellVal).trim() : '';
            });
            return obj;
          }).filter(r => Object.values(r).some(v => v));
          
          setParsedData({ headers, rows: parsedRows });
          setParseError('');
          setShowSuccess(false);
          setImportedRecord(null);
        } catch (err) {
          console.error(err);
          setParseError('Error al leer el archivo Excel (.xlsx/.xls). Asegúrese de que no esté dañado.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = e => parseCSV(e.target.result);
      reader.readAsText(file, 'UTF-8');
    }
  };

  // Mapeador robusto de filas a subgrupos estadísticos con reemplazo de coma decimal por punto
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
          const rawVal = row[c] !== undefined && row[c] !== null ? String(row[c]).replace(',', '.') : '';
          const val = parseFloat(rawVal);
          return isNaN(val) ? 0 : val;
        });
      });
    } else {
      const keyN = colN || parsedData.headers[0];
      const keyNp = colNp || parsedData.headers[1] || parsedData.headers[0];

      return parsedData.rows.map(row => {
        const nStr = row[keyN] !== undefined && row[keyN] !== null ? String(row[keyN]).replace(',', '.') : '';
        const npOrCStr = row[keyNp] !== undefined && row[keyNp] !== null ? String(row[keyNp]).replace(',', '.') : '';
        
        const nVal = Math.max(1, Math.round(parseFloat(nStr)) || 100);
        const npOrCVal = Math.max(0, Math.round(parseFloat(npOrCStr)) || 0);

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
          <div>
            {!mounted ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Cargando muestras...
              </div>
            ) : records.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <FolderOpen size={48} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className="card-title" style={{ fontSize: 18, marginBottom: 8 }}>No se encontraron muestras registradas</div>
                <div className="card-subtitle" style={{ maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.5 }}>
                  Para exportar reportes, primero debes crear o digitar muestras en el registro de muestras o importar un archivo.
                </div>
                <button className="btn btn-primary" onClick={() => router.push('/muestras')}>
                  Ir al Registro de Muestras
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                    Mostrando <strong>{records.length}</strong> muestra{records.length !== 1 ? 's' : ''} registrada{records.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {records.map(rec => (
                    <div key={rec.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <h3 className="card-title" style={{ margin: 0, fontSize: 16 }}>{rec.producto}</h3>
                            <span style={{ 
                              fontSize: 11, 
                              padding: '2px 8px', 
                              borderRadius: 12, 
                              background: rec.isAtributo ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: rec.isAtributo ? '#60a5fa' : '#34d399',
                              border: rec.isAtributo ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                              fontWeight: 600
                            }}>
                              {rec.isAtributo ? `Atributos (Carta ${rec.tipoGrafico.toUpperCase()})` : 'Variables Continuas'}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                            <strong>Variable:</strong> {rec.variable} &middot; <strong>Inspector:</strong> {rec.analista} &middot; <strong>Fecha:</strong> {rec.fecha}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            <strong>Subgrupos:</strong> {rec.subgrupos} &middot; {!rec.isAtributo && `Tamaño: ${rec.tam} \u00B7 `}<strong>LIE:</strong> {rec.lie} &middot; <strong>LSE:</strong> {rec.lse}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleExportDataRaw(rec)}
                          >
                            Datos Brutos
                          </button>
                          
                          {rec.isAtributo ? (
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => handleExportAttributeChart(rec)}
                            >
                              Gráfico de Control ({rec.tipoGrafico.toUpperCase()})
                            </button>
                          ) : (
                            <>
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => handleExportVariableXbarR(rec)}
                              >
                                Gráfico X̄-R
                              </button>
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => handleExportVariableXbarS(rec)}
                              >
                                Gráfico X̄-S
                              </button>
                            </>
                          )}
                          
                          {!rec.isAtributo && (rec.lie !== '-' || rec.lse !== '-') && (
                            <button 
                              className="btn btn-secondary btn-sm"
                              style={{ 
                                borderColor: 'var(--green-primary)',
                                color: 'var(--green-light)',
                                background: 'rgba(16, 185, 129, 0.05)'
                              }}
                              onClick={() => handleExportCapability(rec)}
                            >
                              Capacidad
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {rec.notas && (
                        <div style={{ 
                          fontSize: 12, 
                          color: 'var(--text-muted)', 
                          background: 'rgba(255,255,255,0.02)', 
                          padding: '8px 12px', 
                          borderRadius: 6,
                          borderLeft: '3px solid var(--border)',
                          fontStyle: 'italic'
                        }}>
                          <strong>Notas:</strong> {rec.notas}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'importar' && (
          <>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="section-title" style={{ marginBottom: 8 }}>Importar Datos desde Archivos Excel o CSV</div>
              <div className="section-subtitle" style={{ marginBottom: 16 }}>
                El archivo debe tener encabezados en la primera fila. Formatos soportados: Excel (.xlsx, .xls) o CSV (.csv, .txt)
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
                  {importFile ? `${(importFile.size / 1024).toFixed(1)} KB` : 'o haz clic para seleccionar · Excel (.xlsx, .xls), CSV, TXT'}
                </div>
                <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" style={{ display: 'none' }}
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
