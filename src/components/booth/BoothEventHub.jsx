import React, { useState, useEffect } from 'react';
import { boothService } from '../../services/boothService';
import CustomCheckbox from '../common/CustomCheckbox';

const BoothEventHub = ({ boothId, eventId, socio, isAdmin }) => {
  const [activeTab, setActiveTab] = useState('consumos'); // Listas first
  const [albaranDocs, setAlbaranDocs] = useState([]);
  const [consumoDocs, setConsumoDocs] = useState([]);
  const [gastosDocs, setGastosDocs] = useState([]);
  const [comidaDocs, setComidaDocs] = useState([]);
  const [tareaDocs, setTareaDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [socios, setSocios] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (boothId) {
       boothService.getSocios(boothId).then(setSocios);
    }
  }, [boothId]);

  // Unified listeners
  useEffect(() => {
    if (!boothId || !eventId) return;
    setLoading(true);

    const unsubAlbaran = boothService.listenToEventData(boothId, eventId, 'albaran', setAlbaranDocs);
    const unsubConsumos = boothService.listenToEventData(boothId, eventId, 'consumos', setConsumoDocs);
    const unsubGastos = boothService.listenToEventData(boothId, eventId, 'gastos', setGastosDocs);
    const unsubComidas = boothService.listenToEventData(boothId, eventId, 'comidas', setComidaDocs);
    const unsubTareas = boothService.listenToEventData(boothId, eventId, 'tareas', setTareaDocs);

    // Initial loading state helper
    setLoading(false);

    return () => {
      unsubAlbaran(); unsubConsumos(); unsubGastos(); unsubComidas(); unsubTareas();
    };
  }, [boothId, eventId]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await boothService.updateEventItem(boothId, eventId, activeTab, editingId, formData);
        setEditingId(null);
      } else {
        await boothService.addEventItem(boothId, eventId, activeTab, {
          ...formData,
          creadoPor: socio.nombre,
          socioId: socio.id
        });
      }
      setFormData({});
    } catch (error) {
      console.error(`Error saving ${activeTab}:`, error);
    }
  };

  const handleSelfCheckout = async (producto) => {
    try {
      if (!window.confirm(`¿Anotar 1x ${producto.articulo} (${producto.precioUnidad}€) a tu cuenta?`)) return;
      
      await boothService.addEventItem(boothId, eventId, 'consumos', {
        targetSocioId: socio.id,
        targetSocioNombre: socio.nombre,
        productoId: producto.id,
        concepto: producto.articulo,
        tipo: producto.tipo,
        precioUnitario: parseFloat(producto.precioUnidad) || 0,
        cantidad: 1,
        precio: parseFloat(producto.precioUnidad) || 0,
        creadoPor: "App Autoservicio"
      });
      // Optionally could add a toast here.
    } catch (error) {
      console.error("Error anotando consumición rápida:", error);
      alert("Error anotando bebida de autoservicio.");
    }
  };

  const handleEditItem = (item) => {
    const { id, creadoPor, fecha, socioId, ...cleanData } = item;
    setFormData(cleanData);
    setEditingId(id);
    // Scroll up to form
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este registro?')) return;
    try {
      await boothService.deleteEventItem(boothId, eventId, activeTab, itemId);
    } catch (error) {
      console.error(`Error deleting from ${activeTab}:`, error);
    }
  };

  return (
    <div className="booth-view fade-in">
      <header className="event-header">
        <h2 className="premium-title">{eventId === 'feria' ? '🎡 Real de la Feria' : '⛺ San Juan'}</h2>
        <div className="tab-nav">
          <button className={activeTab === 'consumos' ? 'active' : ''} onClick={() => setActiveTab('consumos')}>Listas</button>
          <button className={activeTab === 'inventario' ? 'active' : ''} onClick={() => setActiveTab('inventario')}>Inventario</button>
          <button className={activeTab === 'albaran' ? 'active' : ''} onClick={() => setActiveTab('albaran')}>Albarán</button>
          <button className={activeTab === 'gastos' ? 'active' : ''} onClick={() => setActiveTab('gastos')}>Gastos</button>
          <button className={activeTab === 'comidas' ? 'active' : ''} onClick={() => setActiveTab('comidas')}>Comidas</button>
          <button className={activeTab === 'tareas' ? 'active' : ''} onClick={() => setActiveTab('tareas')}>Tareas</button>
        </div>
      </header>

      {loading ? (
        <div className="loader glass-panel" style={{padding: '2rem'}}>Sincronizando...</div>
      ) : (
        <div className="tab-content">
          {activeTab === 'albaran' && (
            <div className="tab-pane fade-in">
              {isAdmin && (
                <form onSubmit={handleAddItem} className="glass-panel admin-action-form" style={{marginBottom: '2rem'}}>
                  <h4 className="text-gold" style={{fontSize: '0.8rem', marginBottom: '1rem'}}>{editingId ? 'EDITAR PRODUCTO' : 'AÑADIR AL ALBARÁN OFICIAL'}</h4>
                   <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                    <input type="text" placeholder="Tipo (ej: A)" required style={{width: '90px'}} maxLength="2"
                      value={formData.tipo || ''} onChange={e => setFormData({...formData, tipo: e.target.value.toUpperCase()})} />
                    <input type="text" placeholder="Artículo (ej: Cerveza)" required style={{flex: 2}}
                      value={formData.articulo || ''} onChange={e => setFormData({...formData, articulo: e.target.value})} />
                    <input type="number" placeholder="Cantidad" required style={{flex: 1}}
                      value={formData.cantidadRecibida || ''} onChange={e => setFormData({...formData, cantidadRecibida: e.target.value})} />
                    <input type="number" step="0.01" placeholder="Precio (€)" required style={{flex: 1}}
                      value={formData.precioUnidad || ''} onChange={e => setFormData({...formData, precioUnidad: e.target.value})} />
                    <input type="text" placeholder="Proveedor" style={{flex: 2}}
                      value={formData.proveedor || ''} onChange={e => setFormData({...formData, proveedor: e.target.value})} />
                    <button type="submit" className="premium-btn" style={{padding: '0.8rem 2rem', fontSize: '0.8rem'}}>{editingId ? '💾 GUARDAR' : '➕ AÑADIR'}</button>
                    {editingId && (
                      <button type="button" className="premium-btn btn-secondary" style={{padding: '0.8rem 1rem', fontSize: '0.8rem', opacity: 0.7}} onClick={() => { setEditingId(null); setFormData({}); }}>✕</button>
                    )}
                  </div>
                </form>
              )}
              <div className="admin-table-wrapper">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Artículo</th>
                      <th>Stock Recibido</th>
                      <th>Precio</th>
                      <th>Proveedor</th>
                      {isAdmin && <th style={{width: '100px'}}></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {albaranDocs.length === 0 ? <tr><td colSpan={isAdmin ? 6 : 5} style={{textAlign: 'center', padding: '3rem'}}>No hay artículos registrados</td></tr> : 
                    albaranDocs.map(item => (
                      <tr key={item.id}>
                        <td className="text-gold" style={{fontWeight: 900}}>{item.tipo}</td>
                        <td><strong>{item.articulo}</strong></td>
                        <td>{item.cantidadRecibida || 0} ud</td>
                        <td className="text-secondary">{item.precioUnidad || 0}€</td>
                        <td className="text-muted small">{item.proveedor}</td>
                        {isAdmin && (
                          <td style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                            <button className="action-btn-mini edit-btn-mini" onClick={() => handleEditItem(item)} title="Editar">✏️</button>
                            <button className="action-btn-mini delete-btn-mini" onClick={() => handleDeleteItem(item.id)} title="Eliminar">🗑️</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'inventario' && (
            <div className="tab-pane fade-in">
              <div className="admin-table-wrapper" style={{marginTop: '2rem'}}>
                <table className="premium-table">
                  <thead><tr><th>Producto</th><th>Total Recibido</th><th>Consumido</th><th>Stock Actual</th></tr></thead>
                  <tbody>
                    {albaranDocs.length === 0 ? <tr><td colSpan="4" style={{textAlign: 'center', padding: '3rem'}}>No hay datos para calcular inventario</td></tr> :
                    albaranDocs.map(item => {
                      const totalConsumido = consumoDocs
                        .filter(c => c.productoId === item.id)
                        .reduce((acc, curr) => acc + (parseFloat(curr.cantidad) || 0), 0);
                      const stock = (parseFloat(item.cantidadRecibida) || 0) - totalConsumido;
                      return (
                        <tr key={item.id}>
                          <td><strong>{item.articulo}</strong></td>
                          <td>{item.cantidadRecibida} ud</td>
                          <td style={{color: 'var(--color-red)'}}>{totalConsumido} ud</td>
                          <td style={{
                            fontWeight: 900, 
                            fontSize: '1.2rem',
                            color: stock <= 0 ? '#ff0000' : (stock <= 10 ? '#ffa500' : '#00ff00'),
                            textShadow: stock <= 0 ? '0 0 10px rgba(255,0,0,0.5)' : 'none'
                          }}>
                            {stock <= 0 ? (
                              <span className="fade-in">AGOTADO 🚫</span>
                            ) : (
                              <>
                                {stock} {stock <= 10 && '⚠️'}
                                <span style={{fontSize: '0.7rem', marginLeft: '5px'}}>ud</span>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'gastos' && (
            <div className="tab-pane fade-in">
              {isAdmin && (
                <form onSubmit={handleAddItem} className="glass-panel admin-action-form" style={{marginBottom: '2rem'}}>
                  <h4 className="text-gold" style={{fontSize: '0.8rem', marginBottom: '1rem'}}>REGISTRAR MOVIMIENTO (GASTO O INGRESO)</h4>
                  <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                    <select required value={formData.tipoMovimiento || 'gasto'} 
                      onChange={e => setFormData({...formData, tipoMovimiento: e.target.value})}
                      style={{background: 'black', border: '1px solid var(--glass-border)', color: 'white', padding: '0.8rem', flex: 1}}>
                      <option value="gasto">Gasto 💸</option>
                      <option value="ingreso">Ingreso 💰</option>
                    </select>
                    <select required value={formData.targetSocioId || socio.id} 
                      onChange={e => {
                        const s = socios.find(x => x.id === e.target.value);
                        setFormData({...formData, targetSocioId: e.target.value, creadoPor: s?.nombre});
                      }}
                      style={{background: 'black', border: '1px solid var(--glass-border)', color: 'white', padding: '0.8rem', flex: 1}}>
                      <option value="">¿Quién realiza el movimiento?</option>
                      {socios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                    <input type="text" placeholder="Concepto (ej: Hielo, Cuota extra...)" required style={{flex: 2}}
                      value={formData.concepto || ''} onChange={e => setFormData({...formData, concepto: e.target.value})} />
                    <input type="number" step="0.01" placeholder="Importe (€)" required style={{width: '120px'}}
                      value={formData.importe || ''} onChange={e => setFormData({...formData, importe: e.target.value})} />
                    <button type="submit" className="premium-btn" style={{padding: '0.8rem 2rem', fontSize: '0.8rem'}}>💾 REGISTRAR</button>
                  </div>
                </form>
              )}
              <div className="admin-table-wrapper">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Concepto</th>
                      <th>Importe</th>
                      <th>Socio</th>
                      {isAdmin && <th></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {gastosDocs.length === 0 ? <tr><td colSpan={isAdmin ? 5 : 4} style={{textAlign: 'center', padding: '3rem'}}>No hay movimientos registrados</td></tr> :
                    gastosDocs.map(item => (
                      <tr key={item.id}>
                        <td>{item.tipoMovimiento === 'ingreso' ? <span className="text-secondary" style={{fontWeight: 900}}>🟢 INGRESO</span> : <span style={{color: 'var(--color-red)', fontWeight: 900}}>🔴 GASTO</span>}</td>
                        <td>{item.concepto}</td>
                        <td style={{color: item.tipoMovimiento === 'ingreso' ? 'var(--color-secondary)' : 'var(--color-red)', fontWeight: 'bold'}}>{item.tipoMovimiento === 'ingreso' ? '+' : '-'}{item.importe}€</td>
                        <td>{item.creadoPor}</td>
                        {isAdmin && (
                          <td>
                            <button className="action-btn-mini delete-btn-mini" onClick={() => handleDeleteItem(item.id)} title="Eliminar">🗑️</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'comidas' && (
            <div className="tab-pane fade-in">
              {isAdmin && (
                <form onSubmit={handleAddItem} className="glass-panel admin-action-form" style={{marginBottom: '2rem'}}>
                  <h4 className="text-gold" style={{fontSize: '0.8rem', marginBottom: '1rem'}}>PROGRAMAR DÍA DE COMIDA Y ASIGNAR GRUPO</h4>
                  <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', flexDirection: 'column'}}>
                    <div style={{display: 'flex', gap: '1rem'}}>
                      <input type="date" required value={formData.fecha || ''} onChange={e => setFormData({...formData, fecha: e.target.value})} />
                      <input type="text" placeholder="Nota opcional (ej: Arroz)..." style={{flex: 1}} value={formData.menu || ''} onChange={e => setFormData({...formData, menu: e.target.value})} />
                      <button type="submit" className="premium-btn" style={{padding: '0.8rem 2rem', fontSize: '0.8rem'}}>📅 PROGRAMAR</button>
                    </div>
                    <div className="glass-panel" style={{padding: '1rem', background: 'rgba(0,0,0,0.5)'}}>
                      <p style={{fontSize: '0.7rem', marginBottom: '0.5rem'}} className="text-gold">SELECCIONAR GRUPO RESPONSABLE:</p>
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto'}}>
                        {socios.map(s => (
                          <label key={s.id} style={{fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}>
                            <input type="checkbox" 
                              checked={(formData.responsablesIds || []).includes(s.id)}
                              onChange={e => {
                                const ids = formData.responsablesIds || [];
                                const nombres = formData.responsablesNombres || [];
                                if (e.target.checked) {
                                  setFormData({...formData, responsablesIds: [...ids, s.id], responsablesNombres: [...nombres, s.nombre]});
                                } else {
                                  setFormData({...formData, responsablesIds: ids.filter(id => id !== s.id), responsablesNombres: nombres.filter(n => n !== s.nombre)});
                                }
                              }}
                            /> {s.nombre}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </form>
              )}
              <div className="home-grid">
                {comidaDocs.length === 0 ? <p className="text-muted" style={{gridColumn: '1/-1', textAlign: 'center', padding: '3rem'}}>No hay comidas programadas</p> :
                comidaDocs.map(comida => {
                  const isResponsable = (comida.responsablesIds || []).includes(socio.id);
                  const canEdit = isAdmin || isResponsable;
                  const isEditingThis = editingId === comida.id;

                  return (
                    <div key={comida.id} className="glass-panel widget event-card fade-in">
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                        <h4 style={{fontSize: '1rem', border: 'none', marginBottom: '0.5rem'}}>{new Date(comida.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
                        {isAdmin && <button className="action-btn-mini delete-btn-mini" style={{width: '32px', height: '32px', borderRadius: '10px'}} onClick={() => handleDeleteItem(comida.id)}>🗑️</button>}
                      </div>

                      {isEditingThis ? (
                        <div className="edit-menu-form fade-in" style={{marginTop: '1rem'}}>
                           <input type="text" placeholder="Menú..." className="premium-input" style={{width: '100%', marginBottom: '0.5rem'}}
                             value={formData.menu || ''} onChange={e => setFormData({...formData, menu: e.target.value})} />
                           <input type="number" step="0.01" placeholder="Precio Cubierto (€)" className="premium-input" style={{width: '100%', marginBottom: '1rem'}}
                             value={formData.precioCubierto || ''} onChange={e => setFormData({...formData, precioCubierto: e.target.value})} />
                           <div style={{display: 'flex', gap: '0.5rem'}}>
                             <button className="premium-btn" style={{flex: 1, padding: '0.5rem'}} onClick={handleAddItem}>💾 GUARDAR</button>
                             <button className="premium-btn btn-secondary" style={{padding: '0.5rem'}} onClick={() => { setEditingId(null); setFormData({}); }}>✕</button>
                           </div>
                        </div>
                      ) : (
                        <>
                          <p className="menu-text" style={{minHeight: '60px', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 600}}>
                            {comida.menu || 'Menú por definir'}
                          </p>
                          <div style={{marginBottom: '1rem'}}>
                            <span className="text-gold" style={{fontSize: '0.8rem', fontWeight: 800}}>💰 {comida.precioCubierto ? `${comida.precioCubierto}€` : '-'} / cubierto</span>
                          </div>
                          <div className="text-muted small" style={{marginBottom: '1rem'}}>
                             <strong>Grupo:</strong> {comida.responsablesNombres?.join(', ') || 'Sin asignar'}
                          </div>
                          
                          <div className="event-footer" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)'}}>
                            <span className="text-gold" style={{fontSize: '0.8rem', fontWeight: 800}}>👥 {Object.keys(comida.asistentes || {}).length} asistentes</span>
                            <div style={{display: 'flex', gap: '0.8rem'}}>
                               {canEdit && <button className="action-btn-mini edit-btn-mini" style={{fontSize: '0.9rem', width: '36px', height: '36px'}} onClick={() => handleEditItem(comida)} title="Editar menú">✏️</button>}
                               <button className="premium-btn btn-secondary" style={{padding: '0.4rem 1rem', fontSize: '0.8rem', minHeight: 'auto'}} onClick={() => {
                                  const asistentes = {...(comida.asistentes || {}), [socio.id]: { nombre: socio.nombre, invitados: 0 }};
                                  boothService.updateEventItem(boothId, eventId, 'comidas', comida.id, { asistentes });
                               }}>Anotarme</button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'tareas' && (
            <div className="tab-pane fade-in">
              {isAdmin && (
                <form onSubmit={handleAddItem} className="glass-panel admin-action-form" style={{marginBottom: '2rem'}}>
                   <h4 className="text-gold" style={{fontSize: '0.8rem', marginBottom: '1rem'}}>ASIGNAR TAREA A GRUPO</h4>
                  <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', flexDirection: 'column'}}>
                    <div style={{display: 'flex', gap: '1rem', width: '100%'}}>
                      <input type="text" placeholder="Tarea (ej: Montaje alumbrado)" required style={{flex: 2}}
                        value={formData.tarea || ''} onChange={e => setFormData({...formData, tarea: e.target.value})} />
                      <button type="submit" className="premium-btn" style={{padding: '0.8rem 2rem', fontSize: '0.8rem'}}>📝 ASIGNAR</button>
                    </div>
                    <div className="glass-panel" style={{padding: '1rem', background: 'rgba(0,0,0,0.5)'}}>
                      <p style={{fontSize: '0.7rem', marginBottom: '0.5rem'}} className="text-gold">SELECCIONAR SOCIOS (GRUPO):</p>
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto'}}>
                        {socios.map(s => (
                          <label key={s.id} style={{fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}>
                            <input type="checkbox" 
                              checked={(formData.responsablesIds || []).includes(s.id)}
                              onChange={e => {
                                const ids = formData.responsablesIds || [];
                                const nombres = formData.responsablesNombres || [];
                                if (e.target.checked) {
                                  setFormData({...formData, responsablesIds: [...ids, s.id], responsablesNombres: [...nombres, s.nombre]});
                                } else {
                                  setFormData({...formData, responsablesIds: ids.filter(id => id !== s.id), responsablesNombres: nombres.filter(n => n !== s.nombre)});
                                }
                              }}
                            /> {s.nombre}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </form>
              )}
              <div className="tareas-list">
                {tareaDocs.length === 0 ? <p className="text-muted" style={{gridColumn: '1/-1', textAlign: 'center', padding: '3rem'}}>No hay tareas pendientes</p> :
                tareaDocs.map(tarea => (
                  <div key={tarea.id} className={`tarea-item fade-in ${tarea.completada ? 'done' : ''}`} style={{margin: 0}}>
                    <CustomCheckbox 
                      id={`task-${tarea.id}`}
                      checked={tarea.completada || false}
                      disabled={!isAdmin && !(tarea.responsablesIds || []).includes(socio.id)}
                      onChange={e => {
                        boothService.updateEventItem(boothId, eventId, 'tareas', tarea.id, { completada: e.target.checked });
                      }}
                    />
                    <div className="tarea-body">
                      <strong style={{display: 'block', color: 'var(--text-primary)', fontSize: '1rem'}}>{tarea.tarea}</strong>
                      <span className="text-gold" style={{fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase'}}>RESPONSABLES: {tarea.responsablesNombres?.join(', ') || 'GENERAL'}</span>
                      {isAdmin && (
                         <button className="action-btn-mini delete-btn-mini" style={{marginLeft: 'auto', width: '32px', height: '32px'}} onClick={() => handleDeleteItem(tarea.id)}>🗑️</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'consumos' && (
            <div className="tab-pane fade-in">
              {isAdmin && (
                <form onSubmit={handleAddItem} className="glass-panel admin-action-form" style={{marginBottom: '2rem'}}>
                  <h4 className="text-gold" style={{fontSize: '0.8rem', marginBottom: '1rem'}}>ANOTAR CONSUMO A SOCIO</h4>
                  <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                    <select required value={formData.targetSocioId || ''} 
                      onChange={e => {
                        const s = socios.find(x => x.id === e.target.value);
                        setFormData({...formData, targetSocioId: e.target.value, targetSocioNombre: s?.nombre});
                      }}
                      style={{background: 'black', border: '1px solid var(--glass-border)', color: 'white', padding: '0.8rem', flex: 1}}>
                      <option value="">Seleccionar Socio...</option>
                      {socios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                    
                     <select required value={formData.productoId || ''} 
                      onChange={e => {
                        const p = albaranDocs.find(x => x.id === e.target.value);
                        setFormData({...formData, productoId: e.target.value, concepto: p?.articulo, tipo: p?.tipo, precioUnitario: p?.precioUnidad});
                      }}
                      style={{background: 'black', border: '1px solid var(--glass-border)', color: 'white', padding: '0.8rem', flex: 1}}>
                      <option value="">Seleccionar Producto...</option>
                      {albaranDocs.map(p => <option key={p.id} value={p.id}>[{p.tipo}] {p.articulo} ({p.precioUnidad}€/ud)</option>)}
                    </select>

                    <input type="number" placeholder="Cant." required style={{width: '90px'}}
                      value={formData.cantidad || ''} onChange={e => {
                        const cant = parseFloat(e.target.value) || 0;
                        const total = cant * (formData.precioUnitario || 0);
                        setFormData({...formData, cantidad: e.target.value, precio: total});
                      }} />

                    {formData.precio > 0 && <div className="text-gold" style={{alignSelf: 'center', fontWeight: 'bold'}}>= {formData.precio}€</div>}

                    <button type="submit" className="premium-btn" style={{padding: '0.8rem 2rem', fontSize: '0.8rem'}}>➕ ANOTAR</button>
                  </div>
                </form>
              )}

              {/* AUTOSERVICIO (Self-Checkout TPOS) */}
              <div className="glass-panel widget self-checkout-widget" style={{ marginBottom: '2rem', border: '1px solid var(--color-gold)', background: 'linear-gradient(145deg, rgba(30,30,35,0.9), rgba(15,15,20,0.95))' }}>
                <h4 className="text-gold" style={{fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'center', fontFamily: 'var(--font-serif)', letterSpacing: '2px'}}>BARRA RÁPIDA</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                  {albaranDocs.map(p => {
                     // Calcular stock en tiempo real
                     const consumed = consumoDocs.filter(c => c.productoId === p.id).reduce((acc, curr) => acc + (parseFloat(curr.cantidad)||0), 0);
                     const stock = (parseFloat(p.cantidadRecibida)||0) - consumed;
                     const isAgotado = stock <= 0;

                     return (
                       <button 
                         key={p.id} 
                         onClick={() => !isAgotado && handleSelfCheckout(p)}
                         disabled={isAgotado}
                         className="tpos-btn fade-in" 
                         style={{
                            padding: '1rem', 
                            background: isAgotado ? 'rgba(255,0,0,0.05)' : 'rgba(212,175,55,0.08)', 
                            border: `1px solid ${isAgotado ? 'red' : 'rgba(212,175,55,0.4)'}`,
                            borderRadius: '16px',
                            cursor: isAgotado ? 'not-allowed' : 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                            opacity: isAgotado ? 0.3 : 1,
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                         }}
                         onMouseEnter={(e) => { if(!isAgotado) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.background = 'rgba(212,175,55,0.15)'; } }}
                         onMouseLeave={(e) => { if(!isAgotado) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'rgba(212,175,55,0.08)'; } }}
                       >
                         <span style={{ fontSize: '1.5rem', fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{p.tipo}</span>
                         <span style={{ fontSize: '0.8.5rem', textAlign: 'center', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%', color: 'var(--text-primary)' }}>{p.articulo}</span>
                         <span className="text-gold" style={{ fontSize: '1.2rem', fontWeight: '900' }}>{p.precioUnidad}€</span>
                         {isAgotado && <span style={{color: 'red', fontSize: '0.7rem', fontWeight: 900, position: 'absolute', transform: 'rotate(-15deg)', background: 'rgba(0,0,0,0.8)', padding: '2px 8px', borderRadius: '4px'}}>AGOTADO</span>}
                       </button>
                     );
                  })}
                </div>
              </div>

              <div className="home-grid">
                {/* Personal View */}
                <div className="glass-panel widget h-widget has-debt">
                   <div className="widget-header">
                      <span className="widget-icon">👤</span>
                      <h4>Mi Cuenta Personal</h4>
                   </div>
                   <div className="widget-body">
                      <div className="debt-amount">
                         {consumoDocs.filter(i => i.targetSocioId === socio.id)
                           .reduce((acc, curr) => acc + (parseFloat(curr.precio) || 0), 0)
                           .toLocaleString()} <span className="currency">€</span>
                      </div>
                      <p className="text-muted small">Total acumulado en este evento.</p>
                      <ul style={{marginTop: '1rem', padding: 0, listStyle: 'none', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', maxHeight: '300px', overflowY: 'auto'}}>
                         {consumoDocs.filter(i => i.targetSocioId === socio.id).map(i => (
                           <li key={i.id} style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem'}}>
                              <span><strong>{i.cantidad}ud</strong> - [{i.tipo}] {i.concepto}</span>
                              <span className="text-gold">{i.precio}€</span>
                           </li>
                         ))}
                      </ul>
                   </div>
                </div>

                 {/* Master List (Visible for all) */}
                  <div className="glass-panel widget h-widget" style={{gridColumn: 'span 2'}}>
                     <div className="widget-header">
                        <span className="widget-icon">📊</span>
                        <h4>Resumen de Consumos de la Caseta</h4>
                     </div>
                     <div className="widget-body" style={{overflowX: 'auto'}}>
                        <table className="premium-table" style={{marginTop: '1rem', width: '100%'}}>
                           <thead>
                              <tr>
                                 <th>Socio</th>
                                 <th>Total Acumulado</th>
                                 <th>Último Consumo</th>
                                 {isAdmin && <th></th>}
                              </tr>
                           </thead>
                           <tbody>
                              {socios.map(s => {
                                 const userConsumos = consumoDocs.filter(i => i.targetSocioId === s.id);
                                 const total = userConsumos.reduce((acc, curr) => acc + (parseFloat(curr.precio) || 0), 0);
                                 if (total === 0) return null;
                                 return (
                                   <tr key={s.id}>
                                      <td>{s.nombre}</td>
                                      <td className="text-gold" style={{fontWeight: 900}}>{total.toLocaleString()} €</td>
                                      <td className="text-muted small">
                                         {userConsumos[userConsumos.length - 1]?.concepto || '-'}
                                      </td>
                                      {isAdmin && (
                                        <td>
                                          <button className="delete-btn-mini" onClick={async () => {
                                            if (!window.confirm('¿Deseas eliminar EL ÚLTIMO consumo registrado para este socio?')) return;
                                            const lastId = userConsumos[userConsumos.length - 1]?.id;
                                            if (lastId) await boothService.deleteEventItem(boothId, eventId, 'consumos', lastId);
                                          }} title="Eliminar último">🗑️</button>
                                        </td>
                                      )}
                                   </tr>
                                 );
                              })}
                           </tbody>
                        </table>
                     </div>
                  </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BoothEventHub;
