import React, { useState, useEffect } from 'react';
import './BoothDashboard.css';
import { boothService } from '../services/boothService';
import { ROLES } from '../data/data';

// Sub-components
import BoothHome from './booth/BoothHome';
import BoothNotificaciones from './booth/BoothNotificaciones';
import BoothVotaciones from './booth/BoothVotaciones';
import BoothCuotas from './booth/BoothCuotas';
import BoothEventHub from './booth/BoothEventHub';

const BoothDashboard = ({ socio, onLogout }) => {
  const [activeView, setActiveView] = useState('home');
  const [caseta, setCaseta] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = socio.rol === ROLES.PRESIDENTE || socio.rol === ROLES.TESORERO || socio.rol === ROLES.GLOBAL_ADMIN;
  const isPresident = socio.rol === ROLES.PRESIDENTE || socio.rol === ROLES.GLOBAL_ADMIN;

  useEffect(() => {
    const fetchCasetaData = async () => {
      if (socio.casetaId) {
        // Find the actual booth metadata
        const allCasetas = await boothService.getCasetas();
        const myCaseta = allCasetas.find(c => c.id === socio.casetaId);
        setCaseta(myCaseta);
      }
      setLoading(false);
    };
    fetchCasetaData();
  }, [socio.casetaId]);

  if (!socio.casetaId) return <div className="no-caseta">No tienes una caseta asignada. Contacta con la directiva.</div>;

  const renderView = () => {
    switch(activeView) {
      case 'home': return <BoothHome socio={socio} caseta={caseta} onNavigate={setActiveView} />;
      case 'notificaciones': return <BoothNotificaciones socio={socio} isAdmin={isAdmin} />;
      case 'votaciones': return <BoothVotaciones boothId={socio.casetaId} socioId={socio.id} isPresident={isPresident} />;
      case 'cuotas': return <BoothCuotas boothId={socio.casetaId} socio={socio} isAdmin={isAdmin} />;
      case 'feria': return <BoothEventHub boothId={socio.casetaId} eventId="feria" socio={socio} isAdmin={isPresident} />;
      case 'sanjuan': return <BoothEventHub boothId={socio.casetaId} eventId="sanjuan" socio={socio} isAdmin={isPresident} />;
      default: return <BoothHome socio={socio} caseta={caseta} />;
    }
  };

  return (
    <div className="fade-in" style={{ width: '100%' }}>
      <div className="booth-dashboard-layout">
        {/* Sidebar Navigation */}
        <aside className="glass-panel booth-sidebar">
          <div className="booth-id-card">
            <img 
              src={caseta?.imagen || "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=200"} 
              alt={caseta?.nombre} 
              className="sidebar-booth-thumb"
            />
            <div className="booth-meta">
              <p className="text-gold" style={{fontSize: '0.7rem', fontWeight: 800, margin: 0}}>MI CASETA</p>
              <h4>{caseta?.nombre || 'Mi Caseta'}</h4>
            </div>
          </div>

          <nav className="booth-nav">
            <button 
              className={activeView === 'home' ? 'active' : ''} 
              onClick={() => setActiveView('home')}
            >
              <span className="icon">🏠</span> Inicio
            </button>
            <button 
              className={activeView === 'notificaciones' ? 'active' : ''} 
              onClick={() => setActiveView('notificaciones')}
            >
              <span className="icon">🔔</span> Avisos
            </button>
            <button 
              className={activeView === 'votaciones' ? 'active' : ''} 
              onClick={() => setActiveView('votaciones')}
            >
              <span className="icon">🗳️</span> Votaciones
            </button>
            <button 
              className={activeView === 'cuotas' ? 'active' : ''} 
              onClick={() => setActiveView('cuotas')}
            >
              <span className="icon">💰</span> Cuotas
            </button>
            
            <div className="nav-divider"></div>

            <button 
              className={activeView === 'feria' ? 'active' : ''} 
              onClick={() => setActiveView('feria')}
            >
              <span className="icon">🎡</span> Feria
            </button>
            <button 
              className={activeView === 'sanjuan' ? 'active' : ''} 
              onClick={() => setActiveView('sanjuan')}
            >
              <span className="icon">⛺</span> San Juan
            </button>
          </nav>

          <div style={{marginTop: 'auto', paddingTop: '2rem'}}>
            <div className="glass-panel" style={{padding: '1rem', textAlign: 'center', border: '1px dashed var(--glass-border)'}}>
               <span className="text-gold" style={{fontSize: '0.7rem', display: 'block'}}>ROL ACTUAL</span>
               <strong style={{fontSize: '0.9rem'}}>{socio.rol}</strong>
            </div>
          </div>
        </aside>

        {/* Dynamic Content Area */}
        <main className="booth-main-content">
          {loading ? (
            <div className="loader">Sincronizando con el Real...</div>
          ) : (
            renderView()
          )}
        </main>
      </div>
    </div>
  );
};

export default BoothDashboard;
