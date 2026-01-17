# Instrucciones para Aplicar la Migración

## Opción 1: Usando el SQL Editor de Supabase (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. En el menú lateral, haz clic en **SQL Editor**
3. Crea una nueva query
4. Copia y pega el siguiente código SQL:

```sql
-- Add email column to clients table if it doesn't exist
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for email lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);

-- Add comment to the column
COMMENT ON COLUMN public.clients.email IS 'Email address of the client, can be used for login';
```

5. Haz clic en **Run** o presiona `Ctrl+Enter`
6. Verifica que la migración se ejecutó correctamente (debería mostrar "Success")

## Opción 2: Verificar si la columna ya existe

Si no estás seguro si la columna `email` ya existe en la tabla `clients`, puedes ejecutar esta consulta primero:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'clients';
```

Esto te mostrará todas las columnas de la tabla `clients`. Si ves `email` en la lista, la migración no es necesaria.

## Opción 3: Usando Supabase CLI (Avanzado)

Si tienes Supabase CLI instalado:

```bash
# Navega a la carpeta del proyecto
cd "d:\Google Antigravity App KIOSKO"

# Aplica la migración
supabase db push

# O ejecuta el archivo SQL directamente
supabase db execute --file migrations/03_add_email_to_clients.sql
```

## Verificación

Después de aplicar la migración, verifica que funcionó:

```sql
-- Debe mostrar la columna email
SELECT * FROM public.clients LIMIT 1;
```

## Troubleshooting

### Error: "column already exists"
- No te preocupes, esto significa que la columna ya existe
- La migración usa `IF NOT EXISTS` para evitar este error
- Puedes continuar sin problemas

### Error: "permission denied"
- Asegúrate de estar conectado como propietario del proyecto
- Verifica que tienes permisos de administrador en Supabase

### La columna no aparece
- Refresca el navegador
- Verifica que estás viendo la tabla correcta (`public.clients`)
- Revisa los logs de error en Supabase

## Siguiente Paso

Una vez aplicada la migración, reinicia tu aplicación para que los cambios tomen efecto:

```bash
# Si estás en la carpeta client
npm run dev
```
