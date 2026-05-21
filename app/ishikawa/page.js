'use client';
import { useState, useEffect } from 'react';

const CATEGORIES = {
  mano_obra: { label: "Mano de Obra (Personal)", color: "#10b981", angle: 60, isTop: true, dx: 250 },
  maquinaria: { label: "Maquinaria (Equipos)", color: "#3b82f6", angle: 60, isTop: true, dx: 470 },
  materiales: { label: "Materiales (Insumos)", color: "#8b5cf6", angle: 60, isTop: true, dx: 690 },
  metodos: { label: "Métodos (Procesos)", color: "#f59e0b", angle: -60, isTop: false, dx: 250 },
  medicion: { label: "Medición (Control)", color: "#ec4899", angle: -60, isTop: false, dx: 470 },
  medio_ambiente: { label: "Medio Ambiente (Entorno)", color: "#06b6d4", angle: -60, isTop: false, dx: 690 }
};

export default function IshikawaPage() {
  const [efecto, setEfecto] = useState("Alto índice de defectos en el lote de cosecha");
  const [causas, setCausas] = useState({
    mano_obra: [],
    maquinaria: [],
    materiales: [],
    metodos: [],
    medicion: [],
    medio_ambiente: []
  });

  const [activeCategory, setActiveCategory] = useState("mano_obra");
  const [newCausaText, setNewCausaText] = useState("");

  // Load from localStorage or default
  useEffect(() => {
    const savedEfecto = localStorage.getItem('ishikawa_efecto');
    const savedCausas = localStorage.getItem('ishikawa_causas');
    if (savedEfecto) setEfecto(savedEfecto);
    if (savedCausas) {
      try { setCausas(JSON.parse(savedCausas)); } catch (e) { }
    } else {
      const cleared = {
        mano_obra: [],
        maquinaria: [],
        materiales: [],
        metodos: [],
        medicion: [],
        medio_ambiente: []
      };
      setEfecto("Escriba el efecto o problema aquí...");
      setCausas(cleared);
      saveToLocal("Escriba el efecto o problema aquí...", cleared);
    }
  }, []);

  const saveToLocal = (newEfecto, newCausas) => {
    localStorage.setItem('ishikawa_efecto', newEfecto);
    localStorage.setItem('ishikawa_causas', JSON.stringify(newCausas));
  };

  const updateEfecto = (val) => {
    setEfecto(val);
    saveToLocal(val, causas);
  };

  const addCausa = () => {
    if (!newCausaText.trim()) return;
    const updated = {
      ...causas,
      [activeCategory]: [...causas[activeCategory], newCausaText.trim()]
    };
    setCausas(updated);
    setNewCausaText("");
    saveToLocal(efecto, updated);
  };

  const removeCausa = (cat, index) => {
    const updated = {
      ...causas,
      [cat]: causas[cat].filter((_, i) => i !== index)
    };
    setCausas(updated);
    saveToLocal(efecto, updated);
  };

  const clearAll = () => {
    if (window.confirm("¿Está seguro de que desea limpiar todo el diagrama?")) {
      const cleared = {
        mano_obra: [],
        maquinaria: [],
        materiales: [],
        metodos: [],
        medicion: [],
        medio_ambiente: []
      };
      setEfecto("Escriba el efecto o problema aquí...");
      setCausas(cleared);
      saveToLocal("Escriba el efecto o problema aquí...", cleared);
    }
  };

  // Helper to slice text for SVG wrapping
  const wrapText = (text, maxLength = 22) => {
    if (text.length <= maxLength) return [text];
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    words.forEach(w => {
      if ((currentLine + " " + w).trim().length <= maxLength) {
        currentLine = (currentLine + " " + w).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = w;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines.slice(0, 3); // Max 3 lines
  };

  return (
    <>
      <div className="header">
        <div>
          <div className="header-title">Diagrama de Causa y Efecto — Ishikawa</div>
          <div className="header-subtitle">Estructurar tormenta de ideas bajo el esquema de las 6M en agronegocios</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary no-print" onClick={clearAll}>
            Limpiar Todo
          </button>
          <button className="btn btn-secondary no-print" onClick={() => window.print()}>
            Imprimir Diagrama
          </button>
        </div>
      </div>

      <div className="page-content fade-in">
        
        {/* Input panel y editor */}
        <div className="grid-3 no-print" style={{ marginBottom: 16 }}>
          {/* Box 1: Problema / Efecto */}
          <div className="card" style={{ gridColumn: 'span 1' }}>
            <div className="section-title" style={{ marginBottom: 12 }}>1. Definir Efecto (Problema)</div>
            <label className="form-label">Efecto Principal analizado:</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={efecto}
              onChange={e => updateEfecto(e.target.value)}
              placeholder="Ej: Alto porcentaje de rechazo de fruta..."
            />
          </div>

          {/* Box 2: Agregar Causas */}
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="section-title" style={{ marginBottom: 12 }}>2. Registrar Causas por Categoría (6M)</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  className={`btn ${activeCategory === key ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    fontSize: 12,
                    padding: '6px 12px',
                    borderLeft: `4px solid ${cat.color}`
                  }}
                  onClick={() => setActiveCategory(key)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1 }}
                value={newCausaText}
                onChange={e => setNewCausaText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCausa()}
                placeholder={`Añadir causa a: ${CATEGORIES[activeCategory].label}...`}
              />
              <button className="btn btn-primary" onClick={addCausa}>Agregar</button>
            </div>
          </div>
        </div>

        {/* SVG Diagrama de Ishikawa */}
        <div className="card" style={{ overflowX: 'auto', padding: '20px 10px', textAlign: 'center', marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 16, textAlign: 'left' }}>Representación Visual del Diagrama de Ishikawa</div>
          
          <div style={{ minWidth: 980, display: 'inline-block', background: 'var(--bg-main)', borderRadius: 12, padding: 12, border: '1px solid var(--border)' }}>
            <svg width="1000" height="520" viewBox="0 0 1000 520" style={{ fontFamily: 'Inter, sans-serif' }}>
              {/* Fondos o bordes decorativos */}
              <rect width="1000" height="520" rx="8" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="1" />

              {/* LÍNEA PRINCIPAL (ESPINA CENTRAL) */}
              <line x1="50" y1="260" x2="810" y2="260" stroke="var(--green-primary)" strokeWidth="4" strokeLinecap="round" />
              {/* Flecha hacia el efecto */}
              <polygon points="810,252 825,260 810,268" fill="var(--green-primary)" />

              {/* CAJA DEL EFECTO */}
              <g transform="translate(825, 210)">
                <rect width="160" height="100" rx="8" fill="var(--bg-main)" stroke="var(--green-primary)" strokeWidth="2.5" />
                <foreignObject x="8" y="8" width="144" height="84">
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    wordBreak: 'break-word',
                    lineHeight: 1.3
                  }}>
                    {efecto}
                  </div>
                </foreignObject>
              </g>

              {/* ESPINAS PRINCIPALES (6M) */}
              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const isTop = cat.isTop;
                const xStart = cat.dx;
                const yStart = 260;
                // Ángulo de 60 o -60 grados
                const xEnd = xStart - 90;
                const yEnd = isTop ? 60 : 460;

                // Lista de causas de esta categoría
                const causasList = causas[key] || [];

                return (
                  <g key={key}>
                    {/* Línea de la espina */}
                    <line x1={xStart} y1={yStart} x2={xEnd} y2={yEnd} stroke={cat.color} strokeWidth="2.5" strokeLinecap="round" />
                    
                    {/* Título de la categoría */}
                    <rect 
                      x={xEnd - 20} 
                      y={isTop ? yEnd - 28 : yEnd + 8} 
                      width="150" 
                      height="20" 
                      rx="4" 
                      fill="var(--bg-main)" 
                      stroke={cat.color} 
                      strokeWidth="1" 
                    />
                    <text 
                      x={xEnd + 55} 
                      y={isTop ? yEnd - 14 : yEnd + 22} 
                      fill="var(--text-primary)" 
                      fontSize="10.5" 
                      fontWeight="700" 
                      textAnchor="middle"
                    >
                      {cat.label}
                    </text>

                    {/* Renderizar causas secundarias de forma escalonada en la espina */}
                    {causasList.map((causa, idx) => {
                      // Calcular punto de intersección en la espina inclinada
                      const stepRatio = (idx + 1) / (causasList.length + 1);
                      const yIntersection = yStart + (yEnd - yStart) * stepRatio;
                      const xIntersection = xStart + (xEnd - xStart) * stepRatio;

                      // Línea secundaria de la causa (horizontal saliendo hacia atrás)
                      const lineLength = 75;
                      const xText = xIntersection - lineLength;
                      const yText = yIntersection;

                      // Wrapear texto
                      const wrapped = wrapText(causa, 18);

                      return (
                        <g key={idx}>
                          {/* Línea horizontal de causa secundaria */}
                          <line 
                            x1={xIntersection} 
                            y1={yIntersection} 
                            x2={xIntersection - lineLength} 
                            y2={yIntersection} 
                            stroke="var(--border-light)" 
                            strokeWidth="1.2" 
                            strokeDasharray="2 2"
                          />
                          {/* Pequeño nodo circular */}
                          <circle cx={xIntersection} cy={yIntersection} r="3" fill={cat.color} />
                          
                          {/* Texto de la causa */}
                          <g transform={`translate(${xText - 4}, ${yText - (wrapped.length * 6) + 4})`}>
                            {wrapped.map((line, lIdx) => (
                              <text 
                                key={lIdx} 
                                x="0" 
                                y={lIdx * 11} 
                                fill="var(--text-muted)" 
                                fontSize="9" 
                                fontWeight="500"
                                textAnchor="end"
                              >
                                {line}
                              </text>
                            ))}
                          </g>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Listado de eliminación de causas */}
        <div className="card no-print">
          <div className="section-title" style={{ marginBottom: 16 }}>3. Gestionar Detalle de Causas por Categoría</div>
          <div className="grid-3" style={{ gap: 16 }}>
            {Object.entries(CATEGORIES).map(([key, cat]) => {
              const list = causas[key] || [];
              return (
                <div key={key} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 6, borderBottom: `2px solid ${cat.color}` }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{cat.label}</span>
                    <span className="badge badge-green" style={{ fontSize: 10 }}>{list.length}</span>
                  </div>
                  
                  {list.length === 0 ? (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>Sin causas añadidas</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {list.map((c, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: 'var(--bg-card)', padding: '6px 8px', borderRadius: 6, gap: 4 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{c}</span>
                          <button 
                            style={{ 
                              background: 'transparent', 
                              border: 'none', 
                              color: '#ef4444', 
                              cursor: 'pointer', 
                              fontSize: 12, 
                              padding: '0 2px' 
                            }}
                            title="Eliminar causa"
                            onClick={() => removeCausa(key, idx)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Diagnóstico interpretativo / Recomendaciones finales de Ishikawa */}
        <div className="card" style={{ border: '1px solid var(--green-primary)', borderLeft: '4px solid var(--green-primary)', marginTop: 16 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Guía Práctica de Análisis de Ishikawa</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <p style={{ marginBottom: 8 }}>
              El diagrama de <strong>Ishikawa (Causa-Efecto)</strong> es una herramienta cualitativa fundamental para estructurar causas potenciales. Una vez finalizada la lluvia de ideas:
            </p>
            <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
              <li><strong>Priorización:</strong> Identifique cuáles causas tienen mayor probabilidad de impacto o frecuencia.</li>
              <li><strong>Validación con datos:</strong> Use los <em>Diagramas de Pareto</em> y las <em>Cartas de Control</em> para comprobar estadísticamente si las causas identificadas están afectando realmente los resultados del proceso.</li>
              <li><strong>Plan de Acción:</strong> Defina medidas correctivas y preventivas enfocadas en las causas raíz identificadas (por ejemplo, mantenimiento a la maquinaria, re-calibración de medidores o capacitación del personal).</li>
            </ol>
          </div>
        </div>

      </div>
    </>
  );
}
