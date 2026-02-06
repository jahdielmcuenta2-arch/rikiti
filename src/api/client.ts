// ============================================================
// CLIENTE DE DATOS CENTRALIZADO — Firebase Firestore
// ============================================================
// Todas las operaciones de lectura/escritura pasan por aquí.
//
// Si Firebase está configurado:
//   → Lee/escribe en Firestore (colección "studymate", doc "shared_data")
//   → Usa onSnapshot para escuchar cambios en tiempo real
//   → Todos los usuarios comparten el mismo documento
//
// Si Firebase NO está configurado:
//   → Todo funciona con localStorage (modo local)
//
// ============================================================

import { db } from '../lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';

import {
  USE_CLOUD,
  LOCAL_STORAGE_KEY,
  FIRESTORE_COLLECTION,
  FIRESTORE_DOC_ID,
} from '../config/serverConfig';

import { DEFAULT_SUBJECTS } from '../config/subjects';

// ==================== TIPOS ====================
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  category: string;
  subject: string;
  dueDate: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  type: string;
  subject: string;
}

export interface ScheduleItem {
  id: string;
  day: string;
  subject: string;
  room: string;
  startTime: string;
  endTime: string;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  files: FileItem[];
}

export interface FileItem {
  id: string;
  name: string;
  type: string;
  url: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  subject: string;
}

export interface AppData {
  tasks: Task[];
  events: Event[];
  schedule: ScheduleItem[];
  folders: Folder[];
  generalFiles: FileItem[];
  flashcards: Flashcard[];
  subjects: string[];
}

// ==================== DATOS POR DEFECTO ====================
export const defaultData: AppData = {
  tasks: [],
  events: [],
  schedule: [],
  folders: [],
  generalFiles: [],
  flashcards: [],
  subjects: [...DEFAULT_SUBJECTS],
};

// ==================== REFERENCIA AL DOCUMENTO ====================
function getDocRef() {
  if (!db) throw new Error('Firebase no inicializado');
  return doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
}

// ==================== FUNCIONES PRINCIPALES ====================

/**
 * Carga todos los datos de la app (una sola vez).
 * - Cloud:  Firestore getDoc
 * - Local:  localStorage
 */
export async function loadAppData(): Promise<AppData> {
  if (USE_CLOUD && db) {
    try {
      const docRef = getDocRef();
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const raw = snapshot.data() as Record<string, unknown>;
        return mergeWithDefaults(raw);
      }
      // Si el documento no existe, crearlo con datos por defecto
      await setDoc(docRef, defaultData);
      return { ...defaultData };
    } catch (err) {
      console.warn('[StudyMate] Error cargando de Firestore, usando localStorage:', err);
      return loadFromLocalStorage();
    }
  }
  return loadFromLocalStorage();
}

/**
 * Guarda todos los datos de la app.
 * - Cloud:  Firestore setDoc (merge)
 * - Local:  localStorage (siempre como cache)
 */
export async function saveAppData(data: AppData): Promise<void> {
  // Siempre guardamos en localStorage como cache
  saveToLocalStorage(data);

  if (USE_CLOUD && db) {
    try {
      const docRef = getDocRef();
      // Convertimos a objeto plano para Firestore
      const plain = JSON.parse(JSON.stringify(data));
      await setDoc(docRef, plain);
    } catch (err) {
      console.warn('[StudyMate] Error guardando en Firestore:', err);
    }
  }
}

/**
 * Suscribirse a cambios en TIEMPO REAL desde Firestore.
 * Cada vez que otro usuario actualiza los datos, se llama al callback.
 * Devuelve una función para cancelar la suscripción.
 *
 * Si Firebase no está configurado, devuelve un no-op.
 */
export function subscribeToData(
  callback: (data: AppData) => void
): Unsubscribe {
  if (USE_CLOUD && db) {
    try {
      const docRef = getDocRef();
      return onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const raw = snapshot.data() as Record<string, unknown>;
          const merged = mergeWithDefaults(raw);
          // Actualizar cache local
          saveToLocalStorage(merged);
          callback(merged);
        }
      }, (err) => {
        console.warn('[StudyMate] Error en listener de Firestore:', err);
      });
    } catch (err) {
      console.warn('[StudyMate] Error creando listener:', err);
    }
  }
  // Si no hay Firebase, devolver no-op
  return () => {};
}

// ==================== HELPERS ====================

function mergeWithDefaults(raw: Record<string, unknown>): AppData {
  return {
    tasks: (raw.tasks as Task[]) || [],
    events: (raw.events as Event[]) || [],
    schedule: (raw.schedule as ScheduleItem[]) || [],
    folders: (raw.folders as Folder[]) || [],
    generalFiles: (raw.generalFiles as FileItem[]) || [],
    flashcards: (raw.flashcards as Flashcard[]) || [],
    subjects: (raw.subjects as string[]) || [...DEFAULT_SUBJECTS],
  };
}

function loadFromLocalStorage(): AppData {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const raw = JSON.parse(stored) as Record<string, unknown>;
      return mergeWithDefaults(raw);
    }
  } catch (err) {
    console.error('[StudyMate] Error leyendo localStorage:', err);
  }
  return { ...defaultData };
}

function saveToLocalStorage(data: AppData): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('[StudyMate] Error escribiendo localStorage:', err);
  }
}
