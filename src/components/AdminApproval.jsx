import React, { useState, useEffect } from 'react';
import './AdminApproval.css';
import { boothService } from '../services/boothService';
import { ROLES } from '../data/data';

const AdminApproval = ({ casetas }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const fetched = await boothService.getPendingRequests();
      setRequests(fetched);
      setLoading(false);
    };
    fetchRequests();
  }, []);

  const handleAction = async (requestId, status, socioData = null) => {
    await boothService.updateRequestStatus(requestId, status, socioData);
    setRequests(requests.filter(r => r.id !== requestId));
    alert(`Solicitud ${status === 'aprobado' ? 'Aprobada' : 'Rechazada'} con éxito.`);
  };

  const getCasetaName = (id) => casetas.find(c => c.id === id)?.nombre || 'Desconocida';

  return (
    <div className="admin-approval-container glass-panel fade-in">
      <h2 className="section-title">Solicitudes de Entrada Pendientes</h2>
      <p>Revisa las peticiones de los interesados en unirse a las casetas del Real.</p>

      {loading ? (
        <div className="loader">Consultando solicitudes...</div>
      ) : (
        <div className="requests-table-wrapper">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Caseta Solicitada</th>
                <th>Motivo</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => (
                <tr key={request.id}>
                  <td><strong>{request.nombre}</strong></td>
                  <td>
                    <div className="contact-info">
                      <span>✉️ {request.email}</span>
                      <span>📞 {request.telefono}</span>
                    </div>
                  </td>
                  <td>{getCasetaName(request.casetaId)}</td>
                  <td className="reason-cell">{request.motivo || 'No especificado'}</td>
                  <td>{new Date(request.fecha).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button 
                      className="approve-btn"
                      onClick={() => handleAction(request.id, 'aprobado', {
                        uid: request.uid,
                        nombre: request.nombre,
                        email: request.email,
                        telefono: request.telefono,
                        casetaId: request.casetaId,
                        rol: ROLES.NORMAL,
                        approved: true
                      })}
                    >
                      Aprobar
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => handleAction(request.id, 'rechazado')}
                    >
                      Rechazar
                    </button>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan="6" className="no-requests">No hay solicitudes pendientes en este momento.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminApproval;
