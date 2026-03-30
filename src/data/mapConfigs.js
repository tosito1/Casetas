// Definitive San Juan Layout
const casetasSanJuanDef = [
  ...Array.from({ length: 27 }).map((_, i) => ({ id: 89 - i, x: 170, y: -30 + i * 30, w: 38, h: 26 })),
  { id: 90, x: 170, y: -60, w: 38, h: 26 },
  { id: 91, x: 170, y: -90, w: 38, h: 26 },
  ...[55, 56, 57, 60, 61, 62].map((id, i) => ({ id, x: 245, y: 570 + i * 28, w: 38, h: 26 })),
  ...[12, 11, 10, 9, 8, 7].map((id, i) => ({ id, x: 290 + i * 45, y: 318, w: 43, h: 32 })),
  ...[1, 2, 3, 4, 5, 6].map((id, i) => ({ id, x: 290 + i * 45, y: 261, w: 43, h: 32 })),
  ...[41, 42, 43, 44, 45, 46, 47, 48, 49].map((id, i) => ({ id, x: 514.5, y: 550 + i * 25, w: 38, h: 23 })),
  ...[50, 51, 52, 53, 54].map((id, i) => ({ id, x: 476.5 - i * 46.3, y: 760, w: 38, h: 26 })),
  ...[23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35].map((id, i) => ({ id, x: 640, y: 550 + i * 16, w: 43, h: 16 })),
  ...[36, 37, 38, 39, 40].map((id, i) => ({ id: 36+i, x: 685 + i * 40, y: 750, w: 38, h: 32 })),
  ...['cr-sanjuan', 13, 14, 15, 16, 17].map((id, i) => ({ id, x: 700 + i * 38, y: 460, w: 35, h: 38, special: id === 'cr-sanjuan' ? 'CruzRoja' : null })),
  ...[22, 21, 20, 19, 18].map((id, i) => ({ id, x: 700 + i * 45, y: 520, w: 43, h: 38 })),
];

// Feria filtering logic
const sanJuanFeriaBase = casetasSanJuanDef.filter(c => 
  !(c.y === 318 && c.x >= 290) &&             
  !(c.y === 261 && c.x >= 290) &&             
  !(c.y === 460 && c.x >= 700) &&             
  !(c.y === 520 && c.x >= 700) &&             
  !(c.x === 640) &&                           
  !(c.y === 750 && c.x >= 685) &&             
  !(c.x === 514.5) &&                         
  !(c.y === 760) &&                           
  !(c.x === 245 && c.y >= 570) &&             
  !(c.x === 170)                               
);

