'use client';
import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { aguacatePeso, aloeAltura, calcXbarR, calcCapability } from '../../lib/data';

const STORAGE_KEY = 'agrometric_registros';

function loadUserRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveUserRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export default function MuestrasPage() {
  const [activeTab, setActiveTab] = useState('ver');
  const [form, setForm] = useState({
    producto: '', tipo: 'Fruta', variable: '', unidad: '', analista: '', fecha: '', lse: '', lie: '',
    nSubgrupos: 10, tamSubgrupo: 5, notas: ''
  });
  const [step, setStep] = useState(1);
  const [matrixData, setMatrixData] = useState([]);
  const [saved, setSaved] = useState(false);
  const [userRecords, setUserRecords] = useState([]);

  useEffect(() => {
    setUserRecords(loadUserRecords());
  }, []);

  const muestrasDemo = [
    { id: 1, producto: 'Aguacate Hass', tipo: 'Fruta', variable: 'Peso (g)', analista: 'Carlos Mendoza', fecha: '2026-05-01', subgrupos: 25, tam: 5, lse: 280, lie: 180, estado: 'Analizado' },
    { id: 2, producto: 'Aloe Vera', tipo: 'Planta Medicinal', variable: 'Altura (cm)', analista: 'Laura Gómez', fecha: '2026-05-05', subgrupos: 25, tam: 4, lse: 55, lie: 25, estado: 'Analizado' },
    { id: 3, producto: 'Manzanilla', tipo: 'Planta Medicinal', variable: 'Flores defectuosas', analista: 'Ana Torres', fecha: '2026-05-10', subgrupos: 25, tam: 100, lse: '-', lie: '-', estado: 'Analizado' },
    { id: 4, producto: 'Tomate Chonto', tipo: 'Hortaliza', variable: 'Manchas / Lesiones', analista: 'Pedro Rivas', fecha: '2026-05-12', subgrupos: 25, tam: 1, lse: '-', lie: '-', estado: 'Analizado' },
  ];

  const initMatrix = () => {
    const rows = Array.from({ length: +form.nSubgrupos }, () => Array(+form.tamSubgrupo).fill(''));
    setMatrixData(rows); setStep(2);
  };

  const updateCell = (r, c, v) => {
    const next = matrixData.map((row, ri) => ri === r ? row.map((cell, ci) => ci === c ? v : cell) : row);
    setMatrixData(next);
  };

  const handleSave = () => {
    // Parse matrix to numbers
    const subgruposNums = matrixData.map(row => row.map(v => parseFloat(v) || 0));
    const newRecord = {
      id: Date.now(),
      producto: form.producto,
      tipo: form.tipo,
      variable: `${form.variable}${form.unidad ? ' (' + form.unidad + ')' : ''}`,
      unidad: form.unidad,
      variableName: form.variable,
      analista: form.analista,
      fecha: form.fecha || new Date().toISOString().slice(0, 10),
      subgrupos: subgruposNums.length,
      tam: subgruposNums[0]?.length || 0,
      lse: form.lse || '-',
      lie: form.lie || '-',
      lseNum: parseFloat(form.lse) || null,
      lieNum: parseFloat(form.lie) || null,
      estado: 'Analizado',
      subgruposData: subgruposNums,
      notas: form.notas,
    };
    const updated = [...loadUserRecords(), newRecord];
    saveUserRecords(updated);
    setUserRecords(updated);
    setSaved(true);
    setStep(3);
  };

  return (
    <>
      <div className="header">
        <div>
          <div className="header-title">Registro de Muestras</div>
          <div className="header-subtitle">Trazabilidad completa: producto, analista, fecha, valores por subgrupo</div>
        </div>
      </div>
      <div className="page-content fade-in">

        <div className="tabs">
          {[['ver', 'Ver Registros'], ['nuevo', 'Nuevo Registro']].map(([k, l]) => (
            <button key={k} className={`tab ${activeTab === k ? 'active' : ''}`} onClick={() => { setActiveTab(k); setStep(1); setSaved(false); }}>{l}</button>
          ))}
        </div>

        {/* VER REGISTROS */}
        {activeTab === 'ver' && (() => {
          const allRecords = [
            ...muestrasDemo,
            ...userRecords.map((r, i) => ({ ...r, id: `U${i + 1}`, _user: true })),
          ];
          return (
            <div className="card">
              <div className="section-header">
                <div>
                  <div className="section-title">Muestras Registradas</div>
                  <div className="section-subtitle">
                    {allRecords.length} registros en el sistema
                    {userRecords.length > 0 && <span style={{ color: 'var(--green-light)', marginLeft: 8 }}>({userRecords.length} propios)</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {userRecords.length > 0 && (
                    <button className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}
                      onClick={() => { if (confirm('¿Eliminar todos tus registros?')) { saveUserRecords([]); setUserRecords([]); } }}>
                      Limpiar míos
                    </button>
                  )}
                  <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('nuevo')}>+ Nuevo</button>
                </div>
              </div>
              <div className="table-container">
                <table>
                  <thead><tr>
                    <th>#</th><th>Producto</th><th>Tipo</th><th>Variable</th><th>Analista</th><th>Fecha</th><th>Subgrupos</th><th>n</th><th>LSE</th><th>LIE</th><th>Estado</th>
                  </tr></thead>
                  <tbody>
                    {allRecords.map((m, idx) => (
                      <tr key={idx} style={m._user ? { background: 'rgba(16,185,129,0.04)', borderLeft: '3px solid var(--green-primary)' } : {}}>
                        <td style={{ fontWeight: 600, color: m._user ? 'var(--green-light)' : undefined }}>{m.id}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {m._user && <span style={{ fontSize: 10, background: 'var(--green-dark)', color: 'var(--green-light)', borderRadius: 4, padding: '1px 5px', marginRight: 6 }}>TUYO</span>}
                          {m.producto}
                        </td>
                        <td><span className="badge badge-blue">{m.tipo}</span></td>
                        <td>{m.variable}</td>
                        <td>{m.analista}</td>
                        <td className="td-num">{m.fecha}</td>
                        <td className="td-num">{m.subgrupos}</td>
                        <td className="td-num">{m.tam}</td>
                        <td className="td-num">{m.lse}</td>
                        <td className="td-num">{m.lie}</td>
                        <td><span className="badge badge-green">{m.estado}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* NUEVO REGISTRO */}
        {activeTab === 'nuevo' && (
          <>
            {/* Step indicator */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
              {['Información General', 'Datos por Subgrupo', 'Confirmación'].map((label, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700,
                    background: step > i + 1 ? 'var(--green-primary)' : step === i + 1 ? 'var(--green-dark)' : 'var(--bg-card)',
                    border: `2px solid ${step >= i + 1 ? 'var(--green-primary)' : 'var(--border)'}`,
                    color: step >= i + 1 ? '#fff' : 'var(--text-muted)',
                  }}>{step > i + 1 ? '✓' : i + 1}</div>
                  <span style={{ fontSize: 12, color: step === i + 1 ? 'var(--green-light)' : 'var(--text-muted)', fontWeight: step === i + 1 ? 600 : 400 }}>{label}</span>
                  {i < 2 && <div style={{ width: 40, height: 1, background: step > i + 1 ? 'var(--green-primary)' : 'var(--border)' }} />}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="card">
                <div className="section-title" style={{ marginBottom: 16 }}>Información del Muestreo</div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Nombre del Producto *</label>
                    <input className="form-input" value={form.producto} onChange={e => setForm(f => ({ ...f, producto: e.target.value }))} placeholder="Ej: Aguacate Hass" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo de Producto</label>
                    <select className="form-select" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                      <option>Fruta</option><option>Hortaliza</option><option>Planta Medicinal</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Variable a Controlar *</label>
                    <input className="form-input" value={form.variable} onChange={e => setForm(f => ({ ...f, variable: e.target.value }))} placeholder="Ej: Peso, Diámetro, pH..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unidad de Medida</label>
                    <input className="form-input" value={form.unidad} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))} placeholder="g, cm, pH, °Brix..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre del Analista *</label>
                    <input className="form-input" value={form.analista} onChange={e => setForm(f => ({ ...f, analista: e.target.value }))} placeholder="Nombre completo" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha de Muestreo</label>
                    <input type="date" className="form-input" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">LSE (Límite Superior Especificación)</label>
                    <input type="number" className="form-input" value={form.lse} onChange={e => setForm(f => ({ ...f, lse: e.target.value }))} placeholder="Opcional" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">LIE (Límite Inferior Especificación)</label>
                    <input type="number" className="form-input" value={form.lie} onChange={e => setForm(f => ({ ...f, lie: e.target.value }))} placeholder="Opcional" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Número de Subgrupos (≥25 recomendado)</label>
                    <input type="number" className="form-input" value={form.nSubgrupos} min={2} max={50} onChange={e => setForm(f => ({ ...f, nSubgrupos: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tamaño del Subgrupo (n)</label>
                    <select className="form-select" value={form.tamSubgrupo} onChange={e => setForm(f => ({ ...f, tamSubgrupo: e.target.value }))}>
                      {[2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Notas / Observaciones</label>
                    <textarea className="form-textarea" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Condiciones del muestreo, observaciones..." />
                  </div>
                </div>
                <button className="btn btn-primary" onClick={initMatrix} disabled={!form.producto || !form.variable || !form.analista}>
                  Siguiente → Ingresar Datos
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="card">
                <div className="section-title" style={{ marginBottom: 4 }}>Datos por Subgrupo</div>
                <div className="section-subtitle" style={{ marginBottom: 16 }}>
                  {form.nSubgrupos} subgrupos × {form.tamSubgrupo} observaciones = {form.nSubgrupos * form.tamSubgrupo} datos
                </div>
                <div className="table-container data-table-input" style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 16 }}>
                  <table>
                    <thead><tr>
                      <th>Subgrupo</th>
                      {Array.from({ length: +form.tamSubgrupo }, (_, i) => <th key={i}>X{i + 1}</th>)}
                      <th>X̄</th><th>R</th>
                    </tr></thead>
                    <tbody>
                      {matrixData.map((row, ri) => {
                        const nums = row.map(v => parseFloat(v)).filter(v => !isNaN(v));
                        const media = nums.length === row.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : '-';
                        const rango = nums.length === row.length ? (Math.max(...nums) - Math.min(...nums)).toFixed(2) : '-';
                        return (
                          <tr key={ri}>
                            <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{ri + 1}</td>
                            {row.map((cell, ci) => (
                              <td key={ci}>
                                <input type="number" step="any" value={cell} placeholder="0"
                                  onChange={e => updateCell(ri, ci, e.target.value)} />
                              </td>
                            ))}
                            <td style={{ color: 'var(--green-light)', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{media}</td>
                            <td style={{ color: '#f59e0b', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{rango}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary" onClick={() => setStep(1)}>← Volver</button>
                  <button className="btn btn-primary" onClick={handleSave}>Guardar Registro</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="card" style={{ textAlign: 'center', padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <CheckCircle size={64} style={{ color: 'var(--green-light)', marginBottom: 16 }} />
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green-light)', marginBottom: 8 }}>Registro Guardado</div>
                <div style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
                  {form.producto} — {form.variable} ({form.nSubgrupos} subgrupos × n={form.tamSubgrupo})
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => { setStep(1); setSaved(false); setMatrixData([]); setForm({ producto:'',tipo:'Fruta',variable:'',unidad:'',analista:'',fecha:'',lse:'',lie:'',nSubgrupos:10,tamSubgrupo:5,notas:'' }); }}>
                    Nuevo Registro
                  </button>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('ver')}>Ver Todos</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
