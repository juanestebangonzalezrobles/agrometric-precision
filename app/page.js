'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  FlaskConical,
  LineChart,
  AlertTriangle,
  TrendingUp,
  Binary,
  ShieldAlert,
  Sliders,
  BarChart3,
  ClipboardList,
  BookOpen,
  Tag,
  ArrowRight
} from 'lucide-react';

const STORAGE_KEY = 'agrometric_registros';

const modules = [
  { href: '/variables', icon: TrendingUp, title: 'Control de Variables', desc: 'Gráficos X̄-R y X̄-S para datos continuos' },
  { href: '/atributos', icon: Binary, title: 'Control de Atributos', desc: 'Gráficos P, NP, C, U para conteos' },
  { href: '/normalidad', icon: ShieldAlert, title: 'Prueba de Normalidad', desc: 'Anderson-Darling, histograma, Q-Q plot' },
  { href: '/capacidad', icon: Sliders, title: 'Capacidad del Proceso', desc: 'Cp, Cpk, Pp, Ppk con visualización' },
  { href: '/pareto', icon: BarChart3, title: 'Diagrama de Pareto', desc: 'Identificar defectos vitales (80/20)' },
  { href: '/muestras', icon: ClipboardList, title: 'Registro de Muestras', desc: 'Ingresar datos manual o por archivo' },
  { href: '/ayuda', icon: BookOpen, title: 'Guía Teórica', desc: '¿Nuevo aquí? Aprende CEP desde cero' },
];

// Un evaluador de puntos fuera de los límites de control (UCL / LCL) para variables y atributos
function checkOOCPoints(rec) {
  if (!rec.subgruposData || rec.subgruposData.length === 0) return 0;
  
  try {
    if (rec.isAtributo) {
      const subgrupos = rec.subgruposData;
      if (rec.tipoGrafico === 'p') {
        const totalNP = subgrupos.reduce((a, s) => a + (s.np !== undefined ? s.np : s.c || 0), 0);
        const totalN = subgrupos.reduce((a, s) => a + (s.n || 100), 0);
        if (totalN === 0) return 0;
        const pbar = totalNP / totalN;
        let oocCount = 0;
        subgrupos.forEach(s => {
          const p = (s.np !== undefined ? s.np : s.c || 0) / (s.n || 100);
          const sigma = Math.sqrt(pbar * (1 - pbar) / (s.n || 100));
          const ucl = pbar + 3 * sigma;
          const lcl = Math.max(0, pbar - 3 * sigma);
          if (p > ucl || p < lcl) oocCount++;
        });
        return oocCount;
      } else { // 'c'
        const cbar = subgrupos.reduce((a, s) => a + (s.c !== undefined ? s.c : s.np || 0), 0) / subgrupos.length;
        const sigma = Math.sqrt(cbar);
        const ucl = cbar + 3 * sigma;
        const lcl = Math.max(0, cbar - 3 * sigma);
        let oocCount = 0;
        subgrupos.forEach(s => {
          const c = s.c !== undefined ? s.c : s.np || 0;
          if (c > ucl || c < lcl) oocCount++;
        });
        return oocCount;
      }
    } else {
      const subgrupos = rec.subgruposData;
      const means = subgrupos.map(sg => sg.reduce((a, b) => a + b, 0) / sg.length);
      const ranges = subgrupos.map(sg => Math.max(...sg) - Math.min(...sg));
      const grandMean = means.reduce((a, b) => a + b, 0) / means.length;
      const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;
      
      const n = rec.tam || 5;
      const A2_lookup = { 2: 1.88, 3: 1.02, 4: 0.729, 5: 0.577, 6: 0.483, 7: 0.419, 8: 0.373, 9: 0.337, 10: 0.308 };
      const A2 = A2_lookup[n] || 0.577;
      const ucl_x = grandMean + A2 * avgRange;
      const lcl_x = grandMean - A2 * avgRange;
      
      let oocCount = 0;
      means.forEach(m => {
        if (m > ucl_x || m < lcl_x) oocCount++;
      });
      return oocCount;
    }
  } catch (err) {
    console.error('Error calculando OOC para dashboard:', err);
    return 0;
  }
}

