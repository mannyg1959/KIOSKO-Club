import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { executeWithRetry, handleSupabaseError } from '../lib/supabaseHelpers';
import { Tag, Plus, Edit2, Trash2, Check, X, Image as ImageIcon } from 'lucide-react';

const OffersManagement = () => {
    const [offers, setOffers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        image_url: '',
        product_ids: [],
        is_active: true
    });
    const [error, setError] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const fetchData = async () => {
        console.log('[fetchData] Iniciando...');

        setLoading(true);
        setLoadError(null);

        try {
            console.log('[fetchData] Obteniendo ofertas...');
            const offersResult = await executeWithRetry(
                () => supabase
                    .from('offers')
                    .select('*')
                    .order('created_at', { ascending: false }),
                {
                    maxRetries: 2,
                    timeout: 30000
                }
            );

            console.log('[fetchData] Ofertas obtenidas:', offersResult.data?.length || 0);

            console.log('[fetchData] Obteniendo productos...');
            const productsResult = await executeWithRetry(
                () => supabase
                    .from('products')
                    .select('*')
                    .order('name'),
                {
                    maxRetries: 2,
                    timeout: 30000
                }
            );

            console.log('[fetchData] Productos obtenidos:', productsResult.data?.length || 0);

            setOffers(offersResult.data || []);
            setProducts(productsResult.data || []);
        } catch (err) {
            console.error('[fetchData] Error:', err);
            const errorMessage = handleSupabaseError(err);
            setLoadError(errorMessage);
            setOffers([]);
            setProducts([]);
        } finally {
            console.log('[fetchData] Finalizando, setLoading(false)');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validaciones
        if (!formData.name.trim()) {
            setError('El nombre es requerido');
            return;
        }
        if (!formData.price || parseFloat(formData.price) <= 0) {
            setError('El precio debe ser mayor a 0');
            return;
        }
        if (formData.product_ids.length === 0) {
            setError('Debe seleccionar al menos un producto');
            return;
        }

        try {
            const offerData = {
                name: formData.name,
                price: parseFloat(formData.price),
                image_url: formData.image_url || null,
                product_ids: formData.product_ids,
                is_active: formData.is_active
            };

            if (editingOffer) {
                const { error } = await supabase
                    .from('offers')
                    .update(offerData)
                    .eq('id', editingOffer.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('offers')
                    .insert([offerData]);

                if (error) throw error;
            }

            resetForm();
            fetchData();
        } catch (err) {
            setError('Error al guardar: ' + err.message);
        }
    };

    const handleEdit = (offer) => {
        setEditingOffer(offer);
        setFormData({
            name: offer.name,
            price: offer.price.toString(),
            image_url: offer.image_url || '',
            product_ids: offer.product_ids || [],
            is_active: offer.is_active
        });
        setShowForm(true);
        setError(null);
    };

    const handleDelete = async (offerId) => {
        if (!confirm('¿Estás seguro de eliminar esta oferta?')) return;

        try {
            const { error } = await supabase
                .from('offers')
                .delete()
                .eq('id', offerId);

            if (error) throw error;
            fetchData();
        } catch (err) {
            alert('Error al eliminar: ' + err.message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            price: '',
            image_url: '',
            product_ids: [],
            is_active: true
        });
        setEditingOffer(null);
        setShowForm(false);
        setError(null);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            setError('La imagen no puede superar 2MB');
            return;
        }

        try {
            setUploadingImage(true);
            // Convert to base64
            const reader = new FileReader();
            reader.onload = () => {
                setFormData({ ...formData, image_url: reader.result });
                setUploadingImage(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error('Error uploading image:', err);
            setError('Error al cargar la imagen: ' + err.message);
            setUploadingImage(false);
        }
    };

    const toggleProductSelection = (productId) => {
        setFormData(prev => ({
            ...prev,
            product_ids: prev.product_ids.includes(productId)
                ? prev.product_ids.filter(id => id !== productId)
                : [...prev.product_ids, productId]
        }));
    };

    const autoFillFromProduct = () => {
        if (formData.product_ids.length === 1) {
            const product = products.find(p => p.id === formData.product_ids[0]);
            if (product) {
                setFormData(prev => ({
                    ...prev,
                    name: product.name,
                    price: product.price.toString(),
                    image_url: product.image_url || ''
                }));
            }
        }
    };

    useEffect(() => {
        if (formData.product_ids.length === 1 && !editingOffer) {
            autoFillFromProduct();
        }
    }, [formData.product_ids]);

    const getProductNames = (productIds) => {
        return productIds
            .map(id => products.find(p => p.id === id)?.name)
            .filter(Boolean)
            .join(', ');
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Main Card */}
            <div className="card" style={{ maxWidth: '100%', margin: '0 auto', width: '100%' }}>
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            Actualización de Ofertas
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Gestiona las ofertas y promociones del kiosko
                        </p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="btn btn-primary"
                    >
                        {showForm ? <X size={20} /> : <Plus size={20} />}
                        {showForm ? 'Cancelar' : 'Nueva Oferta'}
                    </button>
                </div>

                {/* Form Modal (cuando showForm es true) */}
                {showForm && (
                    <div style={{
                        marginBottom: '2rem',
                        padding: '1.5rem',
                        background: '#F8FAFC',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                            {editingOffer ? 'Editar Oferta' : 'Nueva Oferta'}
                        </h3>

                        {error && (
                            <div className="error-message mb-4">{error}</div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                <div className="mb-4">
                                    <label className="input-label">Nombre de la Oferta *</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej: Combo Snack"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="input-label">Precio *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input-field"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="input-label">Estado</label>
                                    <select
                                        className="input-field"
                                        value={formData.is_active.toString()}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                                    >
                                        <option value="true">Activa</option>
                                        <option value="false">Inactiva</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="input-label">Imagen (Opcional)</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="url"
                                        className="input-field"
                                        value={formData.image_url}
                                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                        placeholder="https://ejemplo.com/imagen.jpg o sube archivo"
                                        style={{ flex: 1 }}
                                    />
                                    <label className="btn btn-secondary" style={{ margin: 0, cursor: 'pointer' }}>
                                        📷 Subir
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="input-label">Productos Incluidos * (Selecciona uno o más)</label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                    gap: '0.5rem',
                                    maxHeight: '250px',
                                    overflowY: 'auto',
                                    padding: '1rem',
                                    background: 'white',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    {products.map((product) => (
                                        <label
                                            key={product.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.5rem',
                                                background: formData.product_ids.includes(product.id) ? 'var(--primary-light)' : 'transparent',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                border: formData.product_ids.includes(product.id) ? '1px solid var(--primary)' : '1px solid transparent',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.product_ids.includes(product.id)}
                                                onChange={() => toggleProductSelection(product.id)}
                                                style={{ width: '16px', height: '16px' }}
                                            />
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                                {product.name} (${parseFloat(product.price).toFixed(2)})
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary">
                                    <Check size={20} />
                                    {editingOffer ? 'Actualizar' : 'Guardar'} Oferta
                                </button>
                                <button type="button" onClick={resetForm} className="btn btn-secondary">
                                    <X size={20} />
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Table Section */}
                {loading ? (
                    <div className="text-center p-12 text-secondary">Cargando ofertas...</div>
                ) : loadError ? (
                    <div className="text-center p-8 text-error">{loadError}</div>
                ) : offers.length === 0 ? (
                    <div className="text-center p-12 text-secondary">
                        <Tag size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No hay ofertas registradas aún.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table style={{ fontSize: '0.85rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '80px', fontSize: '0.75rem' }}>IMAGEN</th>
                                    <th style={{ fontSize: '0.75rem' }}>NOMBRE</th>
                                    <th style={{ fontSize: '0.75rem' }}>PRODUCTOS</th>
                                    <th style={{ width: '100px', fontSize: '0.75rem' }}>PRECIO</th>
                                    <th style={{ width: '100px', fontSize: '0.75rem' }}>ESTADO</th>
                                    <th style={{ width: '110px', fontSize: '0.75rem' }}>CREADA</th>
                                    <th style={{ width: '120px', textAlign: 'center', fontSize: '0.75rem' }}>ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {offers.map((offer) => (
                                    <tr key={offer.id}>
                                        <td>
                                            {offer.image_url ? (
                                                <img
                                                    src={offer.image_url}
                                                    alt={offer.name}
                                                    style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        objectFit: 'cover',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--border-color)'
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: '#F1F5F9',
                                                    borderRadius: '8px',
                                                    border: '1px dashed var(--border-color)'
                                                }}>
                                                    <ImageIcon size={20} style={{ color: 'var(--text-secondary)' }} />
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                            {offer.name}
                                        </td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {getProductNames(offer.product_ids || [])}
                                        </td>
                                        <td>
                                            <span style={{
                                                background: 'var(--success-light)',
                                                color: 'var(--success)',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '6px',
                                                fontSize: '0.85rem',
                                                fontWeight: '600'
                                            }}>
                                                ${parseFloat(offer.price).toFixed(2)}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '6px',
                                                fontSize: '0.7rem',
                                                fontWeight: '600',
                                                background: offer.is_active ? 'var(--success-light)' : 'var(--error-light)',
                                                color: offer.is_active ? 'var(--success)' : 'var(--error)'
                                            }}>
                                                {offer.is_active ? 'ACTIVA' : 'INACTIVA'}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                            {new Date(offer.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => handleEdit(offer)}
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.4rem 0.6rem', minWidth: 'auto', height: 'auto' }}
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(offer.id)}
                                                    className="btn btn-danger"
                                                    style={{ padding: '0.4rem 0.6rem', minWidth: 'auto', height: 'auto' }}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', padding: '1rem' }}>
                                        Total Ofertas: {offers.length} | Activas: {offers.filter(o => o.is_active).length}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OffersManagement;
