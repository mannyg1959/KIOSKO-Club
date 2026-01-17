import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Plus, Trash2, Tag } from 'lucide-react';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({ name: '', price: '', stock: '' });
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data);
        } catch (error) {
            setFetchError(error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('products')
                .insert([{
                    name: formData.name,
                    price: parseFloat(formData.price),
                    stock: parseInt(formData.stock) || 0
                }]);

            if (error) throw error;

            setFormData({ name: '', price: '', stock: '' });
            fetchProducts();
        } catch (error) {
            alert('Error creating product: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            alert('Error deleting product: ' + error.message);
        }
    };

    return (
        <div className="entry-container">
            <div className="entry-header">
                <div className="entry-title-group">
                    <h2 className="entry-title">Gestión de Productos</h2>
                    <p className="entry-subtitle">Administra tu inventario de productos</p>
                </div>
            </div>

            <div className="entry-grid-sidebar">
                {/* Form Section */}
                <div>
                    <div className="entry-card sticky top-6">
                        <h3 className="entry-form-title">Nuevo Producto</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label className="input-label">Nombre del Producto</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Empanada"
                                    className="input-field"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Precio ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="input-field"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Stock Inicial</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="input-field"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-primary w-full justify-center"
                                style={{ marginTop: '1rem', padding: '1rem' }}
                                disabled={loading}
                            >
                                <Plus size={18} />
                                {loading ? 'Guardando...' : 'Agregar Producto'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div>
                    <div className="entry-card h-full flex flex-col">
                        <h3 className="entry-form-title">Inventario Actual</h3>
                        {fetchError && <div className="p-3 mb-4 text-red-600 bg-red-50 rounded-lg">{fetchError}</div>}

                        <div className="flex-1 overflow-hidden">
                            {products.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Package size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No hay productos registrados.</p>
                                </div>
                            ) : (
                                <div className="entry-table-container">
                                    <table className="entry-table">
                                        <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th>Precio</th>
                                                <th>Stock</th>
                                                <th className="text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.map((product) => (
                                                <tr key={product.id}>
                                                    <td className="font-semibold">{product.name}</td>
                                                    <td className="font-bold text-gray-800">${product.price}</td>
                                                    <td>
                                                        <span className={`px-2 py-1 rounded text-sm ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {product.stock} un.
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
                                                            className="entry-action-btn delete"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Products;
