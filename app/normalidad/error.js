'use client';
import { useEffect } from 'react';

export default function NormalidadError({ error, reset }) {
  useEffect(() => {
    console.error('Error en Normalidad:', error);
  }, [error]);

  return (
    <div style={{
      padding: '40px',
      maxWidth: '600px',
      margin: '40px auto',
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid #ef4444',
      borderRadius: '12px',
      color: '#fca5a5',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <h2 style={{ color: '#ef4444', marginBottom: '16px', fontSize: '20px' }}>
        Error en Prueba de Normalidad
      </h2>
      <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '12px' }}>
        <strong>Mensaje:</strong> {error?.message || 'Error desconocido'}
      </p>
      <pre style={{
        fontSize: '11px',
        background: 'rgba(0,0,0,0.3)',
        padding: '12px',
        borderRadius: '8px',
        overflow: 'auto',
        maxHeight: '200px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}>
        {error?.stack || 'Sin stack trace'}
      </pre>
      <button
        onClick={() => reset()}
        style={{
          marginTop: '16px',
          padding: '10px 20px',
          background: '#ef4444',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
        }}
      >
        Reintentar
      </button>
    </div>
  );
}
