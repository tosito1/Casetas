import React, { useState, useEffect } from 'react';
import { boothService } from '../../services/boothService';
import CustomCheckbox from '../common/CustomCheckbox';
import './BoothVotaciones.css';

const BoothVotaciones = ({ boothId, socioId, isPresident }) => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [votosPendientes, setVotosPendientes] = useState({}); // { pollId: [opt1, opt2] }
  const [changingVoteId, setChangingVoteId] = useState(null);
  
  const [newPoll, setNewPoll] = useState({ 
    pregunta: '', 
    opciones: ['', ''],
    fechaInicio: new Date().toISOString().slice(0, 16),
    fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    multipleChoice: false
  });

  useEffect(() => {
    if (boothId) {
      const unsubscribe = boothService.listenToVotaciones(boothId, (data) => {
        setPolls(data);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [boothId]);

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await boothService.updatePoll(boothId, editingId, {
          pregunta: newPoll.pregunta,
          fechaInicio: newPoll.fechaInicio,
          fechaFin: newPoll.fechaFin,
          multipleChoice: newPoll.multipleChoice,
        });
        setEditingId(null);
      } else {
        const validOptions = newPoll.opciones.filter(o => o.trim());
        if (validOptions.length < 2) return alert("Añade al menos 2 opciones de respuesta.");

        const initialResults = {};
        validOptions.forEach(opt => initialResults[opt] = 0);

        await boothService.addPoll(boothId, {
          ...newPoll,
          opciones: validOptions,
          resultados: initialResults,
          votos: {},
        });
      }
      
      resetForm();
    } catch (error) {
      console.error("Error managing poll:", error);
    }
  };

  const resetForm = () => {
    setNewPoll({ 
      pregunta: '', 
      opciones: ['', ''], 
      fechaInicio: new Date().toISOString().slice(0, 16),
      fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      multipleChoice: false
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditPoll = (poll) => {
    setNewPoll({
      pregunta: poll.pregunta || '',
      opciones: poll.opciones || ['', ''],
      fechaInicio: poll.fechaInicio || new Date().toISOString().slice(0, 16),
      fechaFin: poll.fechaFin || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      multipleChoice: poll.multipleChoice || false
    });
    setEditingId(poll.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm("¿Seguro que quieres eliminar este proceso electoral?")) return;
    try {
      await boothService.deletePoll(boothId, pollId);
    } catch (error) {
      console.error("Error deleting poll:", error);
    }
  };

  const handleVoteSubmission = async (pollId) => {
    const choices = votosPendientes[pollId];
    if (!choices || choices.length === 0) return;

    try {
      const poll = polls.find(p => p.id === pollId);
      const userVote = poll.votos?.[socioId];
      const updatedResults = { ...poll.resultados };
      
      // If changing an existing vote, SUBTRACT old choices first
      if (userVote) {
        const oldSelected = Array.isArray(userVote) ? userVote : [userVote];
        oldSelected.forEach(opt => {
          if (updatedResults[opt]) {
            updatedResults[opt] = Math.max(0, updatedResults[opt] - 1);
          }
        });
      }

      // Add NEW choices
      const selectedArray = Array.isArray(choices) ? choices : [choices];
      selectedArray.forEach(opt => {
        updatedResults[opt] = (updatedResults[opt] || 0) + 1;
      });

      await boothService.castVote(boothId, pollId, socioId, choices, updatedResults);
      setChangingVoteId(null);
      
      setVotosPendientes(prev => {
        const next = { ...prev };
        delete next[pollId];
        return next;
      });
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const toggleVoteSelection = (pollId, opt, isMultiple) => {
    setVotosPendientes(prev => {
      const current = prev[pollId] || [];
      
      if (isMultiple) {
        if (current.includes(opt)) {
          return { ...prev, [pollId]: current.filter(o => o !== opt) };
        } else {
          return { ...prev, [pollId]: [...current, opt] };
        }
      } else {
        return { ...prev, [pollId]: current.includes(opt) ? [] : [opt] };
      }
    });
  };

  const getPollStatus = (poll) => {
    const now = new Date();
    const start = new Date(poll.fechaInicio);
    const end = new Date(poll.fechaFin);

    if (now < start) return 'PROGRAMADA';
    if (now > end) return 'CERRADA';
    return 'ABIERTA';
  };

  const addOptionField = () => {
    setNewPoll({ ...newPoll, opciones: [...newPoll.opciones, ''] });
  };

  return (
    <div className="booth-votaciones-container fade-in">
      <header className="votaciones-header">
        <div>
          <p className="votaciones-subtitle">🗳️ DEMOCRACIA ELECTRÓNICA</p>
          <h2 className="premium-title">Procesos de Votación</h2>
        </div>
        {isPresident && !showForm && (
          <button className="gold-btn" onClick={() => setShowForm(true)} style={{fontSize: '0.8rem', padding: '0.75rem 1.5rem'}}>
            AÑADIR CONSULTA
          </button>
        )}
      </header>

      {showForm && (
        <form onSubmit={handleCreatePoll} className="glass-panel-strong poll-creator-form fade-in">
          <h4>{editingId ? '⚙️ Ajustar Votación' : '📅 Preparar Nueva Votación'}</h4>
          
          <div className="input-with-label">
            <label>PREGUNTA PRINCIPAL</label>
            <input 
              type="text" 
              placeholder="¿Cuál es la consulta para los socios?" 
              className="main-question-input"
              required
              value={newPoll.pregunta}
              onChange={(e) => setNewPoll({...newPoll, pregunta: e.target.value})}
            />
          </div>

          <div className="form-grid-layout">
            <div className="input-with-label">
              <label>INICIO DEL PROCESO</label>
              <input type="datetime-local" required value={newPoll.fechaInicio} onChange={e => setNewPoll({...newPoll, fechaInicio: e.target.value})} />
            </div>
            <div className="input-with-label">
              <label>CIERRE DE URNA</label>
              <input type="datetime-local" required value={newPoll.fechaFin} onChange={e => setNewPoll({...newPoll, fechaFin: e.target.value})} />
            </div>
            <div className="input-with-label" style={{display: 'flex', alignItems: 'center', paddingTop: '1.5rem'}}>
              <CustomCheckbox 
                id="multiCheck"
                checked={newPoll.multipleChoice}
                onChange={e => setNewPoll({...newPoll, multipleChoice: e.target.checked})}
                label="Permitir Selección Múltiple"
              />
            </div>
          </div>

          {!editingId && (
            <div className="options-builder">
              <label style={{color: 'var(--color-gold)', fontWeight: 800, fontSize: '0.65rem', display: 'block', marginBottom: '1.5rem'}}>OPCIONES DE RESPUESTA</label>
              {newPoll.opciones.map((opt, idx) => (
                <div key={idx} className="option-input-row">
                  <input 
                    type="text" 
                    placeholder={`Opción ${idx + 1}`} 
                    required
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...newPoll.opciones];
                      newOpts[idx] = e.target.value;
                      setNewPoll({...newPoll, opciones: newOpts});
                    }}
                  />
                  {newPoll.opciones.length > 2 && (
                    <button type="button" className="mini-action-btn danger" onClick={() => {
                       const newOpts = newPoll.opciones.filter((_, i) => i !== idx);
                       setNewPoll({...newPoll, opciones: newOpts});
                    }}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addOptionField} className="gold-link" style={{marginTop: '1rem', border: 'none', background: 'none', cursor: 'pointer'}}>
                + Añadir otra opción
              </button>
            </div>
          )}

          <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
            <button type="submit" className="gold-btn">
              {editingId ? 'GUARDAR CAMBIOS' : 'PUBLICAR VOTACIÓN'}
            </button>
            <button type="button" className="gold-link" onClick={resetForm} style={{border: 'none', background: 'none'}}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="polls-grid">
        {loading ? (
          <div className="glass-panel" style={{padding: '3rem', textAlign: 'center'}}>
             <div className="feria-loader" style={{marginBottom: '1rem'}}>🎡</div>
             <p>Analizando la urna electrónica...</p>
          </div>
        ) : polls.length === 0 ? (
          <div className="glass-panel" style={{padding: '4rem', textAlign: 'center', opacity: 0.6}}>
            <p>No se han registrado procesos electorales en esta caseta.</p>
          </div>
        ) : (
          polls.map(poll => {
            const status = getPollStatus(poll);
            const userVote = poll.votos?.[socioId];
            const hasVoted = userVote !== undefined;
            const canVote = (status === 'ABIERTA' && !hasVoted) || (changingVoteId === poll.id);
            const totalParticipantes = Object.keys(poll.votos || {}).length;

            return (
              <div key={poll.id} className={`glass-panel voting-card fade-in ${status === 'CERRADA' ? 'poll-closed' : ''}`}>
                <span className={`poll-status-tag ${
                  status === 'ABIERTA' ? 'status-open' : status === 'CERRADA' ? 'status-closed' : 'status-scheduled'
                }`}>
                  {status}
                </span>

                <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div>
                    <h3 className="poll-question">{poll.pregunta}</h3>
                    <div className="poll-meta">
                      <div className="poll-meta-item">
                        <span>🕒</span>
                        <span>Termina: {new Date(poll.fechaFin).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="poll-meta-item">
                        <span>👥</span>
                        <span>{totalParticipantes} socios han participado</span>
                      </div>
                      {poll.multipleChoice && (
                        <div className="poll-meta-item" style={{color: 'var(--color-gold-light)', fontWeight: 800}}>
                          <span>🔗</span>
                          <span>MÚLTIPLE ELECCIÓN</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isPresident && (
                    <div className="admin-card-controls" style={{display: 'flex', gap: '8px'}}>
                      <button className="action-btn-mini edit-btn-mini" style={{width: '32px', height: '32px', borderRadius: '10px'}} onClick={() => handleEditPoll(poll)} title="Editar">✎</button>
                      <button className="action-btn-mini delete-btn-mini" style={{width: '32px', height: '32px', borderRadius: '10px'}} onClick={() => handleDeletePoll(poll.id)} title="Eliminar">🗑️</button>
                    </div>
                  )}
                </header>
                
                <div className="poll-content-body">
                  {(!canVote || status === 'CERRADA') ? (
                    <div className="results-container">
                      {poll.opciones.map(opt => {
                        const votos = poll.resultados?.[opt] || 0;
                        const porcentaje = totalParticipantes > 0 ? (votos / totalParticipantes) * 100 : 0;
                        const isMyVote = Array.isArray(userVote) ? userVote.includes(opt) : userVote === opt;

                        return (
                          <div key={opt} className="result-item">
                            <div className="result-info">
                              <span className="result-text" style={{gap: isMyVote ? '0.2rem' : '0.5rem'}}>
                                {isMyVote && (
                                  <div style={{transform: 'scale(0.7)', transformOrigin: 'left center', display: 'flex', alignItems: 'center', width: '22px'}}>
                                    <CustomCheckbox id={`res-${poll.id}-${opt}`} checked={true} disabled={true} />
                                  </div>
                                )}
                                {opt} 
                                {isMyVote && <span className="voted-badge" style={{padding: '0.1rem 0.6rem', marginLeft: '0.2rem', fontSize: '0.55rem'}}>MI ELECCIÓN</span>}
                              </span>
                              <span className="result-percentage">{Math.round(porcentaje)}%</span>
                            </div>
                            <div className="bar-background">
                              <div 
                                className="bar-fill" 
                                style={{ 
                                  width: `${porcentaje}%`, 
                                  background: isMyVote ? 'var(--gradient-gold)' : 'rgba(255,255,255,0.1)'
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="selection-container">
                      {poll.opciones.map(opt => {
                        const isSelected = (votosPendientes[poll.id] || []).includes(opt);
                        return (
                          <div 
                            key={opt}
                            className={`option-choice-box ${isSelected ? 'active' : ''}`}
                            onClick={() => toggleVoteSelection(poll.id, opt, poll.multipleChoice)}
                          >
                            <CustomCheckbox 
                              id={`check-${poll.id}-${opt}`}
                              checked={isSelected}
                              onChange={() => {}} // Controlled by box click
                            />
                            <span className="choice-label">{opt}</span>
                          </div>
                        );
                      })}
                      
                      {votosPendientes[poll.id]?.length > 0 && (
                        <button 
                          className="gold-btn confirm-vote-btn fade-in" 
                          onClick={() => handleVoteSubmission(poll.id)}
                        >
                          ENVIAR MI VOTO A LA URNA
                        </button>
                      )}
                    </div>
                  )}
                </div>

                 <div className="poll-actions-footer">
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                       {status === 'ABIERTA' && <span className="floating" style={{fontSize: '0.6rem', color: '#4ade80'}}>● ACTIVA</span>}
                       <span style={{fontSize: '0.75rem', opacity: 0.5}}>Referencia ID: {poll.id.slice(0, 8)}</span>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                      {(hasVoted && status === 'ABIERTA' && changingVoteId !== poll.id) && (
                         <button 
                           className="gold-link" 
                           style={{fontSize: '0.7rem', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer'}} 
                           onClick={() => setChangingVoteId(poll.id)}
                         >
                           🔄 Recalibrar mi voto
                         </button>
                      )}
                      {hasVoted && <span className="voted-badge">✓ PARTICIPACIÓN COMPLETADA</span>}
                    </div>
                 </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BoothVotaciones;
