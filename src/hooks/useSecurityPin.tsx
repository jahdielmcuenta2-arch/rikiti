// ============================================================
// PIN DE SEGURIDAD GLOBAL — desde variable de entorno
// ============================================================
// El PIN se configura SOLO en .env (VITE_SECURITY_PIN=1234)
// NO se puede cambiar desde la interfaz.
// Se pide CADA VEZ que se hace una acción protegida.
// ============================================================

import { useState, useCallback, useRef } from 'react';
import { Lock, X } from 'lucide-react';

const PIN_LENGTH = 4;

// Lee el PIN desde la variable de entorno de Vite
const CORRECT_PIN = import.meta.env.VITE_SECURITY_PIN || '';

// Clases de animación consistentes con la app
const BTN = 'transition-all duration-200 ease-out hover:scale-105 active:scale-95 focus:outline-none';
const ICON_BTN = 'transition-all duration-200 ease-out hover:scale-110 active:scale-90 focus:outline-none';

interface UseSecurityPinOptions {
  darkMode: boolean;
}

export function useSecurityPin({ darkMode }: UseSecurityPinOptions) {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [shakeAnim, setShakeAnim] = useState(false);

  // Guardamos la acción pendiente en un ref para ejecutarla tras validar
  const pendingAction = useRef<(() => void) | null>(null);

  // Tema dinámico
  const theme = {
    modal: darkMode ? 'bg-gray-800' : 'bg-white',
    text: darkMode ? 'text-gray-100' : 'text-gray-800',
    textSecondary: darkMode ? 'text-gray-400' : 'text-gray-500',
    textMuted: darkMode ? 'text-gray-500' : 'text-gray-400',
  };

  // ==================== FUNCIÓN PRINCIPAL ====================

  /**
   * Envuelve una acción sensible con protección por PIN.
   * Si NO hay PIN configurado en .env → ejecuta directamente (sin protección).
   * Si hay PIN → muestra modal para pedirlo CADA VEZ.
   */
  const runProtectedAction = useCallback((action: () => void) => {
    if (!CORRECT_PIN) {
      // No hay PIN en .env → ejecutar directamente sin bloqueo
      action();
      return;
    }
    // Guardar la acción y pedir PIN
    pendingAction.current = action;
    setPinInput('');
    setPinError('');
    setShakeAnim(false);
    setShowPinModal(true);
  }, []);

  // ==================== HANDLERS ====================

  function handleVerify() {
    if (pinInput.length !== PIN_LENGTH) {
      setPinError(`El PIN debe tener ${PIN_LENGTH} dígitos`);
      triggerShake();
      return;
    }
    if (pinInput === CORRECT_PIN) {
      // PIN correcto → ejecutar acción
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
      if (pendingAction.current) {
        pendingAction.current();
        pendingAction.current = null;
      }
    } else {
      // PIN incorrecto
      setPinError('PIN incorrecto');
      setPinInput('');
      triggerShake();
    }
  }

  function triggerShake() {
    setShakeAnim(true);
    setTimeout(() => setShakeAnim(false), 500);
  }

  function handleClose() {
    setShowPinModal(false);
    setPinInput('');
    setPinError('');
    pendingAction.current = null;
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleVerify();
  }

  function handleNumPress(num: number) {
    if (pinInput.length < PIN_LENGTH) {
      const newVal = pinInput + num.toString();
      setPinInput(newVal);
      setPinError('');

      // Auto-verificar cuando se completan los dígitos
      if (newVal.length === PIN_LENGTH) {
        setTimeout(() => {
          if (newVal === CORRECT_PIN) {
            setShowPinModal(false);
            setPinInput('');
            setPinError('');
            if (pendingAction.current) {
              pendingAction.current();
              pendingAction.current = null;
            }
          } else {
            setPinError('PIN incorrecto');
            setPinInput('');
            triggerShake();
          }
        }, 200);
      }
    }
  }

  // ==================== COMPONENTE VISUAL ====================

  const PinModal = showPinModal ? (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 animate-fade-in"
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-xs rounded-2xl p-6 ${theme.modal} animate-scale-in ${shakeAnim ? 'animate-shake' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-full ${darkMode ? 'bg-indigo-900/50' : 'bg-indigo-100'}`}>
              <Lock size={20} className="text-indigo-500" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${theme.text}`}>PIN requerido</h3>
              <p className={`text-xs ${theme.textMuted}`}>Ingresa el código para continuar</p>
            </div>
          </div>
          <button onClick={handleClose} className={`${ICON_BTN} ${theme.textMuted} hover:text-red-400`}>
            <X size={20} />
          </button>
        </div>

        {/* Dots indicadores */}
        <div className="flex justify-center gap-3 mb-6">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                pinInput[i]
                  ? 'bg-indigo-500 scale-110'
                  : (darkMode ? 'bg-gray-600' : 'bg-gray-200')
              }`}
            />
          ))}
        </div>

        {/* Input oculto para teclado nativo en móviles */}
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={pinInput}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH);
            setPinInput(val);
            setPinError('');
          }}
          onKeyDown={handleKeyDown}
          autoFocus
          className="opacity-0 absolute w-0 h-0"
        />

        {/* Teclado numérico */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, idx) => {
            if (key === null) return <div key={idx} />;
            if (key === 'del') {
              return (
                <button
                  key={idx}
                  onClick={() => { setPinInput(prev => prev.slice(0, -1)); setPinError(''); }}
                  className={`${BTN} py-3 rounded-xl text-lg font-medium ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  ←
                </button>
              );
            }
            return (
              <button
                key={idx}
                onClick={() => handleNumPress(key as number)}
                className={`${BTN} py-3 rounded-xl text-lg font-medium ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {key}
              </button>
            );
          })}
        </div>

        {/* Error */}
        {pinError && (
          <p className="text-red-500 text-sm text-center mb-3 animate-scale-in font-medium">
            🔒 {pinError}
          </p>
        )}

        {/* Botón cancelar */}
        <button
          onClick={handleClose}
          className={`${BTN} w-full py-3 rounded-xl font-medium ${darkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          Cancelar
        </button>
      </div>
    </div>
  ) : null;

  return {
    PinModal,
    runProtectedAction,
    isPinConfigured: !!CORRECT_PIN,
  };
}
