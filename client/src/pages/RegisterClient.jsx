import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { UserPlus, Save, Users } from 'lucide-react';

const RegisterClient = () => {
    const [formData, setFormData] = useState({ phone: '', name: '', email: '', userType: 'client', createAccount: false });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [generatedQR, setGeneratedQR] = useState(null);
    const [generatedPassword, setGeneratedPassword] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);
        setGeneratedQR(null);
        setGeneratedPassword(null);

        try {
            // Check if client exists
            const { data: existing } = await supabase
                .from('clients')
                .select('phone')
                .eq('phone', formData.phone)
                .single();

            if (existing) {
                throw new Error('El cliente ya está registrado con este número.');
            }

            // Insert client
            const { data: newClient, error: insertError } = await supabase
                .from('clients')
                .insert([{ phone: formData.phone, name: formData.name, email: formData.email, user_type: formData.userType }])
                .select()
                .single();

            if (insertError) throw insertError;

            // If email provided and createAccount is checked, create user account
            let userCreated = false;
            let tempPassword = null;
            if (formData.createAccount && formData.email) {
                // Generate temporary password
                tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

                try {
                    // Create auth user (this will trigger the profile creation via database trigger)
                    const { data: authData, error: authError } = await supabase.auth.signUp({
                        email: formData.email,
                        password: tempPassword,
                        options: {
                            emailRedirectTo: window.location.origin
                        }
                    });

                    if (authError) throw authError;

                    // Link the profile to the client
                    if (authData.user) {
                        const { error: linkError } = await supabase
                            .from('profiles')
                            .update({
                                client_id: newClient.id,
                                username: formData.email
                            })
                            .eq('id', authData.user.id);

                        if (linkError) {
                            console.error('Error linking profile:', linkError);
                        } else {
                            userCreated = true;
                            setGeneratedPassword(tempPassword);
                        }
                    }
                } catch (authErr) {
                    console.error('Error creating user account:', authErr);
                    // Don't fail the whole registration if user creation fails
                    setError(`Cliente registrado, pero no se pudo crear la cuenta de usuario: ${authErr.message}`);
                }
            }

            setSuccess(true);
            setGeneratedQR(formData.phone);
            setFormData({ phone: '', name: '', email: '', userType: 'client', createAccount: false });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Main Registration Card */}
            <div className="card" style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            Registrar Cliente
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Añade nuevos clientes al sistema
                        </p>
                    </div>
                    <Link to="/clients" className="btn btn-primary">
                        <Users size={20} />
                        Ver Clientes
                    </Link>
                </div>

                {/* Form Section */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                        Datos del Cliente
                    </h3>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Phone */}
                        <div className="mb-4">
                            <label className="input-label">Número de Teléfono (ID Único)</label>
                            <input
                                type="tel"
                                placeholder="Ej: 04141234567"
                                className="input-field"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                            />
                        </div>

                        {/* Name */}
                        <div className="mb-4">
                            <label className="input-label">Nombre *</label>
                            <input
                                type="text"
                                placeholder="Nombre del cliente"
                                className="input-field"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="mb-4">
                            <label className="input-label">Email *</label>
                            <input
                                type="email"
                                placeholder="correo@ejemplo.com"
                                className="input-field"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                Si proporcionas un email, puedes crear una cuenta de usuario para este cliente
                            </p>
                        </div>

                        {/* User Type */}
                        <div className="mb-4">
                            <label className="input-label">Tipo de Usuario *</label>
                            <select
                                className="input-field"
                                value={formData.userType}
                                onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                                required
                            >
                                <option value="client">USUARIO CLIENTE</option>
                                <option value="admin">ADMINISTRADOR</option>
                            </select>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                Define el nivel de acceso del usuario en la aplicación
                            </p>
                        </div>

                        {/* Create Account Checkbox */}
                        {formData.email && (
                            <div className="mb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.createAccount}
                                        onChange={(e) => setFormData({ ...formData, createAccount: e.target.checked })}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                        Crear cuenta de usuario para acceso al sistema
                                    </span>
                                </label>
                                {formData.createAccount && (
                                    <p style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--info)',
                                        marginTop: '0.5rem',
                                        padding: '0.5rem',
                                        background: 'var(--info-light)',
                                        borderRadius: 'var(--radius-md)'
                                    }}>
                                        Se generará una contraseña temporal que se mostrará después del registro
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="error-message mb-4">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            style={{ height: '48px', fontSize: '1rem', marginTop: '1rem' }}
                            disabled={loading}
                        >
                            {loading ? 'Registrando...' : (
                                <>
                                    <Save size={20} />
                                    Registrar Cliente
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Success Card with QR */}
            {success && generatedQR && (
                <div className="card text-center" style={{
                    maxWidth: '600px',
                    margin: '0 auto',
                    width: '100%',
                    background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                    border: '1px solid #BAE6FD'
                }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '1rem',
                        background: 'white',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: '1rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <QRCodeSVG value={generatedQR} size={200} />
                    </div>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        ¡Cliente Registrado con Éxito!
                    </p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Escanea este código para identificar al cliente rápidamente.
                    </p>

                    {generatedPassword && (
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1rem',
                            background: 'var(--success-light)',
                            border: '1px solid #86EFAC',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#15803D', marginBottom: '0.75rem' }}>
                                ✓ Cuenta de Usuario Creada
                            </p>
                            <div style={{
                                background: 'white',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid #86EFAC'
                            }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                    Contraseña Temporal:
                                </p>
                                <p style={{ fontSize: '1.1rem', fontFamily: 'monospace', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    {generatedPassword}
                                </p>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                                Guarda esta contraseña. El cliente podrá usarla para iniciar sesión.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RegisterClient;
