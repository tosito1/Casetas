import React, { useState, useEffect, useRef } from 'react';
import './InteractiveMap.css';
import { ROLES } from '../data/data';
import { MAP_CONFIGS, gpsToPixel, pixelToGps } from '../data/mapConfigs';
import ThemeSwitch from './ThemeSwitch';


const InteractiveMap = ({ 
  casetas: firestoreCasetas, 
  onSelectCaseta,
  currentUser,
  liveUsers = [],
  mapType,
  onMove,
  editMode = false,
  onSaveLocation,
  onMapTypeChange,
  isTracking = true,
  onToggleTracking
}) => {
  const containerRef = useRef(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedCaseta, setSelectedCaseta] = useState(null);
  
  // --- ZOOM & PAN STATE ---
  const [transform, setTransform] = useState({ scale: 0.7, x: 0, y: 0 });
  const [minScale, setMinScale] = useState(0.4);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // --- SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // --- THEME & FILTER STATE ---
  const [theme, setTheme] = useState('day');
  const [visibleTypes, setVisibleTypes] = useState(['Privada', 'Publica', 'Peña']);

  const toggleFilter = (type) => {
    setVisibleTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  useEffect(() => {
    handleReset(); // Initial fit
  }, []);

  // Reset selection when map type changes
  useEffect(() => {
    setSelectedCaseta(null);
  }, [mapType]);

  // --- ZOOM & PAN LOGIC ---
  const activeConfig = MAP_CONFIGS[mapType] || MAP_CONFIGS.sanjuan;

  const handleReset = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const [_, __, vw, vh] = activeConfig.viewBox.split(' ').map(Number);
    const baseScale = Math.min(clientWidth / vw, clientHeight / vh) * 1.1;
    
    setMinScale(baseScale);
    setTransform({
      scale: baseScale,
      x: (clientWidth - vw * baseScale) / 2,
      y: (clientHeight - vh * baseScale) / 2
    });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomIntensity = 0.12;
    const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
    const newScale = Math.min(Math.max(transform.scale + delta, minScale), 3);

    const { clientX, clientY } = e;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const dx = (mouseX - transform.x) / transform.scale;
    const dy = (mouseY - transform.y) / transform.scale;

    setTransform({
      scale: newScale,
      x: mouseX - dx * newScale,
      y: mouseY - dy * newScale
    });
  };

  const smoothPanTo = (mapX, mapY, targetScale = 1.6) => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const newX = (clientWidth / 2) - (mapX * targetScale);
    const newY = (clientHeight / 2) - (mapY * targetScale);
    setTransform({ scale: targetScale, x: newX, y: newY });
  };

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    const matches = firestoreCasetas.filter(c => 
      c.nombre.toLowerCase().includes(q.toLowerCase()) || 
      String(c.numero).includes(q)
    ).slice(0, 5);
    setSearchResults(matches);
  };

  const handleSelectSearchResult = (caseta) => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedCaseta(caseta);
    const mapDef = activeConfig.boothDefinitions.find(d => String(d.id) === String(caseta.numero));
    if (mapDef) {
       smoothPanTo(mapDef.x + mapDef.w / 2, mapDef.y + mapDef.h / 2);
    }
  };

  const handleLocateMe = () => {
    if (!currentUser) return;
    const myUser = liveUsers.find(u => u.id === currentUser?.id);
    if (myUser) {
       const pos = gpsToPixel(myUser.lat, myUser.lng, activeConfig);
       smoothPanTo(pos.x, pos.y, 1.8);
    }
  };


  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    
    setTransform(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy
    }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const interactiveCasetas = activeConfig.boothDefinitions.map(def => {
    const firestoreMatch = firestoreCasetas.find(f => 
      String(f.numero) === String(def.id) || f.id === String(def.id)
    );
    const x = firestoreMatch?.mapX ?? def.x;
    const y = firestoreMatch?.mapY ?? def.y;
    
    return { ...def, x, y, firestoreData: firestoreMatch };
  });

  const handleMapClick = (e) => {
    if (isDragging) return;

    if (editMode && currentUser?.rol === ROLES.GLOBAL_ADMIN) {
       const svg = e.currentTarget;
       const pt = svg.createSVGPoint();
       pt.x = e.clientX;
       pt.y = e.clientY;
       const transformed = pt.matrixTransform(svg.getScreenCTM().inverse());
       const gps = pixelToGps(transformed.x, transformed.y, activeConfig);
       onSaveLocation?.(gps.lat, gps.lng);
       return;
    }

    // Default: Clear selection if clicking empty area
    setSelectedCaseta(null);

    if (onMove) {
      const svg = e.currentTarget;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const transformed = pt.matrixTransform(svg.getScreenCTM().inverse());
      const gps = pixelToGps(transformed.x, transformed.y, activeConfig);
      onMove(gps.lat, gps.lng);
    }
  };

  const handleBoothClick = (e, casetaData) => {
    e.stopPropagation();
    setSelectedCaseta(casetaData);
    const mapDef = activeConfig.boothDefinitions.find(d => String(d.id) === String(casetaData.numero));
    if (mapDef) {
       smoothPanTo(mapDef.x + mapDef.w / 2, mapDef.y + mapDef.h / 2, 1.6);
    }
  };

  return (
    <div className={`map-wrapper-v5 glass-panel-strong theme-${theme}`}>
      {/* --- HUD DE NAVEGACIÓN --- */}
      <div className="map-ui-top-left">
        <div className="map-title-bubble">
          <span className="feria-emoji">{activeConfig.id === 'feria' ? '🎡' : '🕯️'}</span>
          <h2>{activeConfig.title}</h2>
        </div>
        
        <div className="map-search-container">
          <input 
            type="text" 
            className="map-search-input" 
            placeholder={activeConfig.id === 'feria' ? "Buscar caseta..." : "Buscar..."}
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <span className="search-icon-fixed">🔍</span>
          {searchResults.length > 0 && (
            <div className="search-results glass-panel">
              {searchResults.map(res => (
                <div key={res.id} className="search-result-item" onClick={() => handleSelectSearchResult(res)}>
                  <div className="res-info">
                    <span className="res-num">{res.numero}</span>
                    <span className="res-name">{res.nombre}</span>
                  </div>
                  <span className={`search-result-type ${res.clase.toLowerCase()}`}>{res.clase}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="map-ui-top-right">
        <ThemeSwitch theme={theme} setTheme={setTheme} />
        
        <div className="hud-pill-group">
          {currentUser && (
            <>
              <button 
                 className={`hud-pill-btn ${!isTracking ? 'off' : 'active'}`} 
                 onClick={onToggleTracking}
                 title="Mi Ubicación"
              >
                {isTracking ? '📡' : '🛰️'}
              </button>

              <button 
                 className="hud-pill-btn" 
                 onClick={handleLocateMe}
                 disabled={!isTracking}
              >
                📍
              </button>
            </>
          )}
        </div>
      </div>

      {/* --- FILTROS (Segmented on Mobile) --- */}
      <div className="map-ui-bottom-left">
        <div className="filter-chips">
          <button className={`chip ${visibleTypes.includes('Publica') ? 'active' : ''}`} onClick={() => toggleFilter('Publica')}>Públicas</button>
          <button className={`chip ${visibleTypes.includes('Privada') ? 'active' : ''}`} onClick={() => toggleFilter('Privada')}>Privadas</button>
          <button className={`chip ${visibleTypes.includes('Peña') ? 'active' : ''}`} onClick={() => toggleFilter('Peña')}>Peñas</button>
        </div>
      </div>

      {currentUser?.rol === ROLES.GLOBAL_ADMIN && onMapTypeChange && (
        <div className="map-ui-bottom-center-admin">
          <div className="admin-map-switcher pill-selector">
            <button className={mapType === 'sanjuan' ? 'active' : ''} onClick={() => onMapTypeChange('sanjuan')}>SAN JUAN</button>
            <button className={mapType === 'feria' ? 'active' : ''} onClick={() => onMapTypeChange('feria')}>FERIA</button>
          </div>
        </div>
      )}

      <div 
        className={`map-scroll-container ${isDragging ? 'is-dragging' : ''}`}
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width={activeConfig.viewBox.split(' ')[2]}
          height={activeConfig.viewBox.split(' ')[3]}
          viewBox={activeConfig.viewBox}
          className="fair-map-v5"
           style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onClick={handleMapClick}
        >
          <g>
            <rect x="-150" y="-300" width="1500" height="1500" fill="#f8f9fa" />
            
            {/* --- FONDOS VERDES DINÁMICOS --- */}
            <g className="parcelas-layer">
              {activeConfig.greenAreas?.map((area, i) => (
                <rect 
                  key={`green-${i}`} 
                  x={area.x} y={area.y} 
                  width={area.w} height={area.h} 
                  rx={area.rx || 10} 
                  fill="#f0f7f0" stroke="#d1e3d1" strokeWidth="2" 
                />
              ))}
            </g>

            {/* --- RED DE CALLES --- */}
            <g className="roads-layer">
              {activeConfig.roads?.map((road, i) => (
                <g key={`road-${i}`}>
                   <rect 
                      x={road.x} y={road.y} 
                      width={road.w} height={road.h || 20} 
                      fill="#f2e3b6" rx={road.rx || 4} 
                   />
                   {road.label && (
                      <text 
                        x={road.x + road.w/2} y={road.y + (road.h||20)/2 + 1} 
                        fontSize="12" fill="#d4af37" 
                        textAnchor="middle" dominantBaseline="middle" 
                        className="italic font-bold"
                      >
                        {road.label}
                      </text>
                   )}
                 </g>
               ))}
             </g>

             {/* --- FAROLILLOS --- */}
             {theme === 'night' && (
               <g className="luces-feria" pointerEvents="none">
                 {activeConfig.id === 'feria' && Array.from({ length: 45 }).map((_, i) => (
                   <circle key={`l-c-${i}`} cx={575} cy={-160 + i * 25} r="2" fill="#fef08a" filter="drop-shadow(0 0 4px rgba(253,224,71,0.9))" />
                 ))}
                 {activeConfig.id === 'feria' && Array.from({ length: 15 }).map((_, i) => (
                   <circle key={`l-s-${i}`} cx={220 + i * 25} cy={-77} r="2" fill="#fef08a" filter="drop-shadow(0 0 4px rgba(253,224,71,0.9))" />
                 ))}
                 {activeConfig.id === 'feria' && Array.from({ length: 45 }).map((_, i) => (
                   <circle key={`l-i-${i}`} cx={230} cy={-160 + i * 25} r="2" fill="#fef08a" filter="drop-shadow(0 0 4px rgba(253,224,71,0.9))" />
                 ))}
               </g>
             )}

             {/* --- CASETA MUNICIPAL --- */}
            <g className="municipal-area" transform={activeConfig.municipal?.transform}>
               <rect 
                  width={activeConfig.municipal?.w || 180} 
                  height={activeConfig.municipal?.h || 150} 
                  fill="#eff6ff" stroke="#3b82f6" strokeWidth="4" rx="4"
                  className="caseta-3d" 
               />
               <text x={(activeConfig.municipal?.w || 180)/2} y="65" fontSize="16" fill="#1d4ed8" textAnchor="middle" className="font-bold">CASETA</text>
               <text x={(activeConfig.municipal?.w || 180)/2} y="85" fontSize="16" fill="#1d4ed8" textAnchor="middle" className="font-bold">MUNICIPAL</text>
            </g>

            {/* Rotonda */}
            {activeConfig.rotonda && (
              <circle 
                cx={activeConfig.rotonda.cx} cy={activeConfig.rotonda.cy} 
                r={activeConfig.rotonda.r} 
                fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" 
              />
            )}

            {/* --- SERVICIOS --- */}
            {activeConfig.servicios?.map(s => (
               <g key={s.id}>
                <rect x={s.x} y={s.y} width={s.w} height={s.h} fill="#fef3c7" stroke="#b45309" strokeWidth="3" rx="4" className="caseta-3d" />
                <text x={s.x + s.w/2} y={s.y + s.h/2} fontSize="12" fill="#92400e" textAnchor="middle" dominantBaseline="middle" style={{fontWeight: 900}}>{s.label}</text>
              </g>
            ))}

            {/* --- PUERTAS --- */}
            {activeConfig.puertas?.map(puerta => {
              const pos = gpsToPixel(puerta.lat, puerta.lng, activeConfig);
              const isLateral = puerta.id === 'p_lat';
              return (
                <g key={puerta.id} transform={`translate(${pos.x}, ${pos.y})`}>
                  <rect x={isLateral ? 15 : -40} y={isLateral ? -10 : 5} width="80" height="20" rx="10" fill="#eab308" stroke="#fff" strokeWidth="2" />
                  <text x={isLateral ? 55 : 0} y={isLateral ? 1 : 16} fontSize="10" fill={theme === 'day' ? "#000" : "#fff"} textAnchor="middle" dominantBaseline="middle" style={{fontWeight: 900}}>{puerta.name}</text>
                </g>
              );
            })}


            {interactiveCasetas.map((c) => {
              const isPeña = activeConfig.nombresExtras.some(ne => String(ne.id) === String(c.id));
              const typeLabel = isPeña ? 'Peña' : (c.firestoreData?.clase === 'Publica' ? 'Publica' : 'Privada');
              
              if (c.special !== 'CruzRoja' && !visibleTypes.includes(typeLabel)) return null;

              const isSelected = selectedCaseta?.id === c.firestoreData?.id;

              return (
                <g 
                  key={c.id} 
                  className={`caseta-group-v5 ${c.firestoreData ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={(e) => c.firestoreData && handleBoothClick(e, c.firestoreData)}
                  onMouseEnter={() => c.firestoreData && setHoveredId(c.firestoreData.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <rect
                    x={c.x} y={c.y} width={c.w} height={c.h} rx="2"
                    fill={c.firestoreData ? (
                      isPeña ? 'url(#stripe-yellow-v5)' : 
                      (c.firestoreData.clase === 'Publica' ? 'url(#stripe-red-v5)' : 'url(#stripe-green-v5)')
                    ) : "#fff"}
                    stroke={isSelected ? "var(--color-gold)" : "#333"}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className="caseta-rect-v5 caseta-3d"
                  />
                  
                  <g transform={`translate(${c.x + c.w / 2}, ${c.y + c.h / 2}) ${c.h > c.w ? 'rotate(-90)' : ''}`}>
                    {c.special === 'CruzRoja' ? (
                       <text x="0" y="2" fontSize="18" fill="red" fontWeight="900" textAnchor="middle" dominantBaseline="middle">+</text>
                    ) : (
                      <text 
                        x="0" y="0" fontSize={10} 
                        fill={theme === 'day' ? "#000" : "#fff"}
                        stroke={theme === 'day' ? "#fff" : "none"} strokeWidth="0.5"
                        fontWeight="900" paintOrder="stroke fill" textAnchor="middle" dominantBaseline="middle"
                        className="select-none" style={{ pointerEvents: 'none' }}
                      >
                        {c.label || c.id}
                      </text>
                    )}
                  </g>

                  {currentUser && c.firestoreData && (() => {
                    const count = liveUsers.filter(u => u.boothId === c.firestoreData.id).length;
                    if (count === 0) return null;
                    return (
                      <g transform={`translate(${c.x + c.w - 5}, ${c.y + 5})`}>
                        <rect x="-15" y="-6" width="20" height="12" rx="4" fill="rgba(0,0,0,0.6)" />
                        <text x="-13" y="3" fontSize="8" fill="white" fontWeight="900">👥{count}</text>
                      </g>
                    );
                  })()}
                </g>
              );
            })}

            {/* Live Users Layer */}
            {currentUser && (
              <g className="live-users">
                {liveUsers.filter(u => !u.isOutside).map(user => {
                  const pos = gpsToPixel(user.lat, user.lng, activeConfig);
                  const isMe = user.id === currentUser?.id;
                  const dotColor = isMe ? "var(--color-gold)" : "#00e5ff";

                  return (
                    <g key={user.id} className={`user-marker ${isMe ? 'is-me' : 'is-other'}`} transform={`translate(${pos.x}, ${pos.y})`}>
                      {isMe && <circle r="10" fill="none" stroke={dotColor} strokeWidth="1.5" className="radar-ping" />}
                      {!isMe && <circle r="6" fill={dotColor} opacity="0.3" className="breathe-glow" />}
                      <circle r={isMe ? 5 : 4} fill={dotColor} stroke="#fff" strokeWidth="1.5" />
                    </g>
                  );
                })}
              </g>
            )}

            <defs>
              <linearGradient id="roof-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
              </linearGradient>

              <pattern id="stripe-green-v5" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="2" height="4" fill="#004724" />
                <rect x="2" width="2" height="4" fill="white" />
              </pattern>
              <pattern id="stripe-red-v5" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="2" height="4" fill="#BB242B" />
                <rect x="2" width="2" height="4" fill="white" />
              </pattern>
              <pattern id="stripe-yellow-v5" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="2" height="4" fill="#D4AF37" />
                <rect x="2" width="2" height="4" fill="white" />
              </pattern>
            </defs>
          </g>
        </svg>

        {/* Floating Zoom Controls */}
        <div className="map-zoom-hud">
          <button onClick={() => setTransform(p => ({ ...p, scale: Math.min(p.scale + 0.3, 3) }))}>+</button>
          <div className="hud-sep"></div>
          <button onClick={() => setTransform(p => ({ ...p, scale: Math.max(p.scale - 0.3, minScale) }))}>-</button>
          <button className="reset-btn" onClick={handleReset}>⟲</button>
        </div>

        {/* PREMIUM BOTTOM SHEET (Mobile) / SIDECARD (Desktop) */}
        {selectedCaseta && (
          <div className="booth-bottom-sheet glass-panel-strong fade-in-up">
            <div className="sheet-handle" onClick={() => setSelectedCaseta(null)}></div>
            <div className="sheet-content">
              <div className="sheet-header">
                <img src={selectedCaseta.imagen} alt="" className="sheet-img" />
                <div className="sheet-title-group">
                  <span className={`sheet-badge ${selectedCaseta.clase.toLowerCase()}`}>{selectedCaseta.clase}</span>
                  <h3>{selectedCaseta.nombre}</h3>
                  <p>📍 {selectedCaseta.calle}, {selectedCaseta.numero}</p>
                </div>
                <button className="close-sheet" onClick={() => setSelectedCaseta(null)}>✕</button>
              </div>
              
              <div className="sheet-actions">
                <button className="sheet-btn gold" onClick={() => { onSelectCaseta(selectedCaseta); setSelectedCaseta(null); }}>
                  ✨ Ver Detalles
                </button>
                {currentUser && (
                   <button className="sheet-btn secondary" onClick={handleLocateMe}>
                     🚀 Ruta
                   </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveMap;
