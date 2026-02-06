import { useState, useEffect, useCallback } from 'react';
import {
  Home,
  CheckSquare,
  FileText,
  Calendar,
  Timer,
  Layers,
  Plus,
  X,
  Trash2,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  Clock,
  BookOpen,
  Upload,
  FolderPlus,
  Settings,
  Users,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Cloud,
  HardDrive,
} from 'lucide-react';

// ==================== CONFIG & API CENTRALIZADOS ====================
import {
  USE_CLOUD,
  SYNC_INTERVAL,
  THEME_STORAGE_KEY,
} from './config/serverConfig';

import {
  loadAppData,
  saveAppData,
  subscribeToData,
  defaultData,
  type AppData,
  type Task,
  type Event as AppEvent,
  type ScheduleItem,
  type Folder,
  type FileItem,
  type Flashcard,
} from './api/client';

// ==================== CONSTANTES DE UI ====================

// Clase base para TODOS los botones — animación suave al hacer hover/clic
const BTN = 'transition-all duration-200 ease-out hover:scale-105 active:scale-95 focus:outline-none';

// Clases para iconos clicables (papelera, cerrar, etc.)
const ICON_BTN = 'transition-all duration-200 ease-out hover:scale-110 active:scale-90 focus:outline-none';

const taskCategories = [
  'Tarea', 'Proyecto', 'Examen', 'Exposición', 'Foto',
  'Lectura', 'Práctica', 'Investigación', 'Ensayo', 'Laboratorio'
];

const categoryColors: Record<string, { light: string; dark: string }> = {
  'Tarea': { light: 'bg-blue-100 text-blue-700 border-blue-300', dark: 'bg-blue-900/50 text-blue-300 border-blue-700' },
  'Proyecto': { light: 'bg-purple-100 text-purple-700 border-purple-300', dark: 'bg-purple-900/50 text-purple-300 border-purple-700' },
  'Examen': { light: 'bg-red-100 text-red-700 border-red-300', dark: 'bg-red-900/50 text-red-300 border-red-700' },
  'Exposición': { light: 'bg-orange-100 text-orange-700 border-orange-300', dark: 'bg-orange-900/50 text-orange-300 border-orange-700' },
  'Foto': { light: 'bg-pink-100 text-pink-700 border-pink-300', dark: 'bg-pink-900/50 text-pink-300 border-pink-700' },
  'Lectura': { light: 'bg-green-100 text-green-700 border-green-300', dark: 'bg-green-900/50 text-green-300 border-green-700' },
  'Práctica': { light: 'bg-cyan-100 text-cyan-700 border-cyan-300', dark: 'bg-cyan-900/50 text-cyan-300 border-cyan-700' },
  'Investigación': { light: 'bg-indigo-100 text-indigo-700 border-indigo-300', dark: 'bg-indigo-900/50 text-indigo-300 border-indigo-700' },
  'Ensayo': { light: 'bg-amber-100 text-amber-700 border-amber-300', dark: 'bg-amber-900/50 text-amber-300 border-amber-700' },
  'Laboratorio': { light: 'bg-teal-100 text-teal-700 border-teal-300', dark: 'bg-teal-900/50 text-teal-300 border-teal-700' }
};

const folderColors = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-green-400 to-green-600',
  'from-orange-400 to-orange-600',
  'from-pink-400 to-pink-600',
  'from-cyan-400 to-cyan-600',
  'from-red-400 to-red-600',
  'from-indigo-400 to-indigo-600'
];

// Alias de tipos para evitar conflictos con Event del DOM
type _Task = Task;
type _Event = AppEvent;
type _ScheduleItem = ScheduleItem;
type _Folder = Folder;
type _FileItem = FileItem;
type _Flashcard = Flashcard;

