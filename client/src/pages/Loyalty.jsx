import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Gift, CheckCircle, AlertCircle } from 'lucide-react';

const Loyalty = () => {
    const { user, profile } = useAuth();
    const [phone, setPhone] = useState('');
    const [client, setClient] = useState(null);
    const [prizes, setPrizes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // If user is a client with linked account, load their data automatically
    useEffect(() => {
        if (profile?.role === 'client' && profile?.client) {
            setClient(profile.client);
            setPhone(profile.client.phone);
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
        e.preventDefault();
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
            setMessage({ type: 'error', text: 'Primero busca un cliente' });
            return;
        }

        if (client.points_balance < prize.points) {
            setMessage({ type: 'error', text: 'Puntos insuficientes' });
            return;
        }

        setLoading(true);
        try {
            // Record redemption
            const { error: redemptionError } = await supabase
                .from('redemptions')
                .insert([{
                    client_id: client.id,
                    prize_description: prize.name,
                    points_used: prize.points
                }]);

            if (redemptionError) throw redemptionError;

            // Update client points
            const newBalance = client.points_balance - prize.points;
            const { error: updateError } = await supabase
                .from('clients')
                .update({ points_balance: newBalance })
                .eq('id', client.id);

            if (updateError) throw updateError;

            setClient({ ...client, points_balance: newBalance });
            setMessage({ type: 'success', text: `¡Premio canjeado! Nuevo saldo: ${newBalance} puntos` });
        } catch (err) {
            console.error('Error redeeming prize:', err);
            setMessage({ type: 'error', text: 'Error al canjear premio' });
        } finally {
            setLoading(false);
        }
    };

    const isClientUser = profile?.role === 'client' && profile?.client;

    // Calcular el premio más caro para la barra de progreso
    const maxPrizePoints = prizes.length > 0 ? Math.max(...prizes.map(p => p.points)) : 1000;
    const progressPercentage = client ? Math.min((client.points_balance / maxPrizePoints) * 100, 100) : 0;

    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
            {/* Search Form for Admin */}
            {!isClientUser && (
                <div className={`card ${client ? 'mb-0' : ''}`}>
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="tel"
                                placeholder="Buscar cliente por teléfono..."
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            <Search size={20} />
                            Buscar
                        </button>
                    </form>
                </div>
            )}

            {/* Messages */}
            {message.text && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            {/* Empty State */}
            {!client && !isClientUser && (
                <div className="text-center p-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                    <Gift size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Busca un cliente para ver su balance y premios</p>
                </div>
            )}

            {client && (
                <>
                    {/* Header - Balance Section */}
                    <div>
                        <h2 style={{
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            color: '#64748b',
                            marginBottom: '0.25rem'
                        }}>
                            TU BALANCE
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1e293b' }}>
                                {client.points_balance.toLocaleString()}
                            </span>
                            <span style={{ fontSize: '1.25rem', fontWeight: '600', color: '#8b5cf6' }}>
                                puntos
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div style={{
                            height: '12px',
                            background: '#f1f5f9',
                            borderRadius: '999px',
                            overflow: 'hidden',
                            maxWidth: '400px'
                        }}>
                            <div style={{
                                width: `${progressPercentage}%`,
                                height: '100%',
                                background: '#8b5cf6',
                                borderRadius: '999px',
                                transition: 'width 1s ease-in-out'
                            }} />
                        </div>
                    </div>

                    {/* Rewards Section */}
                    <div>
                        <h3 className="section-title" style={{ marginTop: '2rem', marginBottom: '1.5rem', fontWeight: '800' }}>
                            PREMIOS DISPONIBLES
                        </h3>

                        {prizes.length === 0 ? (
                            <div className="text-center p-8 text-gray-500">No hay premios activos en este momento.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {prizes.map((prize) => {
                                    const canRedeem = client ? client.points_balance >= prize.points : false;
                                    return (
                                        <div key={prize.id} style={{
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            padding: '1.25rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            background: 'white',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                        }}>
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <Gift size={24} style={{ color: '#334155' }} />
                                                </div>
                                                <div>
                                                    <h4 style={{
                                                        fontWeight: '700',
                                                        color: '#1e293b',
                                                        fontSize: '1.1rem',
                                                        marginBottom: '0.1rem'
                                                    }}>
                                                        {prize.name}
                                                    </h4>
                                                    <div style={{
                                                        fontSize: '0.9rem',
                                                        color: '#64748b',
                                                        borderBottom: '2px solid #ddd6fe',
                                                        display: 'inline-block',
                                                        lineHeight: '1.2'
                                                    }}>
                                                        {prize.points} puntos
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleRedeem(prize)}
                                                disabled={!canRedeem || loading}
                                                style={{
                                                    background: canRedeem ? '#6366f1' : '#e2e8f0',
                                                    color: canRedeem ? 'white' : '#94a3b8',
                                                    padding: '0.5rem 1.25rem',
                                                    borderRadius: '8px',
                                                    fontWeight: '600',
                                                    fontSize: '0.95rem',
                                                    border: 'none',
                                                    cursor: canRedeem ? 'pointer' : 'not-allowed',
                                                    transition: 'all 0.2s',
                                                    boxShadow: canRedeem ? '0 4px 6px -1px rgba(99, 102, 241, 0.3)' : 'none'
                                                }}
                                            >
                                                Canjear
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Loyalty;
