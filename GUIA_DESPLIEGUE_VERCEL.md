# 🚀 Guía de Despliegue en Vercel

## 📋 Requisitos Previos

- ✅ Cuenta en [Vercel](https://vercel.com)
- ✅ Cuenta en [GitHub](https://github.com) (recomendado)
- ✅ Proyecto de Supabase configurado
- ✅ Variables de entorno de Supabase

---

## 🎯 Opción 1: Despliegue desde GitHub (Recomendado)

### Paso 1: Subir el Proyecto a GitHub

1. **Crear un repositorio en GitHub:**
   - Ve a https://github.com/new
   - Nombre: `kiosko-app` (o el que prefieras)
   - Visibilidad: Privado (recomendado)
   - Click en "Create repository"

2. **Inicializar Git en tu proyecto:**
   ```bash
   cd "d:\Google Antigravity App KIOSKO\client"
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. **Conectar con GitHub:**
   ```bash
   git remote add origin https://github.com/TU-USUARIO/kiosko-app.git
   git branch -M main
   git push -u origin main
   ```

### Paso 2: Conectar Vercel con GitHub

1. **Ve a Vercel:**
   - Visita https://vercel.com
   - Haz clic en "Sign Up" o "Log In"
   - Autoriza con GitHub

2. **Importar Proyecto:**
   - Click en "Add New..." → "Project"
   - Selecciona tu repositorio `kiosko-app`
   - Click en "Import"

3. **Configurar el Proyecto:**
   ```
   Framework Preset: Vite
   Root Directory: ./client (si tu código está en la carpeta client)
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Agregar Variables de Entorno:**
   - En "Environment Variables" agrega:
     ```
     VITE_SUPABASE_URL = https://tu-proyecto.supabase.co
     VITE_SUPABASE_KEY = tu-anon-key-aqui
     ```
   - ⚠️ **IMPORTANTE:** Obtén estos valores de tu proyecto en Supabase

5. **Deploy:**
   - Click en "Deploy"
   - Espera 2-3 minutos
   - ¡Listo! 🎉

---

## 🎯 Opción 2: Despliegue Directo (Sin GitHub)

### Paso 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Paso 2: Login en Vercel

```bash
vercel login
```

### Paso 3: Desplegar

```bash
cd "d:\Google Antigravity App KIOSKO\client"
vercel
```

Sigue las instrucciones:
- Set up and deploy? **Y**
- Which scope? Selecciona tu cuenta
- Link to existing project? **N**
- What's your project's name? `kiosko-app`
- In which directory is your code located? `./`
- Want to override settings? **Y**
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Development Command: `npm run dev`

### Paso 4: Configurar Variables de Entorno

```bash
vercel env add VITE_SUPABASE_URL
# Pega tu URL de Supabase

vercel env add VITE_SUPABASE_KEY
# Pega tu Anon Key de Supabase
```

### Paso 5: Re-desplegar con Variables

```bash
vercel --prod
```

---

## 🔧 Configuración de Variables de Entorno en Vercel

### Obtener Credenciales de Supabase:

1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_KEY`

### Agregar en Vercel (Interfaz Web):

1. Ve a tu proyecto en Vercel
2. Click en **Settings** → **Environment Variables**
3. Agrega cada variable:
   ```
   Name: VITE_SUPABASE_URL
   Value: https://xxxxx.supabase.co
   
   Name: VITE_SUPABASE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Click en **Save**
5. Ve a **Deployments** → Click en los 3 puntos del último deployment → **Redeploy**

---

## 🐛 Solución de Problemas Comunes

### Error: "Page Not Found" o 404

**Causa:** Vercel no está manejando correctamente las rutas de React Router.

**Solución:**
- ✅ Verifica que existe el archivo `vercel.json` en la carpeta `client`
- ✅ El archivo debe contener:
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```

### Error: "Supabase is not defined" o errores de conexión

**Causa:** Variables de entorno no configuradas.

**Solución:**
1. Verifica que las variables estén en Vercel:
   - Settings → Environment Variables
2. Asegúrate que empiecen con `VITE_`
3. Re-despliega el proyecto

### Error de Build

**Causa:** Dependencias faltantes o errores en el código.

**Solución:**
1. Verifica que `package.json` tenga todas las dependencias
2. Prueba el build localmente:
   ```bash
   npm run build
   ```
3. Si funciona localmente, re-despliega en Vercel

### La aplicación carga pero no se conecta a Supabase

**Causa:** Variables de entorno incorrectas.

**Solución:**
1. Verifica en Supabase Dashboard:
   - Settings → API
   - Copia exactamente la URL y la Key
2. Actualiza las variables en Vercel
3. Re-despliega

---

## 📁 Estructura de Archivos Necesaria

```
client/
├── dist/                  # Generado por build (no subir a Git)
├── node_modules/          # Dependencias (no subir a Git)
├── public/               # Archivos estáticos
├── src/                  # Código fuente
├── .env                  # Variables locales (no subir a Git)
├── .env.example          # Plantilla de variables ✅
├── .gitignore            # Archivos a ignorar ✅
├── index.html            # HTML principal
├── package.json          # Dependencias ✅
├── vercel.json           # Configuración de Vercel ✅
└── vite.config.js        # Configuración de Vite
```

---

## ✅ Checklist de Despliegue

Antes de desplegar, verifica:

- [ ] Archivo `vercel.json` creado
- [ ] Archivo `.gitignore` actualizado
- [ ] Variables de entorno de Supabase obtenidas
- [ ] Build funciona localmente (`npm run build`)
- [ ] Proyecto subido a GitHub (Opción 1) o Vercel CLI instalado (Opción 2)
- [ ] Variables de entorno configuradas en Vercel
- [ ] Primer despliegue exitoso
- [ ] Aplicación accesible desde la URL de Vercel
- [ ] Login funciona correctamente
- [ ] Conexión a Supabase funciona

---

## 🔄 Actualizaciones Futuras

### Con GitHub (Automático):
1. Haz cambios en tu código
2. Commit y push:
   ```bash
   git add .
   git commit -m "Descripción del cambio"
   git push
   ```
3. Vercel despliega automáticamente ✨

### Sin GitHub (Manual):
```bash
vercel --prod
```

---

## 🌐 URL de tu Aplicación

Después del despliegue, tu aplicación estará disponible en:
```
https://kiosko-app-xxxxx.vercel.app
```

Puedes configurar un dominio personalizado en:
**Vercel Dashboard → Settings → Domains**

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Vercel Dashboard → Deployments → View Function Logs
2. Verifica las variables de entorno
3. Prueba el build localmente primero
4. Consulta la documentación de Vercel: https://vercel.com/docs

---

## 🎉 ¡Felicidades!

Tu aplicación KioskoApp ahora está desplegada en Vercel y accesible desde cualquier lugar del mundo.

**Próximos pasos:**
- Comparte la URL con tu equipo
- Configura un dominio personalizado (opcional)
- Monitorea el uso en Vercel Analytics
- Mantén tu código actualizado en GitHub

---

**Creado:** 2026-01-17  
**Versión:** 1.0
