'use client';
import './globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  TrendingUp,
  Binary,
  ShieldAlert,
  Sliders,
  BarChart3,
  GitFork,
  Upload,
  Download,
  BookOpen
} from 'lucide-react';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/muestras', icon: ClipboardList, label: 'Registro de Muestras' },
  { section: 'Control de Variables' },
  { href: '/variables', icon: TrendingUp, label: 'Gráficos X̄-R / X̄-S' },
  { section: 'Control de Atributos' },
  { href: '/atributos', icon: Binary, label: 'Gráficos P, NP, C, U' },
  { section: 'Análisis Estadístico' },
  { href: '/normalidad', icon: ShieldAlert, label: 'Pruebas de Normalidad' },
  { href: '/capacidad', icon: Sliders, label: 'Índices de Capacidad' },
  { href: '/pareto', icon: BarChart3, label: 'Diagrama de Pareto' },
  { href: '/ishikawa', icon: GitFork, label: 'Diagrama de Ishikawa' },
  { section: 'Datos' },
  { href: '/importar', icon: Upload, label: 'Importar Datos' },
  { href: '/exportar', icon: Download, label: 'Exportar / Reportes' },
  { section: 'Aprendizaje' },
  { href: '/ayuda', icon: BookOpen, label: 'Guía Teórica y Ayuda' },
];

function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" style={{ fontSize: '14px', fontWeight: 'bold' }}>AM</div>
        <div className="sidebar-logo-text">
          <h1>AgroMetric</h1>
          <span>Control de Calidad</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-section-title">{item.section}</div>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              <item.icon className="nav-item-icon" size={18} />
              <span>{item.label}</span>
            </Link>
          )
        )}
      </nav>
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)' }}>
        <div>Universidad del Magdalena</div>
        <div>Control Estadístico de Procesos</div>
        <div style={{ marginTop: 4, color: 'var(--green-dark)' }}>2026-1</div>
      </div>
    </aside>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <title>AgroMetric Precision — Control de Calidad</title>
        <meta name="description" content="Sistema de monitoreo y control estadístico de calidad para frutas, hortalizas y plantas medicinales" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌿</text></svg>" />
      </head>
      <body>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
