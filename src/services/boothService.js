import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  or,
  and,
  doc, 
  getDoc,
  updateDoc,
  setDoc,
  onSnapshot,
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { ROLES } from '../data/data';

export const boothService = {
  // Listen to profile changes in real-time
  listenToSocio(uid, callback) {
    const docRef = doc(db, 'socios', uid);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() });
      } else {
        callback(null);
      }
    });
  },

  async getSocioByUid(uid) {
    const docRef = doc(db, 'socios', uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() };
  },

  async updateSocioCuota(uid, status) {
    const socioRef = doc(db, 'socios', uid);
    await updateDoc(socioRef, { cuotaAlDia: status });
    return true;
  },

  // NEW: Listen to all booths in real-time
  listenToCasetas(callback) {
    const q = collection(db, 'casetas');
    return onSnapshot(q, (snapshot) => {
      const casetas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(casetas);
    });
  },

  // Get all booths (Keep as fallback)
  async getCasetas() {
    const querySnapshot = await getDocs(collection(db, 'casetas'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  /**
   * ATOMIC SAVE & DEDUPLICATION STRATEGY
   * Handles both Add and Update cases while ensuring address uniqueness.
   * If a collision is detected, it merges data and cleans redundant docs.
   */
  async saveCaseta(currentId, data) {
    const { id: _ignore, ...cleanData } = data;
    const street = cleanData.calle.trim();
    const numberStr = String(cleanData.numero).trim();
    const numberNum = Number(cleanData.numero);

    // 1. Search for ANY document with the same physical address (Check both String and Number types)
    const q = query(
      collection(db, 'casetas'), 
      and(
        where('calle', '==', street),
        or(
          where('numero', '==', numberStr),
          where('numero', '==', numberNum)
        )
      )
    );
    const searchSnapshot = await getDocs(q);
    
    let targetDocId = null;
    let isCollision = false;

    if (!searchSnapshot.empty) {
      // Address found in DB
      targetDocId = searchSnapshot.docs[0].id;
      isCollision = true;
    }

    try {
      if (isCollision) {
        // SCENARIO: We found an existing record for this address
        const docToUpdate = doc(db, 'casetas', targetDocId);
        await setDoc(docToUpdate, cleanData, { merge: true });

        // CLEANUP: If we were editing a DIFFERENT document ID, it's a redundant duplicate
        if (currentId && currentId !== targetDocId) {
          console.log(`🧹 DEDUPLICATION: Merged address into ${targetDocId} and deleting redundant ${currentId}`);
          await deleteDoc(doc(db, 'casetas', String(currentId)));
        }
        
        return { id: targetDocId, ...cleanData };
      } else {
        // SCENARIO: No existing record for this address
        if (currentId) {
          // Normal Update by ID
          const docRef = doc(db, 'casetas', String(currentId));
          await setDoc(docRef, cleanData, { merge: true });
          return { id: String(currentId), ...cleanData };
        } else {
          // Normal Add
          const docRef = await addDoc(collection(db, 'casetas'), cleanData);
          return { id: docRef.id, ...cleanData };
        }
      }
    } catch (error) {
      console.error("Critical error in saveCaseta:", error);
      throw error;
    }
  },

  // NEW: Delete booth
  async deleteCaseta(id) {
    const docRef = doc(db, 'casetas', String(id));
    await deleteDoc(docRef);
    return id;
  },

  // NEW: Update booth physical location on the SVG map
  async updateBoothMapLocation(boothId, x, y) {
    const docRef = doc(db, 'casetas', boothId);
    await updateDoc(docRef, { mapX: x, mapY: y });
  },

  // NEW: Calibrate booth physical GPS coordinates
  async updateBoothGPSLocation(boothId, lat, lng) {
    const docRef = doc(db, 'casetas', boothId);
    await updateDoc(docRef, { latitudReal: lat, longitudReal: lng, lastGPSCalibration: new Date().toISOString() });
  },

  // Get members for a specific booth
  async getSocios(casetaId) {
    const q = query(collection(db, 'socios'), where('casetaId', '==', casetaId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // NEW: Get ALL socio profiles (Admin only)
  async getAllSocios() {
    const querySnapshot = await getDocs(collection(db, 'socios'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // NEW: Listen to all socios real-time
  listenToAllSocios(callback) {
    const q = collection(db, 'socios');
    return onSnapshot(q, (snapshot) => {
      const socios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(socios);
    });
  },

  // NEW: Change user role or status
  async updateSocioRole(uid, role, approved = true) {
    const socioRef = doc(db, 'socios', uid);
    await updateDoc(socioRef, { rol: role, approved });
    return true;
  },

  // NEW: Quick Approve for platform access
  async approveSocio(uid) {
    const socioRef = doc(db, 'socios', uid);
    await updateDoc(socioRef, { approved: true });
    return true;
  },

  // NEW: Remove user from booth
  async detachSocioFromCaseta(uid) {
    const socioRef = doc(db, 'socios', uid);
    await updateDoc(socioRef, { casetaId: null, approved: false });
    return true;
  },

  // Get a single socio profile
  async getSocioProfile(email) {
    const q = query(collection(db, 'socios'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
  },

  // Submit a membership request
  async submitRequest(requestData) {
    const docRef = await addDoc(collection(db, 'solicitudes'), {
      ...requestData,
      estado: 'pendiente',
      fecha: new Date().toISOString()
    });
    return { id: docRef.id, ...requestData };
  },

  // Get pending requests
  async getPendingRequests() {
    const q = query(collection(db, 'solicitudes'), where('estado', '==', 'pendiente'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Approve or reject a request
  async updateRequestStatus(requestId, status, socioData = null) {
    const requestRef = doc(db, 'solicitudes', requestId);
    await updateDoc(requestRef, { estado: status });
    
    if (status === 'aprobado' && socioData && socioData.uid) {
      // Update the official member record of the EXISTING user by UID
      const socioRef = doc(db, 'socios', socioData.uid);
      await updateDoc(socioRef, {
        casetaId: socioData.casetaId,
        rol: socioData.rol,
        approved: true
      });
    }
    return true;
  },

  // NEW: Sync User Profile with Auth UID
  async syncUserProfile(firebaseUser) {
    const docRef = doc(db, 'socios', firebaseUser.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      const isAdminEmail = firebaseUser.email === 'admin@feria.com';
      const initialProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        nombre: firebaseUser.displayName || (isAdminEmail ? 'Admin Feria' : 'Usuario Nuevo'),
        telefono: firebaseUser.phoneNumber || '',
        rol: isAdminEmail ? ROLES.GLOBAL_ADMIN : ROLES.NORMAL,
        casetaId: null,
        approved: isAdminEmail ? true : false,
        cuotaAlDia: true
      };
      await setDoc(docRef, initialProfile);
      return initialProfile;
    }
    
    const profile = { id: docSnap.id, ...docSnap.data() };
    
    // Safety check: if existing user changes to admin email, ensure they get admin role
    if (firebaseUser.email === 'admin@feria.com' && profile.rol !== ROLES.GLOBAL_ADMIN) {
      profile.rol = ROLES.GLOBAL_ADMIN;
      profile.approved = true;
      await updateDoc(docRef, { rol: ROLES.GLOBAL_ADMIN, approved: true });
    }

    return profile;
  },

  // MI CASETA HUB HELPERS
  
  // -- Notifications (Targeted)
  listenToNotificaciones(boothId, currentSocio, callback) {
    const q = query(
      collection(db, 'casetas', boothId, 'notificaciones'),
      orderBy('fecha', 'desc')
    );
    return onSnapshot(q, (snap) => {
      let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Administrators see ALL. Others only relevant ones.
      const isAdmin = currentSocio.rol === ROLES.PRESIDENTE || currentSocio.rol === ROLES.TESORERO || currentSocio.rol === ROLES.GLOBAL_ADMIN;
      
      if (!isAdmin) {
        data = data.filter(n => {
          if (!n.targetType || n.targetType === 'all') return true;
          if (n.targetType === 'role') return n.targetValue === currentSocio.rol;
          if (n.targetType === 'specific') {
             // Handle both single UID and array of UIDs (for future multi-select)
             if (Array.isArray(n.targetValue)) return n.targetValue.includes(currentSocio.id);
             return n.targetValue === currentSocio.id;
          }
          return false;
        });
      }
      
      callback(data);
    });
  },

  async addNotificacion(boothId, data) {
    return await addDoc(collection(db, 'casetas', boothId, 'notificaciones'), {
      ...data,
      fecha: new Date().toISOString()
    });
  },

  // -- Votations
  listenToVotaciones(boothId, callback) {
    const q = collection(db, 'casetas', boothId, 'votaciones');
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  },

  async addPoll(boothId, data) {
    return await addDoc(collection(db, 'casetas', boothId, 'votaciones'), {
      ...data,
      creadoEn: new Date().toISOString()
    });
  },

  async updatePoll(boothId, pollId, data) {
    const docRef = doc(db, 'casetas', boothId, 'votaciones', pollId);
    await setDoc(docRef, data, { merge: true });
  },

  async deletePoll(boothId, pollId) {
    const docRef = doc(db, 'casetas', boothId, 'votaciones', pollId);
    await deleteDoc(docRef);
  },

  async castVote(boothId, pollId, socioId, choices, updatedResults) {
    const docRef = doc(db, 'casetas', boothId, 'votaciones', pollId);
    await updateDoc(docRef, {
      [`votos.${socioId}`]: choices,
      resultados: updatedResults
    });
  },

  // -- Fees (Cuotas)
  listenToCuotas(boothId, callback) {
    const q = collection(db, 'casetas', boothId, 'cuotas');
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  },

  async addCuota(boothId, feeData) {
    return await addDoc(collection(db, 'casetas', boothId, 'cuotas'), {
      ...feeData,
      creadoEn: new Date().toISOString()
    });
  },

  async registerPayment(boothId, feeId, userId, amount) {
    const docRef = doc(db, 'casetas', boothId, 'cuotas', feeId);
    await updateDoc(docRef, {
      [`pagos.${userId}`]: {
        pagado: true,
        fechaPago: new Date().toISOString(),
        montoCobrado: amount
      }
    });

    // Also update the global status for convenience (optional but helpful)
    const socioRef = doc(db, 'socios', userId);
    await updateDoc(socioRef, { cuotaAlDia: true });
  },

  async deleteCuota(boothId, feeId) {
    const docRef = doc(db, 'casetas', boothId, 'cuotas', feeId);
    await deleteDoc(docRef);
  },

  // -- Ledger (Movimientos)
  listenToMovimientos(boothId, callback) {
    const q = query(
      collection(db, 'casetas', boothId, 'movimientos'),
      orderBy('fecha', 'desc')
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  },

  async addMovimiento(boothId, data) {
    return await addDoc(collection(db, 'casetas', boothId, 'movimientos'), {
      ...data,
      fecha: new Date().toISOString()
    });
  },

  async deleteMovimiento(boothId, movId) {
    const docRef = doc(db, 'casetas', boothId, 'movimientos', movId);
    await deleteDoc(docRef);
  },

  // -- Event Hub (Feria/San Juan)
  // Type: albaran, gastos, comidas, tareas
  listenToEventData(boothId, eventId, subType, callback) {
    const q = collection(db, 'casetas', boothId, 'eventos', eventId, subType);
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  },

  async addEventItem(boothId, eventId, subType, data) {
    return await addDoc(collection(db, 'casetas', boothId, 'eventos', eventId, subType), {
      ...data,
      fecha: new Date().toISOString()
    });
  },

  async updateEventItem(boothId, eventId, subType, itemId, data) {
    const docRef = doc(db, 'casetas', boothId, 'eventos', eventId, subType, itemId);
    await setDoc(docRef, data, { merge: true });
  },

  async deleteEventItem(boothId, eventId, subType, itemId) {
    const docRef = doc(db, 'casetas', boothId, 'eventos', eventId, subType, itemId);
    await deleteDoc(docRef);
  },

  // -- GLOBAL CONFIGURATION (for Admins)
  listenToGlobalConfig(callback) {
    const docRef = doc(db, 'config', 'global');
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      } else {
        // Initial default config if missing
        callback({ activeMap: 'sanjuan' });
      }
    });
  },

  async updateGlobalConfig(data) {
    const docRef = doc(db, 'config', 'global');
    await setDoc(docRef, data, { merge: true });
  }
};
