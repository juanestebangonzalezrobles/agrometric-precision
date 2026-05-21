'use client';
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
  Tag
} from 'lucide-react';

const kpis = [
  { label: 'Productos Monitoreados', value: '4', icon: Layers, color: 'var(--green-light)' },
  { label: 'Muestras Registradas', value: '100', icon: FlaskConical, color: 'var(--green-light)' },
  { label: 'Gráficos Activos', value: '8', icon: LineChart, color: '#60a5fa' },
  { label: 'Puntos Fuera de Control', value: '3', icon: AlertTriangle, color: '#f59e0b' },
];

const products = [
  { name: 'Aguacate Hass', type: 'Fruta', variable: 'Peso (g)', status: 'Bajo Control', statusType: 'green', icon: Tag },
  { name: 'Aloe Vera', type: 'Planta Medicinal', variable: 'Altura (cm)', status: 'Bajo Control', statusType: 'green', icon: Tag },
  { name: 'Manzanilla Alemana', type: 'Planta Medicinal', variable: 'Flores defectuosas', status: 'Bajo Control', statusType: 'green', icon: Tag },
  { name: 'Tomate Chonto', type: 'Hortaliza', variable: 'Manchas / Lesiones', status: 'Revisar', statusType: 'yellow', icon: Tag },
];

const alerts = [
  { msg: 'Tomate Chonto: 1 punto fuera de control (Subgrupo 9)', type: 'yellow', time: 'Hoy' },
  { msg: 'Manzanilla: Subgrupo 7 cerca del LCS (p = 0.14)', type: 'yellow', time: 'Hoy' },
  { msg: 'Aguacate: Proceso capaz — Cpk = 0.94', type: 'green', time: 'Hoy' },
];

const modules = [
  { href: '/variables', icon: TrendingUp, title: 'Control de Variables', desc: 'Gráficos X̄-R y X̄-S para datos continuos' },
  { href: '/atributos', icon: Binary, title: 'Control de Atributos', desc: 'Gráficos P, NP, C, U para conteos' },
  { href: '/normalidad', icon: ShieldAlert, title: 'Prueba de Normalidad', desc: 'Anderson-Darling, histograma, Q-Q plot' },
  { href: '/capacidad', icon: Sliders, title: 'Capacidad del Proceso', desc: 'Cp, Cpk, Pp, Ppk con visualización' },
  { href: '/pareto', icon: BarChart3, title: 'Diagrama de Pareto', desc: 'Identificar defectos vitales (80/20)' },
  { href: '/muestras', icon: ClipboardList, title: 'Registro de Muestras', desc: 'Ingresar datos manual o por archivo' },
  { href: '/ayuda', icon: BookOpen, title: 'Guía Teórica', desc: '¿Nuevo aquí? Aprende CEP desde cero' },
];

export default function Dashboard() {
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

        <div className="grid-2" style={{ marginBottom: 16 }}>
          {/* Productos */}
          <div className="card">
            <div className="section-header">
              <div className="section-title">Productos Monitoreados</div>
              <Link href="/muestras" className="btn btn-secondary btn-sm">+ Agregar</Link>
            </div>
            <div>
              {products.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < products.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', color: 'var(--green-light)' }}><p.icon size={20} /></span>
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
            {alerts.map((a, i) => (
              <div key={i} className={`stat-box stat-box-${a.type}`} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>{a.msg}</div>
                <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>{a.time}</div>
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              Basado en reglas de Western Electric
            </div>
          </div>
        </div>

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
