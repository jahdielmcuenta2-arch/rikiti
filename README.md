# 📚 StudyMate — Tu Compañero de Estudios

Aplicación web mobile-first para estudiantes, diseñada con interfaz tipo celular. Incluye gestión de tareas, horarios, calendario, apuntes, Pomodoro, flashcards y modo oscuro.

Pensada para compartir con amigos: todos los datos se sincronizan **en tiempo real** usando **Firebase Firestore**.

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|---|---|
| Framework | React 19 |
| Bundler | Vite 7 |
| Estilos | Tailwind CSS 4 |
| Iconos | Lucide React |
| Backend/DB | Firebase Firestore + Storage |
| Hosting | Vercel |
| Lenguaje | TypeScript |

---

## 📋 Requisitos previos

- **Node.js** 18 o superior — [descargar](https://nodejs.org/)
- **npm** 9 o superior (viene incluido con Node)
- Una cuenta de **Google** (para Firebase, gratuito)
- Una cuenta de **GitHub** (para subir el código)
- Una cuenta de **Vercel** (para hosting gratuito) — [vercel.com](https://vercel.com)

---

## 🔥 Paso 1: Crear proyecto en Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. Clic en **"Agregar proyecto"** (o "Add project")
3. Ponle un nombre (ej: `studymate`)
4. Desactiva Google Analytics si quieres (no lo necesitamos) → **Crear proyecto**
5. Espera a que se cree y haz clic en **Continuar**

### Crear la app web:
6. En la página principal del proyecto, haz clic en el ícono **Web** (`</>`)
7. Dale un nombre a la app (ej: `studymate-web`)
8. **NO marques** "Firebase Hosting" (usaremos Vercel)
9. Clic en **Registrar app**
10. Firebase te mostrará algo como esto:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "studymate-xxxxx.firebaseapp.com",
  projectId: "studymate-xxxxx",
  storageBucket: "studymate-xxxxx.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxxxxxxxxxxxxxxx"
};
```

11. **Copia estos valores** — los necesitarás en el paso 3

### Activar Firestore:
12. En el menú lateral de Firebase, ve a **Firestore Database**
13. Clic en **"Crear base de datos"** (o "Create database")
14. Selecciona **modo de prueba** ("Start in test mode") → esto permite leer/escribir sin autenticación (perfecto para el prototipo)
15. Elige una ubicación (la más cercana a ti) → **Habilitar**

### Activar Firebase Storage (para imágenes):
16. En el menú lateral de Firebase, ve a **Storage**
17. Clic en **"Comenzar"** (o "Get started")
18. Selecciona **modo de prueba** ("Start in test mode")
19. Elige la misma ubicación que Firestore → **Listo**

> ⚠️ **Importante**: El modo de prueba expira en 30 días. Cuando expire:
> - **Firestore** → Reglas → cambia a:
> ```
> rules_version = '2';
> service cloud.firestore {
>   match /databases/{database}/documents {
>     match /{document=**} {
>       allow read, write: if true;
>     }
>   }
> }
> ```
> - **Storage** → Reglas → cambia a:
> ```
> rules_version = '2';
> service firebase.storage {
>   match /b/{bucket}/o {
>     match /{allPaths=**} {
>       allow read, write: if true;
>     }
>   }
> }
> ```

---

## 🚀 Paso 2: Instalación en local

```bash
# 1. Clonar el repositorio
git clone <URL_DE_TU_REPO>
cd studymate

# 2. Instalar dependencias
npm install
```

---

## 🔑 Paso 3: Configurar variables de entorno

```bash
# 3. Crear archivo de variables de entorno
cp .env.example .env
```

Abre el archivo `.env` y pega los valores que copiaste de Firebase:

```env
VITE_FIREBASE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=studymate-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=studymate-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=studymate-xxxxx.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxxxxxxxxxxxxxxx
```

> **Nota**: En Vite, las variables de entorno del frontend **deben** empezar con `VITE_`.

### Archivo `.env` — ¿Dónde va?

```
studymate/
├── .env          ← AQUÍ (en la raíz del proyecto)
├── .env.example
├── package.json
├── ...
```

---

## 💻 Paso 4: Ejecutar en local

```bash
# 4. Levantar en modo desarrollo
npm run dev
```

Abre en el navegador: **http://localhost:5173**

Verás en la consola del navegador:
- `[StudyMate] ✅ Firebase conectado al proyecto: studymate-xxxxx` → todo bien
- `[StudyMate] ℹ️ Firebase no configurado — usando modo local` → las variables están vacías

Para compilar la versión de producción:

```bash
npm run build
# Los archivos listos se generan en la carpeta dist/
```

---

## 📤 Paso 5: Subir a GitHub

```bash
# Inicializar git (si aún no lo hiciste)
git init

# Asegúrate de que .env esté en .gitignore
echo ".env" >> .gitignore

# Agregar archivos
git add .
git commit -m "StudyMate - primera versión"

# Crear repositorio en GitHub y subir
# (ve a github.com → New repository → copia los comandos que te da)
git remote add origin https://github.com/TU_USUARIO/studymate.git
git branch -M main
git push -u origin main
```

> ⚠️ **NUNCA subas el archivo `.env`** a GitHub. Contiene tus claves de Firebase. El archivo `.env.example` sí se sube (no tiene valores reales).

---

## 🌐 Paso 6: Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub
2. Clic en **"Add New" → "Project"**
3. Selecciona tu repositorio `studymate`
4. Vercel detectará automáticamente que es un proyecto Vite
5. **Antes de hacer deploy**, configura las variables de entorno:
   - Clic en **"Environment Variables"**
   - Agrega las **6 variables** de Firebase, una por una:

| Nombre | Valor |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `studymate-xxxxx.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `studymate-xxxxx` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `studymate-xxxxx.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` |
| `VITE_FIREBASE_APP_ID` | `1:123456789:web:xx...` |

6. Clic en **"Deploy"**
7. Espera ~1 minuto
8. ¡Listo! Vercel te dará una URL tipo: `https://studymate-xxx.vercel.app`
9. **Comparte esa URL con tus amigos** 🎉

### Configuración de build (Vercel la detecta automáticamente):
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

---

## 📚 Lista de materias

Las materias están centralizadas en `src/config/subjects.ts`:

- Lengua Castellana
- Ed. Física
- Física
- Cálculo
- Geometría
- Ética y Rel.
- Filosofía
- Historia y Geografía
- Inglés
- Biología
- Artística
- Economía y Política
- Tecnología y Estadística
- Química

También puedes agregar o eliminar materias desde la propia app (botón 📖 en la pestaña Tareas).

---

## 📁 Estructura del proyecto

```
studymate/
├── .env.example              # Plantilla de variables de entorno
├── .gitignore                # Excluye .env y node_modules
├── README.md                 # Este archivo
├── index.html                # HTML base
├── package.json
├── vite.config.ts
├── src/
│   ├── main.tsx              # Punto de entrada React
│   ├── App.tsx               # Componente principal (toda la UI)
│   ├── index.css             # Tailwind + animaciones
│   ├── vite-env.d.ts         # Tipos para variables de entorno
│   ├── lib/
│   │   └── firebase.ts       # 🔥 Inicialización de Firebase (LEE DE .env)
│   ├── config/
│   │   ├── serverConfig.ts   # Constantes de la app
│   │   └── subjects.ts       # Lista centralizada de materias
│   ├── api/
│   │   └── client.ts         # Cliente de datos (Firestore + Storage / localStorage)
│   └── utils/
│       └── cn.ts             # Utilidad para clases CSS
```

### ¿Dónde está qué?

| Necesitas... | Archivo |
|---|---|
| Cambiar claves de Firebase | `.env` |
| Cambiar materias | `src/config/subjects.ts` |
| Cambiar nombre de colección Firestore | `src/config/serverConfig.ts` |
| Modificar cómo se leen/guardan datos | `src/api/client.ts` |
| Modificar la UI | `src/App.tsx` |

---

## ❓ Problemas comunes (FAQ)

### "La app dice 'Modo local' en vez de 'Firebase conectado'"
- Verifica que tu archivo `.env` tenga las 6 variables de Firebase con los valores correctos.
- Reinicia el servidor de desarrollo (`Ctrl+C` y vuelve a ejecutar `npm run dev`).
- Verifica que los nombres de las variables empiecen con `VITE_`.

### "Error: Missing or insufficient permissions"
- Ve a Firebase Console → Firestore → **Reglas**
- Asegúrate de que las reglas permitan lectura/escritura (ver sección de Firestore arriba).

### "Los datos no se guardan"
- **Modo local:** revisa que tu navegador no bloquee localStorage (modo incógnito puede bloquearlo).
- **Firebase:** abre la consola del navegador (F12) y busca errores con `[StudyMate]`.

### "Mis amigos no ven mis cambios"
- Asegúrate de que todos usen la **misma URL de Vercel**.
- Verifica que en Vercel las variables de entorno de Firebase estén correctas.
- Todos los usuarios comparten el mismo documento de Firestore automáticamente.

### "Las imágenes no se guardan en Firebase"
- Las imágenes se suben a **Firebase Storage** (no se guardan dentro de Firestore).
- Verifica que hayas **activado Firebase Storage** en la consola de Firebase (ver Paso 1).
- Si Storage no está activado, las imágenes se guardarán en base64 en localStorage (solo en tu navegador).
- Revisa las **reglas de Storage** (deben permitir lectura/escritura).

### "No me aparecen las materias nuevas"
- Si ya tenías datos guardados en localStorage, las materias antiguas pueden persistir.
- Borra los datos del navegador (`localStorage.clear()` en la consola) o elimínalas manualmente desde la app.

### "El deploy en Vercel falla"
- Verifica que hayas agregado **las 6 variables de entorno** en el panel de Vercel.
- Revisa los logs de build en Vercel para ver el error exacto.

### "¿Es seguro poner las claves de Firebase en el frontend?"
- Las claves de Firebase del frontend son **públicas por diseño** — solo identifican tu proyecto.
- La seguridad real está en las **reglas de Firestore** (quién puede leer/escribir).
- Para un proyecto escolar compartido con amigos, el modo de prueba es suficiente.

---

## 🔒 Buenas prácticas de seguridad

1. **Nunca subas `.env` a GitHub** — ya está en `.gitignore`
2. **Las claves de Firebase del frontend son públicas** — esto es normal y esperado
3. **Configura reglas de Firestore** adecuadas si la app será pública
4. **No almacenes información sensible** en los datos de la app

---

## 📄 Licencia

Proyecto de uso educativo. Libre de usar y modificar.
