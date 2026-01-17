# Scripts Batch para el Proyecto

Este proyecto incluye varios scripts batch (`.bat`) para facilitar el desarrollo sin problemas de permisos de PowerShell.

## Scripts Disponibles

### 🚀 `dev.bat` - Servidor de Desarrollo
Inicia el servidor de desarrollo de Vite.

**Uso:**
```bash
dev.bat
```

- Abre automáticamente el servidor en `http://localhost:5173`
- Hot reload activado (los cambios se reflejan automáticamente)
- Presiona `Ctrl+C` para detener el servidor

---

### 📦 `build.bat` - Build de Producción
Construye la aplicación optimizada para producción.

**Uso:**
```bash
build.bat
```

- Genera los archivos optimizados en la carpeta `dist/`
- Minifica y optimiza el código
- Listo para desplegar en producción

---

### 👁️ `preview.bat` - Vista Previa de Producción
Previsualiza la build de producción localmente.

**Uso:**
```bash
preview.bat
```

- **Nota:** Debes ejecutar `build.bat` primero
- Sirve los archivos de la carpeta `dist/`
- Útil para probar la versión de producción antes de desplegar

---

### 📥 `install.bat` - Instalar Dependencias
Instala todas las dependencias del proyecto.

**Uso:**
```bash
install.bat
```

- Ejecuta `npm install`
- Útil después de clonar el repositorio o actualizar `package.json`

---

## Solución de Problemas

### ¿Por qué usar archivos .bat?

En Windows, cuando la ejecución de scripts de PowerShell está deshabilitada, `npm` no puede ejecutarse correctamente. Estos scripts batch evitan ese problema ejecutando los comandos directamente con Node.js.

### ¿Puedo seguir usando npm?

Sí, si habilitas la ejecución de scripts en PowerShell:

1. Abre PowerShell como **Administrador**
2. Ejecuta: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Luego podrás usar `npm run dev`, `npm run build`, etc.

### El servidor no inicia

1. Verifica que las dependencias estén instaladas: ejecuta `install.bat`
2. Asegúrate de que el puerto 5173 no esté en uso
3. Revisa que Node.js esté instalado: `node --version`

---

## Estructura del Proyecto

```
client/
├── dev.bat           # Inicia servidor de desarrollo
├── build.bat         # Construye para producción
├── preview.bat       # Previsualiza build de producción
├── install.bat       # Instala dependencias
├── package.json      # Configuración del proyecto
├── vite.config.js    # Configuración de Vite
└── src/              # Código fuente
```

---

## Comandos Equivalentes

| Script Batch | Comando npm | Descripción |
|-------------|-------------|-------------|
| `dev.bat` | `npm run dev` | Servidor de desarrollo |
| `build.bat` | `npm run build` | Build de producción |
| `preview.bat` | `npm run preview` | Vista previa |
| `install.bat` | `npm install` | Instalar dependencias |

---

**¡Feliz desarrollo! 🎉**
