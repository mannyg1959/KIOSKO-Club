import { supabase } from './supabase';

/**
 * Ejecuta una consulta de Supabase con reintentos automáticos y timeout
 * @param {Function} queryFn - Función que retorna la consulta de Supabase
 * @param {Object} options - Opciones de configuración
 * @returns {Promise} - Resultado de la consulta
 */
export const executeWithRetry = async (queryFn, options = {}) => {
    const {
        maxRetries = 3,
        retryDelay = 1000,
        timeout = 10000,
        onError = null
    } = options;

    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            // Crear una promesa con timeout
            const queryPromise = queryFn();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Query timeout')), timeout)
            );

            // Ejecutar la consulta con timeout
            const result = await Promise.race([queryPromise, timeoutPromise]);

            // Verificar si hay error en la respuesta
            if (result.error) {
                throw result.error;
            }

            // Si llegamos aquí, la consulta fue exitosa
            return result;

        } catch (error) {
            lastError = error;
            console.error(`Intento ${attempt + 1}/${maxRetries} falló:`, error.message);

            // Si es el último intento, lanzar el error
            if (attempt === maxRetries - 1) {
                if (onError) {
                    onError(error);
                }
                throw error;
            }

            // Esperar antes de reintentar (con backoff exponencial)
            const delay = retryDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
};

/**
 * Verifica la conexión con Supabase
 * @returns {Promise<boolean>} - true si hay conexión, false si no
 */
export const checkConnection = async () => {
    try {
        const { error } = await supabase
            .from('clients')
            .select('id')
            .limit(1);

        return !error;
    } catch (error) {
        console.error('Error verificando conexión:', error);
        return false;
    }
};

/**
 * Maneja errores de Supabase de forma consistente
 * @param {Error} error - Error de Supabase
 * @returns {string} - Mensaje de error amigable
 */
export const handleSupabaseError = (error) => {
    if (!error) return 'Error desconocido';

    // Errores de red
    if (error.message === 'Query timeout') {
        return 'La consulta tardó demasiado. Por favor, intenta de nuevo.';
    }

    if (error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError') ||
        error.message?.includes('network')) {
        return 'Error de conexión. Verifica tu conexión a internet.';
    }

    // Errores de autenticación
    if (error.message?.includes('JWT') ||
        error.message?.includes('expired') ||
        error.code === 'PGRST301') {
        return 'Sesión expirada. Por favor, inicia sesión nuevamente.';
    }

    // Errores de permisos
    if (error.code === '42501' || error.message?.includes('permission')) {
        return 'No tienes permisos para realizar esta acción.';
    }

    // Error genérico
    return error.message || 'Error al conectar con la base de datos';
};
