import React, { useState } from 'react';
import './Navbar.css';
import { ROLES } from '../data/data';

const Navbar = ({ activeTab, setActiveTab, currentUser, onLogout }) => {
  const isGlobalAdmin = currentUser?.rol === ROLES.GLOBAL_ADMIN;
  const isMember = currentUser && currentUser.casetaId !== null;
  const userInitial = (currentUser?.nombre || currentUser?.email || '?')[0].toUpperCase();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo" onClick={() => setActiveTab('map')}>
          <img 
            src="/app_icon.png" 
            alt="Logo" 
            className="logo-img" 
            style={{width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-gold)'}} 
          />
          <h1>Mi <span className="highlight">Caseta</span></h1>
        </div>

        <div className="nav-mobile-actions">
          <div className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <div className={`hamburger-icon ${isMobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="menu-label hide-mobile">MENÚ</span>
          </div>
        </div>
        
        <div className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
          <button 
            className={`nav-item ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => handleNavClick('list')}
          >
            🎪 <span className="nav-text">Casetas</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => handleNavClick('map')}
          >
            🗺️ <span className="nav-text">El Real</span>
          </button>
          
          {isMember && (
            <button 
              className={`nav-item member-btn ${activeTab === 'my-booth' ? 'active' : ''}`}
              onClick={() => handleNavClick('my-booth')}
            >
              ⭐ <span className="nav-text">Mi Caseta</span>
            </button>
          )}

          {currentUser && !isMember && !isGlobalAdmin && (
            <button 
              className={`nav-item request-btn ${activeTab === 'request' ? 'active' : ''}`}
              onClick={() => handleNavClick('request')}
            >
              ✍️ <span className="nav-text">Solicitar</span>
            </button>
          )}

          {(isGlobalAdmin || currentUser?.rol === ROLES.PRESIDENTE || currentUser?.rol === ROLES.TESORERO) && (
            <button 
              className={`nav-item admin-btn ${activeTab === 'admin-suite' ? 'active' : ''}`}
              onClick={() => handleNavClick('admin-suite')}
            >
              🛡️ <span className="nav-text">{isGlobalAdmin ? 'Admin' : 'Gestión'}</span>
            </button>
          )}
        </div>

        <div className="nav-actions">
          {currentUser ? (
            <div className="user-profile">
              <span className="user-name">{currentUser.nombre || currentUser.email.split('@')[0]}</span>
              <div className="user-avatar">{userInitial}</div>
              
              <button className="Btn-logout" title="Cerrar Sesión" onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}>
                <div className="logout-sign">
                  <svg viewBox="0 0 512 512">
                    <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
                  </svg>
                </div>
                <div className="logout-text">Cerrar</div>
              </button>
            </div>
          ) : (
            <button 
              className={`premium-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => handleNavClick('login')}
              style={{padding: '0.6rem 1.2rem', fontSize: '0.8rem', borderRadius: 'var(--radius-full)'}}
            >
              🔐 Acceso
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
