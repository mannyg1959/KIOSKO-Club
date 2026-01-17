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

    return (
        <div className="page-container">
            <header className="page-header">
                <h1 className="page-title">Canje de Puntos</h1>
                <p className="page-subtitle">Redime tus puntos por premios increíbles</p>
            </header>

            {!isClientUser && (
                <form onSubmit={handleSearch} className="search-form">
                    <div className="search-input-group">
                        <Search className="search-icon" size={20} />
                        <input
                            type="tel"
                            placeholder="Buscar por teléfono..."
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        <Search size={20} />
                        Buscar
                    </button>
                </form>
            )}

            {message.text && (
                <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            {client && (
                <div className="client-info-card">
                    <div className="client-info-header">
                        <div>
                            <h3 className="client-name">{client.name}</h3>
                            <p className="client-phone">{client.phone}</p>
                        </div>
                        <div className="points-badge">
                            <span className="points-label">Puntos</span>
                            <span className="points-value">{client.points_balance}</span>
                        </div>
                    </div>
                </div>
            )}

            {client && prizes.length > 0 && (
                <div className="prizes-section">
                    <h2 className="section-title">Premios Disponibles</h2>
                    <div className="prizes-grid">
                        {prizes.map((prize) => {
                            const canRedeem = client.points_balance >= prize.points;
                            return (
                                <div key={prize.id} className={`prize-card ${!canRedeem ? 'prize-card-disabled' : ''}`}>
                                    <div className="prize-icon">
                                        <Gift size={32} />
                                    </div>
                                    <h3 className="prize-name">{prize.name}</h3>
                                    <p className="prize-points">{prize.points} puntos</p>
                                    <button
                                        onClick={() => handleRedeem(prize)}
                                        disabled={!canRedeem || loading}
                                        className="btn btn-primary w-full"
                                    >
                                        {canRedeem ? 'Canjear' : 'Puntos insuficientes'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {!client && !isClientUser && (
                <div className="empty-state">
                    <Gift size={64} className="empty-state-icon" />
                    <p className="empty-state-text">Busca un cliente para comenzar</p>
                </div>
            )}
        </div>
    );
};

export default Loyalty;
