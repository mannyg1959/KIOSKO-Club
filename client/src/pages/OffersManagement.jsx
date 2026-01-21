import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { executeWithRetry, handleSupabaseError } from '../lib/supabaseHelpers';
import { Tag, Plus, Edit2, Trash2, Check, X, Package, Image as ImageIcon } from 'lucide-react';

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
                    timeout: 5000
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
                    timeout: 5000
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
                // Update
                const { error } = await supabase
                    .from('offers')
                    .update({ ...offerData, updated_at: new Date().toISOString() })
                    .eq('id', editingOffer.id);

                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('offers')
                    .insert([offerData]);

                if (error) throw error;
            }

            // Reset form and refresh
            resetForm();
            fetchOffers();
        } catch (err) {
            console.error('Error saving offer:', err);
            setError('Error al guardar la oferta: ' + err.message);
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
            fetchOffers();
        } catch (err) {
            console.error('Error deleting offer:', err);
            setError('Error al eliminar la oferta');
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

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Por favor selecciona un archivo de imagen válido');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setError('La imagen es muy grande. Máximo 2MB');
            return;
        }

        setUploadingImage(true);
        setError(null);

        try {
            // Convert to base64
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image_url: reader.result });
                setUploadingImage(false);
            };
            reader.onerror = () => {
                setError('Error al cargar la imagen');
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
        <div className="entry-container">
            <div className="entry-header">
                <div className="entry-title-group">
                    <h2 className="entry-title">Actualización de Ofertas</h2>
                    <p className="entry-subtitle">Gestiona las ofertas y promociones del kiosko</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn btn-primary"
                >
                    {showForm ? <X size={18} /> : <Plus size={18} />}
                    {showForm ? 'Cancelar' : 'Nueva Oferta'}
                </button>
            </div>

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

            {showForm && (
                <div className="entry-card" style={{ marginBottom: '2rem' }}>
                    <h3 className="entry-form-title">
                        {editingOffer ? 'Editar Oferta' : 'Nueva Oferta'}
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                            <div className="input-group">
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

                            <div className="input-group">
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

                            <div className="input-group">
                                <label className="input-label">Imagen de la Oferta</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {/* Preview de imagen */}
                                    {formData.image_url && (
                                        <div style={{ position: 'relative', display: 'inline-block', maxWidth: '200px' }}>
                                            <img
                                                src={formData.image_url}
                                                alt="Preview"
                                                style={{
                                                    width: '100%',
                                                    maxWidth: '200px',
                                                    height: '120px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(0, 242, 255, 0.3)'
                                                }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, image_url: '' })}
                                                style={{
                                                    position: 'absolute',
                                                    top: '-8px',
                                                    right: '-8px',
                                                    background: 'rgba(255, 0, 100, 0.9)',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '28px',
                                                    height: '28px',
                                                    cursor: 'pointer',
                                                    color: 'white',
                                                    fontSize: '18px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 'bold'
                                                }}
                                                title="Quitar imagen"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        {/* Botón subir archivo */}
                                        <label style={{
                                            flex: 1,
                                            padding: '0.75rem 1rem',
                                            background: 'rgba(0, 242, 255, 0.1)',
                                            border: '1px solid rgba(0, 242, 255, 0.3)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            textAlign: 'center',
                                            color: 'var(--neon-cyan)',
                                            transition: 'all 0.2s',
                                            fontWeight: '500'
                                        }}
                                            onMouseEnter={(e) => e.target.style.background = 'rgba(0, 242, 255, 0.2)'}
                                            onMouseLeave={(e) => e.target.style.background = 'rgba(0, 242, 255, 0.1)'}
                                        >
                                            {uploadingImage ? 'Cargando...' : '📁 Subir Archivo'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                style={{ display: 'none' }}
                                                disabled={uploadingImage}
                                            />
                                        </label>

                                        {/* Separador */}
                                        <span style={{ color: 'var(--text-dim)', fontSize: '0.875rem', fontWeight: '500' }}>
                                            o
                                        </span>

                                        {/* Input URL */}
                                        <input
                                            type="url"
                                            className="input-field"
                                            style={{ flex: 2 }}
                                            value={formData.image_url?.startsWith('data:') ? '' : formData.image_url}
                                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                            placeholder="🔗 Pegar URL de imagen"
                                            disabled={uploadingImage}
                                        />
                                    </div>

                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>
                                        Sube una imagen desde tu computadora o pega una URL externa (máx. 2MB)
                                    </p>
                                </div>
                            </div>

                            <div className="input-group">
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

                        <div className="input-group" style={{ marginTop: '1rem' }}>
                            <label className="input-label">Productos Incluidos * (Selecciona uno o más)</label>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '0.5rem',
                                maxHeight: '300px',
                                overflowY: 'auto',
                                padding: '1rem',
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid rgba(0, 242, 255, 0.2)'
                            }}>
                                {products.map((product) => (
                                    <label
                                        key={product.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.5rem',
                                            background: formData.product_ids.includes(product.id)
                                                ? 'rgba(0, 242, 255, 0.1)'
                                                : 'rgba(255, 255, 255, 0.02)',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            border: formData.product_ids.includes(product.id)
                                                ? '1px solid rgba(0, 242, 255, 0.3)'
                                                : '1px solid transparent',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.product_ids.includes(product.id)}
                                            onChange={() => toggleProductSelection(product.id)}
                                            style={{ accentColor: 'var(--neon-cyan)' }}
                                        />
                                        <span style={{
                                            fontSize: '0.875rem',
                                            color: formData.product_ids.includes(product.id)
                                                ? 'var(--neon-cyan)'
                                                : 'var(--text-main)'
                                        }}>
                                            {product.name} (${parseFloat(product.price).toFixed(2)})
                                        </span>
                                    </label>
                                ))}
                            </div>
                            {formData.product_ids.length === 1 && (
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                                    💡 Tip: Al seleccionar un solo producto, el nombre y precio se autocompletarán
                                </p>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button type="submit" className="btn btn-success">
                                <Check size={18} />
                                {editingOffer ? 'Actualizar' : 'Guardar'} Oferta
                            </button>
                            <button type="button" onClick={resetForm} className="btn btn-secondary">
                                <X size={18} />
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="loading-text" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    Cargando ofertas...
                </div>
            ) : loadError ? (
                <div style={{
                    background: 'rgba(255, 77, 77, 0.1)',
                    backdropFilter: 'blur(var(--blur-std))',
                    border: '1px solid rgba(255, 77, 77, 0.3)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <Tag size={48} style={{ margin: '0 auto 1rem', opacity: 0.7, color: '#ff4d4d' }} />
                    <h3 style={{ color: '#ff4d4d', marginBottom: '0.5rem' }}>Error al cargar datos</h3>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>{loadError}</p>
                    <button
                        onClick={fetchData}
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
                <div className="no-movements" style={{
                    background: 'var(--bg-glass)',
                    backdropFilter: 'blur(var(--blur-std))',
                    border: 'var(--glass-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '3rem 2rem',
                    textAlign: 'center'
                }}>
                    <Tag size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: 'var(--text-dim)' }} />
                    <p style={{ color: 'var(--text-dim)' }}>No hay ofertas registradas aún.</p>
                </div>
            ) : (
                <div className="entry-table-container">
                    <table className="entry-table">
                        <thead>
                            <tr>
                                <th>Imagen</th>
                                <th>Nombre</th>
                                <th>Productos</th>
                                <th>Precio</th>
                                <th>Estado</th>
                                <th>Creada</th>
                                <th style={{ textAlign: 'center' }}>Acciones</th>
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
                                                    width: '60px',
                                                    height: '60px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(0, 242, 255, 0.2)'
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '60px',
                                                height: '60px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                borderRadius: '8px',
                                                border: '1px dashed rgba(0, 242, 255, 0.2)'
                                            }}>
                                                <ImageIcon size={24} style={{ color: 'var(--text-dim)' }} />
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ fontWeight: 600, color: 'var(--text-pure)' }}>
                                        {offer.name}
                                    </td>
                                    <td style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                                        {getProductNames(offer.product_ids || [])}
                                    </td>
                                    <td>
                                        <span style={{
                                            background: 'rgba(0, 255, 163, 0.1)',
                                            color: 'var(--neon-green)',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '6px',
                                            fontSize: '0.875rem',
                                            fontWeight: 'bold',
                                            border: '1px solid rgba(0, 255, 163, 0.2)'
                                        }}>
                                            ${parseFloat(offer.price).toFixed(2)}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            border: '1px solid',
                                            background: offer.is_active ? 'rgba(0, 255, 163, 0.1)' : 'rgba(255, 0, 100, 0.1)',
                                            color: offer.is_active ? 'var(--neon-green)' : '#ff0066',
                                            borderColor: offer.is_active ? 'rgba(0, 255, 163, 0.3)' : 'rgba(255, 0, 100, 0.3)'
                                        }}>
                                            {offer.is_active ? 'ACTIVA' : 'INACTIVA'}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                                        {new Date(offer.created_at).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => handleEdit(offer)}
                                                className="entry-action-btn edit"
                                                title="Editar"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(offer.id)}
                                                className="entry-action-btn delete"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="7" className="entry-total-footer">
                                    Total Ofertas: {offers.length} | Activas: {offers.filter(o => o.is_active).length}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
};

export default OffersManagement;
