import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Package, Plus, List } from 'lucide-react';

const Products = () => {
    const [formData, setFormData] = useState({ name: '', price: '', image_url: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const { error } = await supabase
                .from('products')
                .insert([{
                    name: formData.name,
                    price: parseFloat(formData.price),
                    image_url: formData.image_url || null
                }]);

            if (error) throw error;

            setFormData({ name: '', price: '', image_url: '' });
            setSuccess(true);

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            setError('Error al crear producto: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Main Registration Card */}
            <div className="card" style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            Registrar Producto
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Añade nuevos productos al catálogo
                        </p>
                    </div>
                    <Link to="/products-list" className="btn btn-primary">
                        <List size={20} />
                        Ver Productos
                    </Link>
                </div>

                {/* Form Section */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                        Datos del Producto
                    </h3>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Success Message */}
                        {success && (
                            <div className="success-message mb-4">
                                ✓ Producto creado exitosamente
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="error-message mb-4">
                                {error}
                            </div>
                        )}

                        {/* Product Name */}
                        <div className="mb-4">
                            <label className="input-label">Nombre del Producto *</label>
                            <input
                                type="text"
                                placeholder="Ej: Coca Cola 500ml"
                                className="input-field"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        {/* Price */}
                        <div className="mb-4">
                            <label className="input-label">Precio ($) *</label>
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

                        {/* Image URL */}
                        <div className="mb-4">
                            <label className="input-label">URL de Imagen (Opcional)</label>
                            <input
                                type="url"
                                placeholder="https://ejemplo.com/imagen.jpg"
                                className="input-field"
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                Puedes agregar una imagen del producto para usarla en ofertas
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            style={{ height: '48px', fontSize: '1rem', marginTop: '1rem' }}
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : (
                                <>
                                    <Plus size={20} />
                                    Agregar Producto
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Products;
