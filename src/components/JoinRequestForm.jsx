import React, { useState, useEffect } from 'react';
import './JoinRequestForm.css';
import { boothService } from '../services/boothService';

const JoinRequestForm = ({ casetas, currentUser, initialCasetaId }) => {
  const [formData, setFormData] = useState({
    casetaId: initialCasetaId || '',
    motivo: ''
  });
  
  const [submitted, setSubmitted] = useState(false);

  // Sync with initialCasetaId if it changes
  useEffect(() => {
    if (initialCasetaId) {
      setFormData(prev => ({ ...prev, casetaId: initialCasetaId }));
    }
  }, [initialCasetaId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.casetaId) {
      alert("Por favor, selecciona una caseta.");
      return;
    }
    
    // Auto-fill with current user data to prevent falsifying info
    await boothService.submitRequest({
      ...formData,
      nombre: currentUser?.nombre || currentUser?.email || 'Socio',
      email: currentUser?.email,
      telefono: currentUser?.telefono || 'Sin especificar',
      uid: currentUser?.id
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="request-success glass-panel fade-in">
        <div className="success-icon">✅</div>
        <h2>¡Solicitud Enviada!</h2>
        <p>Tu petición para unirte a la caseta ha sido registrada. Tu información de perfil se ha enviado automáticamente.</p>
        <button onClick={() => setSubmitted(false)} className="gold-link">Enviar otra solicitud</button>
      </div>
    );
  }

  return (
    <div className="join-request-container glass-panel fade-in">
      <h2 className="section-title">Solicitar Entrada</h2>
      <p>Selecciona la caseta a la que quieres unirte. Enviamos tu perfil verificado automáticamente.</p>

      <form className="request-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Selecciona la Caseta</label>
          <select 
            required
            value={formData.casetaId}
            onChange={(e) => setFormData({...formData, casetaId: e.target.value})}
          >
            <option value="">-- Elige una caseta --</option>
            {casetas.map(caseta => (
              <option key={caseta.id} value={caseta.id}>
                {caseta.nombre} ({caseta.calle}, {caseta.numero})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Motivo de la solicitud (Opcional)</label>
          <textarea 
            rows="4"
            value={formData.motivo}
            onChange={(e) => setFormData({...formData, motivo: e.target.value})}
            placeholder="¿Por qué quieres unirte a esta caseta?..."
          />
        </div>

        <button type="submit" className="submit-btn feria-gradient">
          Enviar Petición Oficial
        </button>
      </form>
    </div>
  );
};

export default JoinRequestForm;
