'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Trash2, 
  Edit3, 
  Plus, 
  X, 
  ArrowLeft, 
  Save, 
  ClipboardList, 
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  User,
  Calendar,
  Layers,
  Activity
} from 'lucide-react';
import { aguacatePeso, aloeAltura, manzanillaP, tomateDefectos } from '../../lib/data';

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
    notes: typeof r.notas === 'string' ? r.notas.trim() : '',
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

    // Si no contiene registros sembrados, sembramos de inmediato
    const hasSeeded = clean.some(r => r && r.id && r.id.startsWith('seeded_'));
    if (!hasSeeded) {
      const seededRecords = [
        {
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
        {
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
        {
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
        {
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
      ].map(safeSanitize).filter(Boolean);

      clean = [...clean.filter(r => !r.id.startsWith('seeded_')), ...seededRecords];
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

export default function MuestrasPage() {
  // Evitar Hydration Mismatches
  const [mounted, setMounted] = useState(false);
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('ver');
  const [step, setStep] = useState(1);
  const [saved, setSaved] = useState(false);

  // Formulario nuevo registro
  const [form, setForm] = useState({
    producto: '',
    tipo: 'Fruta',
    variableName: '',
    unidad: '',
    analista: '',
    fecha: '',
    lse: '',
    lie: '',
    nSubgrupos: 10,
    tamSubgrupo: 5,
    isAtributo: false,
    tipoGrafico: 'p',
    notas: ''
  });

  const [matrixData, setMatrixData] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editMatrix, setEditMatrix] = useState([]);
  const [integrityError, setIntegrityError] = useState(null);

  // Efecto inicial de montaje
  useEffect(() => {
    setMounted(true);
    try {
      const loaded = getSafeRecords();
      setRecords(loaded);
      saveSafeRecords(loaded); // Reescribir sanitizados de inmediato
    } catch (err) {
      console.error('Error durante la hidratación de datos:', err);
      setIntegrityError(err.message);
    }
  }, []);

  // Inicializar matriz de datos para creación
  const initMatrix = () => {
    const numRows = Math.max(2, Math.min(100, parseInt(form.nSubgrupos) || 10));
    const isAtrib = !!form.isAtributo;
    let newMatrix = [];

    if (isAtrib) {
      if (form.tipoGrafico === 'p' || form.tipoGrafico === 'np' || form.tipoGrafico === 'u') {
        newMatrix = Array.from({ length: numRows }, () => [100, 0]); // [Tamaño n, Defectuosos np o Defectos c]
      } else {
        newMatrix = Array.from({ length: numRows }, () => [0]); // [Defectos c]
      }
    } else {
      const numCols = Math.max(2, Math.min(25, parseInt(form.tamSubgrupo) || 5));
      newMatrix = Array.from({ length: numRows }, () => Array(numCols).fill(''));
    }
    
    setMatrixData(newMatrix);
    setStep(2);
  };

  const updateCell = (rIndex, cIndex, value) => {
    const copy = matrixData.map((row, ri) => {
      if (ri !== rIndex) return row;
      return row.map((cell, ci) => (ci === cIndex ? value : cell));
    });
    setMatrixData(copy);
  };

  const handleSaveNew = () => {
    try {
      const isAtrib = !!form.isAtributo;
      let finalSubgruposData = [];

      if (isAtrib) {
        finalSubgruposData = matrixData.map(row => {
          if (form.tipoGrafico === 'p' || form.tipoGrafico === 'np') {
            return {
              n: Math.max(1, parseInt(row[0]) || 100),
              np: Math.max(0, parseInt(row[1]) || 0)
            };
          } else if (form.tipoGrafico === 'u') {
            return {
              n: Math.max(1, parseInt(row[0]) || 100),
              c: Math.max(0, parseInt(row[1]) || 0)
            };
          } else {
            return {
              c: Math.max(0, parseInt(row[0]) || 0)
            };
          }
        });
      } else {
        finalSubgruposData = matrixData.map(row => 
          row.map(val => {
            const parsed = parseFloat(val);
            return isNaN(parsed) ? 0 : parsed;
          })
        );
      }

      const lseStr = form.lse && form.lse.trim() !== '' ? form.lse.trim() : '-';
      const lieStr = form.lie && form.lie.trim() !== '' ? form.lie.trim() : '-';

      const newRecordRaw = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        producto: form.producto || 'Sin Nombre',
        tipo: form.tipo || 'Fruta',
        variableName: form.variableName || 'Variable',
        unidad: form.unidad || '',
        variable: form.unidad ? `${form.variableName} (${form.unidad})` : form.variableName,
        analista: form.analista || 'Analista',
        fecha: form.fecha || new Date().toISOString().split('T')[0],
        lse: lseStr,
        lie: lieStr,
        estado: 'Analizado',
        subgruposData: finalSubgruposData,
        notas: form.notas || '',
        isAtributo: isAtrib,
        tipoGrafico: form.tipoGrafico,
        isDemo: false
      };

      const sanitized = safeSanitize(newRecordRaw);
      if (!sanitized) throw new Error('No se pudo sanitizar el nuevo registro.');

      const nextRecords = [...records, sanitized];
      setRecords(nextRecords);
      saveSafeRecords(nextRecords);
      setSaved(true);
      setStep(3);
    } catch (err) {
      alert(`Error al guardar el registro: ${err.message}`);
    }
  };

  const handleDeleteRecord = (id, event) => {
    event.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar este registro por completo? Esta acción no se puede deshacer.')) {
      const next = records.filter(r => r.id !== id);
      setRecords(next);
      saveSafeRecords(next);
    }
  };

  const handleOpenEdit = (rec) => {
    if (!rec) return;
    setEditingRecord(rec);
    setEditForm({
      producto: rec.producto || '',
      variableName: rec.variableName || '',
      unidad: rec.unidad || '',
      analista: rec.analista || '',
      fecha: rec.fecha || '',
      lse: rec.lse === '-' ? '' : rec.lse,
      lie: rec.lie === '-' ? '' : rec.lie,
      notas: rec.notas || ''
    });
    try {
      setEditMatrix(JSON.parse(JSON.stringify(rec.subgruposData || [])));
    } catch {
      setEditMatrix([]);
    }
  };

  const handleUpdateEditCell = (rIndex, cIndex, value) => {
    const next = editMatrix.map((row, ri) => {
      if (ri !== rIndex) return row;
      if (editingRecord?.isAtributo) {
        let key = 'c';
        if (editingRecord.tipoGrafico === 'p' || editingRecord.tipoGrafico === 'np') {
          key = cIndex === 0 ? 'n' : 'np';
        } else if (editingRecord.tipoGrafico === 'u') {
          key = cIndex === 0 ? 'n' : 'c';
        }
        return {
          ...row,
          [key]: value === '' ? '' : (parseInt(value) || 0)
        };
      } else {
        return row.map((cell, ci) => (ci === cIndex ? value : cell));
      }
    });
    setEditMatrix(next);
  };

  const handleDeleteSubgrupo = (rIndex) => {
    if (editMatrix.length <= 2) {
      alert('Se requieren al menos 2 subgrupos para un correcto análisis estadístico.');
      return;
    }
    setEditMatrix(editMatrix.filter((_, ri) => ri !== rIndex));
  };

  const handleAddSubgrupo = () => {
    let newRow;
    if (editingRecord?.isAtributo) {
      if (editingRecord.tipoGrafico === 'p' || editingRecord.tipoGrafico === 'np') {
        newRow = { n: 100, np: 0 };
      } else if (editingRecord.tipoGrafico === 'u') {
        newRow = { n: 100, c: 0 };
      } else {
        newRow = { c: 0 };
      }
    } else {
      const tam = parseInt(editingRecord?.tam) || 5;
      newRow = Array(tam).fill(0);
    }
    setEditMatrix([...editMatrix, newRow]);
  };

  const handleSaveEdit = () => {
    if (!editingRecord) return;
    try {
      const isAtrib = !!editingRecord.isAtributo;
      let finalSubgruposData = [];

      if (isAtrib) {
        finalSubgruposData = editMatrix.map(row => {
          if (editingRecord.tipoGrafico === 'p' || editingRecord.tipoGrafico === 'np') {
            return {
              n: Math.max(1, parseInt(row.n) || 100),
              np: Math.max(0, parseInt(row.np) || 0)
            };
          } else if (editingRecord.tipoGrafico === 'u') {
            return {
              n: Math.max(1, parseInt(row.n) || 100),
              c: Math.max(0, parseInt(row.c) || 0)
            };
          } else {
            return {
              c: Math.max(0, parseInt(row.c) || 0)
            };
          }
        });
      } else {
        finalSubgruposData = editMatrix.map(row => 
          row.map(val => {
            const parsed = parseFloat(val);
            return isNaN(parsed) ? 0 : parsed;
          })
        );
      }

      const lseStr = editForm.lse && String(editForm.lse).trim() !== '' ? String(editForm.lse).trim() : '-';
      const lieStr = editForm.lie && String(editForm.lie).trim() !== '' ? String(editForm.lie).trim() : '-';

      const updatedRecordRaw = {
        ...editingRecord,
        producto: editForm.producto || 'Sin Nombre',
        variableName: editForm.variableName || 'Variable',
        unidad: editForm.unidad || '',
        variable: editForm.unidad ? `${editForm.variableName} (${editForm.unidad})` : editForm.variableName,
        analista: editForm.analista || 'Analista',
        fecha: editForm.fecha || new Date().toISOString().split('T')[0],
        lse: lseStr,
        lie: lieStr,
        subgruposData: finalSubgruposData,
        notas: editForm.notas || ''
      };

      const sanitized = safeSanitize(updatedRecordRaw);
      if (!sanitized) throw new Error('Sanitización fallida al editar.');

      const nextRecords = records.map(r => (r.id === editingRecord.id ? sanitized : r));
      setRecords(nextRecords);
      saveSafeRecords(nextRecords);
      setEditingRecord(null);
    } catch (err) {
      alert(`Error al actualizar cambios: ${err.message}`);
    }
  };

  const handleResetDatabase = () => {
    if (confirm('¿Estás seguro de que deseas eliminar TODOS los registros guardados? Esta acción eliminará permanentemente todos tus datos ingresados.')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      setRecords([]);
    }
  };

  // Renderizado defensivo pre-hidratación
  if (!mounted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <RefreshCw className="animate-spin" size={40} style={{ color: 'var(--green-light)' }} />
        <div style={{ color: 'var(--text-muted)', fontSize: 14, fontFamily: 'Outfit, sans-serif' }}>Iniciando entorno interactivo seguro...</div>
      </div>
    );
  }

  // Interfaz de recuperación ante fallos catastróficos
  if (integrityError) {
    return (
      <div className="page-content fade-in" style={{ padding: '60px 20px' }}>
        <div className="card" style={{ maxWidth: 550, margin: '0 auto', textAlign: 'center', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.02)' }}>
          <AlertTriangle size={54} style={{ color: '#ef4444', marginBottom: 16, margin: '0 auto' }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ef4444', marginBottom: 12 }}>Conflicto de Datos en el Navegador</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
            El sistema detectó datos corruptos o incompatibles almacenados localmente en su sesión. 
            Para reestablecer la funcionalidad inmediatamente, podemos realizar una limpieza rápida.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => {
              if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
              setIntegrityError(null);
              setRecords([]);
            }}>Reestablecer Sesión y Limpiar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Cabecera Premium */}
      <div className="header" style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(4, 120, 87, 0.03) 100%)',
        padding: '32px',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        marginBottom: '28px'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <ClipboardList style={{ color: 'var(--green-light)' }} size={24} />
            <h1 className="header-title" style={{ margin: 0, fontSize: '26px', fontWeight: 800, background: 'linear-gradient(to right, #ffffff, #a7f3d0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Registro Estadístico de Muestras
            </h1>
          </div>
          <p className="header-subtitle" style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13.5px', maxWidth: '650px', lineHeight: 1.5 }}>
            Registre, edite y gestione conjuntos de datos de variables y atributos agrícolas de manera segura con control interactivo en tiempo real.
          </p>
        </div>
        <div style={{
          position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
          filter: 'blur(30px)', pointerEvents: 'none'
        }} />
      </div>

      <div className="page-content fade-in">
        {/* Pestañas de Control */}
        <div className="tabs" style={{
          display: 'flex', gap: 12, marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '8px'
        }}>
          {[
            { id: 'ver', label: 'Ver Registros Guardados', count: records.length },
            { id: 'nuevo', label: 'Ingresar Nuevo Registro', count: null }
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                setStep(1);
                setSaved(false);
              }}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                background: activeTab === tab.id ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                color: activeTab === tab.id ? 'var(--green-light)' : 'var(--text-muted)'
              }}
            >
              {tab.label}
              {tab.count !== null && (
                <span style={{
                  fontSize: '10.5px',
                  background: activeTab === tab.id ? 'var(--green-primary)' : 'var(--border)',
                  color: '#ffffff',
                  padding: '1.5px 6px',
                  borderRadius: '10px',
                  fontWeight: 700
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: VISUALIZAR REGISTROS */}
        {activeTab === 'ver' && (
          <div className="card" style={{ border: '1px solid var(--border)', borderRadius: '12px' }}>
            <div className="section-header" style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: '20px'
            }}>
              <div>
                <h3 className="section-title" style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Muestras en Memoria</h3>
                <p className="section-subtitle" style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Visualice, edite o elimine las muestras que alimentan los gráficos y reportes del sistema.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {records.length > 0 && (
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={handleResetDatabase}
                    style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Trash2 size={13} /> Vaciar Base de Datos
                  </button>
                )}
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={() => {
                    setActiveTab('nuevo');
                    setStep(1);
                    setSaved(false);
                    setForm({
                      producto: '', tipo: 'Fruta', variableName: '', unidad: '', analista: '', fecha: '', lse: '', lie: '',
                      nSubgrupos: 10, tamSubgrupo: 5, isAtributo: false, tipoGrafico: 'p', notas: ''
                    });
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <PlusCircle size={14} /> Registrar Muestra
                </button>
              </div>
            </div>

            {records.length === 0 ? (
              <div style={{ padding: '64px 20px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                <div style={{ fontSize: '42px', marginBottom: '14px' }}>📂</div>
                <h4 style={{ fontSize: '15.5px', fontWeight: 700, margin: '0 0 6px 0' }}>Base de Datos de Muestras Vacía</h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 auto 20px auto', maxWidth: '440px', lineHeight: 1.6 }}>
                  Registre sus mediciones variables o recuentos de atributos directamente para activar los cálculos automáticos de estabilidad, histogramas y capacidad de procesos.
                </p>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setActiveTab('nuevo');
                    setStep(1);
                    setSaved(false);
                  }}
                >
                  Registrar Primera Muestra
                </button>
              </div>
            ) : (
              <div className="table-container" style={{ overflowX: 'auto', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 14px', textAlign: 'left' }}>Muestra</th>
                      <th style={{ padding: '12px 14px', textAlign: 'left' }}>Tipo</th>
                      <th style={{ padding: '12px 14px', textAlign: 'left' }}>Variable / Atributo</th>
                      <th style={{ padding: '12px 14px', textAlign: 'left' }}>Analista</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Fecha</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Subgrupos</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>n</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>LIE</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>LSE</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((m, idx) => (
                      <tr 
                        key={m.id || idx} 
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: 'rgba(16, 185, 129, 0.02)',
                          borderLeft: '3px solid var(--green-primary)',
                          transition: 'background 0.2s ease'
                        }}
                      >
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#ffffff' }}>
                          {m.producto}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className="badge badge-secondary" style={{ fontSize: '10.5px', padding: '3px 7px' }}>
                            {m.tipo}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 500 }}>{m.variable}</span>
                            {m.isAtributo && (
                              <span style={{
                                fontSize: '9px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontWeight: 700
                              }}>
                                ATRIBUTO ({m.tipoGrafico?.toUpperCase()})
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{m.analista}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>{m.fecha}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>{m.subgrupos}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: 'var(--text-muted)' }}>{m.tam}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: m.lie !== '-' ? 'var(--green-light)' : 'var(--text-muted)' }}>{m.lie}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: m.lse !== '-' ? '#ef4444' : 'var(--text-muted)' }}>{m.lse}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button 
                              className="btn btn-secondary btn-sm" 
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: '11.5px' }}
                              onClick={() => handleOpenEdit(m)}
                            >
                              <Edit3 size={12} /> Editar
                            </button>
                            <button 
                              className="btn btn-red btn-sm" 
                              style={{ display: 'flex', alignItems: 'center', padding: '5px', borderRadius: '6px' }}
                              onClick={(e) => handleDeleteRecord(m.id, e)}
                              title="Eliminar registro"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REGISTRAR MUESTRA */}
        {activeTab === 'nuevo' && (
          <>
            {/* Control de Pasos */}
            <div style={{
              display: 'flex', gap: 16, marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap',
              background: 'rgba(255, 255, 255, 0.01)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)'
            }}>
              {[
                { label: 'Configuración General', stepNum: 1 },
                { label: 'Entrada de Muestras', stepNum: 2 },
                { label: 'Confirmación', stepNum: 3 }
              ].map((s, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 800,
                    background: step > s.stepNum ? 'var(--green-primary)' : step === s.stepNum ? 'var(--green-dark)' : 'transparent',
                    border: `2px solid ${step >= s.stepNum ? 'var(--green-primary)' : 'var(--border)'}`,
                    color: step >= s.stepNum ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.3s ease'
                  }}>
                    {step > s.stepNum ? '✓' : s.stepNum}
                  </div>
                  <span style={{
                    fontSize: '12.5px',
                    fontWeight: step === s.stepNum ? 700 : 500,
                    color: step === s.stepNum ? 'var(--green-light)' : 'var(--text-muted)'
                  }}>
                    {s.label}
                  </span>
                  {idx < 2 && <div style={{ width: '30px', height: '1.5px', background: step > s.stepNum ? 'var(--green-primary)' : 'var(--border)' }} />}
                </div>
              ))}
            </div>

            {/* PASO 1: METADATOS Y TAMAÑO */}
            {step === 1 && (
              <div className="card" style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  📊 Parámetros del Control Estadístico
                </h3>
                
                <div className="grid-2" style={{ gap: '16px 20px', marginBottom: '24px' }}>
                  
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Tipo de Control Estadístico *</label>
                    <select 
                      className="form-select" 
                      value={form.isAtributo ? `atributo_${form.tipoGrafico}` : 'variable'}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'variable') {
                          setForm(f => ({ ...f, isAtributo: false, tipoGrafico: 'p' }));
                        } else if (val.startsWith('atributo_')) {
                          const graphType = val.replace('atributo_', '');
                          setForm(f => ({ ...f, isAtributo: true, tipoGrafico: graphType }));
                        }
                      }}
                      style={{ padding: '10px' }}
                    >
                      <option value="variable">Control por Variables Continuas (Gráficos X̄-R y X̄-S)</option>
                      <option value="atributo_p">Control por Atributos (Gráfico P - Proporción Defectuosa)</option>
                      <option value="atributo_np">Control por Atributos (Gráfico NP - Número de Defectuosos)</option>
                      <option value="atributo_c">Control por Atributos (Gráfico C - Recuento de Defectos)</option>
                      <option value="atributo_u">Control por Atributos (Gráfico U - Defectos por Unidad)</option>
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
                    <label className="form-label" style={{ fontWeight: 600 }}>Categoría / Variedad</label>
                    <select 
                      className="form-select" 
                      value={form.tipo} 
                      onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                      style={{ padding: '9px 12px' }}
                    >
                      <option>Fruta</option>
                      <option>Hortaliza</option>
                      <option>Tubérculo</option>
                      <option>Granos / Cereales</option>
                      <option>Procesados / Empacados</option>
                      <option>Otro</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      {form.isAtributo ? 'Atributo Controlado *' : 'Variable de Medición *'}
                    </label>
                    <input 
                      className="form-input" 
                      value={form.variableName} 
                      onChange={e => setForm(f => ({ ...f, variableName: e.target.value }))} 
                      placeholder={form.isAtributo ? "Ej: Golpes en Tránsito, Presencia de Plaga..." : "Ej: Diámetro Ecuatorial, Firmeza, Peso..."}
                      style={{ padding: '9px 12px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Unidad de Medida</label>
                    <input 
                      className="form-input" 
                      value={form.unidad} 
                      onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))} 
                      placeholder={form.isAtributo ? "Ej: Porcentaje, defectos/caja" : "Ej: mm, g, °Brix, pH..."}
                      style={{ padding: '9px 12px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Inspector / Analista *</label>
                    <input 
                      className="form-input" 
                      value={form.analista} 
                      onChange={e => setForm(f => ({ ...f, analista: e.target.value }))} 
                      placeholder="Ingrese nombre del analista"
                      style={{ padding: '9px 12px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Fecha de Registro</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={form.fecha} 
                      onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                      style={{ padding: '9px 12px' }}
                    />
                  </div>

                  {!form.isAtributo && (
                    <>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600 }}>Límite Inferior Especificación (LIE)</label>
                        <input 
                          type="number" 
                          step="any"
                          className="form-input" 
                          value={form.lie} 
                          onChange={e => setForm(f => ({ ...f, lie: e.target.value }))} 
                          placeholder="Mínimo aceptable de calidad (Opcional)"
                          style={{ padding: '9px 12px' }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600 }}>Límite Superior Especificación (LSE)</label>
                        <input 
                          type="number" 
                          step="any"
                          className="form-input" 
                          value={form.lse} 
                          onChange={e => setForm(f => ({ ...f, lse: e.target.value }))} 
                          placeholder="Máximo aceptable de calidad (Opcional)"
                          style={{ padding: '9px 12px' }}
                        />
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Número de Subgrupos / Muestreos *</label>
                    <input 
                      type="number" 
                      min={2} 
                      max={100}
                      className="form-input" 
                      value={form.nSubgrupos} 
                      onChange={e => setForm(f => ({ ...f, nSubgrupos: e.target.value }))}
                      style={{ padding: '9px 12px' }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Recomendado: 10 - 25 subgrupos para estabilidad estadística.
                    </span>
                  </div>

                  {!form.isAtributo && (
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Tamaño del Subgrupo (n) *</label>
                      <select 
                        className="form-select" 
                        value={form.tamSubgrupo} 
                        onChange={e => setForm(f => ({ ...f, tamSubgrupo: e.target.value }))}
                        style={{ padding: '9px 12px' }}
                      >
                        {[2,3,4,5,6,7,8,9,10,12,15].map(n => (
                          <option key={n} value={n}>n = {n} observaciones</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Notas / Observaciones del Lote</label>
                    <textarea 
                      className="form-textarea" 
                      value={form.notas} 
                      onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} 
                      placeholder="Condiciones climáticas, procedencia del lote, anomalías observadas..."
                      style={{ padding: '10px', minHeight: '80px', borderRadius: '8px' }}
                    />
                  </div>

                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      if (!form.producto.trim() || !form.variableName.trim() || !form.analista.trim()) {
                        alert('Por favor complete los campos obligatorios (*): Producto, Variable/Atributo e Inspector.');
                        return;
                      }
                      const sg = parseInt(form.nSubgrupos);
                      if (isNaN(sg) || sg < 2 || sg > 100) {
                        alert('El número de subgrupos debe ser un número entero entre 2 y 100.');
                        return;
                      }
                      initMatrix();
                    }}
                    style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    Establecer Matriz de Muestreo →
                  </button>
                </div>
              </div>
            )}

            {/* PASO 2: MATRIZ DE ENTRADA INTERACTIVA */}
            {step === 2 && (
              <div className="card" style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0', fontSize: '16px', fontWeight: 700 }}>
                      ✍️ Captura de Datos de Campo
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      Complete los valores de cada muestreo. Medias y estadísticos en tiempo real a la derecha.
                    </p>
                  </div>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)',
                    padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: 'var(--green-light)'
                  }}>
                    {form.isAtributo 
                      ? `Atributos: ${form.tipoGrafico?.toUpperCase()} - ${form.nSubgrupos} Evaluaciones` 
                      : `Variables: ${form.nSubgrupos} subgrupos × n=${form.tamSubgrupo} (Total: ${parseInt(form.nSubgrupos) * parseInt(form.tamSubgrupo)} datos)`
                    }
                  </div>
                </div>

                <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.02)', position: 'sticky', top: 0, zIndex: 10, boxShadow: 'inset 0 -1px 0 var(--border)' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'center', width: '60px' }}>Subgrupo</th>
                        {!form.isAtributo ? (
                          <>
                            {Array.from({ length: parseInt(form.tamSubgrupo) }, (_, i) => (
                              <th key={i} style={{ padding: '10px 12px', textAlign: 'center' }}>Dato {i + 1}</th>
                            ))}
                            <th style={{ padding: '10px 12px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.02)', color: 'var(--green-light)' }}>Media (X̄)</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', background: 'rgba(245, 158, 11, 0.02)', color: '#f59e0b' }}>Rango (R)</th>
                          </>
                        ) : (form.tipoGrafico === 'p' || form.tipoGrafico === 'np') ? (
                          <>
                            <th style={{ padding: '10px 12px', textAlign: 'center' }}>Tamaño Muestra (n)</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center' }}>Defectuosos (np)</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--green-light)' }}>Proporción (p)</th>
                          </>
                        ) : form.tipoGrafico === 'u' ? (
                          <>
                            <th style={{ padding: '10px 12px', textAlign: 'center' }}>Tamaño Muestra (n)</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center' }}>Recuento Defectos (c)</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--green-light)' }}>Defectos/Unidad (u)</th>
                          </>
                        ) : (
                          <th style={{ padding: '10px 12px', textAlign: 'center' }}>Recuento Defectos (c)</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {matrixData.map((row, ri) => {
                        const parsedRow = row.map(v => parseFloat(v)).filter(v => !isNaN(v));
                        
                        let media = '-';
                        let rango = '-';
                        let p = '-';

                        if (!form.isAtributo) {
                          if (parsedRow.length === row.length && row.length > 0) {
                            const sum = parsedRow.reduce((a, b) => a + b, 0);
                            media = (sum / row.length).toFixed(3);
                            rango = (Math.max(...parsedRow) - Math.min(...parsedRow)).toFixed(3);
                          }
                        } else if (form.tipoGrafico === 'p' || form.tipoGrafico === 'np') {
                          const nVal = parseFloat(row[0]);
                          const npVal = parseFloat(row[1]);
                          if (!isNaN(nVal) && !isNaN(npVal) && nVal > 0) {
                            p = (npVal / nVal).toFixed(4);
                          }
                        } else if (form.tipoGrafico === 'u') {
                          const nVal = parseFloat(row[0]);
                          const cVal = parseFloat(row[1]);
                          if (!isNaN(nVal) && !isNaN(cVal) && nVal > 0) {
                            p = (cVal / nVal).toFixed(4);
                          }
                        }

                        return (
                          <tr key={ri} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.01)' }}>
                              {ri + 1}
                            </td>
                            {row.map((cell, ci) => (
                              <td key={ci} style={{ padding: '6px 8px' }}>
                                <input 
                                  type="number" 
                                  step="any"
                                  placeholder="0"
                                  value={cell}
                                  onChange={e => updateCell(ri, ci, e.target.value)}
                                  style={{
                                    width: '100%',
                                    background: 'var(--bg-secondary)',
                                    color: '#ffffff',
                                    border: '1px solid var(--border)',
                                    borderRadius: '4px',
                                    padding: '6px 10px',
                                    textAlign: 'right',
                                    fontFamily: 'JetBrains Mono, monospace',
                                    fontSize: '12px'
                                  }}
                                />
                              </td>
                            ))}

                            {!form.isAtributo ? (
                              <>
                                <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--green-light)', fontFamily: 'JetBrains Mono', background: 'rgba(16, 185, 129, 0.01)' }}>
                                  {media}
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#f59e0b', fontFamily: 'JetBrains Mono', background: 'rgba(245, 158, 11, 0.01)' }}>
                                  {rango}
                                </td>
                              </>
                            ) : (form.tipoGrafico === 'p' || form.tipoGrafico === 'np' || form.tipoGrafico === 'u') ? (
                              <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--green-light)', fontFamily: 'JetBrains Mono' }}>
                                {p}
                              </td>
                            ) : null}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setStep(1)}
                    style={{ padding: '9px 18px', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <ArrowLeft size={14} /> Atrás
                  </button>

                  <button 
                    className="btn btn-primary" 
                    onClick={handleSaveNew}
                    style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Save size={14} /> Procesar y Guardar Registro
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3: CONFIRMACIÓN DE ÉXITO */}
            {step === 3 && (
              <div className="card" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: '600px', margin: '0 auto', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto'
                }}>
                  <CheckCircle size={36} style={{ color: 'var(--green-light)' }} />
                </div>
                
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--green-light)', margin: '0 0 8px 0' }}>
                  ¡Registro Guardado Exitosamente!
                </h3>
                
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 auto 24px auto', maxWidth: '400px', lineHeight: 1.5 }}>
                  Los datos de <strong>{form.producto}</strong> para la variable/atributo <strong>{form.variableName}</strong> han sido consolidados de forma segura en su almacenamiento local.
                </p>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '14px', marginBottom: '28px', textAlign: 'left',
                  display: 'flex', flexDirection: 'column', gap: 6, fontSize: '12.5px'
                }}>
                  <div>👤 <strong>Inspector:</strong> {form.analista}</div>
                  <div>📅 <strong>Fecha:</strong> {form.fecha || new Date().toISOString().split('T')[0]}</div>
                  <div>📦 <strong>Muestreo:</strong> {form.nSubgrupos} subgrupos {!form.isAtributo && `× n=${form.tamSubgrupo}`}</div>
                  {form.lie && <div>📉 <strong>Límite Calidad LIE:</strong> {form.lie}</div>}
                  {form.lse && <div>📈 <strong>Límite Calidad LSE:</strong> {form.lse}</div>}
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      setStep(1);
                      setSaved(false);
                      setForm({
                        producto: '', tipo: 'Fruta', variableName: '', unidad: '', analista: '', fecha: '', lse: '', lie: '',
                        nSubgrupos: 10, tamSubgrupo: 5, isAtributo: false, tipoGrafico: 'p', notas: ''
                      });
                    }}
                  >
                    Nuevo Muestreo
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setActiveTab('ver')}
                  >
                    Ver Bandeja de Muestras
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* MODAL DE EDICIÓN AVANZADO */}
        {editingRecord && (
          <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: '20px', backdropFilter: 'blur(4px)'
          }}>
            <div className="card modal-content" style={{
              width: '100%', maxWidth: '880px', maxHeight: '90vh', overflowY: 'auto',
              border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: '12px',
              padding: '24px'
            }}>
              
              {/* Cabecera Modal */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px'
              }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--green-light)', margin: 0 }}>
                    ✏️ Editor de Datos: {editingRecord.producto}
                  </h3>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    Modifique campos de identificación o altere celdas de mediciones individuales.
                  </p>
                </div>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '6px', borderRadius: '50%', minWidth: 'auto' }}
                  onClick={() => setEditingRecord(null)}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Formulario Metadatos */}
              <div className="grid-3" style={{
                gap: 12, marginBottom: '20px', background: 'rgba(255, 255, 255, 0.01)',
                padding: '14px', borderRadius: '8px', border: '1px solid var(--border)'
              }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 600 }}>Producto</label>
                  <input 
                    className="form-input" 
                    style={{ padding: '6px 10px', fontSize: '12.5px' }}
                    value={editForm.producto} 
                    onChange={e => setEditForm(f => ({ ...f, producto: e.target.value }))} 
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 600 }}>Variable / Atributo</label>
                  <input 
                    className="form-input" 
                    style={{ padding: '6px 10px', fontSize: '12.5px' }}
                    value={editForm.variableName} 
                    onChange={e => setEditForm(f => ({ ...f, variableName: e.target.value }))} 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 600 }}>Unidad</label>
                  <input 
                    className="form-input" 
                    style={{ padding: '6px 10px', fontSize: '12.5px' }}
                    value={editForm.unidad} 
                    onChange={e => setEditForm(f => ({ ...f, unidad: e.target.value }))} 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 600 }}>Analista</label>
                  <input 
                    className="form-input" 
                    style={{ padding: '6px 10px', fontSize: '12.5px' }}
                    value={editForm.analista} 
                    onChange={e => setEditForm(f => ({ ...f, analista: e.target.value }))} 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 600 }}>Fecha</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    style={{ padding: '6px 10px', fontSize: '12.5px' }}
                    value={editForm.fecha} 
                    onChange={e => setEditForm(f => ({ ...f, fecha: e.target.value }))} 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 600 }}>Especificación (LIE / LSE)</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input 
                      type="number" 
                      step="any"
                      placeholder="LIE"
                      className="form-input" 
                      style={{ padding: '6px 10px', fontSize: '12.5px', width: '50%' }}
                      value={editForm.lie} 
                      onChange={e => setEditForm(f => ({ ...f, lie: e.target.value }))} 
                    />
                    <input 
                      type="number" 
                      step="any"
                      placeholder="LSE"
                      className="form-input" 
                      style={{ padding: '6px 10px', fontSize: '12.5px', width: '50%' }}
                      value={editForm.lse} 
                      onChange={e => setEditForm(f => ({ ...f, lse: e.target.value }))} 
                    />
                  </div>
                </div>
              </div>

              {/* Matriz interactiva de Edición */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>
                    Valores Registrados ({editMatrix.length} subgrupos):
                  </div>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: '11.5px' }}
                    onClick={handleAddSubgrupo}
                  >
                    <Plus size={12} /> Agregar Subgrupo
                  </button>
                </div>

                <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  {editingRecord.isAtributo ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                          <th style={{ padding: '10px', textAlign: 'center', width: '70px' }}>Subgrupo</th>
                          {(editingRecord.tipoGrafico === 'p' || editingRecord.tipoGrafico === 'np' || editingRecord.tipoGrafico === 'u') && <th style={{ padding: '10px', textAlign: 'center' }}>Muestra (n)</th>}
                          <th style={{ padding: '10px', textAlign: 'center' }}>
                            {(editingRecord.tipoGrafico === 'p' || editingRecord.tipoGrafico === 'np') ? 'Defectuosos (np)' : 'Defectos (c)'}
                          </th>
                          <th style={{ padding: '10px', textAlign: 'center', width: '70px' }}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editMatrix.map((item, ri) => (
                          <tr key={ri} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>{ri + 1}</td>
                            
                            {(editingRecord.tipoGrafico === 'p' || editingRecord.tipoGrafico === 'np' || editingRecord.tipoGrafico === 'u') && (
                              <td style={{ padding: '4px 8px' }}>
                                <input 
                                  type="number" 
                                  className="table-input"
                                  value={item.n !== undefined ? item.n : ''}
                                  onChange={e => handleUpdateEditCell(ri, 0, e.target.value)}
                                  style={{
                                    width: '100%', padding: '5px 8px', textAlign: 'right', background: 'var(--bg-secondary)',
                                    color: '#fff', border: '1px solid var(--border)', borderRadius: '4px', fontFamily: 'JetBrains Mono'
                                  }}
                                />
                              </td>
                            )}

                            <td style={{ padding: '4px 8px' }}>
                              <input 
                                type="number" 
                                className="table-input"
                                value={
                                  (editingRecord.tipoGrafico === 'p' || editingRecord.tipoGrafico === 'np') 
                                    ? (item.np !== undefined ? item.np : '') 
                                    : (item.c !== undefined ? item.c : '')
                                }
                                onChange={e => 
                                  handleUpdateEditCell(
                                    ri, 
                                    (editingRecord.tipoGrafico === 'p' || editingRecord.tipoGrafico === 'np' || editingRecord.tipoGrafico === 'u') ? 1 : 0, 
                                    e.target.value
                                  )
                                }
                                style={{
                                  width: '100%', padding: '5px 8px', textAlign: 'right', background: 'var(--bg-secondary)',
                                  color: '#fff', border: '1px solid var(--border)', borderRadius: '4px', fontFamily: 'JetBrains Mono'
                                }}
                              />
                            </td>

                            <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                              <button 
                                className="btn btn-red btn-sm" 
                                style={{ padding: '5px' }}
                                onClick={() => handleDeleteSubgrupo(ri)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                          <th style={{ padding: '10px', textAlign: 'center', width: '70px' }}>Sg</th>
                          {Array.from({ length: parseInt(editingRecord.tam) || (editMatrix[0]?.length || 5) }, (_, i) => (
                            <th key={i} style={{ padding: '10px', textAlign: 'center' }}>X{i + 1}</th>
                          ))}
                          <th style={{ padding: '10px', textAlign: 'center', color: 'var(--green-light)', background: 'rgba(16, 185, 129, 0.02)' }}>Media (X̄)</th>
                          <th style={{ padding: '10px', textAlign: 'center', width: '70px' }}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editMatrix.map((row, ri) => {
                          const parsedRow = Array.isArray(row) ? row.map(v => parseFloat(v)).filter(v => !isNaN(v)) : [];
                          const media = (Array.isArray(row) && parsedRow.length === row.length && row.length > 0)
                            ? (parsedRow.reduce((a, b) => a + b, 0) / row.length).toFixed(3)
                            : '-';

                          return (
                            <tr key={ri} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>{ri + 1}</td>
                              
                              {Array.isArray(row) && row.map((cell, ci) => (
                                <td key={ci} style={{ padding: '4px 6px' }}>
                                  <input 
                                    type="number" 
                                    step="any"
                                    value={cell}
                                    onChange={e => handleUpdateEditCell(ri, ci, e.target.value)}
                                    style={{
                                      width: '100%', padding: '5px 8px', textAlign: 'right', background: 'var(--bg-secondary)',
                                      color: '#fff', border: '1px solid var(--border)', borderRadius: '4px', fontFamily: 'JetBrains Mono',
                                      fontSize: '12px'
                                    }}
                                  />
                                </td>
                              ))}

                              <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 600, color: 'var(--green-light)', fontFamily: 'JetBrains Mono', background: 'rgba(16, 185, 129, 0.01)' }}>
                                {media}
                              </td>

                              <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                                <button 
                                  className="btn btn-red btn-sm" 
                                  style={{ padding: '5px' }}
                                  onClick={() => handleDeleteSubgrupo(ri)}
                                >
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
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setEditingRecord(null)}
                >
                  Cancelar
                </button>
                
                <button 
                  className="btn btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }} 
                  onClick={handleSaveEdit}
                >
                  <Save size={14} /> Guardar Cambios
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  );
}
