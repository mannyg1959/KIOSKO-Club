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
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="section-title mb-2">Catálogo de Productos</h2>
                    <p className="text-secondary">Explora nuestros productos disponibles</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center p-12 text-secondary">
                    Cargando productos...
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                    <Package size={48} className="mx-auto mb-4 text-red-400" />
                    <h3 className="text-red-600 font-bold mb-2">Error al cargar productos</h3>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={fetchProducts}
                        className="btn btn-primary"
                    >
                        Reintentar
                    </button>
                </div>
            ) : products.length === 0 ? (
                <div className="card text-center p-12">
                    <Package size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-secondary">No hay productos disponibles en este momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <div key={product.id} className="card p-0 overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                            {/* Imagen del producto */}
                            <div className="h-48 bg-gray-50 flex items-center justify-center p-4">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="max-w-full max-h-full object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    className="flex flex-col items-center justify-center gap-2 text-gray-400"
                                    style={{ display: product.image_url ? 'none' : 'flex' }}
                                >
                                    <ImageIcon size={32} />
                                    <span className="text-xs">Sin imagen</span>
                                </div>
                            </div>

                            {/* Información del producto */}
                            <div className="p-4 text-center">
                                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 min-h-[3rem]">
                                    {product.name}
                                </h3>
                                <p className="text-xl font-bold text-green-600">
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
