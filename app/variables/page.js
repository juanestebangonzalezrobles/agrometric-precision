'use client';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts';
import { calcXbarR, calcXbarS, aguacatePeso, aloeAltura } from '../../lib/data';

const STORAGE_KEY = 'agrometric_registros';

const DATASETS = {
  aguacate: aguacatePeso,
  aloe: aloeAltura,
  custom: null,
};

const CustomDot = (props) => {
  const { cx, cy, payload, oocKey, normalColor = "#10b981" } = props;
  const isOoc = oocKey ? payload[oocKey] : payload.ooc;
  if (isOoc) return <circle cx={cx} cy={cy} r={6} fill="#ef4444" stroke="#ef4444" strokeWidth={2} />;
  return <circle cx={cx} cy={cy} r={4} fill={normalColor} stroke={normalColor} strokeWidth={1.5} />;
};

export default function VariablesPage() {
  const [selected, setSelected] = useState('aguacate');
  const [customData, setCustomData] = useState({ n: 5, rows: 25, values: [] });
  const [chartType, setChartType] = useState('XR'); // 'XR' (Rangos) o 'XS' (Desviación Estándar)
  const [result, setResult] = useState(null);
  const [dataset, setDataset] = useState(aguacatePeso);
  const [userRecords, setUserRecords] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const records = raw ? JSON.parse(raw) : [];
      // Only include records that have subgruposData (variable type)
      setUserRecords(records.filter(r => r.subgruposData && r.subgruposData.length > 0));
    } catch { setUserRecords([]); }
  }, []);

  useEffect(() => {
    if (selected !== 'custom' && !selected.startsWith('user_')) {
      const ds = selected === 'aguacate' ? aguacatePeso : aloeAltura;
      setDataset(ds);
      const isXS = chartType === 'XS';
      const r = isXS ? calcXbarS(ds.subgrupos) : calcXbarR(ds.subgrupos);
      const chartData = r.stats.map((s, i) => ({
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
      }));
      setResult({
        ...r,
        Rbar: isXS ? r.Sbar : r.Rbar,
        UCL_R: isXS ? r.UCL_S : r.UCL_R,
        LCL_R: isXS ? r.LCL_S : r.LCL_R,
        chartData,
        isXS
      });
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
          const r = isXS ? calcXbarS(rec.subgruposData) : calcXbarR(rec.subgruposData);
          const chartData = r.stats.map((s, i) => ({
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
          }));
          setResult({
            ...r,
            Rbar: isXS ? r.Sbar : r.Rbar,
            UCL_R: isXS ? r.UCL_S : r.UCL_R,
            LCL_R: isXS ? r.LCL_S : r.LCL_R,
            chartData,
            isXS
          });
        } catch { alert('Error al calcular. Verifica que los datos sean numéricos.'); }
      }
    }
  }, [selected, userRecords, chartType]);

  const handleCustomCalc = () => {
    if (customData.values.length === 0) return;
    try {
      const rows = customData.values;
      const isXS = chartType === 'XS';
      const r = isXS ? calcXbarS(rows) : calcXbarR(rows);
      const chartData = r.stats.map((s, i) => ({
        sg: i + 1, media: +s.mean.toFixed(3), rango: +s.range.toFixed(3),
        UCL_X: +r.UCL_X.toFixed(3), LCL_X: +r.LCL_X.toFixed(3),
        Xbarbar: +r.Xbarbar.toFixed(3),
        UCL_R: isXS ? +r.UCL_S.toFixed(3) : +r.UCL_R.toFixed(3),
        LCL_R: isXS ? +r.LCL_S.toFixed(3) : +r.LCL_R.toFixed(3),
        Rbar: isXS ? +r.Sbar.toFixed(3) : +r.Rbar.toFixed(3),
        ooc_x: s.mean > r.UCL_X || s.mean < r.LCL_X,
        ooc_r: isXS ? s.range > r.UCL_S || s.range < r.LCL_S : s.range > r.UCL_R || s.range < r.LCL_R,
      }));
      setResult({
        ...r,
        Rbar: isXS ? r.Sbar : r.Rbar,
        UCL_R: isXS ? r.UCL_S : r.UCL_R,
        LCL_R: isXS ? r.LCL_S : r.LCL_R,
        chartData,
        isXS
      });
    } catch { alert('Error procesando datos. Verifique el formato.'); }
  };

  useEffect(() => {
    if (selected === 'custom') {
      handleCustomCalc();
    }
  }, [chartType]);

  const handleManualInput = (sgIdx, valIdx, val) => {
    const next = [...(customData.values.length ? customData.values : Array.from({ length: customData.rows }, () => Array(customData.n).fill('')))];
    if (!next[sgIdx]) next[sgIdx] = Array(customData.n).fill('');
    next[sgIdx][valIdx] = parseFloat(val) || '';
    setCustomData(d => ({ ...d, values: next }));
  };

  const oocCount = result ? result.chartData.filter(d => d.ooc_x || d.ooc_r).length : 0;

  return (
    <>
      <div className="header">
        <div>
          <div className="header-title">Control de Variables — Gráficos X̄-R / X̄-S</div>
          <div className="header-subtitle">Variables continuas: Peso, Diámetro, pH, Grados Brix, Altura, etc.</div>
        </div>
        <button className="btn btn-secondary no-print" onClick={() => window.print()}>
          Imprimir Reporte
        </button>
      </div>
      <div className="page-content fade-in">

        {/* Dataset selector */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Seleccionar Conjunto de Datos</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { key: 'aguacate', label: 'Aguacate Hass — Peso (g)' },
              { key: 'aloe', label: 'Aloe Vera — Altura (cm)' },
              ...userRecords.map((r, i) => ({ key: `user_${i}`, label: `${r.producto} — ${r.variableName || r.variable}`, user: true })),
              { key: 'custom', label: 'Ingresar mis datos' },
            ].map(opt => (
              <button key={opt.key} className={`btn ${selected === opt.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelected(opt.key)}
                style={opt.user ? { borderColor: 'var(--green-primary)', color: selected === opt.key ? undefined : 'var(--green-light)' } : {}}>
                {opt.label}
                {opt.user && <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }}>TUYO</span>}
              </button>
            ))}
          </div>
          {userRecords.length === 0 && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              Guarda un registro en <strong>Muestras</strong> para analizarlo aquí
            </div>
          )}
        </div>

        {/* Tipo de Gráfico (X̄-R vs X̄-S) */}
        <div className="tabs no-print">
          <button className={`tab ${chartType === 'XR' ? 'active' : ''}`} onClick={() => setChartType('XR')}>
            Carta X̄-R (Rangos)
          </button>
          <button className={`tab ${chartType === 'XS' ? 'active' : ''}`} onClick={() => setChartType('XS')}>
            Carta X̄-S (Desviaciones)
          </button>
        </div>

        {/* Custom data entry */}
        {selected === 'custom' && (
          <div className="card" style={{ marginBottom: 16 }}>
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

        {/* Info del dataset */}
        {result && selected !== 'custom' && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Producto', val: dataset.producto },
              { label: 'Variable', val: `${dataset.variable} (${dataset.unidad})` },
              { label: 'Analista', val: dataset.analista },
              { label: 'Subgrupos', val: dataset.subgrupos.length },
              { label: 'n (tamaño)', val: dataset.n },
              { label: 'Puntos OOC', val: oocCount, color: oocCount > 0 ? '#ef4444' : 'var(--green-light)' },
            ].map((item, i) => (
              <div key={i} className="card" style={{ padding: '10px 16px', flex: '1', minWidth: 120 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: item.color || 'var(--text-primary)' }}>{item.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Límites calculados */}
        {result && (
          <div className="grid-3" style={{ marginBottom: 16 }}>
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
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'JetBrains Mono', color: s.color || 'var(--green-light)' }}>{s.val}</div>
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

          return (
            <div className="chart-wrapper">
              <div className="chart-title">Gráfico de Control X̄ (Media)</div>
              <div className="chart-desc">
                Puntos fuera de control (OOC) marcados en rojo. LCS = {result.UCL_X.toFixed(3)} | LC = {result.Xbarbar.toFixed(3)} | LCI = {result.LCL_X.toFixed(3)}
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={result.chartData} margin={{ top: 15, right: 90, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="sg" label={{ value: 'Subgrupo', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }} stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={domainX} allowDataOverflow={true} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                  <ReferenceLine y={result.UCL_X} stroke="#ef4444" strokeWidth={2} label={{ value: `LCS: ${result.UCL_X.toFixed(3)}`, fill: '#ef4444', fontSize: 10, fontWeight: 'bold', position: 'right' }} />
                  <ReferenceLine y={result.Xbarbar} stroke="var(--green-primary)" strokeWidth={2} label={{ value: `LC: ${result.Xbarbar.toFixed(3)}`, fill: 'var(--green-primary)', fontSize: 10, fontWeight: 'bold', position: 'right' }} />
                  <ReferenceLine y={result.LCL_X} stroke="#ef4444" strokeWidth={2} label={{ value: `LCI: ${result.LCL_X.toFixed(3)}`, fill: '#ef4444', fontSize: 10, fontWeight: 'bold', position: 'right' }} />
                  <Line type="monotone" dataKey="media" stroke="var(--green-light)" strokeWidth={2} dot={<CustomDot oocKey="ooc_x" normalColor="var(--green-light)" />} name="X̄" />
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
            <div className="chart-wrapper">
              <div className="chart-title">{result.isXS ? 'Gráfico de Control S (Desviación Estándar)' : 'Gráfico de Control R (Rango)'}</div>
              <div className="chart-desc">
                LCS = {result.UCL_R.toFixed(3)} | LC = {result.Rbar.toFixed(3)} | LCI = {result.LCL_R.toFixed(3)}
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={result.chartData} margin={{ top: 15, right: 90, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="sg" stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={domainR} allowDataOverflow={true} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                  <ReferenceLine y={result.UCL_R} stroke="#ef4444" strokeWidth={2} label={{ value: `LCS: ${result.UCL_R.toFixed(3)}`, fill: '#ef4444', fontSize: 10, fontWeight: 'bold', position: 'right' }} />
                  <ReferenceLine y={result.Rbar} stroke="#f59e0b" strokeWidth={2} label={{ value: `LC: ${result.Rbar.toFixed(3)}`, fill: '#f59e0b', fontSize: 10, fontWeight: 'bold', position: 'right' }} />
                  {result.LCL_R > 0 && <ReferenceLine y={result.LCL_R} stroke="#ef4444" strokeWidth={2} label={{ value: `LCI: ${result.LCL_R.toFixed(3)}`, fill: '#ef4444', fontSize: 10, fontWeight: 'bold', position: 'right' }} />}
                  <Line type="monotone" dataKey="rango" stroke="#f59e0b" strokeWidth={2} dot={<CustomDot oocKey="ooc_r" normalColor="#f59e0b" />} name={result.isXS ? 'S' : 'R'} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* Tabla de datos */}
        {result && (
          <div className="card">
            <div className="section-title" style={{ marginBottom: 12 }}>Tabla de Resultados por Subgrupo</div>
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>Subgrupo</th><th>X̄</th><th>{result.isXS ? 'S' : 'R'}</th><th>LCS(X̄)</th><th>LC(X̄)</th><th>LCI(X̄)</th><th>Estado X̄</th><th>Estado {result.isXS ? 'S' : 'R'}</th>
                </tr></thead>
                <tbody>
                  {result.chartData.map((d, i) => (
                    <tr key={i} style={d.ooc_x || d.ooc_r ? { background: 'rgba(239,68,68,0.06)' } : {}}>
                      <td style={{ fontWeight: 600 }}>{d.sg}</td>
                      <td className="td-num">{d.media}</td>
                      <td className="td-num">{d.rango}</td>
                      <td className="td-num" style={{ color: '#ef4444' }}>{d.UCL_X}</td>
                      <td className="td-num" style={{ color: 'var(--green-primary)' }}>{d.Xbarbar}</td>
                      <td className="td-num" style={{ color: '#ef4444' }}>{d.LCL_X}</td>
                      <td><span className={`badge ${d.ooc_x ? 'badge-red' : 'badge-green'}`}>{d.ooc_x ? 'OOC' : 'OK'}</span></td>
                      <td><span className={`badge ${d.ooc_r ? 'badge-red' : 'badge-green'}`}>{d.ooc_r ? 'OOC' : 'OK'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DIAGNÓSTICO TÉCNICO ── */}
        {result && (() => {
          const oocX = result.chartData.filter(d => d.ooc_x);
          const oocR = result.chartData.filter(d => d.ooc_r);
          const totalOoc = result.chartData.filter(d => d.ooc_x || d.ooc_r).length;
          const isControlled = totalOoc === 0;
          // Runs test: 7+ consecutive points same side of centerline
          let runLen = 0, maxRun = 0, runsSide = null;
          result.chartData.forEach(d => {
            const side = d.media > result.Xbarbar ? 1 : -1;
            if (side === runsSide) { runLen++; maxRun = Math.max(maxRun, runLen); }
            else { runLen = 1; runsSide = side; }
          });
          const hasTrend = maxRun >= 7;
          const ampRel = ((result.UCL_X - result.LCL_X) / result.Xbarbar * 100).toFixed(1);

          return (
            <div className="card" style={{ border: '1px solid var(--green-primary)', borderLeft: '4px solid var(--green-primary)', marginBottom: 16 }}>
              <div className="section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                Diagnóstico Técnico — Gráficos {result.isXS ? 'X̄-S' : 'X̄-R'}
                <span className={`badge ${isControlled && !hasTrend ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 11 }}>
                  {isControlled && !hasTrend ? 'Proceso Estable' : 'Requiere Atención'}
                </span>
              </div>

              {/* Estado general */}
              <div style={{ padding: '14px 16px', borderRadius: 8, marginBottom: 14,
                background: isControlled ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${isControlled ? 'var(--green-primary)' : '#ef4444'}` }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: isControlled ? 'var(--green-light)' : '#ef4444', marginBottom: 4 }}>
                  {isControlled ? 'Proceso Bajo Control Estadístico' : `Proceso Fuera de Control — ${totalOoc} subgrupo(s) OOC`}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {isControlled
                    ? `Los ${result.chartData.length} subgrupos analizados se encuentran dentro de los límites de control (±3σ). El proceso es estable y predecible. La variación observada es de tipo común (aleatoria).`
                    : `De ${result.chartData.length} subgrupos analizados, ${totalOoc} presentan puntos fuera de los límites de control (±3σ), indicando presencia de causas especiales de variación que deben identificarse y eliminarse.`}
                </div>
              </div>

              {/* Detalle OOC */}
              {totalOoc > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>Detalle de Puntos Fuera de Control:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 6 }}>
                    {oocX.map((d, i) => (
                      <div key={`x${i}`} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'rgba(239,68,68,0.06)', padding: '6px 10px', borderRadius: 6, borderLeft: '3px solid #ef4444' }}>
                        <strong style={{ color: '#ef4444' }}>Sg. {d.sg} — Gráfico X̄:</strong> Media = {d.media} {d.media > d.UCL_X ? `> LCS (${d.UCL_X})` : `< LCI (${d.LCL_X})`}
                      </div>
                    ))}
                    {oocR.map((d, i) => (
                      <div key={`r${i}`} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'rgba(245,158,11,0.06)', padding: '6px 10px', borderRadius: 6, borderLeft: '3px solid #f59e0b' }}>
                        <strong style={{ color: '#f59e0b' }}>Sg. {d.sg} — Gráfico {result.isXS ? 'S' : 'R'}:</strong> {result.isXS ? 'Desv. Estándar' : 'Rango'} = {d.rango} {d.rango > d.UCL_R ? `> LCS (${d.UCL_R})` : `< LCI (${d.LCL_R})`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reglas de Nelson */}
              {hasTrend && (
                <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 14, background: 'rgba(245,158,11,0.08)', border: '1px solid #f59e0b' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 2 }}>Regla de Runs: Tendencia Detectada</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Se detectaron {maxRun}+ puntos consecutivos del mismo lado de la línea central. Según las Reglas de Nelson, esto indica una tendencia sistemática en el proceso (cambio gradual en la media).
                  </div>
                </div>
              )}

              {/* Resumen estadístico */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginBottom: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                {[
                  { label: 'Gran Media (X̄̄)', val: result.Xbarbar.toFixed(4) },
                  { label: result.isXS ? 'Desviación Media (S̄)' : 'Rango Medio (R̄)', val: result.Rbar.toFixed(4) },
                  { label: 'Amplitud banda control X̄', val: `${(result.UCL_X - result.LCL_X).toFixed(4)}` },
                  { label: 'Amplitud relativa (%X̄̄)', val: `${ampRel}%` },
                  { label: 'Subgrupos analizados', val: result.chartData.length },
                  { label: 'Subgrupos OOC', val: totalOoc, color: totalOoc > 0 ? '#ef4444' : 'var(--green-light)' },
                ].map((s, i) => (
                  <div key={i} style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{s.label}: </span>
                    <span style={{ fontWeight: 700, color: s.color || 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>{s.val}</span>
                  </div>
                ))}
              </div>

              {/* Recomendaciones */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-light)', marginBottom: 8 }}>Recomendaciones:</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.8 }}>
                  {isControlled && !hasTrend ? (<>
                    <li>El proceso está estable. <strong style={{ color: 'var(--text-primary)' }}>Proceda con el análisis de capacidad</strong> (Cp, Cpk) para evaluar si cumple con las especificaciones del cliente.</li>
                    <li>Continúe el monitoreo periódico (al menos una vez por turno) para detectar cambios futuros.</li>
                    <li>Documente las condiciones actuales del proceso como referencia para futuras comparaciones.</li>
                    <li>Considere reducir la variabilidad del proceso para mejorar los índices de capacidad.</li>
                  </>) : (<>
                    <li><strong style={{ color: '#ef4444' }}>No calcule índices de capacidad</strong> hasta que el proceso esté bajo control estadístico.</li>
                    <li>Investigue las causas asignables en los subgrupos OOC: revise cambios en materia prima, operador, equipo o condiciones ambientales en el momento de muestreo.</li>
                    <li>Usa la herramienta <strong style={{ color: 'var(--green-light)' }}>Diagrama de Ishikawa</strong> para estructurar y documentar las fuentes potenciales de esta variación especial.</li>
                    <li>Una vez eliminadas las causas especiales, recalcule los límites de control con los subgrupos restantes.</li>
                    {hasTrend && <li>Para la tendencia detectada, revise si hay desgaste progresivo de herramientas, temperatura acumulada, o fatiga del operador.</li>}
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
