import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { boothService } from '../services/boothService';
import { ROLES } from '../data/data';
import AdminApproval from './AdminApproval';
import AddCasetaForm from './AddCasetaForm';

const AdminDashboard = ({ casetas, onAddCaseta }) => {
  const [activeView, setActiveView] = useState('stats');
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCaseta, setEditingCaseta] = useState(null);

  useEffect(() => {
    const unsubscribe = boothService.listenToAllSocios((data) => {
      setSocios(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const stats = {
    totalCasetas: casetas.length,
    totalSocios: socios.length,
    pendingSocios: socios.filter(s => !s.approved && s.casetaId).length,
    pendingAppUsers: socios.filter(s => !s.approved).length,
    publicas: casetas.filter(c => c.clase === 'Publica').length,
    privadas: casetas.filter(c => c.clase === 'Privada').length,
    peñas: casetas.filter(c => c.clase === 'Peña').length
  };

  const handleUpdateRole = async (uid, newRole) => {
    if (window.confirm(`¿Seguro que quieres cambiar el rol a ${newRole}?`)) {
      await boothService.updateSocioRole(uid, newRole);
    }
  };

  const handleDeleteCaseta = async (id) => {
    if (window.confirm('¿ELIMINAR CASETA? Esta acción es permanente.')) {
      await boothService.deleteCaseta(id);
      alert('Caseta eliminada.');
    }
  };

  const handleEditClick = (caseta) => {
    setEditingCaseta(caseta);
    setActiveView('add');
  };

  const handleUpdateCaseta = async (id, data) => {
    await boothService.saveCaseta(id, data);
    setEditingCaseta(null);
    setActiveView('booths');
  };

  return (
    <div className="admin-dashboard-layout fade-in">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar glass-panel">
        <div className="admin-sidebar-header">
          <span className="admin-icon">🛡️</span>
          <h3>Panel Control</h3>
        </div>
        <nav className="admin-nav">
          <button className={activeView === 'stats' ? 'active' : ''} onClick={() => setActiveView('stats')}>
            <span className="icon">📊</span> 
            <span className="label">Resumen</span>
          </button>
          <button className={activeView === 'booths' ? 'active' : ''} onClick={() => setActiveView('booths')}>
            <span className="icon">🛖</span> 
            <span className="label">Casetas</span>
          </button>
          <button className={activeView === 'users' ? 'active' : ''} onClick={() => setActiveView('users')}>
            <span className="icon">👥</span> 
            <span className="label">Socios</span>
          </button>
          <button className={activeView === 'requests' ? 'active' : ''} onClick={() => setActiveView('requests')}>
            <span className="icon">⚖️</span> 
            <span className="label">Peticiones</span>
          </button>
          <button className={activeView === 'add' ? 'active' : ''} onClick={() => { setActiveView('add'); setEditingCaseta(null); }}>
            <span className="icon">➕</span> 
            <span className="label">Nueva</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-content">
        
        {activeView === 'stats' && (
          <div className="admin-view fade-in">
            <h2 className="premium-title">Estado del Real</h2>
            <div className="stats-grid">
              <div className="stat-card glass-panel gold-border">
                <span className="stat-value">{stats.totalCasetas}</span>
                <span className="stat-label">Casetas Totales</span>
              </div>
              <div className="stat-card glass-panel">
                <span className="stat-value text-gold">{stats.pendingAppUsers}</span>
                <span className="stat-label">Nuevos Registros</span>
              </div>
              <div className="stat-card glass-panel">
                <span className="stat-value text-red">{stats.pendingSocios}</span>
                <span className="stat-label">Peticiones Caseta</span>
              </div>
            </div>

            <div className="distribution-chart glass-panel mt-2">
              <h3>Distribución por Tipo</h3>
              <div className="chart-bars">
                <div className="chart-item">
                  <div className="bar-container"><div className="bar bg-red" style={{ height: `${(stats.publicas/(stats.totalCasetas || 1))*100}%` }}></div></div>
                  <span>Públicas ({stats.publicas})</span>
                </div>
                <div className="chart-item">
                  <div className="bar-container"><div className="bar bg-green" style={{ height: `${(stats.privadas/(stats.totalCasetas || 1))*100}%` }}></div></div>
                  <span>Privadas ({stats.privadas})</span>
                </div>
                <div className="chart-item">
                  <div className="bar-container"><div className="bar bg-yellow" style={{ height: `${(stats.peñas/(stats.totalCasetas || 1))*100}%` }}></div></div>
                  <span>Peñas ({stats.peñas})</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'booths' && (
          <div className="admin-view fade-in">
            <h2 className="premium-title">Gestión de Inventario</h2>
            <div className="admin-table-wrapper glass-panel">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Nombre</th>
                    <th>Calle</th>
                    <th>Clase</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {casetas.map(c => (
                    <tr key={c.id}>
                      <td><img src={c.imagen} className="table-thumb" alt="" /></td>
                      <td><strong>{c.nombre}</strong></td>
                      <td>{c.calle}, {c.numero}</td>
                      <td><span className={`badge ${c.clase.toLowerCase()}`}>{c.clase}</span></td>
                      <td className="actions-cell">
                        <button className="action-btn-mini edit-btn-mini" onClick={() => handleEditClick(c)} title="Editar">✏️</button>
                        <button className="action-btn-mini delete-btn-mini" onClick={() => handleDeleteCaseta(c.id)} title="Eliminar">🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {casetas.length === 0 && (
                    <tr><td colSpan="5" className="no-data">No hay casetas registradas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'users' && (
          <div className="admin-view fade-in">
            <h2 className="premium-title">Directorio de Socios</h2>
            <div className="admin-table-wrapper glass-panel">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {socios.map(s => (
                    <tr key={s.id}>
                      <td>{s.nombre}</td>
                      <td>{s.email}</td>
                      <td>
                        <select 
                          className="role-select" 
                          value={s.rol} 
                          onChange={(e) => handleUpdateRole(s.id, e.target.value)}
                        >
                          <option value={ROLES.NORMAL}>Socio</option>
                          <option value={ROLES.PRESIDENTE}>Presidente</option>
                          <option value={ROLES.GLOBAL_ADMIN}>Admin Global</option>
                        </select>
                      </td>
                      <td>
                        <span className={`status-tag ${s.approved ? 'ok' : 'pending'}`}>
                          {s.approved ? 'Validado' : 'Pendiente'}
                        </span>
                      </td>
                      <td>
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                          {!s.approved && (
                            <button className="action-link text-green" onClick={() => boothService.approveSocio(s.id)}>Aprobar</button>
                          )}
                          <button className="action-link text-red" onClick={() => boothService.detachSocioFromCaseta(s.id)}>Expulsar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'requests' && (
          <div className="admin-view fade-in">
            <AdminApproval casetas={casetas} />
          </div>
        )}

        {activeView === 'add' && (
          <div className="admin-view fade-in">
            <AddCasetaForm 
              onAdd={onAddCaseta} 
              onUpdate={handleUpdateCaseta}
              initialData={editingCaseta}
              onCancel={() => { setEditingCaseta(null); setActiveView('booths'); }}
            />
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;
