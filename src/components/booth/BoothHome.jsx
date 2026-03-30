import React, { useState, useEffect } from 'react';
import { boothService } from '../../services/boothService';
import { locationService } from '../../services/locationService';
import { MAP_CONFIGS, pixelToGps } from '../../data/mapConfigs';
import './BoothHome.css';

const BoothHome = ({ socio, caseta, onNavigate }) => {
  const [socios, setSocios] = useState([]);
  const [latestNotif, setLatestNotif] = useState(null);
  const [activePoll, setActivePoll] = useState(null);
  const [feesData, setFeesData] = useState({ count: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const boothId = caseta?.id;

  useEffect(() => {
    if (boothId) {
      // 1. Sync Members
      const fetchSocios = async () => {
        const data = await boothService.getSocios(boothId);
        setSocios(data);
      };
      fetchSocios();

      // 2. Real-time Announcements
      const unsubNotifs = boothService.listenToNotificaciones(boothId, socio, (data) => {
        if (data.length > 0) setLatestNotif(data[0]);
      });

      // 3. Real-time Polls
      const unsubPolls = boothService.listenToVotaciones(boothId, (data) => {
        const now = new Date();
        const active = data.find(p => {
          const start = new Date(p.fechaInicio);
          const end = new Date(p.fechaFin);
          return now >= start && now <= end;
        });
        setActivePoll(active || null);
      });

      // 4. Real-time Fees logic
      const unsubCuotas = boothService.listenToCuotas(boothId, (data) => {
        // Filter fees where user is assigned and NOT paid
        const pending = data.filter(f => {
          const isAssigned = f.asignados === 'todos' || (Array.isArray(f.asignados) && f.asignados.includes(socio.id));
          const isPaid = f.pagos?.[socio.id]?.pagado;
          return isAssigned && !isPaid;
        });

        // Calculate total including surcharges
        const total = pending.reduce((acc, f) => {
          const isLate = new Date() > new Date(f.deadline);
          const base = f.dineroBase || f.montoBase || 0;
          const extra = f.dineroRecargo || f.montoRecargo || 0;
          const price = isLate ? base + extra : base;
          return acc + price;
        }, 0);

        setFeesData({ count: pending.length, total });
        setLoading(false);
      });

      return () => {
        unsubNotifs();
        unsubPolls();
        unsubCuotas();
      };
    }
  }, [boothId, socio.id]);

  const handleCheckIn = () => {
    if (!caseta) return;

    // Find custom coordinates or fallback to San Juan layout constants
    let x = caseta.mapX;
    let y = caseta.mapY;

    if (x === undefined || y === undefined) {
      // Try to find the booth in the static San Juan layout
      const sanJuanBooth = MAP_CONFIGS.sanjuan.boothDefinitions.find(b => String(b.id) === String(caseta.numero));
      if (sanJuanBooth) {
        x = sanJuanBooth.x + sanJuanBooth.w / 2;
        y = sanJuanBooth.y + sanJuanBooth.h / 2;
      } else {
        // Absolute fallback to center of the park
        x = 600;
        y = 500;
      }
    }

    // Convert pixel coordinates to GPS for real-time tracking
    const gps = pixelToGps(x + (Math.random() * 20 - 10), y + (Math.random() * 20 - 10), MAP_CONFIGS.sanjuan);

    locationService.broadcastLocation(socio.uid, {
      lat: gps.lat,
      lng: gps.lng,
      name: socio.nombre,
      boothId: caseta.id
    });
    alert("¡Has fichado en la caseta! Ahora te ven en el mapa.");
  };

  const handleCalibrateGPS = () => {
    if (!navigator.geolocation) {
      alert("Tu dispositivo no soporta GPS.");
      return;
    }
    const confirm = window.confirm("¿Estás situado FÍSICAMENTE justo en la entrada o centro de la Caseta AHORA MISMO?\nEsto sobreescribirá las coordenadas maestras.");
    if (!confirm) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await boothService.updateBoothGPSLocation(boothId, pos.coords.latitude, pos.coords.longitude);
          alert("📍 ¡Excelente! Has anclado las coordenadas físicas de la caseta con precisión métrica.");
        } catch (e) {
          console.error(e);
          alert("Hubo un error guardando las coordenadas.");
        }
      },
      (err) => alert("No se pudo fijar el GPS (Asegúrate de darle permisos al navegador): " + err.message),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  if (loading) return <div className="loader">Sincronizando el Real...</div>;

  return (
    <div className="booth-view fade-in">
      {/* Welcome Hero Card */}
      <header className="home-welcome glass-panel">
        <div className="welcome-text">
          <p className="text-gold" style={{margin: 0, letterSpacing: '4px', fontSize: '0.75rem', fontWeight: 900}}>BIENVENIDO A</p>
          <h2 className="premium-title">{caseta?.nombre || 'Mi Caseta'}</h2>
          <p className="text-secondary" style={{marginTop: '0.5rem', fontWeight: 600}}>¡Hola, {socio.nombre}! Tienes el Real a tus pies.</p>
        </div>
        <div className="welcome-address">
          <div className="address-container">
            <span className="street-name">{caseta?.calle || 'Recinto Ferial'}</span>
            <span className="booth-number">Nº {caseta?.numero || '--'}</span>
          </div>
          <button 
            className="checkin-btn fade-in" 
            style={{marginTop: '1rem'}}
            onClick={handleCheckIn}
          >
            📍 ESTOY AQUÍ
          </button>
        </div>
      </header>

      {/* Dynamic Grid Dashboard */}
      <div className="home-grid">
        
        {/* 1. Latest Announcement */}
        <section className={`glass-panel widget h-widget ${latestNotif ? 'has-content' : ''}`} onClick={() => onNavigate('notificaciones')}>
          <div className="widget-header">
             <span className="widget-icon">🔔</span>
             <h4>Último Aviso</h4>
          </div>
          <div className="widget-body">
            {latestNotif ? (
              <>
                <h5 className="widget-title-featured">{latestNotif.titulo}</h5>
                <p className="widget-excerpt">{latestNotif.contenido.substring(0, 80)}...</p>
                <span className="widget-date">📅 {new Date(latestNotif.fecha).toLocaleDateString()}</span>
              </>
            ) : (
              <p className="text-muted small">No hay noticias frescas por ahora.</p>
            )}
          </div>
          <button className="widget-action-btn">Ir al tablón →</button>
        </section>

        {/* 2. Active Poll */}
        <section className={`glass-panel widget h-widget ${activePoll ? 'has-content active-pulse' : ''}`} onClick={() => onNavigate('votaciones')}>
          <div className="widget-header">
             <span className="widget-icon">🗳️</span>
             <h4>Votación en Curso</h4>
          </div>
          <div className="widget-body">
            {activePoll ? (
              <>
                <h5 className="widget-title-featured">{activePoll.pregunta}</h5>
                <div className="poll-quick-stats">
                   <span className="status-pill success">🔴 ABIERTA</span>
                </div>
              </>
            ) : (
              <p className="text-muted small">No hay urnas abiertas en este momento.</p>
            )}
          </div>
          <button className="widget-action-btn">{activePoll ? 'Votar ahora →' : 'Ver archivo historial →'}</button>
        </section>

        {/* 3. Dues Summary */}
        <section className={`glass-panel widget h-widget ${feesData.count > 0 ? 'has-debt' : ''}`} onClick={() => onNavigate('cuotas')}>
          <div className="widget-header">
             <span className="widget-icon">💰</span>
             <h4>Mis Cuentas</h4>
          </div>
          <div className="widget-body">
            {feesData.count > 0 ? (
              <div className="debt-summary">
                 <div className="debt-amount">{feesData.total.toLocaleString()} <span className="currency">€</span></div>
                 <p className="debt-desc">Tienes <strong>{feesData.count}</strong> cuotas pendientes de ingreso.</p>
              </div>
            ) : (
              <div className="solvency-check">
                 <span style={{fontSize: '2rem', display: 'block', marginBottom: '0.5rem'}}>✅</span>
                 <p className="text-success small" style={{fontWeight: 800}}>¡Al día con la caseta!</p>
              </div>
            )}
          </div>
          <button className="widget-action-btn">Gestionar pagos →</button>
        </section>
      </div>

      {/* Admin Quick Tools */}
      {(socio.rol === 'Presidente' || socio.rol === 'Global Admin') && (
        <section className="glass-panel widget" style={{marginBottom: '2rem', border: '1px dashed var(--color-gold)', background: 'linear-gradient(145deg, rgba(30,30,35,0.7), rgba(15,15,20,0.8))'}}>
           <h4 className="text-gold" style={{fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center'}}>🔧 CALIBRACIÓN DE RADAR (SOLO DIRECTIVA)</h4>
           <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center'}}>
             <button className="premium-btn" onClick={handleCalibrateGPS} style={{padding: '1rem 2rem', fontSize: '1rem', whiteSpace: 'normal', height: 'auto'}}>
               🌍 Fijar Radar de Proximidad en mi Ubicación Actual
             </button>
           </div>
           {caseta?.latitudReal && (
             <p className="text-muted small" style={{marginTop: '0.8rem', textAlign: 'center'}}>
               📍 Caseta anclada a: {caseta.latitudReal.toFixed(6)}, {caseta.longitudReal.toFixed(6)}
             </p>
           )}
           <p className="text-muted small" style={{textAlign: 'center', marginTop: '0.5rem', opacity: 0.7}}>
             Al fijar el radar, el sistema detectará automáticamente cuando un usuario esté a ~5m de la caseta y lo contabilizará en el Aforo General.
           </p>
        </section>
      )}

      {/* Directory Section */}
      <section className="glass-panel widget socios-section">
        <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)'}}>
           <h4 style={{margin: 0, fontFamily: 'var(--font-serif)', color: 'var(--color-gold)', letterSpacing: '1px'}}>Directorio de Socios</h4>
           <span className="text-muted" style={{fontSize: '0.8rem'}}>{socios.length} integrantes</span>
        </header>
        
        <div className="socios-list">
          {socios.map(s => (
            <div key={s.id} className="socio-item fade-in">
              <div className="socio-avatar-wrapper">
                 <span className="socio-avatar">👤</span>
              </div>
              <div className="socio-info">
                <span className="socio-name">{s.nombre}</span>
                <span className={`socio-role-tag ${s.rol}`}>{s.rol}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default BoothHome;
