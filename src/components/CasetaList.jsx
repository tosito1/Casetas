import React from 'react';
import './CasetaList.css';

const CasetaList = ({ casetas, onSelectCaseta, currentUser, onNavigate }) => {
  return (
    <div className="caseta-list-container">
      <div className="list-header">
        <h2 className="section-title">Nuestras Casetas</h2>
        <p>Encuentra la caseta perfecta para disfrutar de la feria.</p>
      </div>

      {!currentUser && (
        <div className="guest-access-warning fade-in">
          <div className="warning-content">
            <span className="warning-icon">🔐</span>
            <div className="warning-text">
              <h4>Acceso de Invitado</h4>
              <p>Estás viendo el listado público. Para interactuar, ver consumos o solicitar acceso, debes iniciar sesión.</p>
            </div>
            <button className="premium-btn mini" onClick={() => onNavigate('login')}>Entrar</button>
          </div>
        </div>
      )}

      <div className="caseta-grid">
        {casetas.map(caseta => {
          const isMember = currentUser?.casetaId === caseta.id;
          const hasBooth = !!currentUser?.casetaId;

          return (
            <div 
              key={caseta.id} 
              className={`card ${isMember ? 'member-highlight' : ''}`}
              onClick={() => {
                if (!currentUser) onNavigate('login');
                else if (isMember) onNavigate('my-booth');
                else if (!hasBooth) onSelectCaseta(caseta);
              }}
            >
              <div className="card-image-bg" style={{ backgroundImage: `url(${caseta.imagen})` }} />
              <div className="border" />
              
              <div className="content">
                <span className="logo-bottom-text">{caseta.nombre}</span>
              </div>
              
              <span className="bottom-text">{caseta.calle} • Nº {caseta.numero}</span>
              
              <div className="card-badge">{caseta.clase}</div>
              {isMember && <div className="member-status-indicator">TU CASETA</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CasetaList;
