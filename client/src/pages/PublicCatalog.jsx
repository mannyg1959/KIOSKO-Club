import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { executeWithRetry, handleSupabaseError } from '../lib/supabaseHelpers';
import { ArrowLeft, Package, Image as ImageIcon } from 'lucide-react';

const PublicCatalog = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);

        try {
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

            setProducts(result.data || []);
        } catch (err) {
            const errorMessage = handleSupabaseError(err);
            setError(errorMessage);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    return (
        <div className="flex flex-col gap-6">
            {/* Main Card */}
            <div className="card" style={{ maxWidth: '100%', margin: '0 auto', width: '100%' }}>
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            Catálogo de Productos
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Explora todos nuestros productos disponibles
                        </p>
                    </div>
                    <Link to="/" className="btn btn-secondary">
                        <ArrowLeft size={20} />
                        Volver al Inicio
                    </Link>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="text-center p-12 text-secondary">Cargando productos...</div>
                ) : error ? (
                    <div className="text-center p-8 text-error">{error}</div>
                ) : products.length === 0 ? (
                    <div className="text-center p-12 text-secondary">
                        <Package size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No hay productos disponibles en este momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                style={{
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease',
                                    cursor: 'default'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                {/* Product Image */}
                                <div style={{
                                    width: '120px',
                                    height: '120px',
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: '#f8fafc',
                                    borderRadius: 'var(--radius-md)',
                                    overflow: 'hidden'
                                }}>
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg></div>`;
                                            }}
                                        />
                                    ) : (
                                        <Package size={40} color="var(--text-secondary)" />
                                    )}
                                </div>

                                {/* Product Name */}
                                <h3 style={{
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    marginBottom: '0.75rem',
                                    color: 'var(--text-primary)',
                                    minHeight: '48px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {product.name}
                                </h3>

                                {/* Product Price */}
                                <div style={{
                                    background: 'var(--success-light)',
                                    color: 'var(--success)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '1.25rem',
                                    fontWeight: '700'
                                }}>
                                    ${parseFloat(product.price).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer with total count */}
                {!loading && !error && products.length > 0 && (
                    <div style={{
                        marginTop: '2rem',
                        padding: '1rem',
                        background: '#f8fafc',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: 'var(--text-secondary)'
                    }}>
                        Total de Productos: {products.length}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicCatalog;