export default function Dashboard() {
  const [records, setRecords] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let loaded = raw ? JSON.parse(raw) : [];
      
      // Limpieza proactiva de datos demo
      if (loaded.some(r => r.isDemo || r.id?.startsWith('demo_'))) {
        loaded = loaded.filter(r => !r.isDemo && !r.id?.startsWith('demo_'));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));
      }
      
      setRecords(loaded);
    } catch {
      setRecords([]);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Cálculos dinámicos
  const numProductos = Array.from(new Set(records.map(r => r.producto))).length;
  const numGraficos = records.length;
  
  const numMuestras = records.reduce((acc, r) => {
    if (!r.subgruposData) return acc;
    if (r.isAtributo) {
      return acc + r.subgruposData.reduce((sum, s) => sum + (s.n || 100), 0);
    } else {
      return acc + r.subgruposData.reduce((sum, sg) => sum + (sg?.length || 0), 0);
    }
  }, 0);

  // Evaluar alertas y estado
  const processedProducts = records.map(r => {
    const oocCount = checkOOCPoints(r);
    return {
      id: r.id,
      name: r.producto,
      type: r.tipo || 'General',
      variable: r.variable || r.variableName || 'Variable',
      status: oocCount > 0 ? 'Revisar' : 'Bajo Control',
      statusType: oocCount > 0 ? 'yellow' : 'green',
      oocCount
    };
  });

  const totalOOCPoints = processedProducts.reduce((acc, p) => acc + p.oocCount, 0);

  const dynamicAlerts = [];
  processedProducts.forEach(p => {
    if (p.oocCount > 0) {
      dynamicAlerts.push({
        msg: `${p.name}: ${p.oocCount} punto(s) fuera de control en el gráfico de inestabilidad`,
        type: 'yellow',
        time: 'Ahora mismo'
      });
    }
  });

  // KPIs
  const kpis = [
    { label: 'Productos Monitoreados', value: isHydrated ? numProductos : '...', icon: Layers, color: 'var(--green-light)' },
    { label: 'Muestras Registradas', value: isHydrated ? numMuestras : '...', icon: FlaskConical, color: 'var(--green-light)' },
    { label: 'Gráficos Activos', value: isHydrated ? numGraficos : '...', icon: LineChart, color: '#60a5fa' },
    { label: 'Puntos Fuera de Control', value: isHydrated ? totalOOCPoints : '...', icon: AlertTriangle, color: totalOOCPoints > 0 ? '#ef4444' : 'var(--text-muted)' },
  ];

  return (
    <>
      <div className="header">
        <div>
          <div className="header-title">Dashboard</div>
          <div className="header-subtitle">Sistema de Control Estadístico de Calidad — AgroMetric Precision</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="status-dot status-dot-green" />
          <span style={{ fontSize: 12, color: 'var(--green-light)' }}>Sistema Activo</span>
        </div>
      </div>

      <div className="page-content fade-in">
        {/* KPIs */}
        <div className="kpi-grid">
          {kpis.map((k, i) => (
            <div key={i} className="kpi-card">
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
              <div className="kpi-icon"><k.icon size={32} /></div>
            </div>
          ))}
        </div>

        {isHydrated && records.length === 0 ? (
          /* PANTALLA PREMIUM DE ESTADO VACÍO INICIAL */
          <div className="card" style={{ padding: '48px 32px', textAlign: 'center', marginBottom: 24, background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <div style={{ fontSize: 50, marginBottom: 16 }}>🌱</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>¡Bienvenido a AgroMetric Precision!</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto 24px auto', lineHeight: 1.6 }}>
              Has iniciado la plataforma en modo limpio. AgroMetric Precision te permite monitorear y analizar la calidad y variabilidad de tus cosechas e insumos mediante Control Estadístico de Procesos (CEP).
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/muestras" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                + Registrar Primera Muestra <ArrowRight size={16} />
              </Link>
              <Link href="/ayuda" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={16} /> Guía de Inicio Rápido
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid-2" style={{ marginBottom: 16 }}>
            {/* Productos */}
            <div className="card">
              <div className="section-header">
                <div className="section-title">Productos Monitoreados</div>
                <Link href="/muestras" className="btn btn-secondary btn-sm">+ Gestionar</Link>
              </div>
              <div>
                {processedProducts.map((p, i) => (
                  <div key={p.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < processedProducts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', color: 'var(--green-light)' }}><Tag size={20} /></span>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.type} · {p.variable}</div>
                      </div>
                    </div>
                    <span className={`badge badge-${p.statusType}`}>{p.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alertas */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 14 }}>Alertas Recientes</div>
              {dynamicAlerts.length === 0 ? (
                <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
                  <strong>¡Proceso Estable!</strong>
                  <div style={{ fontSize: 11.5, marginTop: 4, opacity: 0.8 }}>No hay puntos fuera de los límites de control estadístico en tus registros activos.</div>
                </div>
              ) : (
                <>
                  {dynamicAlerts.map((a, i) => (
                    <div key={i} className={`stat-box stat-box-${a.type}`} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 13, lineHeight: 1.5 }}>{a.msg}</div>
                      <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>{a.time}</div>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                    Basado en límites de control de 3 Desviaciones Estándar (3σ)
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Módulos */}
        <div className="section-title" style={{ marginBottom: 14 }}>Módulos del Sistema</div>
        <div className="grid-auto">
          {modules.map((m, i) => (
            <Link key={i} href={m.href} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'all 0.25s ease' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green-dark)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ color: 'var(--green-light)', marginBottom: 10 }}><m.icon size={28} /></div>
                <div className="card-title">{m.title}</div>
                <div className="card-subtitle" style={{ marginTop: 4 }}>{m.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer info */}
        <div style={{ marginTop: 24, padding: '16px 20px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span>📚 Universidad del Magdalena — Control Estadístico de Procesos 2026-1</span>
          <span>Datos basados en metodología ISO 7870 y AIAG SPC Manual</span>
        </div>
      </div>
    </>
  );
}
