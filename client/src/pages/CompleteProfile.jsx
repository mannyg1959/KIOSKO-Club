import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Phone, Mail, Save, Sparkles } from 'lucide-react';

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
        <div className="login-page">
            <div className="login-dots"></div>
            <div className="login-card animate-fade-in" style={{ maxWidth: '500px' }}>
                {/* Logo Area */}
                <div className="login-logo-container">
                    <div className="login-logo-circle">
                        <div className="login-logo-icon">
                            <Sparkles size={40} strokeWidth={2.5} />
                            <div className="star-badge">★</div>
                        </div>
                    </div>
                </div>

                <h1 className="login-title">
                    COMPLETA TU <span className="title-accent">PERFIL</span>
                </h1>
                <p className="text-gray-600 text-center mb-6">
                    Para continuar, necesitamos algunos datos adicionales
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="input-group">
                        <label className="input-label">
                            <User size={18} className="inline mr-2" />
                            Nombre Completo *
                        </label>
                        <input
                            type="text"
                            placeholder="Tu nombre completo"
                            className="input-field"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">
                            <Phone size={18} className="inline mr-2" />
                            Número de Teléfono *
                        </label>
                        <input
                            type="tel"
                            placeholder="Ej: 04141234567"
                            className="input-field"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Este será tu identificador único en el sistema
                        </p>
                    </div>

                    <div className="input-group">
                        <label className="input-label">
                            <Mail size={18} className="inline mr-2" />
                            Email
                        </label>
                        <input
                            type="email"
                            className="input-field"
                            value={formData.email}
                            disabled
                            style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Email de tu cuenta registrada
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        style={{ marginTop: '1.5rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : (
                            <>
                                <Save size={18} />
                                Completar Registro
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        Todos los campos marcados con * son obligatorios
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CompleteProfile;