// ==================== COMPONENTE PRINCIPAL ====================
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [data, setData] = useState<AppData>(defaultData);
  const [isOnline, setIsOnline] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Modales
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedDay, setSelectedDay] = useState('Lunes');
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  // Formularios
  const [newTask, setNewTask] = useState({ text: '', category: 'Tarea', subject: '', dueDate: '' });
  const [newEvent, setNewEvent] = useState({ title: '', date: '', type: 'Examen', subject: '' });
  const [newClass, setNewClass] = useState({ day: 'Lunes', subject: '', room: '', startTime: '08:00', endTime: '09:00' });
  const [newFolder, setNewFolder] = useState('');
  const [newFlashcard, setNewFlashcard] = useState({ question: '', answer: '', subject: '' });
  const [newSubject, setNewSubject] = useState('');

  // Pomodoro
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');

  // Flashcards
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // ==================== TEMA OSCURO ====================
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem(THEME_STORAGE_KEY, newMode ? 'dark' : 'light');
  };

  // ==================== PERSISTENCIA Y SINCRONIZACIÓN ====================

  // Carga inicial (una sola vez)
  const fetchData = useCallback(async () => {
    const loaded = await loadAppData();
    setData(prev => {
      if (JSON.stringify(prev) !== JSON.stringify(loaded)) {
        return loaded;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Suscripción en TIEMPO REAL (Firebase onSnapshot) o polling (localStorage)
  useEffect(() => {
    if (USE_CLOUD) {
      // Firebase: escuchar cambios en tiempo real
      const unsubscribe = subscribeToData((newData) => {
        setData(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(newData)) {
            return newData;
          }
          return prev;
        });
      });
      return () => unsubscribe();
    } else {
      // Modo local: polling cada SYNC_INTERVAL ms
      const interval = setInterval(fetchData, SYNC_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [fetchData]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const persistData = async (newData: AppData) => {
    setData(newData);
    await saveAppData(newData);
  };

  // ==================== POMODORO ====================
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (pomodoroRunning && pomodoroTime > 0) {
      interval = setInterval(() => setPomodoroTime(t => t - 1), 1000);
    } else if (pomodoroTime === 0) {
      setPomodoroRunning(false);
      if (pomodoroMode === 'work') {
        setPomodoroMode('break');
        setPomodoroTime(5 * 60);
      } else {
        setPomodoroMode('work');
        setPomodoroTime(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [pomodoroRunning, pomodoroTime, pomodoroMode]);

  // ==================== FUNCIONES CRUD ====================
  const addTask = () => {
    if (!newTask.text.trim()) return;
    const task: _Task = {
      id: Date.now().toString(),
      text: newTask.text,
      completed: false,
      category: newTask.category,
      subject: newTask.subject,
      dueDate: newTask.dueDate
    };
    persistData({ ...data, tasks: [...data.tasks, task] });
    setNewTask({ text: '', category: 'Tarea', subject: '', dueDate: '' });
    setShowTaskModal(false);
  };

  const toggleTask = (id: string) => {
    const tasks = data.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    persistData({ ...data, tasks });
  };

  const deleteTask = (id: string) => {
    persistData({ ...data, tasks: data.tasks.filter(t => t.id !== id) });
  };

  const addEvent = () => {
    if (!newEvent.title.trim() || !newEvent.date) return;
    const event: _Event = {
      id: Date.now().toString(),
      ...newEvent
    };
    persistData({ ...data, events: [...data.events, event] });
    setNewEvent({ title: '', date: '', type: 'Examen', subject: '' });
    setShowEventModal(false);
  };

  const deleteEvent = (id: string) => {
    persistData({ ...data, events: data.events.filter(e => e.id !== id) });
  };

  const addClass = () => {
    if (!newClass.subject.trim()) return;
    const classItem: _ScheduleItem = {
      id: Date.now().toString(),
      ...newClass
    };
    persistData({ ...data, schedule: [...data.schedule, classItem] });
    setNewClass({ day: 'Lunes', subject: '', room: '', startTime: '08:00', endTime: '09:00' });
    setShowAddClassModal(false);
  };

  const deleteClass = (id: string) => {
    persistData({ ...data, schedule: data.schedule.filter(s => s.id !== id) });
  };

  const addFolder = () => {
    if (!newFolder.trim()) return;
    const folder: _Folder = {
      id: Date.now().toString(),
      name: newFolder,
      color: folderColors[data.folders.length % folderColors.length],
      files: []
    };
    persistData({ ...data, folders: [...data.folders, folder] });
    setNewFolder('');
    setShowFolderModal(false);
  };

  const deleteFolder = (id: string) => {
    persistData({ ...data, folders: data.folders.filter(f => f.id !== id) });
  };

  const addFileToFolder = (folderId: string, file: _FileItem) => {
    const folders = data.folders.map(f =>
      f.id === folderId ? { ...f, files: [...f.files, file] } : f
    );
    persistData({ ...data, folders });
  };

  const deleteFileFromFolder = (folderId: string, fileId: string) => {
    const folders = data.folders.map(f =>
      f.id === folderId ? { ...f, files: f.files.filter(file => file.id !== fileId) } : f
    );
    persistData({ ...data, folders });
  };

  const addGeneralFile = (file: _FileItem) => {
    persistData({ ...data, generalFiles: [...data.generalFiles, file] });
  };

  const deleteGeneralFile = (id: string) => {
    persistData({ ...data, generalFiles: data.generalFiles.filter(f => f.id !== id) });
  };

  const addFlashcard = () => {
    if (!newFlashcard.question.trim() || !newFlashcard.answer.trim()) return;
    const card: _Flashcard = {
      id: Date.now().toString(),
      ...newFlashcard
    };
    persistData({ ...data, flashcards: [...data.flashcards, card] });
    setNewFlashcard({ question: '', answer: '', subject: '' });
    setShowFlashcardModal(false);
  };

  const deleteFlashcard = (id: string) => {
    const flashcards = data.flashcards.filter(f => f.id !== id);
    persistData({ ...data, flashcards });
    if (currentCardIndex >= flashcards.length) {
      setCurrentCardIndex(Math.max(0, flashcards.length - 1));
    }
  };

  const addSubject = () => {
    if (!newSubject.trim() || data.subjects.includes(newSubject)) return;
    persistData({ ...data, subjects: [...data.subjects, newSubject] });
    setNewSubject('');
    setShowSubjectModal(false);
  };

  const deleteSubject = (subject: string) => {
    persistData({ ...data, subjects: data.subjects.filter(s => s !== subject) });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, folderId?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileItem: _FileItem = {
          id: Date.now().toString(),
          name: file.name,
          type: 'image',
          url: event.target?.result as string
        };
        if (folderId) {
          addFileToFolder(folderId, fileItem);
        } else {
          addGeneralFile(fileItem);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Utilidades
  const getDayName = () => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[new Date().getDay()];
  };

  const getTodaySchedule = () => {
    return data.schedule.filter(s => s.day === getDayName()).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getDaysUntil = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const completedTasks = data.tasks.filter(t => t.completed).length;
  const pendingTasks = data.tasks.filter(t => !t.completed);
  const progress = data.tasks.length > 0 ? (completedTasks / data.tasks.length) * 100 : 0;

  // Clases dinámicas según el tema
  const theme = {
    bg: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    card: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100',
    cardAlt: darkMode ? 'bg-gray-700' : 'bg-gray-50',
    text: darkMode ? 'text-gray-100' : 'text-gray-800',
    textSecondary: darkMode ? 'text-gray-400' : 'text-gray-500',
    textMuted: darkMode ? 'text-gray-500' : 'text-gray-400',
    input: darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-100 text-gray-800',
    border: darkMode ? 'border-gray-700' : 'border-gray-100',
    header: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    nav: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    modal: darkMode ? 'bg-gray-800' : 'bg-white',
    hover: darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
  };

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // ==================== RENDERIZADO ====================
  const renderHome = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>¡Hola! 👋</h1>
          <p className={theme.textSecondary}>{getDayName()}, {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-1 text-green-500 text-xs">
              <Wifi size={14} />
              <span>Sincronizado</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-orange-500 text-xs">
              <WifiOff size={14} />
              <span>Sin conexión</span>
            </div>
          )}
        </div>
      </div>

      {/* Tarjeta principal */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-indigo-100 text-sm">Tareas pendientes</p>
            <p className="text-3xl font-bold">{pendingTasks.length}</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <CheckSquare size={24} />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progreso de hoy</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full">
            <div className="h-2 bg-white rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Próximo evento */}
      {data.events.length > 0 && (
        <div className={`rounded-xl p-4 shadow-sm border ${theme.card} hover:shadow-md transition-shadow duration-300`}>
          <h3 className={`font-semibold mb-2 ${theme.text}`}>📅 Próximo evento</h3>
          {(() => {
            const nextEvent = data.events
              .filter(e => getDaysUntil(e.date) >= 0)
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
            if (!nextEvent) return <p className={`text-sm ${theme.textMuted}`}>No hay eventos próximos</p>;
            const daysLeft = getDaysUntil(nextEvent.date);
            return (
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${theme.text}`}>{nextEvent.title}</p>
                  <p className={`text-sm ${theme.textSecondary}`}>{nextEvent.subject}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${daysLeft <= 3 ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                  {daysLeft === 0 ? '¡Hoy!' : daysLeft === 1 ? 'Mañana' : `${daysLeft} días`}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Horario de hoy */}
      <div className={`rounded-xl p-4 shadow-sm border ${theme.card} hover:shadow-md transition-shadow duration-300`}>
        <div className="flex justify-between items-center mb-3">
          <h3 className={`font-semibold ${theme.text}`}>📚 Horario de hoy</h3>
          <button onClick={() => setShowScheduleModal(true)} className={`${BTN} text-indigo-500 text-sm flex items-center gap-1 hover:text-indigo-400`}>
            <Settings size={14} /> Gestionar
          </button>
        </div>
        {getTodaySchedule().length > 0 ? (
          <div className="space-y-2">
            {getTodaySchedule().map(item => (
              <div key={item.id} className={`flex items-center gap-3 p-2 rounded-lg ${theme.cardAlt} hover:ring-1 hover:ring-indigo-300 transition-all duration-200`}>
                <div className={`text-xs w-16 ${theme.textSecondary}`}>{item.startTime}</div>
                <div className="flex-1">
                  <p className={`font-medium text-sm ${theme.text}`}>{item.subject}</p>
                  <p className={`text-xs ${theme.textMuted}`}>{item.room}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm text-center py-4 ${theme.textMuted}`}>No hay clases programadas para hoy</p>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setActiveTab('pomodoro')} className={`${BTN} rounded-xl p-4 text-center ${darkMode ? 'bg-red-900/30' : 'bg-red-50'} hover:shadow-md`}>
          <Timer className="mx-auto text-red-500 mb-1" size={24} />
          <span className={`text-xs ${theme.textSecondary}`}>Pomodoro</span>
        </button>
        <button onClick={() => setActiveTab('flashcards')} className={`${BTN} rounded-xl p-4 text-center ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'} hover:shadow-md`}>
          <Layers className="mx-auto text-purple-500 mb-1" size={24} />
          <span className={`text-xs ${theme.textSecondary}`}>Flashcards</span>
        </button>
      </div>

      {/* Info de sincronización */}
      <div className={`rounded-xl p-3 flex items-center gap-3 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
        {USE_CLOUD ? (
          <>
            <Cloud className="text-blue-500" size={20} />
            <div className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              <p className="font-medium">🔥 Firebase conectado</p>
              <p>Los cambios se sincronizan en tiempo real entre todos los usuarios</p>
            </div>
          </>
        ) : (
          <>
            <HardDrive className="text-blue-500" size={20} />
            <div className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              <p className="font-medium">Modo local</p>
              <p>Los datos se guardan en este navegador</p>
            </div>
          </>
        )}
      </div>

      {/* Badge de estado de Firebase */}
      <div className={`rounded-xl p-3 flex items-center gap-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <Users className={`${USE_CLOUD ? 'text-green-500' : 'text-gray-400'}`} size={20} />
        <div className={`text-xs ${theme.textSecondary}`}>
          <p className="font-medium">{USE_CLOUD ? '🟢 Firebase activo' : '⚪ Sin Firebase'}</p>
          <p>{USE_CLOUD ? 'Datos compartidos con todos los usuarios en tiempo real' : 'Configura Firebase en .env para compartir con amigos'}</p>
        </div>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className={`text-xl font-bold ${theme.text}`}>✅ Tareas</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowSubjectModal(true)} className={`${BTN} p-2 rounded-full ${darkMode ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-600'} hover:shadow-md`}>
            <BookOpen size={18} />
          </button>
          <button onClick={() => setShowTaskModal(true)} className={`${BTN} p-2 bg-indigo-500 rounded-full text-white hover:bg-indigo-600 hover:shadow-lg`}>
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className={`rounded-xl p-4 shadow-sm border ${theme.card}`}>
        <div className="flex justify-between text-sm mb-2">
          <span className={theme.textSecondary}>Completadas: {completedTasks}/{data.tasks.length}</span>
          <span className="font-medium text-indigo-500">{Math.round(progress)}%</span>
        </div>
        <div className={`h-3 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Lista de tareas */}
      {data.tasks.length > 0 ? (
        <div className="space-y-2">
          {data.tasks.map(task => (
            <div key={task.id} className={`rounded-xl p-4 shadow-sm border transition-all duration-300 hover:shadow-md ${task.completed ? (darkMode ? 'border-green-800 bg-green-900/20' : 'border-green-200 bg-green-50') : theme.card}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => toggleTask(task.id)} className={`${ICON_BTN} mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${task.completed ? 'bg-green-500 border-green-500' : (darkMode ? 'border-gray-500 hover:border-green-400' : 'border-gray-300 hover:border-green-500')}`}>
                  {task.completed && <span className="text-white text-xs">✓</span>}
                </button>
                <div className="flex-1">
                  <p className={`font-medium ${task.completed ? 'line-through text-gray-400' : theme.text}`}>{task.text}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${darkMode ? categoryColors[task.category]?.dark : categoryColors[task.category]?.light || 'bg-gray-100 text-gray-600'}`}>
                      {task.category}
                    </span>
                    {task.subject && <span className={`px-2 py-0.5 text-xs rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{task.subject}</span>}
                    {task.dueDate && <span className={`text-xs ${theme.textMuted}`}>{new Date(task.dueDate).toLocaleDateString('es-ES')}</span>}
                  </div>
                </div>
                <button onClick={() => deleteTask(task.id)} className={`${ICON_BTN} text-red-400 hover:text-red-600 p-1`}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`text-center py-8 ${theme.textMuted}`}>
          <CheckSquare size={48} className="mx-auto mb-2 opacity-50" />
          <p>No hay tareas. ¡Agrega una!</p>
        </div>
      )}
    </div>
  );

  const renderNotes = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className={`text-xl font-bold ${theme.text}`}>📝 Apuntes & Recursos</h2>
        <button onClick={() => setShowFolderModal(true)} className={`${BTN} p-2 bg-indigo-500 rounded-full text-white hover:bg-indigo-600 hover:shadow-lg`}>
          <FolderPlus size={18} />
        </button>
      </div>

      {/* Carpetas */}
      {data.folders.length > 0 && (
        <div className="space-y-2">
          {data.folders.map(folder => (
            <div key={folder.id} className={`rounded-xl shadow-sm border overflow-hidden ${theme.card} hover:shadow-md transition-shadow duration-300`}>
              <div
                className={`flex items-center justify-between p-4 cursor-pointer ${BTN}`}
                onClick={() => setExpandedFolders(prev =>
                  prev.includes(folder.id) ? prev.filter(id => id !== folder.id) : [...prev, folder.id]
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${folder.color} flex items-center justify-center`}>
                    <FileText size={20} className="text-white" />
                  </div>
                  <div>
                    <p className={`font-medium ${theme.text}`}>{folder.name}</p>
                    <p className={`text-xs ${theme.textMuted}`}>{folder.files.length} archivos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }} className={`${ICON_BTN} text-red-400 p-1 hover:text-red-600`}>
                    <Trash2 size={16} />
                  </button>
                  <ChevronRight size={20} className={`${theme.textMuted} transition-transform duration-300 ${expandedFolders.includes(folder.id) ? 'rotate-90' : ''}`} />
                </div>
              </div>

              {expandedFolders.includes(folder.id) && (
                <div className={`border-t p-4 ${darkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-100 bg-gray-50'}`}>
                  <label className={`${BTN} flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer mb-3 ${darkMode ? 'border-gray-600 hover:border-indigo-500' : 'border-gray-300 hover:border-indigo-400'}`}>
                    <Upload size={18} className={theme.textMuted} />
                    <span className={`text-sm ${theme.textSecondary}`}>Subir imagen</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, folder.id)} />
                  </label>
                  {folder.files.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {folder.files.map(file => (
                        <div key={file.id} className="relative group">
                          <img
                            src={file.url}
                            alt={file.name}
                            className={`${BTN} w-full h-20 object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-indigo-400`}
                            onClick={() => { setSelectedImage(file.url); setShowImageModal(true); }}
                          />
                          <button
                            onClick={() => deleteFileFromFolder(folder.id, file.id)}
                            className={`${ICON_BTN} absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100`}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-center text-sm ${theme.textMuted}`}>Sin archivos</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Archivos generales */}
      <div className={`rounded-xl p-4 shadow-sm border ${theme.card} hover:shadow-md transition-shadow duration-300`}>
        <h3 className={`font-semibold mb-3 ${theme.text}`}>📎 Archivos generales</h3>
        <label className={`${BTN} flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer mb-3 ${darkMode ? 'border-gray-600 hover:border-indigo-500' : 'border-gray-300 hover:border-indigo-400'}`}>
          <Upload size={20} className={theme.textMuted} />
          <span className={`text-sm ${theme.textSecondary}`}>Subir imagen</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e)} />
        </label>
        {data.generalFiles.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {data.generalFiles.map(file => (
              <div key={file.id} className="relative group">
                <img
                  src={file.url}
                  alt={file.name}
                  className={`${BTN} w-full h-20 object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-indigo-400`}
                  onClick={() => { setSelectedImage(file.url); setShowImageModal(true); }}
                />
                <button
                  onClick={() => deleteGeneralFile(file.id)}
                  className={`${ICON_BTN} absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-center text-sm py-2 ${theme.textMuted}`}>No hay archivos</p>
        )}
      </div>

      {data.folders.length === 0 && (
        <div className={`text-center py-4 ${theme.textMuted}`}>
          <FileText size={40} className="mx-auto mb-2 opacity-50" />
          <p>Crea carpetas para organizar tus apuntes</p>
        </div>
      )}
    </div>
  );

  const renderCalendar = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className={`text-xl font-bold ${theme.text}`}>📅 Calendario</h2>
        <button onClick={() => setShowEventModal(true)} className={`${BTN} p-2 bg-indigo-500 rounded-full text-white hover:bg-indigo-600 hover:shadow-lg`}>
          <Plus size={18} />
        </button>
      </div>

      {data.events.length > 0 ? (
        <div className="space-y-3">
          {data.events
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(event => {
              const daysLeft = getDaysUntil(event.date);
              const isPast = daysLeft < 0;
              const isUrgent = daysLeft >= 0 && daysLeft <= 3;

              return (
                <div key={event.id} className={`rounded-xl p-4 shadow-sm border transition-all duration-300 hover:shadow-md ${isPast ? 'opacity-60' : ''} ${isUrgent && !isPast ? (darkMode ? 'border-red-800' : 'border-red-200') : theme.card}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${
                        event.type === 'Examen' ? (darkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600') :
                        event.type === 'Entrega' ? (darkMode ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-100 text-orange-600') :
                        (darkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600')
                      }`}>
                        <span className="text-lg font-bold">{new Date(event.date).getDate()}</span>
                        <span className="text-xs">{new Date(event.date).toLocaleDateString('es-ES', { month: 'short' })}</span>
                      </div>
                      <div>
                        <p className={`font-medium ${theme.text}`}>{event.title}</p>
                        <p className={`text-sm ${theme.textSecondary}`}>{event.subject}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                          event.type === 'Examen' ? (darkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600') :
                          event.type === 'Entrega' ? (darkMode ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-100 text-orange-600') :
                          (darkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600')
                        }`}>{event.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isPast && (
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${isUrgent ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                          {daysLeft === 0 ? '¡Hoy!' : daysLeft === 1 ? 'Mañana' : `${daysLeft} días`}
                        </div>
                      )}
                      <button onClick={() => deleteEvent(event.id)} className={`${ICON_BTN} text-red-400 p-1 hover:text-red-600`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        <div className={`text-center py-8 ${theme.textMuted}`}>
          <Calendar size={48} className="mx-auto mb-2 opacity-50" />
          <p>No hay eventos. ¡Agrega uno!</p>
        </div>
      )}
    </div>
  );

  const renderPomodoro = () => (
    <div className="text-center space-y-6">
      <h2 className={`text-xl font-bold ${theme.text}`}>🍅 Pomodoro</h2>

      <div className={`w-64 h-64 mx-auto rounded-full flex items-center justify-center ${pomodoroMode === 'work' ? 'bg-gradient-to-br from-red-400 to-orange-500' : 'bg-gradient-to-br from-green-400 to-teal-500'} transition-all duration-500 hover:shadow-2xl`}>
        <div className={`w-56 h-56 rounded-full flex flex-col items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <p className={`text-5xl font-bold ${theme.text} tabular-nums`}>{formatTime(pomodoroTime)}</p>
          <p className={`text-sm mt-2 ${theme.textSecondary}`}>{pomodoroMode === 'work' ? 'Tiempo de estudio' : 'Descanso'}</p>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => setPomodoroRunning(!pomodoroRunning)}
          className={`${BTN} p-4 rounded-full text-white hover:shadow-xl ${pomodoroRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'}`}
        >
          {pomodoroRunning ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button
          onClick={() => {
            setPomodoroRunning(false);
            setPomodoroTime(pomodoroMode === 'work' ? 25 * 60 : 5 * 60);
          }}
          className={`${BTN} p-4 rounded-full hover:shadow-lg ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
        >
          <RotateCcw size={24} />
        </button>
      </div>

      <div className="flex justify-center gap-2">
        <button
          onClick={() => { setPomodoroMode('work'); setPomodoroTime(25 * 60); setPomodoroRunning(false); }}
          className={`${BTN} px-4 py-2 rounded-full text-sm ${pomodoroMode === 'work' ? 'bg-red-500 text-white hover:bg-red-600' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}
        >
          Trabajo (25m)
        </button>
        <button
          onClick={() => { setPomodoroMode('break'); setPomodoroTime(5 * 60); setPomodoroRunning(false); }}
          className={`${BTN} px-4 py-2 rounded-full text-sm ${pomodoroMode === 'break' ? 'bg-green-500 text-white hover:bg-green-600' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}
        >
          Descanso (5m)
        </button>
      </div>
    </div>
  );

  const renderFlashcards = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className={`text-xl font-bold ${theme.text}`}>🗂️ Flashcards</h2>
        <button onClick={() => setShowFlashcardModal(true)} className={`${BTN} p-2 bg-indigo-500 rounded-full text-white hover:bg-indigo-600 hover:shadow-lg`}>
          <Plus size={18} />
        </button>
      </div>

      {data.flashcards.length > 0 ? (
        <>
          <div
            onClick={() => setShowAnswer(!showAnswer)}
            className={`${BTN} min-h-[250px] bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white flex flex-col items-center justify-center cursor-pointer shadow-lg hover:shadow-2xl`}
          >
            <p className="text-xs uppercase tracking-wider mb-4 opacity-70">
              {showAnswer ? 'Respuesta' : 'Pregunta'} • {currentCardIndex + 1}/{data.flashcards.length}
            </p>
            <p className="text-xl font-medium text-center">
              {showAnswer ? data.flashcards[currentCardIndex]?.answer : data.flashcards[currentCardIndex]?.question}
            </p>
            {data.flashcards[currentCardIndex]?.subject && (
              <span className="mt-4 px-3 py-1 bg-white/20 rounded-full text-xs">
                {data.flashcards[currentCardIndex].subject}
              </span>
            )}
            <p className="text-xs mt-4 opacity-50">Toca para voltear</p>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => { setCurrentCardIndex(Math.max(0, currentCardIndex - 1)); setShowAnswer(false); }}
              disabled={currentCardIndex === 0}
              className={`${BTN} p-3 rounded-full disabled:opacity-30 disabled:hover:scale-100 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <ChevronLeft size={20} className={theme.text} />
            </button>
            <button
              onClick={() => deleteFlashcard(data.flashcards[currentCardIndex]?.id)}
              className={`${ICON_BTN} p-2 text-red-500 hover:text-red-400`}
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={() => { setCurrentCardIndex(Math.min(data.flashcards.length - 1, currentCardIndex + 1)); setShowAnswer(false); }}
              disabled={currentCardIndex === data.flashcards.length - 1}
              className={`${BTN} p-3 rounded-full disabled:opacity-30 disabled:hover:scale-100 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <ChevronRight size={20} className={theme.text} />
            </button>
          </div>
        </>
      ) : (
        <div className={`text-center py-8 ${theme.textMuted}`}>
          <Layers size={48} className="mx-auto mb-2 opacity-50" />
          <p>No hay flashcards. ¡Crea una!</p>
        </div>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-300`}>
      <div className={`max-w-md mx-auto min-h-screen pb-24 ${theme.bg}`}>
        {/* Header */}
        <div className={`px-4 py-3 flex justify-between items-center border-b sticky top-0 z-40 ${theme.header} transition-colors duration-300`}>
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            StudyMate
          </h1>
          <div className="flex gap-2">
            <button onClick={toggleDarkMode} className={`${BTN} p-2 rounded-full ${darkMode ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setActiveTab('pomodoro')} className={`${BTN} p-2 rounded-full ${darkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
              <Timer size={18} />
            </button>
            <button onClick={() => setActiveTab('flashcards')} className={`${BTN} p-2 rounded-full ${darkMode ? 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50' : 'bg-purple-50 text-purple-500 hover:bg-purple-100'}`}>
              <Layers size={18} />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4">
          {activeTab === 'home' && renderHome()}
          {activeTab === 'tasks' && renderTasks()}
          {activeTab === 'notes' && renderNotes()}
          {activeTab === 'calendar' && renderCalendar()}
          {activeTab === 'pomodoro' && renderPomodoro()}
          {activeTab === 'flashcards' && renderFlashcards()}
        </div>

        {/* Bottom Navigation */}
        <div className={`fixed bottom-0 left-0 right-0 border-t px-2 py-2 z-50 ${theme.nav} transition-colors duration-300`}>
          <div className="max-w-md mx-auto flex justify-around">
            {[
              { id: 'home', icon: Home, label: 'Inicio' },
              { id: 'tasks', icon: CheckSquare, label: 'Tareas' },
              { id: 'notes', icon: FileText, label: 'Apuntes' },
              { id: 'calendar', icon: Calendar, label: 'Fechas' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${BTN} flex flex-col items-center py-2 px-4 rounded-xl ${
                  activeTab === tab.id
                    ? `text-indigo-500 ${darkMode ? 'bg-indigo-500/15' : 'bg-indigo-50'} shadow-sm`
                    : `${theme.textMuted} hover:text-indigo-400`
                }`}
              >
                <tab.icon size={20} />
                <span className="text-xs mt-1">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== MODALES ==================== */}

      {/* Modal Nueva Tarea */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fade-in" onClick={() => setShowTaskModal(false)}>
          <div className={`w-full max-w-md rounded-t-3xl p-6 ${theme.modal} animate-slide-up`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${theme.text}`}>Nueva Tarea</h3>
              <button onClick={() => setShowTaskModal(false)} className={`${ICON_BTN} ${theme.textMuted} hover:text-red-400`}>
                <X size={20} />
              </button>
            </div>
            <input
              type="text"
              value={newTask.text}
              onChange={(e) => setNewTask({ ...newTask, text: e.target.value })}
              placeholder="Descripción de la tarea"
              className={`w-full px-4 py-3 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-200 ${theme.input}`}
            />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <select
                value={newTask.category}
                onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                className={`px-4 py-3 rounded-xl focus:outline-none transition-all duration-200 ${theme.input}`}
              >
                {taskCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select
                value={newTask.subject}
                onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                className={`px-4 py-3 rounded-xl focus:outline-none transition-all duration-200 ${theme.input}`}
              >
                <option value="">Materia</option>
                {data.subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl mb-4 focus:outline-none transition-all duration-200 ${theme.input}`}
            />
            <button onClick={addTask} className={`${BTN} w-full py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 hover:shadow-lg`}>
              Agregar Tarea
            </button>
          </div>
        </div>
      )}

      {/* Modal Nuevo Evento */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fade-in" onClick={() => setShowEventModal(false)}>
          <div className={`w-full max-w-md rounded-t-3xl p-6 ${theme.modal} animate-slide-up`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${theme.text}`}>Nuevo Evento</h3>
              <button onClick={() => setShowEventModal(false)} className={`${ICON_BTN} ${theme.textMuted} hover:text-red-400`}>
                <X size={20} />
              </button>
            </div>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              placeholder="Título del evento"
              className={`w-full px-4 py-3 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-200 ${theme.input}`}
            />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                className={`px-4 py-3 rounded-xl focus:outline-none transition-all duration-200 ${theme.input}`}
              >
                <option value="Examen">Examen</option>
                <option value="Entrega">Entrega</option>
                <option value="Evento">Evento</option>
                <option value="Exposición">Exposición</option>
                <option value="Práctica">Práctica</option>
              </select>
              <select
                value={newEvent.subject}
                onChange={(e) => setNewEvent({ ...newEvent, subject: e.target.value })}
                className={`px-4 py-3 rounded-xl focus:outline-none transition-all duration-200 ${theme.input}`}
              >
                <option value="">Materia</option>
                {data.subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
            <input
              type="date"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl mb-4 focus:outline-none transition-all duration-200 ${theme.input}`}
            />
            <button onClick={addEvent} className={`${BTN} w-full py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 hover:shadow-lg`}>
              Agregar Evento
            </button>
          </div>
        </div>
      )}

      {/* Modal Gestión de Horarios */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowScheduleModal(false)}>
          <div className={`w-full max-w-md rounded-2xl p-6 max-h-[80vh] overflow-y-auto ${theme.modal} animate-scale-in`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${theme.text}`}>Gestionar Horarios</h3>
              <button onClick={() => setShowScheduleModal(false)} className={`${ICON_BTN} ${theme.textMuted} hover:text-red-400`}>
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
              {days.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`${BTN} px-3 py-2 rounded-full text-sm whitespace-nowrap ${
                    selectedDay === day ? 'bg-indigo-500 text-white shadow-md' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="space-y-2 mb-4">
              {data.schedule
                .filter(s => s.day === selectedDay)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map(item => (
                  <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl ${theme.cardAlt} transition-all duration-200 hover:ring-1 hover:ring-indigo-300`}>
                    <div className="flex items-center gap-3">
                      <Clock size={16} className={theme.textMuted} />
                      <div>
                        <p className={`font-medium text-sm ${theme.text}`}>{item.subject}</p>
                        <p className={`text-xs ${theme.textMuted}`}>{item.startTime} - {item.endTime} • {item.room}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteClass(item.id)} className={`${ICON_BTN} text-red-400 p-1 hover:text-red-600`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              {data.schedule.filter(s => s.day === selectedDay).length === 0 && (
                <p className={`text-center text-sm py-4 ${theme.textMuted}`}>No hay clases para {selectedDay}</p>
              )}
            </div>

            <button
              onClick={() => { setNewClass({ ...newClass, day: selectedDay }); setShowAddClassModal(true); }}
              className={`${BTN} w-full py-3 bg-indigo-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-indigo-600 hover:shadow-lg`}
            >
              <Plus size={18} /> Agregar Clase
            </button>
          </div>
        </div>
      )}

      {/* Modal Agregar Clase */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fade-in" onClick={() => setShowAddClassModal(false)}>
          <div className={`w-full max-w-md rounded-t-3xl p-6 ${theme.modal} animate-slide-up`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${theme.text}`}>Nueva Clase</h3>
              <button onClick={() => setShowAddClassModal(false)} className={`${ICON_BTN} ${theme.textMuted} hover:text-red-400`}>
                <X size={20} />
              </button>
            </div>
            <select
              value={newClass.day}
              onChange={(e) => setNewClass({ ...newClass, day: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl mb-3 focus:outline-none transition-all duration-200 ${theme.input}`}
            >
              {days.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
            <select
              value={newClass.subject}
              onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl mb-3 focus:outline-none transition-all duration-200 ${theme.input}`}
            >
              <option value="">Seleccionar materia</option>
              {data.subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
            <input
              type="text"
              value={newClass.room}
              onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
              placeholder="Aula / Salón"
              className={`w-full px-4 py-3 rounded-xl mb-3 focus:outline-none transition-all duration-200 ${theme.input}`}
            />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className={`text-xs mb-1 block ${theme.textSecondary}`}>Inicio</label>
                <input
                  type="time"
                  value={newClass.startTime}
                  onChange={(e) => setNewClass({ ...newClass, startTime: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-all duration-200 ${theme.input}`}
                />
              </div>
              <div>
                <label className={`text-xs mb-1 block ${theme.textSecondary}`}>Fin</label>
                <input
                  type="time"
                  value={newClass.endTime}
                  onChange={(e) => setNewClass({ ...newClass, endTime: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-all duration-200 ${theme.input}`}
                />
              </div>
            </div>
            <button onClick={addClass} className={`${BTN} w-full py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 hover:shadow-lg`}>
              Agregar Clase
            </button>
          </div>
        </div>
      )}

      {/* Modal Nueva Carpeta */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowFolderModal(false)}>
          <div className={`w-full max-w-sm rounded-2xl p-6 ${theme.modal} animate-scale-in`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${theme.text}`}>Nueva Carpeta</h3>
              <button onClick={() => setShowFolderModal(false)} className={`${ICON_BTN} ${theme.textMuted} hover:text-red-400`}>
                <X size={20} />
              </button>
            </div>
            <input
              type="text"
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              placeholder="Nombre de la carpeta"
              className={`w-full px-4 py-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-200 ${theme.input}`}
            />
            <button onClick={addFolder} className={`${BTN} w-full py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 hover:shadow-lg`}>
              Crear Carpeta
            </button>
          </div>
        </div>
      )}

      {/* Modal Nueva Flashcard */}
      {showFlashcardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fade-in" onClick={() => setShowFlashcardModal(false)}>
          <div className={`w-full max-w-md rounded-t-3xl p-6 ${theme.modal} animate-slide-up`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${theme.text}`}>Nueva Flashcard</h3>
              <button onClick={() => setShowFlashcardModal(false)} className={`${ICON_BTN} ${theme.textMuted} hover:text-red-400`}>
                <X size={20} />
              </button>
            </div>
            <textarea
              value={newFlashcard.question}
              onChange={(e) => setNewFlashcard({ ...newFlashcard, question: e.target.value })}
              placeholder="Pregunta"
              rows={2}
              className={`w-full px-4 py-3 rounded-xl mb-3 focus:outline-none resize-none transition-all duration-200 ${theme.input}`}
            />
            <textarea
              value={newFlashcard.answer}
              onChange={(e) => setNewFlashcard({ ...newFlashcard, answer: e.target.value })}
              placeholder="Respuesta"
              rows={2}
              className={`w-full px-4 py-3 rounded-xl mb-3 focus:outline-none resize-none transition-all duration-200 ${theme.input}`}
            />
            <select
              value={newFlashcard.subject}
              onChange={(e) => setNewFlashcard({ ...newFlashcard, subject: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl mb-4 focus:outline-none transition-all duration-200 ${theme.input}`}
            >
              <option value="">Materia (opcional)</option>
              {data.subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
            <button onClick={addFlashcard} className={`${BTN} w-full py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 hover:shadow-lg`}>
              Crear Flashcard
            </button>
          </div>
        </div>
      )}

      {/* Modal Gestión de Materias */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowSubjectModal(false)}>
          <div className={`w-full max-w-md rounded-2xl p-6 max-h-[80vh] overflow-y-auto ${theme.modal} animate-scale-in`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${theme.text}`}>Gestionar Materias</h3>
              <button onClick={() => setShowSubjectModal(false)} className={`${ICON_BTN} ${theme.textMuted} hover:text-red-400`}>
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Nueva materia"
                className={`flex-1 px-4 py-2 rounded-xl focus:outline-none transition-all duration-200 ${theme.input}`}
              />
              <button onClick={addSubject} className={`${BTN} px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 hover:shadow-lg`}>
                <Plus size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {data.subjects.map(subject => (
                <div key={subject} className={`flex items-center justify-between p-3 rounded-xl ${theme.cardAlt} transition-all duration-200 hover:ring-1 hover:ring-indigo-300`}>
                  <span className={`text-sm ${theme.text}`}>{subject}</span>
                  <button onClick={() => deleteSubject(subject)} className={`${ICON_BTN} text-red-400 p-1 hover:text-red-600`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Imagen (Lightbox) */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowImageModal(false)}>
          <button className={`${ICON_BTN} absolute top-4 right-4 text-white p-2 hover:text-red-400`} onClick={() => setShowImageModal(false)}>
            <X size={24} />
          </button>
          <img src={selectedImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}
