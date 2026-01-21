import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Package, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { executeWithRetry, handleSupabaseError } from '../lib/supabaseHelpers';
import '../styles/home.css';
import Banner01 from '../assets/Banner_01.png';

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
    const [itemsPerPage, setItemsPerPage] = useState(4);

    // Responsive items per page
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setItemsPerPage(1);
            } else if (window.innerWidth < 1024) {
                setItemsPerPage(2);
            } else {
                setItemsPerPage(4);
            }
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
    const fetchMovements = useCallback(async () => {
        console.log('[fetchMovements] Iniciando...', { hasProfile: !!profile, hasClientId: !!profile?.client?.id });

        if (!profile?.client?.id) {
            console.log('[fetchMovements] No hay client_id, terminando');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

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
                    timeout: 30000
                }
            );

            console.log('[fetchMovements] Count obtenido:', countResult.count);
            setTotalMovements(countResult.count || 0);

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
                    timeout: 30000
                }
            );

            console.log('[fetchMovements] Movimientos obtenidos:', movementsResult.data?.length || 0);
            setRecentMovements(movementsResult.data || []);
        } catch (error) {
            console.error('[fetchMovements] Error:', error);
            const errorMessage = handleSupabaseError(error);
            setError(errorMessage);
            setRecentMovements([]);
        } finally {
            console.log('[fetchMovements] Finalizando, setLoading(false)');
            setLoading(false);
        }
    }, [profile]);

    useEffect(() => {
        fetchMovements();
    }, [fetchMovements]);

    // Fetch ofertas activas
    const fetchOffers = useCallback(async () => {
        console.log('[fetchOffers] Iniciando...');

        setLoadingOffers(true);
        setOffersError(null);

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
                    timeout: 30000
                }
            );

            console.log('[fetchOffers] Ofertas obtenidas:', result.data?.length || 0);
            setOffers(result.data || []);
        } catch (error) {
            console.error('[fetchOffers] Error:', error);
            const errorMessage = handleSupabaseError(error);
            setOffersError(errorMessage);
            setOffers([]);
        } finally {
            console.log('[fetchOffers] Finalizando, setLoadingOffers(false)');
            setLoadingOffers(false);
        }
    }, []);

    useEffect(() => {
        fetchOffers();
    }, [fetchOffers]);

    const handleNextSlide = () => {
        setCurrentSlide((prev) => (prev >= offers.length - 1 ? 0 : prev + 1));
    };

    const handlePrevSlide = () => {
        setCurrentSlide((prev) => (prev <= 0 ? offers.length - 1 : prev - 1));
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
        <div className="flex flex-col gap-8">
            {/* Header de Bienvenida con Puntos + Banner */}
            <div className="home-welcome-header">
                {/* Tarjeta de Bienvenida */}
                <div className="card" style={{
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    height: '100%'
                }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem', color: 'white' }}>
                        ¡Hola {userDisplayName.split(' ')[0]}!!
                    </h1>
                    <div style={{ fontSize: '1rem', opacity: 0.9 }}>
                        Tienes acumulados <span style={{ fontSize: '2rem', fontWeight: '800', color: 'white', display: 'block', marginTop: '0.25rem' }}>
                            {points} Pts
                        </span>
                    </div>
                </div>

                {/* Banner Promocional */}
                <div style={{
                    borderRadius: 'var(--radius-xl)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-md)',
                    height: '100%'
                }}>
                    <img
                        src={Banner01}
                        alt="K-Point - Acumula, Canjea y Sonríe"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            display: 'block'
                        }}
                    />
                </div>
            </div>

            {/* Carrusel de Ofertas */}
            <div className="card">
                <h2 className="section-title">Ofertas Destacadas</h2>

                {loadingOffers ? (
                    <div className="text-center p-8 text-secondary">Cargando ofertas...</div>
                ) : offersError ? (
                    <div className="text-center p-8 text-error">{offersError}</div>
                ) : offers.length === 0 ? (
                    <div className="text-center p-8 text-secondary">No hay ofertas activas en este momento.</div>
                ) : (
                    <div style={{ position: 'relative' }}>
                        {/* Botón Anterior */}
                        {offers.length > itemsPerPage && (
                            <button
                                onClick={handlePrevSlide}
                                style={{
                                    position: 'absolute',
                                    left: '-20px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 10,
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    border: '2px solid var(--primary)',
                                    color: 'var(--primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: 'var(--shadow-md)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--primary)';
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'white';
                                    e.currentTarget.style.color = 'var(--primary)';
                                }}
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}

                        {/* Contenedor del Carrusel */}
                        <div style={{ overflow: 'hidden', padding: '0 10px' }}>
                            <div style={{
                                display: 'flex',
                                gap: '1rem',
                                transition: 'transform 0.5s ease-in-out',
                                transform: `translateX(calc(-${currentSlide * (100 / itemsPerPage)}% - ${currentSlide * (16 / itemsPerPage)}px))`
                            }}>
                                {offers.map((offer) => (
                                    <div key={offer.id} style={{
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '1rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        minWidth: `calc(${100 / itemsPerPage}% - ${(16 * (itemsPerPage - 1)) / itemsPerPage}px)`,
                                        flexShrink: 0
                                    }}>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            marginBottom: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: '#f8fafc',
                                            borderRadius: '50%'
                                        }}>
                                            {offer.image_url ? (
                                                <img src={offer.image_url} alt={offer.name} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <Package size={28} color="var(--primary)" />
                                            )}
                                        </div>
                                        <h3 style={{
                                            fontSize: '0.9rem',
                                            fontWeight: '600',
                                            marginBottom: '0.5rem',
                                            minHeight: '54px',
                                            lineHeight: '1.35',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            color: 'var(--text-primary)',
                                            width: '100%'
                                        }}>
                                            {offer.name}
                                        </h3>
                                        <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--success)' }}>
                                            ${parseFloat(offer.price).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Botón Siguiente */}
                        {offers.length > itemsPerPage && (
                            <button
                                onClick={handleNextSlide}
                                style={{
                                    position: 'absolute',
                                    right: '-20px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 10,
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    border: '2px solid var(--primary)',
                                    color: 'var(--primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: 'var(--shadow-md)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--primary)';
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'white';
                                    e.currentTarget.style.color = 'var(--primary)';
                                }}
                            >
                                <ChevronRight size={24} />
                            </button>
                        )}

                        {/* Indicadores de posición */}
                        {offers.length > itemsPerPage && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                marginTop: '1.5rem'
                            }}>
                                {offers.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentSlide(index)}
                                        style={{
                                            width: currentSlide === index ? '24px' : '8px',
                                            height: '8px',
                                            borderRadius: '4px',
                                            background: currentSlide === index ? 'var(--primary)' : '#d1d5db',
                                            border: 'none',
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
            <div className="card">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="section-title mb-0">Últimos Movimientos</h2>
                    {totalMovements > 10 && (
                        <Link to="/movements" className="btn btn-secondary btn-sm">
                            Ver Todos
                        </Link>
                    )}
                </div>

                {loading ? (
                    <div className="text-center p-8 text-secondary">Cargando movimientos...</div>
                ) : error ? (
                    <div className="text-center p-8 text-error">{error}</div>
                ) : recentMovements.length === 0 ? (
                    <div className="text-center p-8 text-secondary">No tienes movimientos registrados aún.</div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>DETALLE</th>
                                    <th className="text-right">MONTO</th>
                                    <th className="text-right">HORA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentMovements.map((movement) => (
                                    <tr key={movement.id}>
                                        <td className="font-medium">
                                            Compra en Kiosko
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ticket #{movement.id.slice(0, 8)}</div>
                                        </td>
                                        <td className="text-right font-bold" style={{ color: 'var(--success)' }}>
                                            ${parseFloat(movement.amount || 0).toFixed(2)}
                                        </td>
                                        <td className="text-right text-secondary text-sm">
                                            {formatDate(movement.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Botones de Acción */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/loyalty" className="btn btn-primary" style={{ padding: '1.5rem', fontSize: '1.1rem' }}>
                    <Gift size={24} />
                    Ver Catálogo de Premios
                </Link>
                <Link to="/catalog" className="btn btn-secondary" style={{ padding: '1.5rem', fontSize: '1.1rem' }}>
                    <Package size={24} />
                    Explorar Productos
                </Link>
            </div>
        </div>
    );
};

export default Home;
