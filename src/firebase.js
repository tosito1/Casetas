import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDC4syuatsPwxNo6shK3yp_8eg-Uk3amXo",
  authDomain: "casetas-e1609.firebaseapp.com",
  projectId: "casetas-e1609",
  storageBucket: "casetas-e1609.firebasestorage.app",
  messagingSenderId: "318530134361",
  appId: "1:318530134361:web:78ccdeb7d030c67a83ec48",
  databaseURL: "https://casetas-e1609-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtDb = getDatabase(app);

// Auth Providers
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

export default app;
