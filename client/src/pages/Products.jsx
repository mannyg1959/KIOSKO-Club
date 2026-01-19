import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Package, Plus } from 'lucide-react';

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
        <div className="entry-container">
            <div className="entry-header">
                <div className="entry-title-group">
                    <h2 className="entry-title">Registrar Producto</h2>
                    <p className="entry-subtitle">Añade nuevos productos al catálogo</p>
                </div>
                <Link
                    to="/products-list"
                    className="btn btn-primary"
                >
                    <Package size={18} />
                    Ver Productos
                </Link>
            </div>

            <div className="entry-card" style={{ maxWidth: '600px' }}>
                <h3 className="entry-form-title">Datos del Producto</h3>

                {error && (
                    <div style={{
                        background: 'rgba(255, 0, 100, 0.1)',
                        border: '1px solid rgba(255, 0, 100, 0.3)',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        color: '#ff0066'
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        background: 'rgba(0, 255, 163, 0.1)',
                        border: '1px solid rgba(0, 255, 163, 0.3)',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        color: 'var(--neon-green)'
                    }}>
                        ✓ Producto creado exitosamente
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
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

                    <div className="input-group">
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

                    <div className="input-group">
                        <label className="input-label">URL de Imagen (Opcional)</label>
                        <input
                            type="url"
                            placeholder="https://ejemplo.com/imagen.jpg"
                            className="input-field"
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                            Puedes agregar una imagen del producto para usarla en ofertas
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-success"
                        style={{ marginTop: '1rem', width: '100%' }}
                        disabled={loading}
                    >
                        <Plus size={18} />
                        {loading ? 'Guardando...' : 'Agregar Producto'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Products;
