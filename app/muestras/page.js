'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, Trash2, Edit3, Plus, X, ArrowLeft, Save } from 'lucide-react';

const STORAGE_KEY = 'agrometric_registros';

// Datos predeterminados para sembrar el localStorage en la primera carga
const DEFAULT_RECORDS = [
  {
    id: 'demo_1',
    producto: 'Aguacate Hass',
    tipo: 'Fruta',
    variable: 'Peso (g)',
    unidad: 'g',
    variableName: 'Peso',
    analista: 'Carlos Mendoza',
    fecha: '2026-05-01',
    subgrupos: 25,
    tam: 5,
    lse: 280,
    lie: 180,
    lseNum: 280,
    lieNum: 180,
    estado: 'Analizado',
    subgruposData: [
      [225, 230, 220, 235, 228], [210, 215, 220, 218, 212], [245, 240, 238, 242, 250],
      [198, 205, 200, 195, 202], [260, 255, 258, 262, 257], [230, 228, 225, 232, 235],
      [185, 190, 188, 192, 186], [242, 238, 245, 240, 243], [220, 215, 218, 222, 216],
      [265, 270, 268, 272, 260], [205, 210, 208, 212, 206], [250, 245, 248, 252, 247],
      [235, 240, 238, 232, 237], [195, 200, 198, 202, 197], [215, 220, 218, 212, 217],
      [258, 262, 255, 260, 257], [228, 230, 225, 232, 227], [240, 245, 242, 238, 243],
      [202, 198, 205, 200, 203], [270, 265, 268, 272, 267], [218, 222, 220, 215, 219],
      [255, 250, 252, 258, 253], [185, 188, 190, 186, 187], [232, 235, 230, 238, 233],
      [248, 245, 250, 252, 247],
    ],
    isAtributo: false,
    isDemo: true
  },
  {
    id: 'demo_2',
    producto: 'Aloe Vera',
    tipo: 'Planta Medicinal',
    variable: 'Altura (cm)',
    unidad: 'cm',
    variableName: 'Altura',
    analista: 'Laura Gómez',
    fecha: '2026-05-05',
    subgrupos: 25,
    tam: 4,
    lse: 55,
    lie: 25,
    lseNum: 55,
    lieNum: 25,
    estado: 'Analizado',
    subgruposData: [
      [38, 42, 40, 39], [45, 48, 44, 46], [32, 35, 33, 34], [50, 52, 49, 51],
      [28, 30, 29, 31], [43, 41, 44, 42], [36, 38, 37, 35], [47, 50, 48, 46],
      [33, 31, 34, 32], [52, 54, 51, 53], [40, 42, 39, 41], [27, 29, 28, 30],
      [44, 46, 43, 45], [37, 39, 36, 38], [49, 51, 48, 50], [35, 33, 36, 34],
      [41, 43, 40, 42], [26, 28, 27, 29], [46, 48, 45, 47], [38, 40, 37, 39],
      [53, 55, 52, 54], [31, 33, 30, 32], [44, 42, 45, 43], [39, 41, 38, 40],
      [48, 50, 47, 49],
    ],
    isAtributo: false,
    isDemo: true
  },
  {
    id: 'demo_3',
    producto: 'Manzanilla Alemana',
    tipo: 'Planta Medicinal',
    variable: 'Flores defectuosas',
    unidad: '',
    variableName: 'Flores defectuosas',
    analista: 'Ana Torres',
    fecha: '2026-05-10',
    subgrupos: 25,
    tam: 100,
    lse: '-',
    lie: '-',
    estado: 'Analizado',
    isAtributo: true,
    isDemo: true,
    tipoGrafico: 'p',
    subgruposData: [8,5,12,3,9,6,14,4,7,11,5,8,10,3,6,9,13,4,7,8,5,11,6,9,7].map(np => ({ n: 100, np }))
  },
  {
    id: 'demo_4',
    producto: 'Tomate Chonto',
    tipo: 'Hortaliza',
    variable: 'Manchas / Lesiones',
    unidad: '',
    variableName: 'Manchas / Lesiones',
    analista: 'Pedro Rivas',
    fecha: '2026-05-12',
    subgrupos: 25,
    tam: 1,
    lse: '-',
    lie: '-',
    estado: 'Analizado',
    isAtributo: true,
    isDemo: true,
    tipoGrafico: 'c',
    subgruposData: [3,7,2,5,8,4,6,1,9,3,5,7,2,4,6,8,3,5,1,7,4,6,2,5,8].map(c => ({ n: 1, c }))
  }
];

function loadRecords() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RECORDS));
      return DEFAULT_RECORDS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_RECORDS;
  }
}

