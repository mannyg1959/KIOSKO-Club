import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Package, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import '../styles/home.css';

const Home = () => {
    const { profile } = useAuth();
    const [recentMovements, setRecentMovements] = useState([]);
    const [totalMovements, setTotalMovements] = useState(0);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);
    const [offers, setOffers] = useState([]);
    const [loadingOffers, setLoadingOffers] = useState(true);

    // Datos del usuario
    const userName = profile?.username || profile?.email?.split('@')[0] || 'Usuario';
    const points = profile?.client?.points_balance || 0;

    // Fetch últimos movimientos del cliente
    useEffect(() => {
        const fetchMovements = async () => {
            if (!profile?.client?.id) {
                setLoading(false);
                return;
            }

            try {
                // Obtener total de movimientos
                const { count } = await supabase
                    .from('sales')
                    .select('*', { count: 'exact', head: true })
                    .eq('client_id', profile.client.id);

                setTotalMovements(count || 0);

                // Obtener últimos 10 movimientos con información del cliente
                const { data, error } = await supabase
                    .from('sales')
                    .select(`
                        id,
                        amount,
                        points_earned,
                        created_at,
                        items,
                        clients!sales_client_id_fkey (
                            name,
                            phone
                        )
                    `)
                    .eq('client_id', profile.client.id)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (error) {
                    console.error('Error fetching movements:', error);
                    throw error;
                }

                console.log('Movements fetched:', data); // Debug
                setRecentMovements(data || []);
            } catch (error) {
                console.error('Error fetching movements:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMovements();
    }, [profile]);

    // Fetch ofertas activas
    useEffect(() => {
        const fetchOffers = async () => {
            setLoadingOffers(true);
            try {
                const { data, error } = await supabase
                    .from('offers')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching offers:', error);
                    throw error;
                }

                console.log('Offers fetched:', data); // Debug
                setOffers(data || []);
            } catch (error) {
                console.error('Error fetching offers:', error);
            } finally {
                setLoadingOffers(false);
            }
        };

        fetchOffers();
    }, []);

    // Carrusel automático - 1 oferta a la vez, cada 5 segundos
    useEffect(() => {
        if (offers.length === 0) return; // No iniciar si no hay ofertas

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % offers.length);
        }, 5000); // ✅ Cambiado a 5 segundos

        return () => clearInterval(interval);
    }, [offers.length]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % offers.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + offers.length) % offers.length);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="home-container">
            {/* Header de Bienvenida con Puntos */}
            <div className="welcome-header">
                <h1 className="welcome-title">
                    Bienvenido: <span className="user-name">{userName}</span>
                </h1>
                <div className="points-display-header">
                    Total puntos acumulados: <span className="points-value">{points} Pts</span>
                </div>
            </div>

            {/* Últimos Movimientos */}
            <div className="movements-section">
                <div className="section-header">
                    <h2 className="section-title">
                        Últimos movimientos {totalMovements > 0 && `(${Math.min(10, totalMovements)} movimientos)`}
                    </h2>
                    {totalMovements > 10 && (
                        <Link to="/movements" className="btn-view-all">
                            Ver Todos
                        </Link>
                    )}
                </div>

                {loading ? (
                    <div className="loading-text">Cargando movimientos...</div>
                ) : recentMovements.length === 0 ? (
                    <div className="no-movements">
                        <p>No tienes movimientos registrados aún.</p>
                    </div>
                ) : (
                    <div className="movements-table-container">
                        <table className="movements-table">
                            <thead>
                                <tr>
                                    <th>CLIENTE</th>
                                    <th>MONTO</th>
                                    <th>HORA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentMovements.map((movement) => (
                                    <tr key={movement.id}>
                                        <td className="client-name">
                                            {movement.clients?.name || 'Cliente'}
                                        </td>
                                        <td className="amount">${parseFloat(movement.amount || 0).toFixed(2)}</td>
                                        <td className="time">{formatDate(movement.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Botones de Acción */}
            <div className="action-buttons">
                <Link to="/loyalty" className="action-btn">
                    <Gift size={20} />
                    Ver Opciones de Canje
                </Link>
                <Link to="/products" className="action-btn">
                    <Package size={20} />
                    Ver Todos los Productos
                </Link>
            </div>

            {/* Carrusel de Ofertas */}
            <div className="offers-section">
                <h2 className="section-title">Combos y Productos en OFERTA !!</h2>

                {loadingOffers ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                        Cargando ofertas...
                    </div>
                ) : offers.length === 0 ? (
                    <div style={{
                        background: 'var(--bg-glass)',
                        backdropFilter: 'blur(var(--blur-std))',
                        border: 'var(--glass-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '3rem 2rem',
                        textAlign: 'center'
                    }}>
                        <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: 'var(--text-dim)' }} />
                        <p style={{ color: 'var(--text-dim)' }}>No hay ofertas activas en este momento.</p>
                    </div>
                ) : (
                    <div className="carousel-container">
                        {/* Carrusel horizontal con scroll automático */}
                        <div className="carousel-wrapper" style={{
                            position: 'relative',
                            overflow: 'hidden',
                            padding: '2rem 0'
                        }}>
                            <div className="carousel-scroll" style={{
                                display: 'flex',
                                gap: '1.5rem',
                                transition: 'transform 0.5s ease-in-out',
                                transform: `translateX(-${currentSlide * 180}px)`
                            }}>
                                {offers.map((offer) => (
                                    <div
                                        key={offer.id}
                                        className="carousel-item"
                                        style={{
                                            flex: '0 0 150px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.75rem',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {/* Contenedor de imagen con fondo blanco */}
                                        <div style={{
                                            width: '150px',
                                            height: '150px',
                                            background: 'white',
                                            borderRadius: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '1rem',
                                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                                        }}>
                                            {offer.image_url ? (
                                                <img
                                                    src={offer.image_url}
                                                    alt={offer.name}
                                                    style={{
                                                        maxWidth: '100%',
                                                        maxHeight: '100%',
                                                        width: 'auto',
                                                        height: 'auto',
                                                        objectFit: 'contain'
                                                    }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.querySelector('.offer-placeholder-icon').style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div className="offer-placeholder-icon" style={{
                                                display: offer.image_url ? 'none' : 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                color: '#ccc'
                                            }}>
                                                <Package size={40} />
                                                <p style={{ fontSize: '0.75rem', margin: 0 }}>Sin imagen</p>
                                            </div>
                                        </div>

                                        {/* Información debajo */}
                                        <div style={{
                                            width: '150px',
                                            textAlign: 'left'
                                        }}>
                                            <h3 style={{
                                                margin: 0,
                                                fontSize: '0.875rem',
                                                fontWeight: '600',
                                                color: 'var(--text-pure)',
                                                marginBottom: '0.25rem',
                                                lineHeight: 1.2,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {offer.name}
                                            </h3>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '0.875rem',
                                                fontWeight: '600',
                                                color: 'var(--neon-green)',
                                                textShadow: '0 0 10px rgba(0, 255, 163, 0.5)'
                                            }}>
                                                ${parseFloat(offer.price).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Botones de navegación */}
                            {offers.length > 4 && (
                                <>
                                    <button
                                        className="carousel-btn prev"
                                        onClick={prevSlide}
                                        style={{
                                            position: 'absolute',
                                            left: '-20px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            zIndex: 10
                                        }}
                                    >
                                        <ChevronLeft size={24} />
                                    </button>

                                    <button
                                        className="carousel-btn next"
                                        onClick={nextSlide}
                                        style={{
                                            position: 'absolute',
                                            right: '-20px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            zIndex: 10
                                        }}
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Indicadores */}
                        {offers.length > 4 && (
                            <div className="carousel-indicators">
                                {Array.from({ length: Math.ceil(offers.length / 4) }).map((_, index) => (
                                    <button
                                        key={index}
                                        className={`indicator ${index === Math.floor(currentSlide / 4) ? 'active' : ''}`}
                                        onClick={() => setCurrentSlide(index * 4)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
