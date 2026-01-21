import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { executeWithRetry, handleSupabaseError } from '../lib/supabaseHelpers';
import { Package, ImageIcon } from 'lucide-react';

const ProductCatalog = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProducts = async () => {
        console.log('[fetchProducts] Iniciando...');

        setLoading(true);
        setError(null);

        try {
            console.log('[fetchProducts] Obteniendo productos...');
            const result = await executeWithRetry(
                () => supabase
                    .from('products')
                    .select('*')
                    .order('name'),
                {
                    maxRetries: 2,
                    timeout: 30000
                }
            );

            console.log('[fetchProducts] Productos obtenidos:', result.data?.length || 0);
            setProducts(result.data || []);
        } catch (err) {
            console.error('[fetchProducts] Error:', err);
            const errorMessage = handleSupabaseError(err);
            setError(errorMessage);
            setProducts([]);
        } finally {
            console.log('[fetchProducts] Finalizando, setLoading(false)');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    return (
        <div className="entry-container">
            <div className="entry-header">
                <div className="entry-title-group">
                    <h2 className="entry-title">Catálogo de Productos</h2>
                    <p className="entry-subtitle">Explora nuestros productos disponibles</p>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    Cargando productos...
                </div>
            ) : error ? (
                <div style={{
                    background: 'rgba(255, 77, 77, 0.1)',
                    backdropFilter: 'blur(var(--blur-std))',
                    border: '1px solid rgba(255, 77, 77, 0.3)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.7, color: '#ff4d4d' }} />
                    <h3 style={{ color: '#ff4d4d', marginBottom: '0.5rem' }}>Error al cargar productos</h3>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>{error}</p>
                    <button
                        onClick={fetchProducts}
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
            ) : products.length === 0 ? (
                <div style={{
                    background: 'var(--bg-glass)',
                    backdropFilter: 'blur(var(--blur-std))',
                    border: 'var(--glass-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '3rem 2rem',
                    textAlign: 'center'
                }}>
                    <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: 'var(--text-dim)' }} />
                    <p style={{ color: 'var(--text-dim)' }}>No hay productos disponibles en este momento.</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '1.5rem',
                    padding: '1rem 0'
                }}>
                    {products.map((product) => (
                        <div
                            key={product.id}
                            style={{
                                background: 'var(--bg-glass)',
                                backdropFilter: 'blur(var(--blur-std))',
                                border: 'var(--glass-border)',
                                borderRadius: 'var(--radius-lg)',
                                overflow: 'hidden',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 242, 255, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {/* Imagen del producto */}
                            <div style={{
                                width: '100%',
                                height: '200px',
                                background: 'rgba(0, 0, 0, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                            }}>
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            width: 'auto',
                                            height: 'auto',
                                            objectFit: 'contain'
                                        }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div style={{
                                    display: product.image_url ? 'none' : 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    color: 'var(--text-dim)'
                                }}>
                                    <ImageIcon size={48} />
                                    <p style={{ fontSize: '0.875rem' }}>Sin imagen</p>
                                </div>
                            </div>

                            {/* Información del producto */}
                            <div style={{
                                padding: '1.25rem',
                                textAlign: 'center'
                            }}>
                                <h3 style={{
                                    margin: 0,
                                    fontSize: '1.125rem',
                                    fontWeight: 'bold',
                                    color: 'var(--text-pure)',
                                    marginBottom: '0.75rem',
                                    lineHeight: 1.3,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    minHeight: '2.6em'
                                }}>
                                    {product.name}
                                </h3>
                                <p style={{
                                    margin: 0,
                                    fontSize: '1.75rem',
                                    fontWeight: 'bold',
                                    color: 'var(--neon-green)',
                                    textShadow: '0 0 10px rgba(0, 255, 163, 0.5)'
                                }}>
                                    ${parseFloat(product.price).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductCatalog;
