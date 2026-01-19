import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Edit2, Trash2, Check, XCircle, ArrowLeft, Users } from 'lucide-react';

const ClientsList = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingClient, setEditingClient] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', userType: 'client' });
    const [deleteError, setDeleteError] = useState(null);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClients(data || []);
        } catch (err) {
            console.error('Error fetching clients:', err);
        } finally {
            setLoading(false);
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
                    <h2 className="entry-title">Clientes Registrados</h2>
                    <p className="entry-subtitle">Gestión de base de datos de clientes</p>
                </div>
                <Link to="/register" className="btn btn-secondary">
                    <ArrowLeft size={18} />
                    Volver a Registro
                </Link>
            </div>

            {deleteError && (
                <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm" style={{
                    background: 'rgba(255, 0, 100, 0.1)',
                    border: '1px solid rgba(255, 0, 100, 0.3)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    color: '#ff0066'
                }}>
                    {deleteError}
                </div>
            )}

            {loading ? (
                <div className="loading-text" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    Cargando clientes...
                </div>
            ) : clients.length === 0 ? (
                <div className="no-movements" style={{
                    background: 'var(--bg-glass)',
                    backdropFilter: 'blur(var(--blur-std))',
                    border: 'var(--glass-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '3rem 2rem',
                    textAlign: 'center'
                }}>
                    <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: 'var(--text-dim)' }} />
                    <p style={{ color: 'var(--text-dim)' }}>No hay clientes registrados aún.</p>
                </div>
            ) : (
                <div className="entry-table-container">
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
                                                <span style={{ fontWeight: 'bold', color: 'var(--neon-green)' }}>
                                                    {client.points_balance} pts
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                                                {new Date(client.created_at).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => saveEdit(client.id)}
                                                        className="entry-action-btn edit"
                                                        style={{ color: 'var(--neon-green)' }}
                                                        title="Guardar"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="entry-action-btn delete"
                                                        style={{ color: '#ff0066' }}
                                                        title="Cancelar"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td style={{ fontWeight: 600, color: 'var(--text-pure)' }}>
                                                {client.name || <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Sin nombre</span>}
                                            </td>
                                            <td>{client.phone}</td>
                                            <td>
                                                {client.email || <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Sin email</span>}
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    border: '1px solid',
                                                    background: client.user_type === 'admin' ? 'rgba(157, 0, 255, 0.1)' : 'rgba(0, 255, 163, 0.1)',
                                                    color: client.user_type === 'admin' ? 'var(--neon-purple)' : 'var(--neon-green)',
                                                    borderColor: client.user_type === 'admin' ? 'rgba(157, 0, 255, 0.3)' : 'rgba(0, 255, 163, 0.3)'
                                                }}>
                                                    {client.user_type === 'admin' ? 'ADMIN' : 'CLIENTE'}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{
                                                    background: 'rgba(0, 255, 163, 0.1)',
                                                    color: 'var(--neon-green)',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 'bold',
                                                    border: '1px solid rgba(0, 255, 163, 0.2)'
                                                }}>
                                                    {client.points_balance} pts
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                                                {new Date(client.created_at).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
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
                                <td colSpan="7" className="entry-total-footer">
                                    Total Clientes: {clients.length}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ClientsList;
