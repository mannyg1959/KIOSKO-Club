# 🐧 GUÍA GIT BASH: Actualizar GitHub

## 🎯 ¿Qué es Git Bash?

Git Bash es una terminal de línea de comandos para Windows que emula un entorno Linux/Unix. Es la forma más popular de usar Git en Windows.

---

## 🚀 PROCESO COMPLETO CON GIT BASH

### **Paso 1: Abrir Git Bash**

**Opción A - Desde el Explorador de Windows:**
1. Navega a la carpeta: `d:\Google Antigravity App KIOSKO`
2. **Click derecho** en un espacio vacío
3. Selecciona **"Git Bash Here"**

**Opción B - Desde el menú de inicio:**
1. Busca "Git Bash" en el menú de inicio
2. Abre Git Bash
3. Navega a tu carpeta:
   ```bash
   cd /d/Google\ Antigravity\ App\ KIOSKO
   ```

---

### **Paso 2: Verificar que estás en la carpeta correcta**

```bash
pwd
```

**Deberías ver:**
```
/d/Google Antigravity App KIOSKO
```

---

### **Paso 3: Ver qué archivos cambiaste**

```bash
git status
```

**Verás algo como:**
```
On branch main
Changes not staged for commit:
  modified:   client/src/App.jsx
  modified:   client/src/index.css
```

---

### **Paso 4: Agregar los cambios**

```bash
git add .
```

**Alternativas:**
```bash
# Agregar un archivo específico
git add client/src/App.jsx

# Agregar todos los archivos .jsx
git add *.jsx

# Agregar toda la carpeta client
git add client/
```

---

### **Paso 5: Guardar los cambios (Commit)**

```bash
git commit -m "Descripción de tus cambios"
```

**Ejemplos:**
```bash
git commit -m "feat: Agregado filtro de búsqueda"
git commit -m "fix: Corregido error en login"
git commit -m "style: Mejorado diseño móvil"
```

---

### **Paso 6: Subir a GitHub (Push)**

```bash
git push origin main
```

**Verás algo como:**
```
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Delta compression using up to 8 threads
Compressing objects: 100% (3/3), done.
Writing objects: 100% (3/3), 1.23 KiB | 1.23 MiB/s, done.
Total 3 (delta 2), reused 0 (delta 0)
To https://github.com/mannyg1959/KIOSKO-Club.git
   1c0d8eb..05bd4ed  main -> main
```

---

## ⚡ COMANDO TODO-EN-UNO

Puedes ejecutar los 3 comandos en una sola línea:

```bash
git add . && git commit -m "Descripción de cambios" && git push origin main
```

**Ejemplo:**
```bash
git add . && git commit -m "Actualizado diseño responsive" && git push origin main
```

---

## 🎨 DIFERENCIAS: Git Bash vs PowerShell

| Característica | Git Bash | PowerShell |
|---------------|----------|------------|
| **Rutas** | `/d/carpeta` | `d:\carpeta` |
| **Comandos** | Linux (ls, pwd, cat) | Windows (dir, cd) |
| **Colores** | ✅ Más colorido | ⚠️ Básico |
| **Autocompletado** | ✅ Tab funciona mejor | ✅ Tab funciona |
| **Integración** | ✅ Click derecho | ❌ Manual |

---

## 📋 COMANDOS ÚTILES EN GIT BASH

### **Navegación:**
```bash
# Ver carpeta actual
pwd

# Listar archivos
ls

# Listar archivos con detalles
ls -la

# Cambiar de carpeta
cd /d/Google\ Antigravity\ App\ KIOSKO

# Volver a la carpeta anterior
cd -

# Ir a la carpeta home
cd ~
```

### **Git:**
```bash
# Ver estado
git status

# Ver historial
git log

# Ver historial resumido
git log --oneline

# Ver últimos 5 commits
git log -5

# Ver diferencias
git diff

# Ver ramas
git branch

# Ver configuración
git config --list
```

### **Archivos:**
```bash
# Ver contenido de un archivo
cat README.md

# Crear archivo
touch nuevo-archivo.txt

# Crear carpeta
mkdir nueva-carpeta

# Eliminar archivo
rm archivo.txt

# Copiar archivo
cp origen.txt destino.txt
```

---

## 🎯 FLUJO DE TRABAJO COMPLETO

### **1. Abrir Git Bash en tu proyecto**
```bash
# Click derecho en la carpeta -> "Git Bash Here"
```

### **2. Verificar estado**
```bash
git status
```

### **3. Ver qué cambiaste**
```bash
git diff
```

### **4. Agregar, Commit y Push**
```bash
git add .
git commit -m "Descripción clara de cambios"
git push origin main
```

### **5. Verificar en GitHub**
- Ve a: https://github.com/mannyg1959/KIOSKO-Club
- Verifica que tus cambios estén ahí

### **6. Esperar a Vercel**
- Espera 2-3 minutos
- Verifica tu aplicación en Vercel

---

## 🔧 CONFIGURACIÓN INICIAL (Solo una vez)

### **Configurar tu identidad:**
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"
```

### **Verificar configuración:**
```bash
git config --global --list
```

### **Configurar editor (opcional):**
```bash
# Usar Nano (más fácil)
git config --global core.editor nano

# Usar Vim
git config --global core.editor vim

# Usar VS Code
git config --global core.editor "code --wait"
```

---

## 🎨 PERSONALIZAR GIT BASH

### **Colores en Git:**
```bash
git config --global color.ui auto
```

### **Alias útiles:**
```bash
# Crear atajos
git config --global alias.st status
git config --global alias.co commit
git config --global alias.br branch
git config --global alias.lg "log --oneline --graph --all"

