import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { UserPlus, Save, Users, X, Edit2, Trash2, Check, XCircle } from 'lucide-react';

const RegisterClient = () => {
    const [formData, setFormData] = useState({ phone: '', name: '', email: '', userType: 'client', createAccount: false });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [generatedQR, setGeneratedQR] = useState(null);
    const [showClientList, setShowClientList] = useState(false);
    const [clients, setClients] = useState([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', userType: 'client' });
    const [deleteError, setDeleteError] = useState(null);
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

    const fetchClients = async () => {
        setLoadingClients(true);
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClients(data || []);
            setShowClientList(true);
        } catch (err) {
            console.error('Error fetching clients:', err);
        } finally {
            setLoadingClients(false);
        }
    };

    const startEdit = (client) => {
        setEditingClient(client.id);
        setEditForm({ name: client.name || '', phone: client.phone, email: client.email || '', userType: client.user_type || 'client' });
        setDeleteError(null);
    };

    const cancelEdit = () => {
        setEditingClient(null);
        setEditForm({ name: '', phone: '', email: '', userType: 'client' });
    };

    const saveEdit = async (clientId) => {
        try {
            const { error } = await supabase
                .from('clients')
                .update({
                    name: editForm.name,
                    phone: editForm.phone,
                    email: editForm.email,
                    user_type: editForm.userType
                })
                .eq('id', clientId);

            if (error) throw error;

            // Update local state
            setClients(clients.map(c =>
                c.id === clientId
                    ? { ...c, name: editForm.name, phone: editForm.phone, email: editForm.email, user_type: editForm.userType }
                    : c
            ));
            setEditingClient(null);
        } catch (err) {
            alert('Error al actualizar: ' + err.message);
        }
    };

    const deleteClient = async (client) => {
        setDeleteError(null);

        // Confirm deletion
        if (!confirm(`¿Estás seguro de eliminar al cliente ${client.name || client.phone}?`)) {
            return;
        }

        try {
            // Check if client has sales
            const { data: sales, error: salesError } = await supabase
                .from('sales')
                .select('id')
                .eq('client_id', client.id)
                .limit(1);

            if (salesError) throw salesError;

            if (sales && sales.length > 0) {
                setDeleteError(`No se puede eliminar a ${client.name || client.phone} porque tiene ventas registradas.`);
                return;
            }

            // Delete client
            const { error: deleteError } = await supabase
                .from('clients')
                .delete()
                .eq('id', client.id);

            if (deleteError) throw deleteError;

            // Update local state
            setClients(clients.filter(c => c.id !== client.id));

        } catch (err) {
            setDeleteError('Error al eliminar: ' + err.message);
        }
    };

    return (
        <div className="entry-container">
            <div className="entry-header">
                <div className="entry-title-group">
                    <h2 className="entry-title">Registrar Cliente</h2>
                    <p className="entry-subtitle">Añade nuevos clientes al sistema</p>
                </div>
                <button
                    onClick={fetchClients}
                    className="btn btn-primary"
                    disabled={loadingClients}
                >
                    <Users size={18} />
                    {loadingClients ? 'Cargando...' : 'Ver Clientes'}
                </button>
            </div>

            <div className="entry-card" style={{ maxWidth: '600px' }}>
                <h3 className="entry-form-title">Datos del Cliente</h3>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
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

                    <div className="input-group">
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

                    <div className="input-group">
                        <label className="input-label">Email *</label>
                        <input
                            type="email"
                            placeholder="correo@ejemplo.com"
                            className="input-field"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Si proporcionas un email, puedes crear una cuenta de usuario para este cliente
                        </p>
                    </div>

                    <div className="input-group">
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
                        <p className="text-xs text-gray-500 mt-1">
                            Define el nivel de acceso del usuario en la aplicación
                        </p>
                    </div>

                    {formData.email && (
                        <div className="input-group">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.createAccount}
                                    onChange={(e) => setFormData({ ...formData, createAccount: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-gray-700">
                                    Crear cuenta de usuario para acceso al sistema
                                </span>
                            </label>
                            {formData.createAccount && (
                                <p className="text-xs text-blue-600 mt-2 bg-blue-50 p-2 rounded">
                                    Se generará una contraseña temporal que se mostrará después del registro
                                </p>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        style={{ marginTop: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Registrando...' : (
                            <>
                                <Save size={18} />
                                Registrar Cliente
                            </>
                        )}
                    </button>
                </form>
            </div>

            {success && generatedQR && (
                <div className="entry-card text-center animate-fade-in" style={{ maxWidth: '600px', background: '#F0F9FF', border: '1px solid #B3E5FC' }}>
                    <div className="inline-block p-4 bg-white rounded-xl mb-4 shadow-sm">
                        <QRCodeSVG value={generatedQR} size={200} />
                    </div>
                    <p className="text-xl font-bold text-gray-800 mb-2">¡Cliente Registrado con Éxito!</p>
                    <p className="text-sm text-gray-500 mb-4">Escanea este código para identificar al cliente rápidamente.</p>

                    {generatedPassword && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm font-semibold text-green-800 mb-2">✓ Cuenta de Usuario Creada</p>
                            <div className="bg-white p-3 rounded border border-green-300">
                                <p className="text-xs text-gray-600 mb-1">Contraseña Temporal:</p>
                                <p className="text-lg font-mono font-bold text-gray-900">{generatedPassword}</p>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                                Guarda esta contraseña. El cliente podrá usarla para iniciar sesión.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Client List Modal */}
            {showClientList && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4 animate-fade-in">
                    <div className="entry-card w-full max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden" style={{ margin: 0 }}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Clientes Registrados</h3>
                                <p className="text-gray-500 text-sm">Gestión de base de datos de clientes</p>
                            </div>
                            <button
                                onClick={() => setShowClientList(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={24} className="text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto bg-gray-50">
                            {deleteError && (
                                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm">
                                    {deleteError}
                                </div>
                            )}

                            {clients.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No hay clientes registrados aún.</p>
                                </div>
                            ) : (
                                <div className="entry-table-container bg-white shadow-sm">
                                    <table className="entry-table">
                                        <thead>
                                            <tr>
                                                <th>Nombre</th>
                                                <th>Teléfono</th>
                                                <th>Email</th>
                                                <th>Tipo Usuario</th>
                                                <th>Puntos</th>
                                                <th>Registrado</th>
                                                <th style={{ textAlign: 'center' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {clients.map((client) => (
                                                <tr key={client.id}>
                                                    {editingClient === client.id ? (
                                                        <>
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    className="input-field"
                                                                    style={{ padding: '0.5rem', margin: 0 }}
                                                                    value={editForm.name}
                                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                                    placeholder="Nombre"
                                                                    autoFocus
                                                                />
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="tel"
                                                                    className="input-field"
                                                                    style={{ padding: '0.5rem', margin: 0 }}
                                                                    value={editForm.phone}
                                                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                                    placeholder="Teléfono"
                                                                />
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="email"
                                                                    className="input-field"
                                                                    style={{ padding: '0.5rem', margin: 0 }}
                                                                    value={editForm.email}
                                                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                                    placeholder="Email"
                                                                />
                                                            </td>
                                                            <td>
                                                                <select
                                                                    className="input-field"
                                                                    style={{ padding: '0.5rem', margin: 0 }}
                                                                    value={editForm.userType}
                                                                    onChange={(e) => setEditForm({ ...editForm, userType: e.target.value })}
                                                                >
                                                                    <option value="client">CLIENTE</option>
                                                                    <option value="admin">ADMIN</option>
                                                                </select>
                                                            </td>
                                                            <td>
                                                                <span className="font-bold text-blue-600">
                                                                    {client.points_balance} pts
                                                                </span>
                                                            </td>
                                                            <td className="text-gray-400 text-sm">
                                                                {new Date(client.created_at).toLocaleDateString()}
                                                            </td>
                                                            <td>
                                                                <div className="flex gap-2 justify-center">
                                                                    <button
                                                                        onClick={() => saveEdit(client.id)}
                                                                        className="entry-action-btn edit text-green-600"
                                                                        title="Guardar"
                                                                    >
                                                                        <Check size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={cancelEdit}
                                                                        className="entry-action-btn delete text-red-500"
                                                                        title="Cancelar"
                                                                    >
                                                                        <XCircle size={18} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="font-semibold">
                                                                {client.name || <span className="text-gray-400 italic">Sin nombre</span>}
                                                            </td>
                                                            <td>{client.phone}</td>
                                                            <td>
                                                                {client.email || <span className="text-gray-400 italic">Sin email</span>}
                                                            </td>
                                                            <td>
                                                                <span className={`px-2 py-1 rounded-md text-xs font-bold border ${client.user_type === 'admin'
                                                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                                        : 'bg-green-50 text-green-700 border-green-200'
                                                                    }`}>
                                                                    {client.user_type === 'admin' ? 'ADMIN' : 'CLIENTE'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm font-bold border border-blue-100">
                                                                    {client.points_balance} pts
                                                                </span>
                                                            </td>
                                                            <td className="text-gray-500 text-sm">
                                                                {new Date(client.created_at).toLocaleDateString()}
                                                            </td>
                                                            <td>
                                                                <div className="flex gap-2 justify-center">
                                                                    <button
                                                                        onClick={() => startEdit(client)}
                                                                        className="entry-action-btn edit"
                                                                        title="Editar"
                                                                    >
                                                                        <Edit2 size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => deleteClient(client)}
                                                                        className="entry-action-btn delete"
                                                                        title="Eliminar"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan="6" className="entry-total-footer">
                                                    Total Clientes: {clients.length}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegisterClient;
