'use client';
import './globals.css';
import { useEffect, useState } from 'react';
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
  BookOpen,
  Menu,
  X
} from 'lucide-react';
import { aguacatePeso, aloeAltura, manzanillaP, tomateDefectos } from '../lib/data';

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

function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div className="sidebar-logo-icon" style={{ fontSize: '14px', fontWeight: 'bold' }}>AM</div>
          <div className="sidebar-logo-text">
            <h1>AgroMetric</h1>
            <span>Control de Calidad</span>
          </div>
        </div>
        <button className="sidebar-close-btn no-print" onClick={onClose}>
          <X size={18} />
        </button>
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
              onClick={onClose}
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Inicialización del entorno, sin siembra de datos de demostración
    try {
      const STORAGE_KEY = 'agrometric_registros';
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      console.error('Error al inicializar localStorage:', e);
    }
  }, []);

  return (
    <html lang="es">
      <head>
        <title>AgroMetric Precision — Control de Calidad</title>
        <meta name="description" content="Sistema de monitoreo y control estadístico de calidad para frutas, hortalizas y plantas medicinales" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌿</text></svg>" />
      </head>
      <body>
        <div className="app-layout">
          <header className="mobile-header no-print">
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <div className="mobile-logo">
              <div className="mobile-logo-icon">AM</div>
              <div className="mobile-logo-text">AgroMetric</div>
            </div>
          </header>

          <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)} />

          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
