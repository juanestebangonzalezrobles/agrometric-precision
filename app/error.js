'use client';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('App-level error caught:', error);
  }, [error]);

  return (
    <div style={{ padding: '40px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Algo salió mal</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24, maxWidth: 500 }}>
        Ha ocurrido un error inesperado al procesar los datos de esta página. Esto puede deberse a datos incompatibles o corruptos en la memoria.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          className="btn btn-primary"
          onClick={() => reset()}
        >
          Intentar de nuevo
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            localStorage.removeItem('agrometric_registros');
            localStorage.removeItem('agrometric_selected_id');
            window.location.href = '/';
          }}
        >
          Limpiar Datos y Volver
        </button>
      </div>
    </div>
  );
}
