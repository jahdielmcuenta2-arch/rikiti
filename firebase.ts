// ============================================================
// CONFIGURACIÓN CENTRALIZADA DE FIREBASE
// ============================================================
// Este archivo es el ÚNICO lugar donde se inicializa Firebase.
//
// Lee TODAS las claves desde variables de entorno de Vite
// (prefijo VITE_). Para usarlo:
//
//   1. Crea un proyecto en https://console.firebase.google.com
//   2. Activa Firestore Database
//   3. Activa Firebase Storage
//   4. Copia la configuración de tu proyecto Firebase
//   5. Pégala en tu archivo .env (ver .env.example)
//
// Si las variables están vacías, Firebase NO se inicializa
// y la app funciona en modo localStorage.
// ============================================================
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import {
  getStorage,
  type FirebaseStorage,
} from 'firebase/storage';
// Leer config desde variables de entorno de Vite
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};
// Verificar si Firebase está configurado
export const FIREBASE_CONFIGURED: boolean =
  firebaseConfig.apiKey.length > 0 &&
  firebaseConfig.projectId.length > 0;
// Inicializar Firebase SOLO si está configurado
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
if (FIREBASE_CONFIGURED) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('[StudyMate] ✅ Firebase conectado al proyecto:', firebaseConfig.projectId);
  } catch (err) {
    console.error('[StudyMate] ❌ Error inicializando Firebase:', err);
  }
} else {
  console.log('[StudyMate] ℹ️ Firebase no configurado — usando modo local (localStorage)');
}
export { app, db, storage };
