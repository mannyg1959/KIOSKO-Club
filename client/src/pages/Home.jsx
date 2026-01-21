import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Package, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { executeWithRetry, handleSupabaseError } from '../lib/supabaseHelpers';
import '../styles/home.css';

const Home = () => {
    const { profile } = useAuth();
    const [recentMovements, setRecentMovements] = useState([]);
    const [totalMovements, setTotalMovements] = useState(0);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);
    const [offers, setOffers] = useState([]);
    const [loadingOffers, setLoadingOffers] = useState(true);
    const [userDisplayName, setUserDisplayName] = useState('Usuario');
    const [error, setError] = useState(null);
    const [offersError, setOffersError] = useState(null);

    // Datos del usuario
    const points = profile?.client?.points_balance || 0;

    // Obtener nombre del usuario (cliente o admin)
    useEffect(() => {
        const fetchUserName = async () => {
            if (!profile) return;

            try {
                // Si es cliente, obtener nombre de la tabla clients
                if (profile.client?.id) {
                    const result = await executeWithRetry(
                        () => supabase
                            .from('clients')
                            .select('name')
                            .eq('id', profile.client.id)
                            .single(),
                        {
                            maxRetries: 3,
                            timeout: 8000,
                            onError: (err) => console.error('Error obteniendo nombre de cliente:', err)
                        }
                    );

                    if (result.data?.name) {
                        setUserDisplayName(result.data.name);
                        return;
                    }
                }

                // Si es admin o no se encontró nombre de cliente, usar el nombre del perfil
                if (profile.full_name) {
                    setUserDisplayName(profile.full_name);
                } else if (profile.username) {
                    setUserDisplayName(profile.username);
                } else if (profile.email) {
                    setUserDisplayName(profile.email.split('@')[0]);
                }
            } catch (error) {
                console.error('Error fetching user name:', error);
                // Fallback al email
                if (profile.email) {
                    setUserDisplayName(profile.email.split('@')[0]);
                } else {
                    setUserDisplayName('Usuario');
                }
            }
        };

        fetchUserName();
    }, [profile]);

    // Fetch últimos movimientos del cliente
    useEffect(() => {
        let isMounted = true; // Para evitar actualizaciones de estado en componentes desmontados

        const fetchMovements = async () => {
            console.log('[fetchMovements] Iniciando...', { hasProfile: !!profile, hasClientId: !!profile?.client?.id });

            if (!profile?.client?.id) {
                console.log('[fetchMovements] No hay client_id, terminando');
                if (isMounted) setLoading(false);
                return;
            }

            if (isMounted) {
                setLoading(true);
                setError(null);
            }

            try {
                console.log('[fetchMovements] Obteniendo count...');
                // Obtener total de movimientos con reintentos
                const countResult = await executeWithRetry(
                    () => supabase
                        .from('sales')
                        .select('*', { count: 'exact', head: true })
                        .eq('client_id', profile.client.id),
                    {
                        maxRetries: 2,
                        timeout: 5000 // Reducido a 5 segundos
                    }
                );

                console.log('[fetchMovements] Count obtenido:', countResult.count);
                if (isMounted) setTotalMovements(countResult.count || 0);

                console.log('[fetchMovements] Obteniendo movimientos...');
                // Obtener últimos 10 movimientos con información del cliente
                const movementsResult = await executeWithRetry(
                    () => supabase
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
                        .limit(10),
                    {
                        maxRetries: 2,
                        timeout: 5000 // Reducido a 5 segundos
                    }
                );

                console.log('[fetchMovements] Movimientos obtenidos:', movementsResult.data?.length || 0);
                if (isMounted) setRecentMovements(movementsResult.data || []);
            } catch (error) {
                console.error('[fetchMovements] Error:', error);
                const errorMessage = handleSupabaseError(error);
                if (isMounted) {
                    setError(errorMessage);
                    setRecentMovements([]);
                }
            } finally {
                console.log('[fetchMovements] Finalizando, setLoading(false)');
                if (isMounted) setLoading(false);
            }
        };

        fetchMovements();

        return () => {
            isMounted = false; // Cleanup
        };
    }, [profile]);

    // Fetch ofertas activas
    useEffect(() => {
        let isMounted = true;

        const fetchOffers = async () => {
            console.log('[fetchOffers] Iniciando...');

            if (isMounted) {
                setLoadingOffers(true);
                setOffersError(null);
            }

            try {
                console.log('[fetchOffers] Obteniendo ofertas...');
                const result = await executeWithRetry(
                    () => supabase
                        .from('offers')
                        .select('*')
                        .eq('is_active', true)
                        .order('created_at', { ascending: false }),
                    {
                        maxRetries: 2,
                        timeout: 5000 // Reducido a 5 segundos
                    }
                );

                console.log('[fetchOffers] Ofertas obtenidas:', result.data?.length || 0);
                if (isMounted) setOffers(result.data || []);
            } catch (error) {
                console.error('[fetchOffers] Error:', error);
                const errorMessage = handleSupabaseError(error);
                if (isMounted) {
                    setOffersError(errorMessage);
                    setOffers([]);
                }
            } finally {
                console.log('[fetchOffers] Finalizando, setLoadingOffers(false)');
                if (isMounted) setLoadingOffers(false);
            }
        };

        fetchOffers();

        return () => {
            isMounted = false;
        };
    }, []);

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
            <div style={{
                textAlign: 'left',
                padding: '1rem 1.5rem',
                background: 'rgb(94, 29, 117)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                marginBottom: '1.5rem',
                boxShadow: '0 8px 32px rgba(94, 29, 117, 0.4)'
            }}>
                <h1 style={{ textAlign: 'left', color: '#ffffff', fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Bienvenido: <span style={{ color: 'rgb(40, 227, 3)', fontWeight: 'bold' }}>
                        {userDisplayName}
                    </span>
                </h1>
                <div style={{ textAlign: 'left', color: '#ffffff', fontSize: '1rem' }}>
                    Total puntos acumulados: <span style={{ color: 'rgb(40, 227, 3)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {points} Pts
                    </span>
                </div>
            </div>


            {/* Carrusel de Ofertas */}
            <div className="offers-section">
                <h2 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Combos y Productos en OFERTA !!</h2>

                {loadingOffers ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                        Cargando ofertas...
                    </div>
                ) : offersError ? (
                    <div style={{
                        background: 'rgba(255, 59, 48, 0.1)',
                        backdropFilter: 'blur(var(--blur-std))',
                        border: '1px solid rgba(255, 59, 48, 0.3)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '2rem',
                        textAlign: 'center'
                    }}>
                        <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: '#ff3b30' }} />
                        <p style={{ color: '#ff3b30', marginBottom: '0.5rem', fontWeight: '600' }}>Error al cargar ofertas</p>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>{offersError}</p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                marginTop: '1rem',
                                padding: '0.5rem 1rem',
                                background: 'var(--neon-cyan)',
                                color: 'var(--bg-dark)',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            Reintentar
                        </button>
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
                            padding: '1rem 0'
                        }}>
                            <div className="carousel-scroll" style={{
                                display: 'flex',
                                gap: '1rem',
                                transition: 'transform 0.5s ease-in-out',
                                transform: `translateX(-${currentSlide * 110}px)`
                            }}>
                                {offers.map((offer) => (
                                    <div
                                        key={offer.id}
                                        className="carousel-item"
                                        style={{
                                            flex: '0 0 100px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.5rem',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {/* Contenedor de imagen con fondo blanco */}
                                        <div style={{
                                            width: '100px',
                                            height: '100px',
                                            background: 'white',
                                            borderRadius: '15px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '0.75rem',
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
                                                <Package size={30} />
                                                <p style={{ fontSize: '0.625rem', margin: 0 }}>Sin imagen</p>
                                            </div>
                                        </div>

                                        {/* Información debajo */}
                                        <div style={{
                                            width: '100px',
                                            textAlign: 'left',
                                            minHeight: '40px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between'
                                        }}>
                                            <h3 style={{
                                                margin: 0,
                                                fontSize: offer.name.length > 40 ? '0.625rem' :
                                                    offer.name.length > 25 ? '0.6875rem' : '0.75rem',
                                                fontWeight: '600',
                                                color: 'var(--text-pure)',
                                                marginBottom: '0.25rem',
                                                lineHeight: 1.2,
                                                overflow: 'hidden',
                                                display: '-webkit-box',
                                                WebkitLineClamp: offer.name.length > 40 ? 4 :
                                                    offer.name.length > 25 ? 3 : 2,
                                                WebkitBoxOrient: 'vertical',
                                                textOverflow: 'ellipsis',
                                                wordBreak: 'break-word'
                                            }}>
                                                {offer.name}
                                            </h3>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '0.75rem',
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

                            {/* Botones de navegación - Siempre visibles */}
                            {offers.length > 1 && (
                                <>
                                    <button
                                        className="carousel-btn prev"
                                        onClick={prevSlide}
                                        style={{
                                            position: 'absolute',
                                            left: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            zIndex: 10,
                                            background: 'rgba(0, 200, 200, 0.9)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '40px',
                                            height: '40px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(0, 200, 200, 0.4)',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(0, 220, 220, 1)';
                                            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(0, 200, 200, 0.9)';
                                            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                                        }}
                                    >
                                        <ChevronLeft size={24} />
                                    </button>

                                    <button
                                        className="carousel-btn next"
                                        onClick={nextSlide}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            zIndex: 10,
                                            background: 'rgba(0, 200, 200, 0.9)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '40px',
                                            height: '40px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(0, 200, 200, 0.4)',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(0, 220, 220, 1)';
                                            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(0, 200, 200, 0.9)';
                                            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                                        }}
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Indicadores - Siempre visibles si hay más de 1 oferta */}
                        {offers.length > 1 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                marginTop: '1rem'
                            }}>
                                {offers.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentSlide(index)}
                                        style={{
                                            width: index === currentSlide ? '24px' : '8px',
                                            height: '8px',
                                            borderRadius: '4px',
                                            border: 'none',
                                            background: index === currentSlide ? 'rgba(0, 200, 200, 1)' : 'rgba(255, 255, 255, 0.3)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
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
                ) : error ? (
                    <div style={{
                        background: 'rgba(255, 59, 48, 0.1)',
                        backdropFilter: 'blur(var(--blur-std))',
                        border: '1px solid rgba(255, 59, 48, 0.3)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '2rem',
                        textAlign: 'center',
                        marginTop: '1rem'
                    }}>
                        <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: '#ff3b30' }} />
                        <p style={{ color: '#ff3b30', marginBottom: '0.5rem', fontWeight: '600' }}>Error al cargar movimientos</p>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                marginTop: '1rem',
                                padding: '0.5rem 1rem',
                                background: 'var(--neon-cyan)',
                                color: 'var(--bg-dark)',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            Reintentar
                        </button>
                    </div>
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
                <Link to="/catalog" className="action-btn">
                    <Package size={20} />
                    Ver Todos los Productos
                </Link>
            </div>
        </div>
    );
};

export default Home;
