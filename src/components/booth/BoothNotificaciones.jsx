import React, { useState, useEffect } from 'react';
import { boothService } from '../../services/boothService';
import { ROLES } from '../../data/data';
import './BoothNotificaciones.css';

const BoothNotificaciones = ({ socio, isAdmin }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [socios, setSocios] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [targetType, setTargetType] = useState('all'); // all, role, specific
  const [targetValue, setTargetValue] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const boothId = socio.casetaId;

  useEffect(() => {
    if (boothId) {
      const unsubscribe = boothService.listenToNotificaciones(boothId, socio, setNotificaciones);
      
      // Fetch socios for targeting if admin
      if (isAdmin) {
        boothService.getSocios(boothId).then(setSocios);
      }
      
      return () => unsubscribe();
    }
  }, [boothId, socio, isAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;
    
    setIsSubmitting(true);
    try {
      await boothService.addNotificacion(boothId, {
        titulo: newTitle,
        contenido: newContent,
        targetType,
        targetValue
      });
      setNewTitle('');
      setNewContent('');
      setTargetType('all');
      setTargetValue(null);
    } catch (error) {
      console.error("Error adding notification:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTargetLabel = (notif) => {
    if (!notif.targetType || notif.targetType === 'all') return '👥 Todos';
    if (notif.targetType === 'role') return `🎭 Grupo: ${notif.targetValue}`;
    if (notif.targetType === 'specific') {
      const targetUser = socios.find(s => s.id === notif.targetValue);
      return `👤 Privado: ${targetUser?.nombre || 'Socio'}`;
    }
    return '';
  };

  return (
    <div className="booth-view fade-in">
      <header style={{marginBottom: '2rem'}}>
        <p className="text-gold" style={{marginBottom: '0.5rem', fontWeight: 700, letterSpacing: '2px', fontSize: '0.75rem'}}>COMUNICACIÓN OFICIAL</p>
        <h2 className="premium-title" style={{margin: 0}}>Tablón de Avisos</h2>
      </header>

      {isAdmin && (
        <form onSubmit={handleSubmit} className="admin-action-form fade-in">
          <h4>REDACTAR NUEVO COMUNICADO</h4>
          
          <input 
            type="text" 
            placeholder="Título del aviso" 
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={isSubmitting}
          />
          
          <textarea 
            placeholder="Contenido del mensaje..." 
            rows="3" 
            required
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            disabled={isSubmitting}
          />

          <div className="targeting-controls targeting-controls-grid">
            <div className="control-group">
              <label style={{display: 'block', fontSize: '0.75rem', color: 'var(--color-gold)', marginBottom: '0.5rem', fontWeight: 800}}>DESTINATARIOS</label>
              <select 
                value={targetType} 
                onChange={(e) => {
                  setTargetType(e.target.value);
                  setTargetValue(null);
                }}
                className="premium-input"
              >
                <option value="all">Toda la Caseta</option>
                <option value="role">Por Grupo (Rol)</option>
                <option value="specific">Socio Específico</option>
              </select>
            </div>

            {targetType === 'role' && (
              <div className="control-group fade-in">
                <label style={{display: 'block', fontSize: '0.75rem', color: 'var(--color-gold)', marginBottom: '0.5rem', fontWeight: 800}}>SELECCIONAR ROL</label>
                <select 
                   value={targetValue || ''} 
                   onChange={(e) => setTargetValue(e.target.value)}
                   className="premium-input"
                   required
                >
                  <option value="">-- Elija un rol --</option>
                  <option value={ROLES.NORMAL}>Socios Normales</option>
                  <option value={ROLES.TESORERO}>Tesoreros</option>
                  <option value={ROLES.PRESIDENTE}>Presidentes</option>
                </select>
              </div>
            )}

            {targetType === 'specific' && (
              <div className="control-group fade-in">
                <label style={{display: 'block', fontSize: '0.75rem', color: 'var(--color-gold)', marginBottom: '0.5rem', fontWeight: 800}}>SELECCIONAR SOCIO</label>
                <select 
                   value={targetValue || ''} 
                   onChange={(e) => setTargetValue(e.target.value)}
                   className="premium-input"
                   required
                >
                  <option value="">-- Elija un socio --</option>
                  {socios.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button type="submit" className="premium-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Publicando...' : '📣 PUBLICAR AVISO OFICIAL'}
          </button>
        </form>
      )}

      <div className="notificaciones-list">
        {notificaciones.length === 0 ? (
          <div className="glass-panel widget" style={{textAlign: 'center', padding: '3rem'}}>
            <p className="text-muted">No hay comunicados relevantes para ti en este momento.</p>
          </div>
        ) : (
          notificaciones.map(n => (
            <div key={n.id} className="notification-card" style={{
              borderLeft: n.targetType && n.targetType !== 'all' ? '4px solid var(--color-gold)' : ''
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center'}}>
                <span className="notif-date">
                  📅 {new Date(n.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
                {isAdmin && (
                  <span className="badge badge-gold">
                    {getTargetLabel(n)}
                  </span>
                )}
              </div>
              <h3>{n.titulo}</h3>
              <p>{n.contenido}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BoothNotificaciones;
