'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, Trash2, Edit3, Plus, X, ArrowLeft, Save } from 'lucide-react';

const STORAGE_KEY = 'agrometric_registros';

// Sanitiza un registro para asegurar que todas las propiedades existan con defaults seguros
function sanitizeRecord(r) {
  if (!r || typeof r !== 'object') return null;
  return {
    id: r.id || `rec_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    producto: r.producto || 'Sin nombre',
    tipo: r.tipo || 'General',
    variable: r.variable || '',
    variableName: r.variableName || r.variable || '',
    unidad: r.unidad || '',
    analista: r.analista || '',
    fecha: r.fecha || '',
    subgrupos: r.subgrupos || 0,
    tam: r.tam || 5,
    lse: r.lse ?? '-',
    lie: r.lie ?? '-',
    lseNum: r.lseNum ?? null,
    lieNum: r.lieNum ?? null,
    estado: r.estado || 'Pendiente',
    subgruposData: Array.isArray(r.subgruposData) ? r.subgruposData : [],
    notas: r.notas || '',
    isAtributo: !!r.isAtributo,
    tipoGrafico: r.tipoGrafico || 'p',
    isDemo: !!r.isDemo,
  };
}

// Funciones de utilidad para cargar y guardar en localStorage de forma segura
function loadRecords() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Sanitizar cada registro y descartar los inválidos
    return parsed.map(sanitizeRecord).filter(Boolean);
  } catch (err) {
    console.error('Error loading records from localStorage:', err);
    return [];
  }
}

function saveRecords(records) {
  if (typeof window === 'undefined') return;
  const safeRecords = Array.isArray(records) ? records : [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safeRecords));
}


export default function MuestrasPage() {
  const [activeTab, setActiveTab] = useState('ver');
  const [records, setRecords] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editMatrix, setEditMatrix] = useState([]);
  const [editForm, setEditForm] = useState({});
  const [loadError, setLoadError] = useState(null);

  // Formulario nuevo
  const [form, setForm] = useState({
    producto: '', tipo: 'Fruta', variable: '', unidad: '', analista: '', fecha: '', lse: '', lie: '',
    nSubgrupos: 10, tamSubgrupo: 5, notas: ''
  });
  const [step, setStep] = useState(1);
  const [matrixData, setMatrixData] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      let loaded = loadRecords();
      // Filtrar demos
      loaded = loaded.filter(r => r && !r.isDemo && !r.id?.startsWith('demo_'));
      saveRecords(loaded);
      setRecords(loaded);
    } catch (err) {
      console.error('Error crítico cargando registros:', err);
      setLoadError(err.message);
      // Resetear localStorage corrupto
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([])); } catch {}
      setRecords([]);
    }
  }, []);

  const initMatrix = () => {
    let cols = +form.tamSubgrupo;
    if (form.isAtributo) {
      cols = form.tipoGrafico === 'p' ? 2 : 1;
    }
    const rows = Array.from({ length: +form.nSubgrupos }, () => Array(cols).fill(''));
    setMatrixData(rows);
    setStep(2);
  };

  const updateCell = (r, c, v) => {
    const next = matrixData.map((row, ri) => ri === r ? row.map((cell, ci) => ci === c ? v : cell) : row);
    setMatrixData(next);
  };

  const handleSaveNew = () => {
    let subgruposData;
    
    if (form.isAtributo) {
      subgruposData = matrixData.map(row => {
        if (form.tipoGrafico === 'p') {
          return { n: parseFloat(row[0]) || 0, np: parseFloat(row[1]) || 0 };
        } else {
          return { c: parseFloat(row[0]) || 0 };
        }
      });
    } else {
      subgruposData = matrixData.map(row => row.map(v => parseFloat(v) || 0));
    }

    const newRecord = {
      id: `user_${Date.now()}`,
      producto: form.producto,
      tipo: form.tipo,
      variable: `${form.variable}${form.unidad ? ' (' + form.unidad + ')' : ''}`,
      unidad: form.unidad,
      variableName: form.variable,
      analista: form.analista,
      fecha: form.fecha || new Date().toISOString().slice(0, 10),
      subgrupos: subgruposData.length,
      tam: form.isAtributo ? '-' : (subgruposData[0]?.length || 0),
      lse: form.lse || '-',
      lie: form.lie || '-',
      lseNum: parseFloat(form.lse) || null,
      lieNum: parseFloat(form.lie) || null,
      estado: 'Analizado',
      subgruposData: subgruposData,
      notas: form.notas,
      isAtributo: form.isAtributo || false,
      tipoGrafico: form.tipoGrafico || 'p',
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
    if (!rec) return;
    setEditingRecord(rec);
    setEditForm({ ...rec });
    try {
      setEditMatrix(JSON.parse(JSON.stringify(rec.subgruposData || [])));
    } catch {
      setEditMatrix([]);
    }
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
    const isAtributo = editingRecord?.isAtributo;
    let newRow;
    if (isAtributo) {
      newRow = editingRecord?.tipoGrafico === 'p' ? { n: 100, np: 0 } : { c: 0 };
    } else {
      const tam = parseInt(editingRecord?.tam) || 5;
      newRow = Array(tam).fill(0);
    }
    const next = [...editMatrix, newRow];
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

  // Si hubo un error crítico al cargar, mostrar interfaz de recuperación
  if (loadError) {
    return (
      <>
        <div className="header">
          <div>
            <div className="header-title">Registro de Muestras</div>
            <div className="header-subtitle">Error de carga detectado</div>
          </div>
        </div>
        <div className="page-content fade-in">
          <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>Datos del navegador corruptos</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 20px auto', lineHeight: 1.6 }}>
              Se detectaron datos inconsistentes en el almacenamiento local de tu navegador. El sistema los ha limpiado automáticamente.
            </p>
            <button className="btn btn-primary" onClick={() => { setLoadError(null); setRecords([]); }}>Continuar con Base de Datos Limpia</button>
          </div>
        </div>
      </>
    );
  }

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
                {records.length > 0 && (
                  <button className="btn btn-secondary btn-sm" style={{ fontSize: 11, borderColor: '#ef4444', color: '#ef4444' }}
                    onClick={() => { if (confirm('¿Estás seguro de que deseas eliminar TODOS los registros guardados? Esta acción no se puede deshacer.')) { localStorage.removeItem(STORAGE_KEY); setRecords([]); } }}>
                    Vaciar Base de Datos
                  </button>
                )}
                <button className="btn btn-primary btn-sm" onClick={() => { setActiveTab('nuevo'); setStep(1); setSaved(false); setForm({ producto: '', tipo: 'Fruta', variable: '', unidad: '', analista: '', fecha: '', lse: '', lie: '', nSubgrupos: 10, tamSubgrupo: 5, notas: '', isAtributo: false, tipoGrafico: 'p' }); }}>+ Nuevo Registro</button>
              </div>
            </div>
            <div className="table-container">
              {records.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.01)', borderRadius: 8 }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>No hay datos registrados</div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 auto 16px auto', maxWidth: 400, lineHeight: 1.5 }}>
                    El sistema está listo para operar con tus propios muestreos. Agrega un nuevo registro manualmente para comenzar a realizar análisis de estabilidad, normalidad y capacidad.
                  </p>
                  <button className="btn btn-primary btn-sm" onClick={() => { setActiveTab('nuevo'); setStep(1); setSaved(false); setForm({ producto: '', tipo: 'Fruta', variable: '', unidad: '', analista: '', fecha: '', lse: '', lie: '', nSubgrupos: 10, tamSubgrupo: 5, notas: '', isAtributo: false, tipoGrafico: 'p' }); }}>
                    + Registrar Primera Muestra
                  </button>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Origen</th><th>Producto</th><th>Tipo</th><th>Variable / Atributo</th><th>Analista</th><th>Fecha</th><th>Subgrupos</th><th>n</th><th>LSE</th><th>LIE</th><th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((m, idx) => (
                      <tr key={idx} style={!m?.isDemo ? { background: 'rgba(16,185,129,0.04)', borderLeft: '3px solid var(--green-primary)' } : {}}>
                        <td>
                          <span className="badge badge-green" style={{ fontSize: 10 }}>
                            USUARIO
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m?.producto || '-'}</td>
                        <td><span className="badge badge-secondary" style={{ fontSize: 10 }}>{m?.tipo || '-'}</span></td>
                        <td>
                          {m?.variable || '-'} 
                          {m?.isAtributo && <span style={{ fontSize: 9, background: 'var(--border)', color: 'var(--text-muted)', marginLeft: 6, padding: '2px 4px', borderRadius: 4 }}>ATRIBUTO ({m?.tipoGrafico?.toUpperCase() || 'P'})</span>}
                        </td>
                        <td>{m?.analista || '-'}</td>
                        <td className="td-num" style={{ fontSize: 12 }}>{m?.fecha || '-'}</td>
                        <td className="td-num" style={{ fontWeight: 700 }}>{m?.subgrupos ?? '-'}</td>
                        <td className="td-num">{m?.tam ?? '-'}</td>
                        <td className="td-num">{m?.lse ?? '-'}</td>
                        <td className="td-num">{m?.lie ?? '-'}</td>
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
              )}
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
                <div className="section-title" style={{ marginBottom: 16 }}>Nueva Muestra de Datos</div>
                <div className="grid-2">
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Tipo de Análisis *</label>
                    <select className="form-select" value={form.isAtributo ? (form.tipoGrafico === 'c' ? 'atributo_c' : 'atributo_p') : 'variable'} 
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'variable') setForm(f => ({ ...f, isAtributo: false, tipoGrafico: 'p' }));
                        else if (val === 'atributo_p') setForm(f => ({ ...f, isAtributo: true, tipoGrafico: 'p' }));
                        else if (val === 'atributo_c') setForm(f => ({ ...f, isAtributo: true, tipoGrafico: 'c' }));
                      }}>
                      <option value="variable">Control de Variables (X̄-R / X̄-S)</option>
                      <option value="atributo_p">Control de Atributos - Gráfico P (Proporción de defectuosos)</option>
                      <option value="atributo_c">Control de Atributos - Gráfico C (Número de defectos)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre del Producto *</label>
                    <input className="form-input" value={form.producto} onChange={e => setForm(f => ({ ...f, producto: e.target.value }))} placeholder="Ej: Aguacate Hass" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Categoría del Producto</label>
                    <select className="form-select" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                      <option>Fruta</option><option>Hortaliza</option><option>Planta Medicinal</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{form.isAtributo ? 'Atributo a Controlar *' : 'Variable a Controlar *'}</label>
                    <input className="form-input" value={form.variable} onChange={e => setForm(f => ({ ...f, variable: e.target.value }))} placeholder={form.isAtributo ? "Ej: Manchas, Golpes, Defectos..." : "Ej: Peso, Diámetro, pH..."} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unidad de Medida</label>
                    <input className="form-input" value={form.unidad} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))} placeholder={form.isAtributo ? "Opcional" : "g, cm, pH, °Brix..."} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre del Analista *</label>
                    <input className="form-input" value={form.analista} onChange={e => setForm(f => ({ ...f, analista: e.target.value }))} placeholder="Nombre completo" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha de Muestreo</label>
                    <input type="date" className="form-input" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
                  </div>
                  {!form.isAtributo && (
                    <>
                      <div className="form-group">
                        <label className="form-label">LSE (Límite Superior Especificación)</label>
                        <input type="number" className="form-input" value={form.lse} onChange={e => setForm(f => ({ ...f, lse: e.target.value }))} placeholder="Opcional" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">LIE (Límite Inferior Especificación)</label>
                        <input type="number" className="form-input" value={form.lie} onChange={e => setForm(f => ({ ...f, lie: e.target.value }))} placeholder="Opcional" />
                      </div>
                    </>
                  )}
                  <div className="form-group">
                    <label className="form-label">Número de Subgrupos (Muestras)</label>
                    <input type="number" className="form-input" value={form.nSubgrupos} min={2} max={100} onChange={e => setForm(f => ({ ...f, nSubgrupos: e.target.value }))} />
                  </div>
                  {!form.isAtributo && (
                    <div className="form-group">
                      <label className="form-label">Tamaño del Subgrupo (n)</label>
                      <select className="form-select" value={form.tamSubgrupo} onChange={e => setForm(f => ({ ...f, tamSubgrupo: e.target.value }))}>
                        {[2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Notas / Observaciones</label>
                    <textarea className="form-textarea" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Observaciones generales..." />
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => {
                  if (!form.producto || !form.variable || !form.analista) {
                    alert('Por favor completa todos los campos requeridos marcados con (*): Producto, Variable/Atributo y Analista.');
                    return;
                  }
                  if (form.nSubgrupos < 2) {
                    alert('Se requiere un mínimo de 2 subgrupos para analizar.');
                    return;
                  }
                  initMatrix();
                }}>
                  Siguiente → Ingresar Datos
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="card">
                <div className="section-title" style={{ marginBottom: 4 }}>Datos por Subgrupo</div>
                <div className="section-subtitle" style={{ marginBottom: 16 }}>
                  {form.isAtributo ? `${form.nSubgrupos} subgrupos de inspección` : `${form.nSubgrupos} subgrupos × ${form.tamSubgrupo} observaciones = ${form.nSubgrupos * form.tamSubgrupo} datos`}
                </div>
                <div className="table-container data-table-input" style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 16 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Subgrupo</th>
                        {!form.isAtributo ? (
                          <>
                            {Array.from({ length: +form.tamSubgrupo }, (_, i) => <th key={i}>X{i + 1}</th>)}
                            <th>X̄</th><th>R</th>
                          </>
                        ) : form.tipoGrafico === 'p' ? (
                          <>
                            <th>Tamaño de Muestra (n)</th>
                            <th>Piezas Defectuosas (np)</th>
                            <th>Proporción (p)</th>
                          </>
                        ) : (
                          <th>Número de Defectos (c)</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {matrixData.map((row, ri) => {
                        const nums = row.map(v => parseFloat(v)).filter(v => !isNaN(v));
                        
                        let media = '-', rango = '-', prop = '-';
                        if (!form.isAtributo) {
                          media = nums.length === row.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : '-';
                          rango = nums.length === row.length ? (Math.max(...nums) - Math.min(...nums)).toFixed(2) : '-';
                        } else if (form.tipoGrafico === 'p') {
                          if (nums.length === 2 && nums[0] > 0) {
                            prop = (nums[1] / nums[0]).toFixed(4);
                          }
                        }

                        return (
                          <tr key={ri}>
                            <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{ri + 1}</td>
                            {row.map((cell, ci) => (
                              <td key={ci}>
                                <input type="number" step="any" value={cell} placeholder="0"
                                  onChange={e => updateCell(ri, ci, e.target.value)} />
                              </td>
                            ))}
                            {!form.isAtributo ? (
                              <>
                                <td style={{ color: 'var(--green-light)', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{media}</td>
                                <td style={{ color: '#f59e0b', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{rango}</td>
                              </>
                            ) : form.tipoGrafico === 'p' ? (
                              <td style={{ color: 'var(--green-light)', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{prop}</td>
                            ) : null}
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
                  <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={handleAddSubgrupo}>
                    <Plus size={12} /> Agregar Subgrupo
                  </button>
                </div>

                <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {editingRecord.isAtributo ? (
                        <table>
                      <thead>
                        <tr>
                          <th>Subgrupo</th>
                          {editingRecord.tipoGrafico === 'p' && <th>Tamaño de muestra (n)</th>}
                          <th>{editingRecord.tipoGrafico === 'p' ? 'Defectuosos (np)' : 'Defectos (c)'}</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editMatrix.map((item, ri) => (
                          <tr key={ri}>
                            <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{ri + 1}</td>
                            {editingRecord.tipoGrafico === 'p' && (
                              <td>
                                <input type="number" className="table-input" value={item.n ?? ''}
                                  onChange={e => {
                                    const next = [...editMatrix];
                                    next[ri].n = parseInt(e.target.value) || 1;
                                    setEditMatrix(next);
                                  }} />
                              </td>
                            )}
                            <td>
                              <input type="number" className="table-input" value={(editingRecord.tipoGrafico === 'p' ? item.np : item.c) ?? ''}
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
                          {Array.from({ length: parseInt(editingRecord?.tam) || (editMatrix[0]?.length || 5) }, (_, i) => <th key={i}>X{i + 1}</th>)}
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
