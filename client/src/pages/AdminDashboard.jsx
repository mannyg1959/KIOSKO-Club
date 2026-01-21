import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { executeWithRetry, handleSupabaseError } from '../lib/supabaseHelpers';
import { BarChart2, Users, DollarSign, Gift, Settings, Save, Plus, Trash2, Edit2, X, AlertTriangle, Database, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const AdminDashboard = () => {
    const { theme, setLightTheme, setDarkTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('stats');
    const [stats, setStats] = useState({
        salesToday: 0,
        totalClients: 0,
        recentSales: [],
        recentRedemptions: []
    });
    const [loading, setLoading] = useState(true);

    // Config State
    const [config, setConfig] = useState({ points_ratio: '1', kiosk_name: 'KioskoApp' });
    const [prizes, setPrizes] = useState([]);
    const [products, setProducts] = useState([]);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [dbError, setDbError] = useState(false);

    // Modals
    const [showPrizeModal, setShowPrizeModal] = useState(false);
    const [currentPrize, setCurrentPrize] = useState({ id: null, name: '', points: '' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [prizeToDelete, setPrizeToDelete] = useState(null);

    useEffect(() => {
        if (activeTab === 'stats') fetchDashboardData();
        if (activeTab === 'config') fetchConfigData();
    }, [activeTab]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 1. Sales Today
            const salesResult = await executeWithRetry(
                () => supabase
                    .from('sales')
                    .select('amount')
                    .gte('created_at', today.toISOString()),
                { maxRetries: 2, timeout: 30000 }
            );
            const totalSales = salesResult.data?.reduce((sum, sale) => sum + Number(sale.amount), 0) || 0;

            // 2. Total Clients
            const clientResult = await executeWithRetry(
                () => supabase.from('clients').select('*', { count: 'exact', head: true }),
                { maxRetries: 2, timeout: 30000 }
            );

            // 3. Recent Sales & Redemptions
            const recentSalesResult = await executeWithRetry(
                () => supabase.from('sales').select('*, clients(name, phone)').order('created_at', { ascending: false }).limit(5),
                { maxRetries: 2, timeout: 30000 }
            );

            const recentRedemptionsResult = await executeWithRetry(
                () => supabase.from('redemptions').select('*, clients(name, phone)').order('created_at', { ascending: false }).limit(5),
                { maxRetries: 2, timeout: 30000 }
            );

            setStats({
                salesToday: totalSales,
                totalClients: clientResult.count || 0,
                recentSales: recentSalesResult.data || [],
                recentRedemptions: recentRedemptionsResult.data || []
            });
        } catch (error) {
            console.error('[fetchDashboardData] Error:', error);
            const errorMessage = handleSupabaseError(error);
            console.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const fetchConfigData = async () => {
        setLoading(true);
        setDbError(false);
        try {
            const { data: configData, error: configError } = await supabase.from('config').select('*');
            if (configError) throw configError;

            if (configData) {
                const configMap = {};
                configData.forEach(item => configMap[item.key] = item.value);
                setConfig(prev => ({ ...prev, ...configMap }));
            }

            const { data: prizesData, error: prizesError } = await supabase.from('prizes').select('*').order('points', { ascending: true });
            if (prizesError) throw prizesError;

            if (prizesData) setPrizes(prizesData);

            const { data: productData } = await supabase.from('products').select('*').order('name', { ascending: true });
            if (productData) setProducts(productData);

        } catch (error) {
            console.error('Error config:', error);
            // Check for missing table error (404 in REST or Postgres 42P01 or PostgREST PGRST205)
            if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('404')) {
                setDbError(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Upsert config
            const updates = Object.entries(config).map(([key, value]) => ({ key, value }));
            const { error } = await supabase.from('config').upsert(updates);
            if (error) throw error;
            setMsg({ type: 'success', text: 'Configuración guardada.' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Error al guardar. Verifique la base de datos.' });
        } finally {
            setSaving(false);
            setTimeout(() => setMsg({ type: '', text: '' }), 3000);
        }
    };

    const openPrizeModal = (prize = null) => {
        if (prize) {
            setCurrentPrize(prize);
        } else {
            setCurrentPrize({ id: null, name: '', points: '' });
        }
        setShowPrizeModal(true);
    };

    const handleSavePrize = async (e) => {
        e.preventDefault();
        try {
            const prizeData = { name: currentPrize.name, points: parseInt(currentPrize.points) };
            let error;
            let data;

            if (currentPrize.id) {
                const res = await supabase.from('prizes').update(prizeData).eq('id', currentPrize.id).select();
                error = res.error;
                data = res.data;
                if (!error) {
                    setPrizes(prizes.map(p => p.id === currentPrize.id ? data[0] : p));
                }
            } else {
                const res = await supabase.from('prizes').insert([prizeData]).select();
                error = res.error;
                data = res.data;
                if (!error) {
                    setPrizes([...prizes, data[0]]);
                }
            }

            if (error) throw error;
            setShowPrizeModal(false);
        } catch (err) {
            console.error(err);
            if (err.code === '42P01' || err.code === 'PGRST205' || err.message?.includes('404')) {
                alert('Error Crítico: La tabla "prizes" no existe.\n\nPor favor ejecute el script "migrations/02_fix_missing_tables.sql" en su base de datos Supabase.');
            } else {
                alert('Error al guardar premio: ' + err.message);
            }
        }
    };

    const confirmDelete = (prize) => {
        setPrizeToDelete(prize);
        setShowDeleteModal(true);
    };

    const handleDeletePrize = async () => {
        if (!prizeToDelete) return;
        try {
            await supabase.from('prizes').delete().eq('id', prizeToDelete.id);
            setPrizes(prizes.filter(p => p.id !== prizeToDelete.id));
            setShowDeleteModal(false);
            setPrizeToDelete(null);
        } catch (err) {
            alert('Error al eliminar');
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>Administración</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Panel de Control y Configuración General</p>
                </div>
                <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200">
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ border: 'none', borderRadius: '6px' }}
                    >
                        <BarChart2 size={18} /> Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`btn ${activeTab === 'config' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ border: 'none', borderRadius: '6px' }}
                    >
                        <Settings size={18} /> Configuración
                    </button>
                </div>
            </div>

            {loading && <div className="p-8 text-center text-gray-400">Cargando datos...</div>}

            {!loading && activeTab === 'stats' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {/* KPI: Ventas Hoy */}
                        <div className="kpi-card" style={{ borderLeft: '4px solid var(--info)' }}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="kpi-title">Ventas Hoy</div>
                                    <div className="kpi-value">${stats.salesToday.toFixed(2)}</div>
                                </div>
                                <div style={{
                                    background: 'var(--info-light)',
                                    padding: '10px',
                                    borderRadius: '50%',
                                    color: 'var(--info)'
                                }}>
                                    <DollarSign size={24} />
                                </div>
                            </div>
                            <div className="kpi-trend trend-up">
                                <span className="text-sm text-secondary">Ingresos del día actual</span>
                            </div>
                        </div>

                        {/* KPI: Clientes */}
                        <div className="kpi-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="kpi-title">Clientes Totales</div>
                                    <div className="kpi-value">{stats.totalClients}</div>
                                </div>
                                <div style={{
                                    background: 'var(--primary-light)',
                                    padding: '10px',
                                    borderRadius: '50%',
                                    color: 'var(--primary)'
                                }}>
                                    <Users size={24} />
                                </div>
                            </div>
                            <div className="kpi-trend">
                                <span className="text-sm text-secondary">Registrados en el sistema</span>
                            </div>
                        </div>

                        {/* KPI: Canjes */}
                        <div className="kpi-card" style={{ borderLeft: '4px solid var(--warning)' }}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="kpi-title">Canjes Recientes</div>
                                    <div className="kpi-value">{stats.recentRedemptions.length}</div>
                                </div>
                                <div style={{
                                    background: 'var(--warning-light)',
                                    padding: '10px',
                                    borderRadius: '50%',
                                    color: 'var(--warning)'
                                }}>
                                    <Gift size={24} />
                                </div>
                            </div>
                            <div className="kpi-trend">
                                <span className="text-sm text-secondary">Últimas transacciones</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="card">
                            <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Últimas Ventas</h3>
                            <div className="table-container">
                                <table>
                                    <thead><tr><th>Cliente</th><th className="text-right">Monto</th><th className="text-right">Hora</th></tr></thead>
                                    <tbody>
                                        {stats.recentSales.map(s => (
                                            <tr key={s.id}>
                                                <td className="font-medium">{s.clients?.name || s.clients?.phone}</td>
                                                <td className="text-right" style={{ color: 'var(--success)', fontWeight: 'bold' }}>${s.amount}</td>
                                                <td className="text-right text-gray-500 text-sm">{new Date(s.created_at).toLocaleTimeString()}</td>
                                            </tr>
                                        ))}
                                        {stats.recentSales.length === 0 && <tr><td colSpan="3" className="text-center p-4">Sin datos recientes</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="card">
                            <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Canjes Recientes</h3>
                            <div className="table-container">
                                <table>
                                    <thead><tr><th>Cliente</th><th>Premio</th><th className="text-right">Puntos</th></tr></thead>
                                    <tbody>
                                        {stats.recentRedemptions.map(r => (
                                            <tr key={r.id}>
                                                <td className="font-medium">{r.clients?.name || r.clients?.phone}</td>
                                                <td>{r.prize_description}</td>
                                                <td className="text-right" style={{ color: 'var(--error)', fontWeight: 'bold' }}>-{r.points_cost}</td>
                                            </tr>
                                        ))}
                                        {stats.recentRedemptions.length === 0 && <tr><td colSpan="3" className="text-center p-4">Sin canjes recientes</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {!loading && activeTab === 'config' && (
                <div className="flex flex-col gap-6">
                    {dbError && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm flex items-start gap-4">
                            <Database className="text-red-500 shrink-0" size={24} />
                            <div>
                                <h3 className="text-red-800 font-bold text-lg">Configuración de Base de Datos Requerida</h3>
                                <p className="text-red-700 mt-1">
                                    Las tablas necesarias para la configuración no fueron encontradas.
                                    Por favor ejecute el script SQL <code className="bg-red-100 px-2 py-0.5 rounded text-sm font-mono">migrations/02_fix_missing_tables.sql</code> en su panel de Supabase.
                                </p>
                            </div>
                        </div>
                    )}


                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Business Rules */}
                        <div className="card h-fit">
                            <h3 className="section-title flex items-center gap-2" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                <Settings size={20} /> Reglas del Negocio
                            </h3>
                            <form onSubmit={handleSaveConfig}>
                                <div className="mb-4">
                                    <label className="input-label">Nombre del Kiosko</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={config.kiosk_name}
                                        onChange={e => setConfig({ ...config, kiosk_name: e.target.value })}
                                        disabled={dbError}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="input-label">Tasa de Puntos</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="input-field"
                                        value={config.points_ratio}
                                        onChange={e => setConfig({ ...config, points_ratio: e.target.value })}
                                        disabled={dbError}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="input-label">Tema de la Aplicación</label>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={setLightTheme}
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: theme === 'light' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                                background: theme === 'light' ? 'var(--primary-light)' : 'white',
                                                color: theme === 'light' ? 'var(--primary)' : 'var(--text-secondary)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Sun size={20} />
                                            <span style={{ fontWeight: '600' }}>Claro</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={setDarkTheme}
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: theme === 'dark' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                                background: theme === 'dark' ? '#1e293b' : 'white',
                                                color: theme === 'dark' ? 'white' : 'var(--text-secondary)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Moon size={20} />
                                            <span style={{ fontWeight: '600' }}>Oscuro</span>
                                        </button>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                        Cambia el tema visual de toda la aplicación
                                    </p>
                                </div>

                                {msg.text && (
                                    <div style={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        marginBottom: '1rem',
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        backgroundColor: msg.type === 'success' ? 'var(--success-light)' : 'var(--error-light)',
                                        color: msg.type === 'success' ? 'var(--success)' : 'var(--error)'
                                    }}>
                                        {msg.text}
                                    </div>
                                )}

                                <button type="submit" className="btn btn-primary w-full" disabled={saving || dbError}>
                                    <Save size={18} />
                                    {saving ? 'Guardando...' : 'Guardar Configuración'}
                                </button>
                            </form>
                        </div>

                        {/* Prizes Management */}
                        <div className="card">
                            <div className="flex justify-between items-center mb-6" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                <h3 className="section-title flex items-center gap-2 mb-0" style={{ fontSize: '1.2rem', marginBottom: 0 }}><Gift size={20} /> Gestión de Premios</h3>
                                <button onClick={() => openPrizeModal()} disabled={dbError} className="btn btn-success">
                                    <Plus size={18} /> Nuevo
                                </button>
                            </div>

                            <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                {prizes.length === 0 ? (
                                    <p className="text-center text-gray-400 p-8">No hay premios configurados.</p>
                                ) : (
                                    <table>
                                        <thead><tr><th>Premio</th><th>Pts</th><th className="text-right">Acciones</th></tr></thead>
                                        <tbody>
                                            {prizes.map(p => (
                                                <tr key={p.id}>
                                                    <td className="font-medium">{p.name}</td>
                                                    <td className="font-bold">{p.points}</td>
                                                    <td className="text-right flex justify-end gap-2">
                                                        <button onClick={() => openPrizeModal(p)} className="btn btn-secondary" style={{ padding: '8px' }} title="Editar">
                                                            <Edit2 size={16} color="var(--info)" />
                                                        </button>
                                                        <button onClick={() => confirmDelete(p)} className="btn btn-secondary" style={{ padding: '8px' }} title="Eliminar">
                                                            <Trash2 size={16} color="var(--error)" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Prize Modal (Add/Edit) */}
            {showPrizeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="card w-full max-w-md animate-fade-in p-0 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">{currentPrize.id ? 'Editar Premio' : 'Nuevo Premio'}</h3>
                            <button onClick={() => setShowPrizeModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSavePrize} className="p-6">
                            <div className="mb-4">
                                <label className="input-label">Seleccionar Producto / Premio</label>
                                <div className="relative">
                                    <select
                                        className="input-field appearance-none cursor-pointer"
                                        value={currentPrize.name}
                                        onChange={(e) => setCurrentPrize({ ...currentPrize, name: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Seleccione una opción --</option>
                                        <optgroup label="Premios Genéricos">
                                            <option value="Bebida Gratis">Bebida Gratis</option>
                                            <option value="Descuento 10%">Descuento 10%</option>
                                            <option value="Descuento 20%">Descuento 20%</option>
                                            <option value="Vale de Compra $5">Vale de Compra $5</option>
                                        </optgroup>
                                        {products.length > 0 && (
                                            <optgroup label="Productos del Inventario">
                                                {products.map(prod => (
                                                    <option key={prod.id} value={prod.name}>{prod.name} (${prod.price})</option>
                                                ))}
                                            </optgroup>
                                        )}
                                        <optgroup label="Otros">
                                            <option value="Personalizado">Otro (Escribir abajo)</option>
                                        </optgroup>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="input-label">Costo en Puntos</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="Ej: 50"
                                    value={currentPrize.points}
                                    onChange={(e) => setCurrentPrize({ ...currentPrize, points: e.target.value })}
                                    required
                                    min="1"
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowPrizeModal(false)} className="btn btn-secondary flex-1">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary flex-1">
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="card w-full max-w-sm animate-fade-in p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">¿Eliminar Premio?</h3>
                        <p className="text-gray-500 mb-6">Esta acción no se puede deshacer. Se eliminará "{prizeToDelete?.name}".</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary flex-1">
                                Cancelar
                            </button>
                            <button onClick={handleDeletePrize} className="btn btn-danger flex-1">
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
