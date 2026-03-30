import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import InteractiveMap from './components/InteractiveMap';
import CasetaList from './components/CasetaList';
import BoothDashboard from './components/BoothDashboard';
import AddCasetaForm from './components/AddCasetaForm';
import JoinRequestForm from './components/JoinRequestForm';
import AdminDashboard from './components/AdminDashboard';
import AuthForm from './components/AuthForm';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { ROLES } from './data/data';
import { boothService } from './services/boothService';
import { locationService } from './services/locationService';
import { MAP_CONFIGS } from './data/mapConfigs';
import './App.css';

// Helper: Fórmula del Semiverseno (Haversine) para distancia esférica en metros
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; 
}

function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [currentUser, setCurrentUser] = useState(null);
  const [casetas, setCasetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedCaseta, setSelectedCaseta] = useState(null);
  const [liveUsers, setLiveUsers] = useState([]);
  const [isMapEditting, setIsMapEditting] = useState(false);
  const [globalConfig, setGlobalConfig] = useState({ activeMap: 'sanjuan' });
  const [isTracking, setIsTracking] = useState(true);

  // Sync Auth State & Profile Reactivity
  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      
      // Clean up previous profile listener
      if (unsubscribeProfile) unsubscribeProfile();

      if (firebaseUser) {
        // 1. Initial sync/creation
        await boothService.syncUserProfile(firebaseUser);
        
        // 2. Start real-time listener for this user
        unsubscribeProfile = boothService.listenToSocio(firebaseUser.uid, (profile) => {
          setCurrentUser(profile);
          setAuthLoading(false);
        });
      } else {
        setCurrentUser(null);
        setAuthLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // 2. Load Casetas in Real-Time
  useEffect(() => {
    let unsubscribe = null;
    try {
      unsubscribe = boothService.listenToCasetas((fetchedCasetas) => {
        setCasetas(fetchedCasetas);
        setLoading(false);
      });
    } catch (e) {
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 4. Live Map Sync (RTDB)
  useEffect(() => {
    const unsub = locationService.listenToLiveMap((users) => {
      setLiveUsers(users);
    });
    return () => unsub();
  }, []);

  // 5. Redirect on Login
  useEffect(() => {
    if (currentUser && activeTab === 'login') {
      setActiveTab('map');
    }
  }, [currentUser, activeTab]);

  // 4. Global Config Sync
  useEffect(() => {
    const unsub = boothService.listenToGlobalConfig((config) => {
      setGlobalConfig(config);
    });
    return () => unsub();
  }, []);

  // Mantener referencia actualizada de casetas sin reiniciar el GPS (watchPosition es pesado)
  const casetasRef = useRef([]);
  useEffect(() => {
    casetasRef.current = casetas;
  }, [casetas]);

  // 5. GPS Real-time Tracking (con Geofencing & Radar de Proximidad)
  useEffect(() => {
    if (!currentUser || !isTracking) {
      if (!isTracking && currentUser?.id) {
        locationService.leaveMap(currentUser.id);
      }
      return;
    }
    
    let watchId;
    if ("geolocation" in navigator) {
      console.log("📍 Inicializando rastreo GPS en tiempo real para:", currentUser.nombre);
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Geofencing: Verificar si está dentro o muy cerca del recinto activo
          const mapDef = MAP_CONFIGS[globalConfig.activeMap];
          let isOutside = false;
          if (mapDef && mapDef.bounds) {
            const b = mapDef.bounds;
            // Damos un pequeño margen (aprox 200m) para las puertas y zona de aparcamiento
            const isInside = lat <= b.north + 0.002 && lat >= b.south - 0.002 &&
                             lng >= b.west - 0.002 && lng <= b.east + 0.002;
            
            if (!isInside) {
              console.log("🚫", currentUser.nombre, "está fuera del recinto ferial. Se mostrará en la lista de ausentes.");
              isOutside = true;
            }
          }

          // RADAR DE PROXIMIDAD A CASETAS CALIBRADAS (Tolerancia: 5 metros)
          let physicalBoothId = null;
          for (const c of casetasRef.current) {
             if (c.latitudReal && c.longitudReal) {
                const dist = getDistanceInMeters(lat, lng, c.latitudReal, c.longitudReal);
                if (dist <= 5) {
                   physicalBoothId = c.id;
                   break; // Entró en el radio de esta caseta
                }
             }
          }

          // Asignación Inteligente de Caseta:
          // 1. Si está físicamente a <5m de una caseta calibrada, se asigna a esa (sea o no socio).
          // 2. Si NO está en el radar de ninguna, pero la SUYA no está calibrada aún (retrocompatibilidad), se asume que podría estar en la suya o paseando, le dejamos su caseta.
          // 3. Si su caseta SÍ está calibrada, y el radar dice que NO está allí, entonces está fuera (null).
          let broadcastBoothId = physicalBoothId;
          if (!broadcastBoothId) {
             const myCasetaDef = casetasRef.current.find(c => c.id === currentUser.casetaId);
             if (myCasetaDef && !myCasetaDef.latitudReal) {
                broadcastBoothId = currentUser.casetaId; 
             }
          }

          locationService.broadcastLocation(currentUser.id, {
            lat,
            lng,
            name: currentUser.nombre || 'Socio',
            boothId: broadcastBoothId || null,
            isOutside,
            timestamp: Date.now()
          });
        },
        (error) => {
          console.warn("⚠️ Advertencia GPS (Normal en PCs o interiores):", error.message);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 45000, 
          maximumAge: 15000 
        }
      );
    }
    
    // Clean up
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [currentUser, globalConfig.activeMap, isTracking]);

  const handleLogout = () => {
    if (currentUser?.uid) {
      locationService.leaveMap(currentUser.id);
    }
    signOut(auth);
    setActiveTab('map');
  };

  const handleSelectCaseta = (caseta) => {
    setSelectedCaseta(caseta);
    if (currentUser?.casetaId === caseta.id) {
      setActiveTab('my-booth');
    } else {
      setActiveTab('request');
    }
  };

  const handleAddCaseta = async (newCaseta) => {
    // Uses the unified saveCaseta with null ID (Create mode)
    await boothService.saveCaseta(null, newCaseta);
  };

  const handleUpdateCaseta = async (id, updatedData) => {
    // Uses the unified saveCaseta with existing ID (Update/Merge mode)
    await boothService.saveCaseta(id, updatedData);
  };

  if (authLoading) return <div className="loader-overlay">Validando credencial... 🎡</div>;

  return (
    <div className="app">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser} 
        onLogout={handleLogout}
      />

      <main className="main-content">
        <div className="content-container">
          {activeTab === 'login' && !currentUser && (
            <div className="fade-in" style={{marginTop: '2rem'}}>
              <AuthForm />
            </div>
          )}

          {activeTab === 'map' && (
                <div className="fade-in">
                  <InteractiveMap 
                    casetas={casetas} 
                    onSelectCaseta={handleSelectCaseta} 
                    currentUser={currentUser}
                    liveUsers={liveUsers}
                    mapType={globalConfig.activeMap}
                    onMapTypeChange={(newType) => boothService.updateGlobalConfig({ activeMap: newType })}
                    editMode={isMapEditting}
                    isTracking={isTracking}
                    onToggleTracking={() => setIsTracking(!isTracking)}
                    onSaveLocation={async (x, y) => {
                      if (currentUser?.casetaId) {
                        await boothService.updateBoothMapLocation(currentUser.casetaId, x, y);
                        setIsMapEditting(false);
                        alert("Ubicación de la caseta guardada correctamente en el Real.");
                      }
                    }}
                  />

                  {/* SECCIÓN APARTE: Usuarios fuera del recinto - Solo para socios */}
                  {currentUser && liveUsers.filter(u => u.isOutside).length > 0 && (
                    <div className="outside-users-section glass-panel fade-in" style={{marginTop: '1.5rem', padding: '1.5rem', border: '1px solid var(--glass-border)'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                        <h4 className="text-gold" style={{margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.1rem', letterSpacing: '2px'}}>🛰️ SOCIOS FUERA DEL RECINTO</h4>
                        <span className="text-muted" style={{fontSize: '0.8rem'}}>{liveUsers.filter(u => u.isOutside).length} detectados</span>
                      </div>
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem'}}>
                         {liveUsers.filter(u => u.isOutside).map(u => (
                            <div key={u.id || u.uid} className="glass-panel" style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem', background: 'rgba(255,215,0,0.03)'}}>
                               <div className="user-dot-pulse" style={{width: '8px', height: '8px', background: 'red', borderRadius: '50%', boxShadow: '0 0 10px red'}}></div>
                               <div style={{display: 'flex', flexDirection: 'column'}}>
                                  <span style={{fontWeight: 800, fontSize: '0.9rem'}}>{u.name}</span>
                                  <span style={{fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase'}}>Fuera de alcance</span>
                               </div>
                            </div>
                         ))}
                      </div>
                    </div>
                  )}

                  {currentUser?.rol === ROLES.PRESIDENTE && currentUser?.approved && (
                    <button 
                      className={`premium-btn ${isMapEditting ? 'active' : ''}`}
                      style={{
                        position: 'fixed', 
                        bottom: '2rem', 
                        right: '2rem', 
                        zIndex: 1000,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        border: isMapEditting ? '2px solid var(--color-gold)' : 'none'
                      }}
                      onClick={() => setIsMapEditting(!isMapEditting)}
                    >
                      {isMapEditting ? 'DESCARTAR CAMBIOS' : '📍 CALIBRAR MI CASETA'}
                    </button>
                  )}
                </div>
              )}
              
              {activeTab === 'list' && (
                <div className="fade-in">
                  <CasetaList 
                    casetas={casetas} 
                    onSelectCaseta={handleSelectCaseta} 
                    currentUser={currentUser}
                    onNavigate={setActiveTab} 
                  />
                </div>
              )}

              {activeTab === 'request' && currentUser && (
                !currentUser.casetaId ? (
                  <JoinRequestForm casetas={casetas} currentUser={currentUser} initialCasetaId={selectedCaseta?.id} />
                ) : (
                  <div className="glass-panel fade-in" style={{padding: '4rem', textAlign: 'center'}}>
                    <h2 className="text-gold">Ya perteneces a una Caseta</h2>
                    <p className="text-secondary" style={{maxWidth: '500px', margin: '1rem auto'}}>
                      Actualmente ya estás registrado en el Real. Si deseas cambiar de caseta, primero debes solicitar la baja en tu caseta actual.
                    </p>
                    <button className="premium-btn" onClick={() => setActiveTab('my-booth')}>Volver a Mi Caseta</button>
                  </div>
                )
              )}

              {activeTab === 'admin-suite' && currentUser && currentUser.rol === ROLES.GLOBAL_ADMIN && (
                <AdminDashboard casetas={casetas} onAddCaseta={handleAddCaseta} />
              )}

              {(activeTab === 'my-booth' && currentUser && (currentUser.approved || currentUser.rol === ROLES.GLOBAL_ADMIN)) && (
                <BoothDashboard socio={currentUser} onLogout={handleLogout} />
              )}

              {/* Approval Notice for logged users */}
              {currentUser && !currentUser.approved && currentUser.rol !== ROLES.GLOBAL_ADMIN && activeTab === 'my-booth' && (
                <div className="pending-notice glass-panel fade-in">
                  <h2 className="text-gold">Solicitud en Revisión</h2>
                  <p className="text-secondary">Tu acceso a la caseta aún no ha sido aprobado por un administrador.</p>
                  <p className="text-muted small">Te avisaremos una vez seas validado.</p>
                </div>
              )}
        </div>
      </main>

      <footer className="footer-bg">
        <p>© 2024 Casetas de Feria - Autenticación Segura Multi-Proveedor</p>
      </footer>
    </div>
  );
}

export default App;
