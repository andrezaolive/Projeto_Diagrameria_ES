import React from 'react';

// Monitor antigo com o mascote (a "folha sorridente") — usado na tela de login.
const ink = '#1a1020';

export default function MonitorMascote({ escala = 1 }) {
  return (
    <div aria-hidden="true" style={{ width: 352 * escala, height: 290 * escala }}>
      <div style={{ position: 'relative', width: 352, height: 290, transform: `scale(${escala})`, transformOrigin: 'top left' }}>
        {/* Parte traseira */}
        <div
          style={{
            position: 'absolute', left: 66, top: 0, width: 286, height: 211,
            background: '#3b2fa0', border: `5px solid ${ink}`, borderRadius: '20px 20px 0 0',
          }}
        />
        {/* Corpo */}
        <div
          style={{
            position: 'absolute', left: 0, top: 17, width: 340, height: 250,
            background: '#4a52b8', border: `6px solid ${ink}`, borderRadius: 28,
            boxShadow: 'inset 8px 8px 0 #6a72d8, inset -10px -12px 0 #3b2fa0',
          }}
        >
          {/* Tela */}
          <div
            style={{
              position: 'absolute', left: 28, right: 28, top: 22, bottom: 52,
              border: `5px solid ${ink}`, borderRadius: 16, overflow: 'hidden',
              background: 'repeating-conic-gradient(from 0deg at 50% 55%, #ee7a3a 0 12deg, #f5a25a 12deg 24deg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(245,162,90,0.6)',
            }}
          >
            <div style={{ position: 'relative', width: 78, height: 86, background: '#f4f0ea', border: `4px solid ${ink}`, marginTop: -14 }}>
              <div style={{ height: 10, background: '#8f8a99', borderBottom: `3px solid ${ink}` }} />
              <div style={{ position: 'absolute', left: 22, top: 28, width: 5, height: 14, background: ink }} />
              <div style={{ position: 'absolute', left: 45, top: 28, width: 5, height: 14, background: ink }} />
              <div
                style={{
                  position: 'absolute', left: 20, top: 46, width: 30, height: 12,
                  border: `4px solid ${ink}`, borderTop: 'none', borderRadius: '0 0 18px 18px',
                }}
              />
              <div style={{ position: 'absolute', left: 16, top: 86, width: 5, height: 14, background: ink }} />
              <div style={{ position: 'absolute', left: 50, top: 86, width: 5, height: 14, background: ink }} />
            </div>
            <div
              style={{
                position: 'absolute', inset: 0,
                background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 4px)',
              }}
            />
          </div>
          {/* Detalhes do painel */}
          <div style={{ position: 'absolute', left: 28, bottom: 18, display: 'flex', gap: 4 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ width: 3, height: 16, background: ink }} />
            ))}
          </div>
          <div style={{ position: 'absolute', left: 120, bottom: 22, width: 56, height: 7, background: '#5fe0e0', boxShadow: '0 0 10px #5fe0e0' }} />
          <div
            style={{
              position: 'absolute', right: 28, bottom: 16, width: 14, height: 14,
              borderRadius: '50%', background: '#c8323c', border: `3px solid ${ink}`,
            }}
          />
        </div>
        {/* Pescoço */}
        <div style={{ position: 'absolute', left: 100, top: 267, width: 140, height: 22, background: '#1d1f72', border: `4px solid ${ink}` }} />
      </div>
    </div>
  );
}