function saveRecords(records) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export default function MuestrasPage() {
  const [activeTab, setActiveTab] = useState('ver');
  const [records, setRecords] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null); // Registro siendo editado en el modal
  const [editMatrix, setEditMatrix] = useState([]); // Matriz de subgrupos temporal en edición
  const [editForm, setEditForm] = useState({}); // Formulario de metadatos temporal en edición

  // Formulario nuevo
  const [form, setForm] = useState({
    producto: '', tipo: 'Fruta', variable: '', unidad: '', analista: '', fecha: '', lse: '', lie: '',
    nSubgrupos: 10, tamSubgrupo: 5, notas: ''
  });
  const [step, setStep] = useState(1);
  const [matrixData, setMatrixData] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setRecords(loadRecords());
  }, []);

  const initMatrix = () => {
    const rows = Array.from({ length: +form.nSubgrupos }, () => Array(+form.tamSubgrupo).fill(''));
    setMatrixData(rows);
    setStep(2);
  };

  const updateCell = (r, c, v) => {
    const next = matrixData.map((row, ri) => ri === r ? row.map((cell, ci) => ci === c ? v : cell) : row);
    setMatrixData(next);
  };

  const handleSaveNew = () => {
    const subgruposNums = matrixData.map(row => row.map(v => parseFloat(v) || 0));
    const newRecord = {
      id: `user_${Date.now()}`,
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
      isAtributo: false,
      isDemo: false
    };

    const updated = [...records, newRecord];
    saveRecords(updated);
    setRecords(updated);
    setSaved(true);
    setStep(3);
  };

  // Borrar entrada completa
  const handleDeleteRecord = (id, event) => {
    event.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar este registro por completo? Esta acción no se puede deshacer.')) {
      const updated = records.filter(r => r.id !== id);
      saveRecords(updated);
      setRecords(updated);
    }
  };

  // Abrir editor detallado de datos
  const handleOpenEdit = (rec) => {
    setEditingRecord(rec);
    setEditForm({ ...rec });
    setEditMatrix(JSON.parse(JSON.stringify(rec.subgruposData))); // Copia profunda
  };

  // Cambiar celda en el editor modal
  const handleUpdateEditCell = (r, c, v) => {
    const next = editMatrix.map((row, ri) => ri === r ? row.map((cell, ci) => ci === c ? v : cell) : row);
    setEditMatrix(next);
  };

  // Borrar fila (subgrupo) individual del registro en edición
  const handleDeleteSubgrupo = (rIndex) => {
    if (editMatrix.length <= 2) {
      alert('Un conjunto de datos requiere al menos 2 subgrupos para poder ser analizado estadísticamente.');
      return;
    }
    const next = editMatrix.filter((_, ri) => ri !== rIndex);
    setEditMatrix(next);
  };

  // Añadir un nuevo subgrupo en blanco
  const handleAddSubgrupo = () => {
    const tam = editingRecord.tam;
    const next = [...editMatrix, Array(tam).fill(0)];
    setEditMatrix(next);
  };

  // Guardar cambios del registro editado
  const handleSaveEdit = () => {
    const isAtributo = editingRecord.isAtributo;
    let finalSubgruposData;

    if (isAtributo) {
      // Para atributos, la estructura es diferente, la guardamos directamente
      finalSubgruposData = editMatrix;
    } else {
      // Para variables, nos aseguramos que todos sean números reales
      finalSubgruposData = editMatrix.map(row => row.map(v => parseFloat(v) || 0));
    }

    const updatedRecords = records.map(r => {
      if (r.id === editingRecord.id) {
        return {
          ...r,
          producto: editForm.producto,
          variableName: editForm.variableName || r.variableName,
          variable: `${editForm.variableName || r.variableName}${editForm.unidad ? ' (' + editForm.unidad + ')' : ''}`,
          unidad: editForm.unidad || '',
          analista: editForm.analista,
          fecha: editForm.fecha,
          lse: editForm.lse || '-',
          lie: editForm.lie || '-',
          lseNum: parseFloat(editForm.lse) || null,
          lieNum: parseFloat(editForm.lie) || null,
          subgrupos: finalSubgruposData.length,
          subgruposData: finalSubgruposData
        };
      }
      return r;
    });

    saveRecords(updatedRecords);
    setRecords(updatedRecords);
    setEditingRecord(null);
  };

  return (
    <>
      <div className="header">
        <div>
          <div className="header-title">Registro de Muestras</div>
          <div className="header-subtitle">Gestión interactiva: consulta, edita valores específicos, borra registros e ingresa nuevos muestreos</div>
        </div>
      </div>
      <div className="page-content fade-in">

        <div className="tabs">
          {[['ver', 'Ver Registros'], ['nuevo', 'Nuevo Registro']].map(([k, l]) => (
            <button key={k} className={`tab ${activeTab === k ? 'active' : ''}`} onClick={() => { setActiveTab(k); setStep(1); setSaved(false); }}>{l}</button>
          ))}
        </div>

        {/* VER REGISTROS */}
        {activeTab === 'ver' && (
          <div className="card">
            <div className="section-header">
              <div>
                <div className="section-title">Muestras y Datos Registrados</div>
                <div className="section-subtitle">
                  {records.length} conjuntos de datos interactivos cargados en el sistema
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}
                  onClick={() => { if (confirm('¿Restablecer todos los datos a la versión de fábrica? Perderás tus cambios.')) { localStorage.removeItem(STORAGE_KEY); setRecords(loadRecords()); } }}>
                  Restablecer Fábrica
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('nuevo')}>+ Nuevo Registro</button>
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Origen</th><th>Producto</th><th>Tipo</th><th>Variable / Atributo</th><th>Analista</th><th>Fecha</th><th>Subgrupos</th><th>n</th><th>LSE</th><th>LIE</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((m, idx) => (
                    <tr key={idx} style={!m.isDemo ? { background: 'rgba(16,185,129,0.04)', borderLeft: '3px solid var(--green-primary)' } : {}}>
                      <td>
                        <span className={`badge ${m.isDemo ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: 10 }}>
                          {m.isDemo ? 'PREDETERMINADO' : 'USUARIO'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.producto}</td>
                      <td><span className="badge badge-secondary" style={{ fontSize: 10 }}>{m.tipo}</span></td>
                      <td>
                        {m.variable} 
                        {m.isAtributo && <span style={{ fontSize: 9, background: 'var(--border)', color: 'var(--text-muted)', marginLeft: 6, padding: '2px 4px', borderRadius: 4 }}>ATRIBUTO ({m.tipoGrafico.toUpperCase()})</span>}
                      </td>
                      <td>{m.analista}</td>
                      <td className="td-num" style={{ fontSize: 12 }}>{m.fecha}</td>
                      <td className="td-num" style={{ fontWeight: 700 }}>{m.subgrupos}</td>
                      <td className="td-num">{m.tam}</td>
                      <td className="td-num">{m.lse}</td>
                      <td className="td-num">{m.lie}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                            onClick={() => handleOpenEdit(m)}>
                            <Edit3 size={12} /> Editar
                          </button>
                          <button className="btn btn-red btn-sm" style={{ padding: '4px 6px', display: 'flex', alignItems: 'center' }}
                            onClick={(e) => handleDeleteRecord(m.id, e)} title="Eliminar este conjunto de datos">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NUEVO REGISTRO */}
        {activeTab === 'nuevo' && (
          <>
            {/* Indicador de pasos */}
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
                <div className="section-title" style={{ marginBottom: 16 }}>Nueva Muestra de Variables</div>
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
                    <textarea className="form-textarea" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Observaciones generales..." />
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
                    <thead>
                      <tr>
                        <th>Subgrupo</th>
                        {Array.from({ length: +form.tamSubgrupo }, (_, i) => <th key={i}>X{i + 1}</th>)}
                        <th>X̄</th><th>R</th>
                      </tr>
                    </thead>
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
                  <button className="btn btn-primary" onClick={handleSaveNew}>Guardar Registro</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="card" style={{ textAlign: 'center', padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <CheckCircle size={64} style={{ color: 'var(--green-light)', marginBottom: 16 }} />
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green-light)', marginBottom: 8 }}>Registro Guardado Exitosamente</div>
                <div style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
                  {form.producto} — {form.variable} ({form.nSubgrupos} subgrupos × n={form.tamSubgrupo})
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => { setStep(1); setSaved(false); setMatrixData([]); setForm({ producto:'',tipo:'Fruta',variable:'',unidad:'',analista:'',fecha:'',lse:'',lie:'',nSubgrupos:10,tamSubgrupo:5,notas:'' }); }}>
                    Nuevo Registro
                  </button>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('ver')}>Ver Registros</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* MODAL DETALLADO DE EDICIÓN Y GESTIÓN DE SUBGRUPOS */}
        {editingRecord && (
          <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: 20
          }}>
            <div className="card modal-content" style={{
              width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto',
              border: '1px solid var(--border)', background: 'var(--bg-card)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--green-light)', margin: 0 }}>
                    ✏️ Detalle de Datos: {editingRecord.producto}
                  </h3>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    Modifica celdas individuales, elimina o añade subgrupos.
                  </p>
                </div>
                <button className="btn btn-secondary" style={{ padding: '6px', borderRadius: '50%' }} onClick={() => setEditingRecord(null)}>
                  <X size={18} />
                </button>
              </div>

              {/* Formulario de Metadatos */}
              <div className="grid-3" style={{ gap: 12, marginBottom: 16, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Producto</label>
                  <input className="form-input" style={{ padding: '6px 10px', fontSize: 13 }} value={editForm.producto} onChange={e => setEditForm(f => ({ ...f, producto: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Variable</label>
                  <input className="form-input" style={{ padding: '6px 10px', fontSize: 13 }} value={editForm.variableName || editForm.variable} onChange={e => setEditForm(f => ({ ...f, variableName: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Unidad</label>
                  <input className="form-input" style={{ padding: '6px 10px', fontSize: 13 }} value={editForm.unidad || ''} onChange={e => setEditForm(f => ({ ...f, unidad: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Analista</label>
                  <input className="form-input" style={{ padding: '6px 10px', fontSize: 13 }} value={editForm.analista} onChange={e => setEditForm(f => ({ ...f, analista: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Fecha</label>
                  <input type="date" className="form-input" style={{ padding: '6px 10px', fontSize: 13 }} value={editForm.fecha} onChange={e => setEditForm(f => ({ ...f, fecha: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>LSE / LIE</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="number" placeholder="LSE" className="form-input" style={{ padding: '6px 10px', fontSize: 13 }} value={editForm.lse === '-' ? '' : editForm.lse} onChange={e => setEditForm(f => ({ ...f, lse: e.target.value }))} />
                    <input type="number" placeholder="LIE" className="form-input" style={{ padding: '6px 10px', fontSize: 13 }} value={editForm.lie === '-' ? '' : editForm.lie} onChange={e => setEditForm(f => ({ ...f, lie: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Matriz interactiva de datos */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Valores Registrados ({editMatrix.length} subgrupos):</div>
                  {!editingRecord.isAtributo && (
                    <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={handleAddSubgrupo}>
                      <Plus size={12} /> Agregar Subgrupo
                    </button>
                  )}
                </div>

                <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {editingRecord.isAtributo ? (
                    /* Tabla para datos de Atributos (p, c) */
                    <table>
                      <thead>
                        <tr>
                          <th>Subgrupo</th>
                          <th>Tamaño de muestra (n)</th>
                          <th>{editingRecord.tipoGrafico === 'p' ? 'Defectuosos (np)' : 'Defectos (c)'}</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editMatrix.map((item, ri) => (
                          <tr key={ri}>
                            <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{ri + 1}</td>
                            <td>
                              <input type="number" className="table-input" value={item.n}
                                onChange={e => {
                                  const next = [...editMatrix];
                                  next[ri].n = parseInt(e.target.value) || 1;
                                  setEditMatrix(next);
                                }} />
                            </td>
                            <td>
                              <input type="number" className="table-input" value={editingRecord.tipoGrafico === 'p' ? item.np : item.c}
                                onChange={e => {
                                  const next = [...editMatrix];
                                  if (editingRecord.tipoGrafico === 'p') {
                                    next[ri].np = parseInt(e.target.value) || 0;
                                  } else {
                                    next[ri].c = parseInt(e.target.value) || 0;
                                  }
                                  setEditMatrix(next);
                                }} />
                            </td>
                            <td>
                              <button className="btn btn-red btn-sm" onClick={() => {
                                if (editMatrix.length <= 2) return alert('Requiere al menos 2 datos.');
                                setEditMatrix(editMatrix.filter((_, idx) => idx !== ri));
                              }}>
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    /* Tabla para datos de Variables (subgrupos 2D) */
                    <table>
                      <thead>
                        <tr>
                          <th>Sg</th>
                          {Array.from({ length: editingRecord.tam }, (_, i) => <th key={i}>X{i + 1}</th>)}
                          <th>X̄</th><th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editMatrix.map((row, ri) => {
                          const nums = row.map(v => parseFloat(v)).filter(v => !isNaN(v));
                          const media = nums.length === row.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : '-';
                          return (
                            <tr key={ri}>
                              <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{ri + 1}</td>
                              {row.map((cell, ci) => (
                                <td key={ci}>
                                  <input type="number" className="table-input" step="any" value={cell}
                                    onChange={e => handleUpdateEditCell(ri, ci, e.target.value)} />
                                </td>
                              ))}
                              <td style={{ color: 'var(--green-light)', fontFamily: 'JetBrains Mono', fontSize: 11 }}>{media}</td>
                              <td>
                                <button className="btn btn-red btn-sm" style={{ padding: 4 }} onClick={() => handleDeleteSubgrupo(ri)} title="Eliminar este subgrupo">
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Botones de acción modal */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <button className="btn btn-secondary" onClick={() => setEditingRecord(null)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={handleSaveEdit}>
                  <Save size={16} /> Guardar Cambios
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

      <style jsx global>{`
        .table-input {
          width: 100%;
          min-width: 60px;
          background: var(--bg-secondary) !important;
          border: 1px solid var(--border) !important;
          color: var(--text-primary) !important;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          text-align: right;
        }
        .table-input:focus {
          border-color: var(--green-primary) !important;
          outline: none;
        }
      `}</style>
    </>
  );
}
