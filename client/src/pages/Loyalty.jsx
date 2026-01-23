import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Gift, CheckCircle, Ban, RefreshCw } from 'lucide-react';

const Loyalty = () => {
    const { user, profile, refreshProfile } = useAuth();
    const [phone, setPhone] = useState('');
    const [client, setClient] = useState(null);
    const [prizes, setPrizes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // If user is a client with linked account, load their data automatically
    useEffect(() => {
        if (profile?.role === 'client' && profile?.client) {
            setClient(profile.client);
            setPhone(profile.client.phone || '');
        }
    }, [profile]);

    useEffect(() => {
        fetchPrizes();
    }, []);

    const fetchPrizes = async () => {
        try {
            const { data, error } = await supabase
                .from('prizes')
                .select('*')
                .eq('active', true)
                .order('points', { ascending: true });

            if (error) throw error;
            setPrizes(data || []);
        } catch (err) {
            console.error('Error fetching prizes:', err);
        }
    };

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!phone.trim()) return;

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('phone', phone.trim())
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    setMessage({ type: 'error', text: 'Cliente no encontrado' });
                    setClient(null);
                } else {
                    throw error;
                }
            } else {
                setClient(data);
                setMessage({ type: 'success', text: `Cliente encontrado: ${data.name}` });
            }
        } catch (err) {
            console.error('Error searching client:', err);
            setMessage({ type: 'error', text: 'Error al buscar cliente' });
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = async (prize) => {
        if (!client) {
            setMessage({ type: 'error', text: 'Primero identifica a un cliente' });
            return;
        }

        if (client.points_balance < prize.points) {
            setMessage({ type: 'error', text: 'Saldo insuficiente para este premio' });
            return;
        }

        setLoading(true);
        try {
            const pointsToSubtract = Number(prize.points);
            const currentBalance = Number(client.points_balance);
            const newBalance = currentBalance - pointsToSubtract;

            // 1. Record redemption
            const { error: redemptionError } = await supabase
                .from('redemptions')
                .insert([{
                    client_id: client.id,
                    prize_description: prize.name,
                    points_cost: pointsToSubtract
                }]);

            if (redemptionError) throw redemptionError;

            // 2. Update client points
            const { error: updateError } = await supabase
                .from('clients')
                .update({ points_balance: newBalance })
                .eq('id', client.id);

            if (updateError) throw updateError;

            // Success
            setClient({ ...client, points_balance: newBalance });
            setMessage({ type: 'success', text: `Canje exitoso. Se han descontado ${pointsToSubtract} puntos.` });

            if (refreshProfile) await refreshProfile();
        } catch (err) {
            console.error('Redeem error:', err);
            setMessage({ type: 'error', text: 'Error al procesar el canje' });
        } finally {
            setLoading(false);
        }
    };

    const isClientUser = (profile?.role === 'client' && profile?.client);

    const stats = useMemo(() => {
        if (!client || prizes.length === 0) return { nextPrize: null, progress: 0, affordableCount: 0 };

        const next = prizes.find(p => p.points > client.points_balance) || prizes[prizes.length - 1];
        const affordable = prizes.filter(p => client.points_balance >= p.points).length;
        const progress = next.points > 0 ? Math.min((client.points_balance / next.points) * 100, 100) : 0;

        return { nextPrize: next, progress, affordableCount: affordable };
    }, [client, prizes]);

    return (
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-10 px-4">

            {/* SECCIÓN DE BÚSQUEDA (Solo Admin) */}
            {!isClientUser && (
                <div className="card">
                    <form onSubmit={handleSearch} className="flex gap-3 items-center">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="tel"
                                placeholder="Buscar cliente por teléfono..."
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="input-field pl-10"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
                            Buscar
                        </button>
                    </form>
                </div>
            )}

            {/* MENSAJES DE ESTADO */}
            {message.text && (
                <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
                    {message.text}
                </div>
            )}

            {/* ESTADO VACÍO */}
            {!client && !isClientUser && (
                <div className="card flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Gift size={40} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Busca un cliente</h3>
                    <p className="text-gray-500 max-w-md">Ingresa el número telefónico para ver el balance de puntos y premios disponibles.</p>
                </div>
            )}

            {client && (
                <>
                    {/* BALANCE HEADER - Updated with Custom CSS */}
                    <div className="loyalty-balance-card">
                        <span className="loyalty-balance-label">TU BALANCE</span>

                        <div className="flex items-baseline mb-4">
                            <h1 className="loyalty-big-number">
                                {client.points_balance}
                            </h1>
                            <span className="loyalty-unit">puntos</span>
                        </div>

                        {/* Progress Bar - keeping inline style for width but using css for container */}
                        <div className="w-full max-w-sm h-2.5 bg-gray-100 rounded-full overflow-hidden mb-4 shadow-inner">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-500 ease-out shadow-sm"
                                style={{ width: `${stats.progress}%`, backgroundColor: 'var(--primary)' }}
                            ></div>
                        </div>

                        <h2 className="text-base font-medium text-slate-500 mb-1">{client.name}</h2>

                        {stats.nextPrize ? (
                            <p className="text-sm font-medium text-slate-700">
                                Siguiente Meta: <span className="font-bold text-slate-900">{stats.nextPrize.name}</span>
                            </p>
                        ) : (
                            <p className="text-sm font-medium text-success">¡Has alcanzado el máximo nivel!</p>
                        )}
                    </div>

                    {/* PREMIOS DISPONIBLES - Updated with Custom CSS */}
                    <div className="loyalty-prizes-container">
                        <div className="loyalty-prizes-header">
                            <h3 className="loyalty-prizes-title">PREMIOS DISPONIBLES</h3>
                        </div>

                        <div className="loyalty-list">
                            {prizes.map((prize) => {
                                const canRedeem = client.points_balance >= prize.points;
                                const pointsNeeded = prize.points - client.points_balance;

                                return (
                                    <div key={prize.id} className="loyalty-item">

                                        {/* LEFT: INFO */}
                                        <div className="loyalty-item-info">
                                            <div className="loyalty-icon-box">
                                                <Gift size={28} strokeWidth={1.8} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-base leading-tight mb-0.5">{prize.name}</h4>
                                                <p className="text-slate-500 text-sm font-medium">{prize.points} puntos</p>
                                            </div>
                                        </div>

                                        {/* CENTER: STATUS TEXT */}
                                        <div className="loyalty-item-status">
                                            {canRedeem ? (
                                                <span className="text-slate-900 font-medium text-sm">¡Solicítalo en caja!</span>
                                            ) : (
                                                <span className="text-slate-900 font-medium text-sm">Te faltan {pointsNeeded} pts</span>
                                            )}
                                        </div>

                                        {/* RIGHT: ACTION */}
                                        <div className="loyalty-item-action">
                                            <span className={`font-bold text-sm text-slate-900`}>
                                                {canRedeem ? 'Canjeable' : 'Bloqueado'}
                                            </span>

                                            {canRedeem ? (
                                                <div className="shrink-0">
                                                    <CheckCircle className="text-success" size={32} strokeWidth={2.5} />
                                                </div>
                                            ) : (
                                                <div className="shrink-0">
                                                    <Ban className="text-error" size={32} strokeWidth={2.5} />
                                                </div>
                                            )}

                                            {/* ADMIN ACTION BUTTON */}
                                            {profile?.role === 'admin' && canRedeem && (
                                                <button
                                                    onClick={() => handleRedeem(prize)}
                                                    className="btn btn-primary text-xs px-3 py-1.5 ml-2"
                                                    disabled={loading}
                                                    style={{ height: 'auto', minHeight: '32px' }}
                                                >
                                                    CANJEAR
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Loyalty;
