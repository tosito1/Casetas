import { rtDb } from '../firebase';
import { ref, onValue, set, onDisconnect, remove } from 'firebase/database';

export const locationService = {
  /**
   * Broadcast local user location to all participants
   * @param {string} userId 
   * @param {object} data {x, y, name, boothId, status}
   */
  async broadcastLocation(userId, data) {
    if (!userId) return;
    const locationRef = ref(rtDb, `locations/${userId}`);
    await set(locationRef, {
      ...data,
      lastUpdate: new Date().toISOString()
    });

    // Strategy: Auto-remove from map when session ends
    onDisconnect(locationRef).remove();
  },

  /**
   * Listen to all active users on the fairground map
   * @param {function} callback Receives array of active users
   */
  listenToLiveMap(callback) {
    const locationsRef = ref(rtDb, 'locations');
    return onValue(locationsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return callback([]);
      
      const users = Object.keys(data).map(uid => ({
        id: uid,
        ...data[uid]
      }));
      callback(users);
    });
  },

  /**
   * Explicitly leave the live map
   */
  async leaveMap(userId) {
    if (!userId) return;
    const locationRef = ref(rtDb, `locations/${userId}`);
    await remove(locationRef);
  }
};
