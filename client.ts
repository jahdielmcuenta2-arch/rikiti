// ============================================================
// CLIENTE DE DATOS CENTRALIZADO — Firebase Firestore + Storage
// ============================================================
// Todas las operaciones de lectura/escritura pasan por aquí.
//
// IMÁGENES:
//   - Si Firebase está configurado:
//     → Las imágenes se suben a Firebase Storage
//     → Solo se guarda la URL de descarga en Firestore
//     → Esto evita el límite de 1MB por documento de Firestore
//   - Si NO está configurado:
//     → Las imágenes se guardan como base64 en localStorage
//
// DATOS (tareas, horarios, etc.):
//   - Cloud:  Firestore con onSnapshot (tiempo real)
//   - Local:  localStorage
//
// ============================================================
import { db, storage } from '../lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
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
  storagePath?: string; // Ruta en Firebase Storage para poder borrarlo
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
 * Las imágenes NO se guardan aquí — ya se subieron a Storage antes.
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
  return () => {};
}
// ==================== FIREBASE STORAGE (IMÁGENES) ====================
/**
 * Sube una imagen a Firebase Storage y devuelve un FileItem
 * con la URL de descarga (en vez de base64).
 *
 * Si Firebase no está configurado, convierte a base64 (modo local).
 */
export async function uploadImage(
  file: File,
  folderId?: string
): Promise<FileItem> {
  const fileId = Date.now().toString();
  // Si Firebase Storage está disponible, subir ahí
  if (USE_CLOUD && storage) {
    try {
      const storagePath = folderId
        ? `studymate/folders/${folderId}/${fileId}_${file.name}`
        : `studymate/general/${fileId}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return {
        id: fileId,
        name: file.name,
        type: 'image',
        url: downloadURL,
        storagePath: storagePath,
      };
    } catch (err) {
      console.warn('[StudyMate] Error subiendo a Storage, usando base64:', err);
      // Fallback a base64
      return await fileToBase64Item(file, fileId);
    }
  }
  // Modo local: convertir a base64
  return await fileToBase64Item(file, fileId);
}
/**
 * Elimina una imagen de Firebase Storage (si tiene storagePath).
 */
export async function deleteImage(fileItem: FileItem): Promise<void> {
  if (USE_CLOUD && storage && fileItem.storagePath) {
    try {
      const storageRef = ref(storage, fileItem.storagePath);
      await deleteObject(storageRef);
      console.log('[StudyMate] Imagen eliminada de Storage:', fileItem.storagePath);
    } catch (err) {
      // No es crítico si falla el borrado del storage
      console.warn('[StudyMate] Error borrando imagen de Storage:', err);
    }
  }
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
/**
 * Convierte un File a un FileItem con Data URL base64 (para modo local).
 */
function fileToBase64Item(file: File, fileId: string): Promise<FileItem> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve({
        id: fileId,
        name: file.name,
        type: 'image',
        url: event.target?.result as string,
      });
    };
    reader.onerror = () => reject(new Error('Error leyendo archivo'));
    reader.readAsDataURL(file);
  });
}
