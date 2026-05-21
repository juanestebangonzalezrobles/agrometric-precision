'use client';
import dynamic from 'next/dynamic';

const NormalidadClient = dynamic(() => import('./NormalidadClient'), {
  ssr: false,
  loading: () => (
    <>
      <div className="header">
        <div>
          <div className="header-title">Prueba de Normalidad</div>
          <div className="header-subtitle">Cargando análisis...</div>
        </div>
      </div>
      <div className="page-content fade-in">
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div>Cargando módulo de análisis estadístico...</div>
        </div>
      </div>
    </>
  ),
});

export default function NormalidadPage() {
  return <NormalidadClient />;
}