export const MAP_CONFIGS = {
  sanjuan: {
    title: "San Juan",
    viewBox: "-100 -250 1400 1300",
    bounds: {
      north: 37.365800, south: 37.363600, 
      west: -4.856200, east: -4.854400   
    },
    boothDefinitions: casetasSanJuanDef,
    greenAreas: [
      { x: 160, y: -100, w: 60, h: 930 },
      { x: 235, y: 250, w: 320, h: 550 },
      { x: 680, y: 450, w: 350, h: 120 },
      { x: 595, y: 510, w: 70,  h: 300 },
      { x: 675, y: 740, w: 300, h: 80 },
    ],
    roads: [
      { type: 'rect', x: 215, y: -180, w: 30, h: 1000 },
      { type: 'rect', x: 560, y: -180, w: 30, h: 1000 },
      { type: 'rect', x: 930, y: 460, w: 40, h: 420 },
      { type: 'rect', x: 170, y: 790, w: 800, h: 30, label: "Camino peatonal sur" },
      { type: 'rect', x: 208, y: -90, w: 406, h: 25 },
      { type: 'rect', x: 560, y: 498, w: 456, h: 22 },
      { type: 'rect', x: 970, y: 498, w: 70, h: 22 },
      { type: 'rect', x: 245, y: 293, w: 315, h: 25 }
    ],
    rotonda: { cx: 575, cy: 450, r: 25 },
    municipal: { transform: "translate(310, 350)", w: 180, h: 150 },
    servicios: [
      { id: 'serv_1', x: 170, y: -180, w: 115, h: 40, label: 'WC' },
      { id: 'serv_2', x: 360, y: 520, w: 80, h: 35, label: 'WC' }
    ],
    puertas: [
      { id: 'p_prin', name: 'P. Principal', lat: 37.363914, lng: -4.855338 }, 
      { id: 'p_1', name: 'Puerta 1', lat: 37.363914, lng: -4.854776 },        
      { id: 'p_2', name: 'Puerta 2', lat: 37.363914, lng: -4.855867 },        
      { id: 'p_lat', name: 'P. Lateral', lat: 37.364645, lng: -4.854658 },
    ],
    nombresExtras: [],
    trees: []
  },
  feria: {
    title: "Feria",
    viewBox: "-100 -250 1400 1300",
    bounds: {
      north: 37.365800, south: 37.363600, 
      west: -4.856200, east: -4.854400   
    },
    boothDefinitions: [
       ...sanJuanFeriaBase,
       ...Array.from({ length: 31 }).map((_, i) => ({ id: 137 - i, x: 170, y: -120 + i * 30, w: 38, h: 26 })),
       ...[40, 39, 38, 37, 36].map((id, i) => ({ id, x: 700 + i * 45, y: 135, w: 43, h: 38 })),
       ...[45, 44, 43, 42, 41].map((id, i) => ({ id, x: 700 + i * 45, y: 198, w: 43, h: 38 })),
       ...[46, 47, 48, 49, 50].map((id, i) => ({ id, x: 700 + i * 45, y: 236, w: 43, h: 38 })),
       ...[55, 54, 53, 52, 51].map((id, i) => ({ id, x: 700 + i * 45, y: 342, w: 43, h: 38 })),
       ...['cr-feria', 56, 57, 58, 59, 60].map((id, i) => ({ id, x: 655 + i * 45, y: 380, w: 43, h: 38, special: id === 'cr-feria' ? 'CruzRoja' : null })),
       ...[61, 62, 63, 64, 65].map((id, i) => ({ id, x: 700 + i * 45, y: 515.5, w: 43, h: 38 })),
       ...[66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77].map((id, i) => ({ id, x: 605, y: 520 + i * (250 / 11), w: 55, h: 20 })),
       ...[78, 79, 80, 81, 82, 83].map((id, i) => ({ id, x: 685 + i * 40, y: 775, w: 38, h: 32 })),
       ...[84, 85, 86, 87, 88, 89, 90, 91, 92].map((id, i) => ({ id, x: 472, y: 550 + i * (225 / 8), w: 38, h: 23 })),
       ...[93, 94, 95, 96, 97, 98].map((id, i) => ({ id: 93+i, x: 435 - i * 38, y: 775, w: 35, h: 26 })),
       ...Array.from({ length: 8 }).map((_, i) => ({ id: 106 - i, x: 245, y: 605 + i * (170 / 7), w: 38, h: 22 })),
       ...[1, 2, 3, 4].map((id, i) => ({ id, x: 245 + i * 45, y: -60, w: 43, h: 32 })),
       ...[8, 7, 6, 5].map((id, i) => ({ id, x: 245 + i * 45, y: -28, w: 43, h: 32 })),
       ...[9, 10, 11, 12, 13].map((id, i) => ({ id, x: 245 + i * 45, y: 55, w: 43, h: 32 })),
       ...[18, 17, 16, 15, 14].map((id, i) => ({ id, x: 245 + i * 45, y: 87, w: 43, h: 32 })),
       ...[19, 20, 21, 22, 23].map((id, i) => ({ id, x: 245 + i * 45, y: 175, w: 43, h: 32 })),
       ...[29, 28, 27, 26, 25, 24].map((id, i) => ({ id, x: 245 + i * 45, y: 207, w: 43, h: 32 })),
       ...[30, 31, 32, 33, 34, 35].map((id, i) => ({ id, x: 245 + i * 45, y: 295, w: 43, h: 32 })),
    ],
    greenAreas: [
      { x: 160, y: -130, w: 60, h: 1000 },
      { x: 235, y: -70, w: 285, h: 900 },
      { x: 640, y: 120, w: 350,  h: 440 },
      { x: 595, y: 510, w: 70, h: 300 },
      { x: 675, y: 740, w: 300, h: 80 },
    ],
    roads: [
      { type: 'rect', x: 215, y: -180, w: 30, h: 1000 },
      { type: 'rect', x: 552.5, y: -180, w: 45, h: 1000 },
      { type: 'rect', x: 930, y: 135, w: 40, h: 700 },
      { type: 'rect', x: 170, y: 815, w: 800, h: 30 },
      { type: 'rect', x: 208, y: -90, w: 406, h: 25 },
      { type: 'rect', x: 552.5, y: 480.5, w: 487.5, h: 35 },
      { type: 'rect', x: 970, y: 480.5, w: 70, h: 35 },
      { type: 'rect', x: 614, y: 30, w: 316, h: 25 },
      { type: 'rect', x: 614, y: 173, w: 316, h: 25 },
      { type: 'rect', x: 614, y: 274, w: 316, h: 25 },
      { type: 'rect', x: 245, y: 30, w: 315, h: 25 },  
      { type: 'rect', x: 245, y: 150, w: 315, h: 25 }, 
      { type: 'rect', x: 245, y: 270, w: 315, h: 25 }
    ],
    rotonda: { cx: 575, cy: 498, r: 35 },
    municipal: { transform: "translate(245, 423)", w: 227, h: 150 },
    servicios: [
      { id: 'serv_1', x: 170, y: -180, w: 115, h: 40, label: 'WC' },
      { id: 'wc-f-1', x: 245, y: 578, w: 80, h: 22, label: 'WC' }
    ],
    puertas: [
      { id: 'p_prin', name: 'P. Principal', lat: 37.363914, lng: -4.855338 }, 
      { id: 'p_1', name: 'Puerta 1', lat: 37.363914, lng: -4.854776 },        
      { id: 'p_2', name: 'Puerta 2', lat: 37.363914, lng: -4.855867 },        
      { id: 'p_lat', name: 'P. Lateral', lat: 37.364645, lng: -4.854658 },
    ],
    nombresExtras: [],
    trees: []
  }
};

export const gpsToPixel = (lat, lng, config) => {
  if (!config?.bounds) return { x: 500, y: 500 };
  const { north, south, west, east } = config.bounds;
  const latRange = north - south;
  const lngRange = east - west;
  const x = ((lng - west) / lngRange) * 1200; 
  const y = ((north - lat) / latRange) * 950;  
  return { x, y };
};

export const pixelToGps = (x, y, config) => {
  if (!config?.bounds) return { lat: 0, lng: 0 };
  const { north, south, west, east } = config.bounds;
  const latRange = north - south;
  const lngRange = east - west;
  const lng = west + (x / 1200) * lngRange;
  const lat = north - (y / 950) * latRange;
  return { lat, lng };
};
