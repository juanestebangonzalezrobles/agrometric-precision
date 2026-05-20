'use client';
import { useState, useRef } from 'react';
import { aguacatePeso, aloeAltura, calcXbarR, calcP, calcCapability, manzanillaP, tomateDefectos } from '../../lib/data';
import { FolderOpen, CheckCircle } from 'lucide-react';

function downloadCSV(data, filename) {
  const csv = data.map(row => row.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
}

export default function ExportarPage() {
  const [tab, setTab] = useState('exportar');
  const [importFile, setImportFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [parseError, setParseError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

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
      setParsedData({ headers, rows }); setParseError('');
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

            {parsedData && (
              <div className="card">
                 <div className="section-header">
                  <div>
                    <div className="section-title">Vista Previa — {parsedData.rows.length} filas, {parsedData.headers.length} columnas</div>
                    <div className="section-subtitle">Primeras 10 filas del archivo importado</div>
                  </div>
                  <div className="interpretation good" style={{ padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={14} /> Archivo válido
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
                 <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary">Analizar con Gráficos de Control</button>
                  <button className="btn btn-secondary" onClick={() => { setParsedData(null); setImportFile(null); }}>Limpiar</button>
                </div>
              </div>
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
                    ['1', '', '', '', '', ''],
                    ['2', '', '', '', '', ''],
                    ['...', '', '', '', '', ''],
                  ], 'plantilla_variables.csv');
                }}>Plantilla Variables (X̄-R)</button>
                <button className="btn btn-secondary" onClick={() => {
                  downloadCSV([
                    ['Subgrupo', 'n_inspeccionados', 'n_defectuosos'],
                    ['1', '100', ''],
                    ['2', '100', ''],
                    ['...', '', ''],
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