# Ahora puedes usar:
git st      # en vez de git status
git lg      # para ver historial gráfico
```

---

## 📝 SCRIPT BASH PARA ACTUALIZAR RÁPIDO

Crea un archivo `actualizar.sh` en la raíz del proyecto:

```bash
#!/bin/bash

echo "========================================"
echo "  Actualizando GitHub - KIOSKO Club"
echo "========================================"
echo ""

# Pedir mensaje de commit
read -p "Describe tus cambios: " mensaje

echo ""
echo "Agregando archivos..."
git add .

echo "Guardando cambios..."
git commit -m "$mensaje"

echo "Subiendo a GitHub..."
git push origin main

echo ""
echo "========================================"
echo "  ✅ Cambios subidos exitosamente!"
echo "  Vercel actualizará en 2-3 minutos"
echo "========================================"
echo ""
```

### **Hacer el script ejecutable:**
```bash
chmod +x actualizar.sh
```

### **Usar el script:**
```bash
./actualizar.sh
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS EN GIT BASH

### **Error: "Permission denied (publickey)"**

**Solución - Configurar SSH:**
```bash
# Generar clave SSH
ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"

# Copiar la clave pública
cat ~/.ssh/id_ed25519.pub

# Agregar la clave en GitHub:
# Settings -> SSH and GPG keys -> New SSH key
```

**O usar HTTPS en vez de SSH:**
```bash
git remote set-url origin https://github.com/mannyg1959/KIOSKO-Club.git
```

---

### **Error: "Updates were rejected"**

```bash
# Descargar cambios primero
git pull origin main

# Luego subir
git push origin main
```

---

### **Error: "Please tell me who you are"**

```bash
git config --global user.email "tu-email@ejemplo.com"
git config --global user.name "Tu Nombre"
```

---

### **Deshacer el último commit (sin perder cambios):**

```bash
git reset --soft HEAD~1
```

---

### **Deshacer cambios en un archivo:**

```bash
git checkout -- nombre-archivo.jsx
```

---

### **Ver quién modificó cada línea:**

```bash
git blame client/src/App.jsx
```

---

## 🎓 COMANDOS AVANZADOS

### **Descargar cambios de GitHub:**
```bash
git pull origin main
```

### **Ver ramas:**
```bash
git branch -a
```

### **Crear una rama nueva:**
```bash
git checkout -b nueva-funcionalidad
```

### **Cambiar de rama:**
```bash
git checkout main
```

### **Ver diferencias entre commits:**
```bash
git diff HEAD~1 HEAD
```

### **Buscar en el historial:**
```bash
git log --grep="búsqueda"
```

### **Ver archivos en un commit específico:**
```bash
git show abc123:client/src/App.jsx
```

---

## 📊 ATAJOS DE TECLADO EN GIT BASH

| Atajo | Función |
|-------|---------|
| `Tab` | Autocompletar |
| `Ctrl + C` | Cancelar comando |
| `Ctrl + L` | Limpiar pantalla |
| `Ctrl + R` | Buscar en historial |
| `Ctrl + A` | Ir al inicio de línea |
| `Ctrl + E` | Ir al final de línea |
| `Ctrl + U` | Borrar línea |
| `↑` / `↓` | Navegar historial |

---

## 🎯 EJEMPLO COMPLETO PASO A PASO

```bash
# 1. Abrir Git Bash en la carpeta del proyecto
# (Click derecho -> Git Bash Here)

# 2. Verificar carpeta actual
pwd
# Salida: /d/Google Antigravity App KIOSKO

# 3. Ver qué archivos cambiaste
git status
# Salida: modified: client/src/Home.jsx

# 4. Ver las diferencias
git diff client/src/Home.jsx

# 5. Agregar los cambios
git add .

# 6. Verificar que se agregaron
git status
# Salida: Changes to be committed...

# 7. Hacer commit
git commit -m "Agregada sección de estadísticas en Home"

# 8. Subir a GitHub
git push origin main

# 9. Ver el resultado
git log -1
```

---

## 🔄 WORKFLOW DIARIO RECOMENDADO

### **Al Empezar el Día:**
```bash
cd /d/Google\ Antigravity\ App\ KIOSKO
git pull origin main
```

### **Mientras Trabajas:**
```bash
# Guarda frecuentemente
git add .
git commit -m "Descripción del progreso"
```

### **Al Terminar el Día:**
```bash
git push origin main
```

---

## 📚 RECURSOS ADICIONALES

### **Cheat Sheets:**
- [Git Bash Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Linux Commands](https://www.linuxtrainingacademy.com/linux-commands-cheat-sheet/)

### **Documentación:**
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)

---

## ✅ RESUMEN RÁPIDO

### **Comandos Esenciales:**
```bash
# Navegar
cd /d/Google\ Antigravity\ App\ KIOSKO

# Actualizar GitHub
git add .
git commit -m "Mensaje descriptivo"
git push origin main

# Ver estado
git status
git log --oneline
```

### **Todo en una línea:**
```bash
git add . && git commit -m "Tus cambios" && git push origin main
```

---

## 🎉 VENTAJAS DE GIT BASH

✅ **Colores y formato** más claro  
✅ **Autocompletado** con Tab funciona mejor  
✅ **Comandos Linux** familiares  
✅ **Click derecho** para abrir en cualquier carpeta  
✅ **Copy/Paste** más fácil (Shift + Insert)  
✅ **Historial** de comandos persistente  
✅ **Scripts Bash** (.sh) funcionan nativamente  

---

**Fecha de Creación:** 17 de Enero, 2026  
**Versión:** 1.0.0  
**Para:** KIOSKO Club - Git Bash Users

---

💡 **Tip Final:** Git Bash es más poderoso que PowerShell para Git. ¡Aprovecha los comandos Linux y los colores para trabajar más eficientemente!
