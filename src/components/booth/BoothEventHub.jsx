import React, { useState, useEffect } from 'react';
import { boothService } from '../../services/boothService';
import CustomCheckbox from '../common/CustomCheckbox';
import './BoothEventHub.css';

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
                <form onSubmit={handleAddItem} className="admin-action-form fade-in">
                  <h4>{editingId ? 'EDITAR PRODUCTO' : 'AÑADIR AL ALBARÁN OFICIAL'}</h4>
                   <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                    <input type="text" placeholder="TIPO (A)" required style={{width: '90px'}} maxLength="2"
                      value={formData.tipo || ''} onChange={e => setFormData({...formData, tipo: e.target.value.toUpperCase()})} />
                    <input type="text" placeholder="Artículo (ej: Cerveza)" required style={{flex: 2}}
                      value={formData.articulo || ''} onChange={e => setFormData({...formData, articulo: e.target.value})} />
                    <input type="number" placeholder="Cant." required style={{flex: 1}}
                      value={formData.cantidadRecibida || ''} onChange={e => setFormData({...formData, cantidadRecibida: e.target.value})} />
                    <input type="number" step="0.01" placeholder="Precio €" required style={{flex: 1}}
                      value={formData.precioUnidad || ''} onChange={e => setFormData({...formData, precioUnidad: e.target.value})} />
                    <input type="text" placeholder="Proveedor" style={{flex: 2}}
                      value={formData.proveedor || ''} onChange={e => setFormData({...formData, proveedor: e.target.value})} />
                    <button type="submit" className="premium-btn">{editingId ? '💾 GUARDAR' : '➕ AÑADIR'}</button>
                    {editingId && (
                      <button type="button" className="premium-btn btn-secondary" onClick={() => { setEditingId(null); setFormData({}); }}>✕</button>
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
              <div className="admin-table-wrapper">
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
                          }}>
                            {stock <= 0 ? (
                              <span className="badge badge-red">AGOTADO 🚫</span>
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
                <form onSubmit={handleAddItem} className="admin-action-form fade-in">
                  <h4>REGISTRAR MOVIMIENTO (GASTO O INGRESO)</h4>
                  <div className="event-form-grid">
                    <select required value={formData.tipoMovimiento || 'gasto'} 
                      onChange={e => setFormData({...formData, tipoMovimiento: e.target.value})}>
                      <option value="gasto">Gasto 💸</option>
                      <option value="ingreso">Ingreso 💰</option>
                    </select>
                    <select required value={formData.targetSocioId || socio.id} 
                      onChange={e => {
                        const s = socios.find(x => x.id === e.target.value);
                        setFormData({...formData, targetSocioId: e.target.value, creadoPor: s?.nombre});
                      }}>
                      <option value="">¿Quién realiza el movimiento?</option>
                      {socios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                    <input type="text" placeholder="Concepto (ej: Hielo, Cuota extra...)" required
                      value={formData.concepto || ''} onChange={e => setFormData({...formData, concepto: e.target.value})} />
                    <input type="number" step="0.01" placeholder="Importe (€)" required
                      value={formData.importe || ''} onChange={e => setFormData({...formData, importe: e.target.value})} />
                    <button type="submit" className="premium-btn">💾 REGISTRAR</button>
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
                        <td>{item.tipoMovimiento === 'ingreso' ? <span className="badge badge-green">INGRESO</span> : <span className="badge badge-red">GASTO</span>}</td>
                        <td><strong>{item.concepto}</strong></td>
                        <td style={{color: item.tipoMovimiento === 'ingreso' ? 'var(--color-secondary)' : '#ff4d4d', fontWeight: 'bold'}}>{item.tipoMovimiento === 'ingreso' ? '+' : '-'}{item.importe}€</td>
                        <td>{item.creadoPor}</td>
                        {isAdmin && (
                          <td>
                            <button className="delete-btn-mini" onClick={() => handleDeleteItem(item.id)} title="Eliminar">🗑️</button>
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
                <form onSubmit={handleAddItem} className="admin-action-form fade-in">
                  <h4>PROGRAMAR COMIDA Y ASIGNAR GRUPO</h4>
                  <div className="event-form-grid">
                    <input type="date" required value={formData.fecha || ''} onChange={e => setFormData({...formData, fecha: e.target.value})} />
                    <input type="text" placeholder="Nota opcional (ej: Arroz)..." value={formData.menu || ''} onChange={e => setFormData({...formData, menu: e.target.value})} />
                    <button type="submit" className="premium-btn">📅 PROGRAMAR</button>
                  </div>
                  <div className="glass-panel" style={{padding: '1.5rem', background: 'rgba(0,0,0,0.3)', marginTop: '1rem', border: '1px solid var(--glass-border)'}}>
                    <p style={{fontSize: '0.75rem', marginBottom: '1rem', fontWeight: 800}} className="text-gold">RESPONSABLES DEL DÍA:</p>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem', maxHeight: '150px', overflowY: 'auto'}}>
                      {socios.map(s => (
                        <label key={s.id} style={{fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
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
                        <h4 style={{fontSize: '1rem', border: 'none', marginBottom: '0.5rem', color: 'var(--color-gold)'}}>
                          📅 {new Date(comida.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h4>
                        {isAdmin && <button className="delete-btn-mini" onClick={() => handleDeleteItem(comida.id)}>🗑️</button>}
                      </div>

                      {isEditingThis ? (
                        <div className="edit-menu-form fade-in" style={{marginTop: '1rem'}}>
                           <input type="text" placeholder="Menú..." className="premium-input" style={{width: '100%', marginBottom: '0.5rem'}}
                             value={formData.menu || ''} onChange={e => setFormData({...formData, menu: e.target.value})} />
                           <input type="number" step="0.01" placeholder="Precio Cubierto (€)" className="premium-input" style={{width: '100%', marginBottom: '1rem'}}
                             value={formData.precioCubierto || ''} onChange={e => setFormData({...formData, precioCubierto: e.target.value})} />
                           <div style={{display: 'flex', gap: '0.5rem'}}>
                             <button className="premium-btn" style={{flex: 1}} onClick={handleAddItem}>💾 GUARDAR</button>
                             <button className="premium-btn btn-secondary" onClick={() => { setEditingId(null); setFormData({}); }}>✕</button>
                           </div>
                        </div>
                      ) : (
                        <>
                          <p className="menu-text" style={{minHeight: '60px', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-serif)'}}>
                            {comida.menu || 'Menú por definir'}
                          </p>
                          <div style={{marginBottom: '1rem'}}>
                            <span className="badge badge-gold">💰 {comida.precioCubierto ? `${comida.precioCubierto}€` : '-'} / cubierto</span>
                          </div>
                          <div className="text-muted small" style={{marginBottom: '1.5rem'}}>
                             <strong>Grupo:</strong> {comida.responsablesNombres?.join(', ') || 'Sin asignar'}
                          </div>
                          
                          <div className="event-footer" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--glass-border)'}}>
                            <span className="text-gold" style={{fontSize: '0.85rem', fontWeight: 800}}>👥 {Object.keys(comida.asistentes || {}).length} asistentes</span>
                            <div style={{display: 'flex', gap: '0.8rem'}}>
                               {canEdit && <button className="action-btn-mini edit-btn-mini" onClick={() => handleEditItem(comida)} title="Editar menú">✏️</button>}
                               <button className="premium-btn" style={{padding: '0.4rem 1.25rem', fontSize: '0.75rem', minHeight: 'auto'}} onClick={() => {
                                  const asistentes = {...(comida.asistentes || {}), [socio.id]: { nombre: socio.nombre, invitados: 0 }};
                                  boothService.updateEventItem(boothId, eventId, 'comidas', comida.id, { asistentes });
                               }}>ASISTO</button>
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
                <form onSubmit={handleAddItem} className="admin-action-form fade-in">
                   <h4>ASIGNAR TAREA A GRUPO</h4>
                  <div className="event-form-grid">
                    <input type="text" placeholder="Tarea (ej: Montaje alumbrado)" required
                      value={formData.tarea || ''} onChange={e => setFormData({...formData, tarea: e.target.value})} />
                    <button type="submit" className="premium-btn">📝 ASIGNAR</button>
                  </div>
                  <div className="glass-panel" style={{padding: '1.5rem', background: 'rgba(0,0,0,0.3)', marginTop: '1rem', border: '1px solid var(--glass-border)'}}>
                    <p style={{fontSize: '0.75rem', marginBottom: '1rem', fontWeight: 800}} className="text-gold">ASIGNAR A:</p>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem', maxHeight: '150px', overflowY: 'auto'}}>
                      {socios.map(s => (
                        <label key={s.id} style={{fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
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
                         <button className="delete-btn-mini" style={{marginLeft: 'auto'}} onClick={() => handleDeleteItem(tarea.id)}>🗑️</button>
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
                <form onSubmit={handleAddItem} className="admin-action-form fade-in">
                  <h4>ANOTAR CONSUMO A SOCIO</h4>
                  <div className="event-form-grid">
                    <select required value={formData.targetSocioId || ''} 
                      onChange={e => {
                        const s = socios.find(x => x.id === e.target.value);
                        setFormData({...formData, targetSocioId: e.target.value, targetSocioNombre: s?.nombre});
                      }}>
                      <option value="">Seleccionar Socio...</option>
                      {socios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                    
                     <select required value={formData.productoId || ''} 
                      onChange={e => {
                        const p = albaranDocs.find(x => x.id === e.target.value);
                        setFormData({...formData, productoId: e.target.value, concepto: p?.articulo, tipo: p?.tipo, precioUnitario: p?.precioUnidad});
                      }}>
                      <option value="">Seleccionar Producto...</option>
                      {albaranDocs.map(p => <option key={p.id} value={p.id}>[{p.tipo}] {p.articulo}</option>)}
                    </select>

                    <input type="number" placeholder="Cant." required style={{width: '90px'}}
                      value={formData.cantidad || ''} onChange={e => {
                        const cant = parseFloat(e.target.value) || 0;
                        const total = cant * (formData.precioUnitario || 0);
                        setFormData({...formData, cantidad: e.target.value, precio: total});
                      }} />

                    <button type="submit" className="premium-btn">➕ ANOTAR</button>
                  </div>
                </form>
              )}

              {/* AUTOSERVICIO (Self-Checkout TPOS) */}
              <div className="glass-panel widget self-checkout-widget fade-in">
                <h4>BARRA RÁPIDA</h4>
                <div className="tpos-grid">
                  {albaranDocs.map(p => {
                     const consumed = consumoDocs.filter(c => c.productoId === p.id).reduce((acc, curr) => acc + (parseFloat(curr.cantidad)||0), 0);
                     const stock = (parseFloat(p.cantidadRecibida)||0) - consumed;
                     const isAgotado = stock <= 0;

                     return (
                       <button 
                         key={p.id} 
                         onClick={() => !isAgotado && handleSelfCheckout(p)}
                         disabled={isAgotado}
                         className="tpos-btn fade-in"
                       >
                         <span className="tpos-type">{p.tipo}</span>
                         <span className="tpos-name">{p.articulo}</span>
                         <span className="tpos-price">{p.precioUnidad}€</span>
                         {isAgotado && <span className="ago-label">AGOTADO</span>}
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
                      <ul style={{marginTop: '1.5rem', padding: 0, listStyle: 'none', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', maxHeight: '300px', overflowY: 'auto'}}>
                         {consumoDocs.filter(i => i.targetSocioId === socio.id).map(i => (
                           <li key={i.id} style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.6rem'}}>
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
                        <h4>Resumen de Consumos</h4>
                     </div>
                     <div className="widget-body">
                        <div className="admin-table-wrapper">
                          <table className="premium-table">
                             <thead>
                                <tr>
                                   <th>Socio</th>
                                   <th>Total Acumulado</th>
                                   <th>Último Consumo</th>
                                   {isAdmin && <th style={{width: '60px'}}></th>}
                                </tr>
                             </thead>
                             <tbody>
                                {socios.map(s => {
                                   const userConsumos = consumoDocs.filter(i => i.targetSocioId === s.id);
                                   const total = userConsumos.reduce((acc, curr) => acc + (parseFloat(curr.precio) || 0), 0);
                                   if (total === 0) return null;
                                   return (
                                     <tr key={s.id}>
                                        <td><strong>{s.nombre}</strong></td>
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BoothEventHub;
