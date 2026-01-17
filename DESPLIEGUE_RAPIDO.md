# 🚀 DESPLIEGUE RÁPIDO EN VERCEL - GUÍA EXPRESS

## ⚡ Pasos Rápidos (5 minutos)

### 1️⃣ Preparar Credenciales de Supabase

Ve a https://app.supabase.com → Tu Proyecto → Settings → API

Copia estos dos valores:
```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 2️⃣ Opción A: Despliegue desde Vercel Dashboard (MÁS FÁCIL)

1. **Ve a https://vercel.com** → Sign Up/Login

2. **Sube tu carpeta `client`:**
   - Click en "Add New..." → "Project"
   - Click en "Browse" o arrastra la carpeta `client`
   - O conecta con GitHub (ver abajo)

3. **Configuración:**
   ```
   Framework: Vite
   Root Directory: ./
   Build Command: npm run build
   Output Directory: dist
   ```

4. **Variables de Entorno:**
   Click en "Environment Variables" → Agregar:
   ```
   VITE_SUPABASE_URL = https://xxxxx.supabase.co
   VITE_SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

5. **Deploy** → ¡Listo! 🎉

---

### 2️⃣ Opción B: Despliegue con GitHub (RECOMENDADO)

#### Paso 1: Subir a GitHub

```bash
cd "d:\Google Antigravity App KIOSKO\client"
git init
git add .
git commit -m "Initial commit"
```

Crea un repo en https://github.com/new → Luego:

```bash
git remote add origin https://github.com/TU-USUARIO/kiosko-app.git
git branch -M main
git push -u origin main
```

#### Paso 2: Conectar con Vercel

1. Ve a https://vercel.com
2. Click "Add New..." → "Project"
3. Selecciona tu repo de GitHub
4. Configura:
   ```
   Framework: Vite
   Root Directory: ./
   Build Command: npm run build
   Output Directory: dist
   ```
5. Agrega variables de entorno (paso 4 de Opción A)
6. Deploy → ¡Listo! 🎉

---

## 🐛 ¿Error "Page Not Found"?

✅ **Ya está solucionado** - El archivo `vercel.json` ya está creado en tu proyecto.

Si aún tienes el error:
1. Ve a tu proyecto en Vercel
2. Settings → General → Root Directory
3. Asegúrate que sea `./` o `.`
4. Redeploy

---

## 🔑 Variables de Entorno en Vercel

**Dónde agregarlas:**
Vercel Dashboard → Tu Proyecto → Settings → Environment Variables

**Qué agregar:**
```
Name: VITE_SUPABASE_URL
Value: [Tu URL de Supabase]

Name: VITE_SUPABASE_KEY
Value: [Tu Anon Key de Supabase]
```

**Después de agregar:**
- Ve a Deployments
- Click en los 3 puntos del último deployment
- Click "Redeploy"

---

## ✅ Verificación Rápida

Después del despliegue, verifica:

1. **URL funciona:** https://tu-proyecto.vercel.app
2. **Login funciona:** Prueba iniciar sesión
3. **Supabase conecta:** Verifica que carguen datos

---

## 📁 Archivos Creados para Ti

Ya creé estos archivos en tu proyecto:

- ✅ `vercel.json` - Configuración de rutas
- ✅ `.gitignore` - Archivos a ignorar
- ✅ `.env.example` - Plantilla de variables
- ✅ `GUIA_DESPLIEGUE_VERCEL.md` - Guía completa

---

## 🆘 Solución Rápida de Problemas

### Error: Build Failed
```bash
# Prueba el build localmente primero
cd "d:\Google Antigravity App KIOSKO\client"
npm install
npm run build
```

### Error: Supabase no conecta
- Verifica que las variables empiecen con `VITE_`
- Copia exactamente desde Supabase Dashboard
- Redeploy después de agregar variables

### Error: 404 en rutas
- Verifica que `vercel.json` exista
- Root Directory debe ser `./`
- Redeploy

---

## 🎯 Próximos Pasos

1. **Desplegar** siguiendo los pasos de arriba
2. **Probar** la URL que te da Vercel
3. **Compartir** la URL con tu equipo
4. **Opcional:** Configurar dominio personalizado en Vercel

---

## 📞 ¿Necesitas Ayuda?

Si tienes algún error específico, avísame y te ayudo a solucionarlo.

**Documentación completa:** Ver `GUIA_DESPLIEGUE_VERCEL.md`

---

¡Buena suerte con tu despliegue! 🚀
