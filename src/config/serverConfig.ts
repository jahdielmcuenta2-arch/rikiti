// ============================================================
// CONFIGURACIÓN CENTRALIZADA
// ============================================================
// Este archivo centraliza constantes de la app.
// La conexión a Firebase se maneja en src/lib/firebase.ts
// ============================================================

import { FIREBASE_CONFIGURED } from '../lib/firebase';

/**
 * true  → Firebase está configurado, datos en la nube (Firestore).
 * false → Sin Firebase, datos en localStorage del navegador.
 */
export const USE_CLOUD: boolean = FIREBASE_CONFIGURED;

/** Intervalo en ms para re-leer datos de Firestore (polling fallback) */
export const SYNC_INTERVAL = 3000;

/** Clave de localStorage para persistencia local / cache */
export const LOCAL_STORAGE_KEY = 'studymate_shared_data';

/** Clave de localStorage para el tema (oscuro/claro) */
export const THEME_STORAGE_KEY = 'studymate_theme';

/**
 * Nombre del documento de Firestore donde se guardan TODOS los datos.
 * Todos los usuarios comparten este mismo documento.
 */
export const FIRESTORE_COLLECTION = 'studymate';
export const FIRESTORE_DOC_ID = 'shared_data';
