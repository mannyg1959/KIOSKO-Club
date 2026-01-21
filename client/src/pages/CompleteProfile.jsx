import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Phone, Mail, Save, Sparkles, AlertCircle } from 'lucide-react';

const CompleteProfile = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: user?.email || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Si el usuario ya tiene un client_id, redirigir al home
        if (profile?.client_id) {
            navigate('/');
        }
    }, [profile, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Verificar si el teléfono ya existe
            const { data: existingClient } = await supabase
                .from('clients')
                .select('id')
                .eq('phone', formData.phone)
                .single();

            if (existingClient) {
                throw new Error('Este número de teléfono ya está registrado.');
            }

            // Crear el cliente
            const { data: newClient, error: clientError } = await supabase
                .from('clients')
                .insert([{
                    phone: formData.phone,
                    name: formData.name,
                    email: formData.email
                }])
                .select()
                .single();

            if (clientError) throw clientError;

            // Actualizar el perfil con el client_id
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    client_id: newClient.id,
                    username: formData.email
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Redirigir al home
            window.location.href = '/';

        } catch (err) {
            setError(err.message || 'Error al completar el perfil');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <Sparkles size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="auth-title">Kiosko Club</h1>
                    <p className="auth-subtitle">
                        ¡Casi listo! Completa tu perfil para continuar
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && (
                        <div className="error-message">
                            <div className="flex items-center justify-center gap-2">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    <div className="input-group-icon">
                        <User className="input-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Nombre Completo"
                            className="input-field"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group-icon">
                        <Phone className="input-icon" size={20} />
                        <input
                            type="tel"
                            placeholder="Teléfono (Ej: 04141234567)"
                            className="input-field"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                        />
                    </div>

                    <div className="text-xs text-gray-500 ml-1">
                        * Este será tu identificador único en el sistema
                    </div>

                    <div className="input-group-icon">
                        <Mail className="input-icon" size={20} />
                        <input
                            type="email"
                            className="input-field"
                            value={formData.email}
                            disabled
                            style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280' }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        style={{ height: '48px', fontSize: '1rem', marginTop: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : (
                            <>
                                <Save size={18} />
                                Completar Registro
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs text-gray-400 mt-4">
                        Todos los campos marcados son obligatorios para uso interno
                    </p>
                </form>
            </div>
        </div>
    );
};

export default CompleteProfile;
