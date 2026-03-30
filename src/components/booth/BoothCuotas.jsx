import React, { useState, useEffect } from 'react';
import { boothService } from '../../services/boothService';
import { ROLES } from '../../data/data';
import CustomCheckbox from '../common/CustomCheckbox';
import './BoothCuotas.css';

const BoothCuotas = ({ socio, isAdmin }) => {
  const [activeTab, setActiveTab] = useState('personales'); // 'personales', 'caja'
  const [cuotas, setCuotas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [feriaConsumos, setFeriaConsumos] = useState([]);
  const [sanjuanConsumos, setSanjuanConsumos] = useState([]);
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State (Cuotas)
  const [newConcepto, setNewConcepto] = useState('');
  const [newDineroBase, setNewDineroBase] = useState('');
  const [newDineroRecargo, setNewDineroRecargo] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [allSociosTarget, setAllSociosTarget] = useState(true);
  const [selectedSocioIds, setSelectedSocioIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedFeeId, setExpandedFeeId] = useState(null);

  // Form State (Movimientos)
  const [movConcepto, setMovConcepto] = useState('');
  const [movDinero, setMovDinero] = useState('');
  const [movTipo, setMovTipo] = useState('ingreso');
  const [movCategoria, setMovCategoria] = useState('Otros');

  const boothId = socio.casetaId;

  useEffect(() => {
    if (boothId) {
      const unsubCuotas = boothService.listenToCuotas(boothId, setCuotas);
      const unsubMovs = boothService.listenToMovimientos(boothId, (data) => {
        setMovimientos(data);
        setLoading(false);
      });
      // Escuchar consumos de los 2 eventos grandes para el sumatorio global
      const unsubFeria = boothService.listenToEventData(boothId, 'feria', 'consumos', setFeriaConsumos);
      const unsubSanJuan = boothService.listenToEventData(boothId, 'sanjuan', 'consumos', setSanjuanConsumos);

      if (isAdmin) {
        boothService.getSocios(boothId).then(setSocios);
      }

      return () => {
        unsubCuotas();
        unsubMovs();
        unsubFeria();
        unsubSanJuan();
      };
    }
  }, [boothId, isAdmin]);

  // --- Handlers: Cuotas ---
  const handleCreateFee = async (e) => {
    e.preventDefault();
    if (!newConcepto || !newDineroBase || !newDeadline) return;
    setIsSubmitting(true);
    try {
      const feeData = {
        concepto: newConcepto,
        dineroBase: parseFloat(newDineroBase),
        dineroRecargo: parseFloat(newDineroRecargo || 0),
        deadline: newDeadline,
        asignados: allSociosTarget ? 'todos' : selectedSocioIds,
        pagos: {}
      };
      await boothService.addCuota(boothId, feeData);
      setNewConcepto(''); setNewDineroBase(''); setNewDineroRecargo(''); setNewDeadline('');
      setAllSociosTarget(true); setSelectedSocioIds([]);
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };

  const handleMarkAsPaid = async (fee, targetSocio) => {
    const isLate = new Date() > new Date(fee.deadline);
    const price = isLate ? fee.dineroBase + (fee.dineroRecargo || 0) : fee.dineroBase;
    try {
      await boothService.registerPayment(boothId, fee.id, targetSocio.id, price);
    } catch (error) { console.error(error); }
  };

  // --- Handlers: Movimientos ---
  const handleAddMovement = async (e) => {
    e.preventDefault();
    if (!movConcepto || !movDinero) return;
    try {
      await boothService.addMovimiento(boothId, {
        concepto: movConcepto,
        dinero: parseFloat(movDinero),
        tipo: movTipo,
        categoria: movCategoria,
        registradoPor: socio.nombre
      });
      setMovConcepto(''); setMovDinero('');
    } catch (error) { console.error(error); }
  };

  // --- Calculations ---
  const getSocioFeeStatus = (fee, uid) => fee.pagos?.[uid] || { pagado: false };

  const calculateCurrentPrice = (fee) => {
    const isLate = new Date() > new Date(fee.deadline);
    const base = fee.dineroBase || fee.montoBase || 0;
    const extra = fee.dineroRecargo || fee.montoRecargo || 0;
    const price = isLate ? base + extra : base;
    return { price, isLate };
  };

  const currentBalance = movimientos.reduce((acc, m) => {
    const amt = m.dinero || m.monto || 0;
    return m.tipo === 'ingreso' ? acc + amt : acc - amt;
  }, 0);

  const myFees = cuotas.filter(f =>
    f.asignados === 'todos' || (Array.isArray(f.asignados) && f.asignados.includes(socio.id))
  );

  const myPendingFees = myFees.filter(f => !getSocioFeeStatus(f, socio.id).pagado);
  const totalFeesDebt = myPendingFees.reduce((acc, f) => acc + calculateCurrentPrice(f).price, 0);

  const myFeriaDrinks = feriaConsumos.filter(c => c.targetSocioId === socio.id);
  const totalFeriaDebt = myFeriaDrinks.reduce((acc, curr) => acc + (parseFloat(curr.precio) || 0), 0);

  const mySanjuanDrinks = sanjuanConsumos.filter(c => c.targetSocioId === socio.id);
  const totalSanjuanDebt = mySanjuanDrinks.reduce((acc, curr) => acc + (parseFloat(curr.precio) || 0), 0);

  const globalDebt = totalFeesDebt + totalFeriaDebt + totalSanjuanDebt;

  if (loading) return <div className="loader">Sincronizando cuentas...</div>;

  return (
    <div className="cuotas-container fade-in">
      <header className="cuotas-header">
        <div>
          <p className="text-gold" style={{ marginBottom: '0.5rem', fontWeight: 800 }}>ESTADO FINANCIERO</p>
          <h2 className="premium-title" style={{ margin: 0 }}>Cuentas de la Caseta</h2>
        </div>

        <div className="tab-nav">
          <button
            className={activeTab === 'personales' ? 'active' : ''}
            onClick={() => setActiveTab('personales')}
          >
            Mis Pagos
          </button>
          <button
            className={activeTab === 'caja' ? 'active' : ''}
            onClick={() => setActiveTab('caja')}
          >
            Caja General
          </button>
        </div>
      </header>

      {activeTab === 'personales' ? (
        <div className="tab-content fade-in">
          {/* Member's Personal View */}
          <section className="personal-section">
            
            {/* Global Debt Widget */}
            <div className="glass-panel balance-widget" style={{ marginBottom: '3rem', border: '1px solid var(--color-gold)', background: 'linear-gradient(145deg, rgba(30,30,35,0.9), rgba(15,15,20,0.95))' }}>
              <div className="balance-info">
                <h4 style={{fontFamily: 'var(--font-serif)', letterSpacing: '2px', opacity: 0.9}}>DEUDA TOTAL ACUMULADA</h4>
                <div className="total-balance" style={{color: globalDebt > 0 ? '#ff4d4d' : '#00e5ff'}}>
                  {globalDebt.toLocaleString()} <span className="currency" style={{ fontSize: '1.5rem' }}>€</span>
                </div>
              </div>
              <div className="debt-breakdown" style={{display: 'flex', gap: '2rem', marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem'}}>
                 <div><span style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>CUOTAS</span><br/><strong style={{fontSize: '1.2rem'}}>{totalFeesDebt}€</strong></div>
                 <div><span style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>BEBIDAS FERIA</span><br/><strong style={{fontSize: '1.2rem', color: totalFeriaDebt > 0 ? 'var(--color-gold)' : 'white'}}>{totalFeriaDebt}€</strong></div>
                 <div><span style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>BEBIDAS S. JUAN</span><br/><strong style={{fontSize: '1.2rem', color: totalSanjuanDebt > 0 ? 'var(--color-gold)' : 'white'}}>{totalSanjuanDebt}€</strong></div>
              </div>
            </div>

            <h3 className="text-gold" style={{ fontSize: '0.9rem', marginBottom: '2rem' }}>DESGLOSE DE CUOTAS PENDIENTES</h3>
            {myPendingFees.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                <p className="text-muted">No tienes cuotas pendientes. ¡Buen trabajo!</p>
              </div>
            ) : (
              <div className="personal-fees-grid">
                {myPendingFees.map(fee => {
                  const { price, isLate } = calculateCurrentPrice(fee);
                  return (
                    <div key={fee.id} className={`glass-panel fee-card fade-in ${isLate ? 'late' : ''}`}>
                      <span className={`fee-badge ${isLate ? 'badge-late' : 'badge-pending'}`}>
                        {isLate ? 'PLAZO VENCIDO' : 'DENTRO DE PLAZO'}
                      </span>
                      <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem' }}>{fee.concepto}</h4>
                      <p className="text-muted small">Límite: {new Date(fee.deadline).toLocaleDateString()}</p>
                      <div className="fee-price-tag">{(price || 0).toLocaleString()} <span className="currency">€</span></div>
                      {isLate && <div className="late-charge-warning">⚠ Recargo de {fee.dineroRecargo || fee.montoRecargo || 0}€ incluido</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Admin Management Section */}
          {isAdmin && (
            <section className="admin-fee-manager" style={{ marginTop: '6rem' }}>
              <div className="nav-divider"></div>
              <h3 className="text-gold" style={{ fontSize: '0.9rem', marginBottom: '2rem' }}>GIRAR NUEVA CUOTA</h3>
              <form onSubmit={handleCreateFee} className="admin-action-form">
                <div className="fee-form-grid">
                  <input type="text" placeholder="Concepto (ej: Cuota Anual)" required value={newConcepto} onChange={e => setNewConcepto(e.target.value)} />
                  <div className="control-group">
                    <label style={{fontSize: '0.65rem', color: 'var(--color-gold)', fontWeight: 900, marginBottom: '0.5rem', display: 'block'}}>DINERO BASE (€)</label>
                    <input type="number" placeholder="Base €" required value={newDineroBase} onChange={e => setNewDineroBase(e.target.value)} />
                  </div>
                  <div className="control-group">
                    <label style={{fontSize: '0.65rem', color: 'var(--color-gold)', fontWeight: 900, marginBottom: '0.5rem', display: 'block'}}>CARGO EXTRA (€)</label>
                    <input type="number" placeholder="Recargo €" value={newDineroRecargo} onChange={e => setNewDineroRecargo(e.target.value)} />
                  </div>
                  <input type="date" required value={newDeadline} onChange={e => setNewDeadline(e.target.value)} />
                </div>

                <div style={{ display: 'flex', gap: '2rem', margin: '1.5rem 0' }}>
                  <label className="checkbox-wrapper-premium"><input type="radio" checked={allSociosTarget} onChange={() => setAllSociosTarget(true)} /> Todos</label>
                  <label className="checkbox-wrapper-premium"><input type="radio" checked={!allSociosTarget} onChange={() => setAllSociosTarget(false)} /> Selección</label>
                </div>

                {!allSociosTarget && (
                  <div className="member-selection-box">
                    {socios.map(s => (
                      <div key={s.id} className="member-selection-item">
                        <CustomCheckbox checked={selectedSocioIds.includes(s.id)} onChange={() => setSelectedSocioIds(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} />
                        <span>{s.nombre} ({s.rol})</span>
                      </div>
                    ))}
                  </div>
                )}
                <button type="submit" className="premium-btn" style={{ width: '100%' }} disabled={isSubmitting}>GENERAR LISTADO</button>
              </form>

              {/* Fee Lists Summary */}
              <div className="fee-list-admin">
                {cuotas.map(fee => {
                  const assignedCount = fee.asignados === 'todos' ? socios.length : fee.asignados.length;
                  const paidCount = Object.values(fee.pagos || {}).filter(p => p.pagado).length;
                  return (
                    <div key={fee.id} className="glass-panel admin-fee-row-wrapper">
                      <div className="admin-fee-row">
                        <div className="fee-info">
                          <h4>{fee.concepto}</h4>
                          <p className="text-muted small">Creada: {new Date(fee.creadoEn).toLocaleDateString()}</p>
                        </div>
                        <div className="fee-stats">
                          <div className="stat-item"><span className="stat-label">PAGOS</span><span className="stat-value">{paidCount}/{assignedCount}</span></div>
                        </div>
                        <button className="btn-secondary" onClick={() => setExpandedFeeId(expandedFeeId === fee.id ? null : fee.id)}>Ver Socios</button>
                      </div>

                      {expandedFeeId === fee.id && (
                        <div className="participants-detail">
                          <div className="participants-detail-grid">
                            {socios.filter(s => fee.asignados === 'todos' || fee.asignados.includes(s.id)).map(s => {
                              const pInfo = getSocioFeeStatus(fee, s.id);
                              return (
                                <div key={s.id} className="member-payment-row">
                                  <span>{s.nombre}</span>
                                  {pInfo.pagado ? (
                                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                                      <span className="status-pill success">PAGADO</span>
                                      <span style={{fontSize: '0.65rem', color: 'var(--color-gold)'}}>
                                        Ingresado: {pInfo.dineroCobrado || pInfo.montoCobrado || 0}€ ({new Date(pInfo.fechaPago).toLocaleDateString()})
                                      </span>
                                    </div>
                                  ) : (
                                    <button className="premium-btn" style={{ minHeight: 'auto', padding: '0.4rem' }} onClick={() => handleMarkAsPaid(fee, s)}>COBRAR</button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="tab-content fade-in">
          {/* General Cash Balance View */}
          <div className="glass-panel balance-widget fade-in">
            <div className="balance-info">
              <h4>SALDO DISPONIBLE EN CAJA</h4>
              <div className="total-balance">{currentBalance.toLocaleString()} <span className="currency" style={{ fontSize: '1.5rem' }}>€</span></div>
            </div>
            <div className="balance-indicator">
              {movimientos.length} MOVIMIENTOS REGISTRADOS
            </div>
          </div>

           {isAdmin && (
            <form onSubmit={handleAddMovement} className="admin-action-form">
              <h3 className="text-gold" style={{ fontSize: '0.8rem', marginBottom: '0' }}>REGISTRAR NUEVO MOVIMIENTO</h3>
              <div className="movement-form-grid">
                <input type="text" placeholder="Concepto del gasto o ingreso" required value={movConcepto} onChange={e => setMovConcepto(e.target.value)} />
                <input type="number" placeholder="Dinero €" required value={movDinero} onChange={e => setMovDinero(e.target.value)} />
                <select className="premium-input" value={movTipo} onChange={e => setMovTipo(e.target.value)}>
                  <option value="ingreso">Ingreso (+)</option>
                  <option value="gasto">Gasto (-)</option>
                </select>
                <button type="submit" className="premium-btn">REGISTRAR</button>
              </div>
            </form>
          )}

          <div className="ledger-table-wrapper">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Registrado por</th>
                  <th style={{ textAlign: 'right' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map(m => (
                  <tr key={m.id} className="fade-in">
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>{new Date(m.fecha).toLocaleDateString()}</td>
                    <td>
                      <span className={`type-indicator ${m.tipo === 'ingreso' ? 'type-income' : 'type-expense'}`}></span>
                      <span className="movement-concepto">{m.concepto}</span>
                    </td>
                    <td className="text-muted small">{m.registradoPor}</td>
                    <td style={{ textAlign: 'right' }} className={m.tipo === 'ingreso' ? 'amount-income' : 'amount-expense'}>
                      {m.tipo === 'ingreso' ? '+' : '-'}{(m.dinero || m.monto || 0).toLocaleString()} €
                    </td>
                  </tr>
                ))}
                {movimientos.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '4rem' }} className="text-muted">No hay movimientos registrados en el libro de cuentas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoothCuotas;
