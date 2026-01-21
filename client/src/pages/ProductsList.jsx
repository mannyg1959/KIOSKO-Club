import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { executeWithRetry, handleSupabaseError } from '../lib/supabaseHelpers';
import { Edit2, Trash2, Check, X, ArrowLeft, Package, Image as ImageIcon } from 'lucide-react';

const ProductsList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', price: '', image_url: '' });
    const [deleteError, setDeleteError] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchProducts = async () => {
            console.log('[fetchProducts] Iniciando...');

            if (isMounted) {
                setLoading(true);
                setError(null);
            }

            try {
                console.log('[fetchProducts] Obteniendo productos...');
                const result = await executeWithRetry(
                    () => supabase
                        .from('products')
                        .select('*')
                        .order('name'),
                    {
                        maxRetries: 2,
                        timeout: 5000
                    }
                );

                console.log('[fetchProducts] Productos obtenidos:', result.data?.length || 0);
                if (isMounted) setProducts(result.data || []);
            } catch (err) {
                console.error('[fetchProducts] Error:', err);
                const errorMessage = handleSupabaseError(err);
                if (isMounted) {
                    setError(errorMessage);
                    setProducts([]);
                }
            } finally {
                console.log('[fetchProducts] Finalizando, setLoading(false)');
                if (isMounted) setLoading(false);
            }
        };

        fetchProducts();

        return () => {
            isMounted = false;
        };
    }, []);

    const startEdit = (product) => {
        setEditingProduct(product.id);
        setEditForm({
            name: product.name || '',
            price: product.price?.toString() || '',
            image_url: product.image_url || ''
        });
        setDeleteError(null);
    };

    const cancelEdit = () => {
        setEditingProduct(null);
        setEditForm({ name: '', price: '', image_url: '' });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setDeleteError('Por favor selecciona un archivo de imagen válido');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setDeleteError('La imagen es muy grande. Máximo 2MB');
            return;
        }

        setUploadingImage(true);
        setDeleteError(null);

        try {
            // Convert to base64
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditForm({ ...editForm, image_url: reader.result });
                setUploadingImage(false);
            };
            reader.onerror = () => {
                setDeleteError('Error al cargar la imagen');
                setUploadingImage(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error('Error uploading image:', err);
            setDeleteError('Error al cargar la imagen: ' + err.message);
            setUploadingImage(false);
        }
    };


    const saveEdit = async (productId) => {
        setSaving(true);
        setDeleteError(null);

        console.log('Saving product:', productId);
        console.log('Form data:', editForm);

        try {
            // Validate data
            if (!editForm.name || !editForm.price) {
                throw new Error('Nombre y precio son requeridos');
            }

            const updateData = {
                name: editForm.name,
                price: parseFloat(editForm.price),
                image_url: editForm.image_url?.trim() || null
            };

            console.log('Update data:', updateData);

            const { data, error } = await supabase
                .from('products')
                .update(updateData)
                .eq('id', productId)
                .select();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Update successful:', data);

            // Update local state
            setProducts(products.map(p =>
                p.id === productId
                    ? { ...p, ...updateData }
                    : p
            ));
            setEditingProduct(null);
            setEditForm({ name: '', price: '', image_url: '' });
        } catch (err) {
            console.error('Error updating product:', err);
            setDeleteError('Error al actualizar: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const deleteProduct = async (product) => {
        setDeleteError(null);

        // Confirm deletion
        if (!confirm(`¿Estás seguro de eliminar el producto ${product.name}?`)) {
            return;
        }

        try {
            // Check if product is used in offers
            const { data: offers, error: offersError } = await supabase
                .from('offers')
                .select('id, name, product_ids')
                .contains('product_ids', [product.id])
                .limit(1);

            if (offersError) throw offersError;

            if (offers && offers.length > 0) {
                setDeleteError(`No se puede eliminar "${product.name}" porque está incluido en ofertas activas.`);
                return;
            }

            // Delete product
            const { error: deleteError } = await supabase
                .from('products')
                .delete()
                .eq('id', product.id);

            if (deleteError) throw deleteError;

            // Update local state
            setProducts(products.filter(p => p.id !== product.id));

        } catch (err) {
            setDeleteError('Error al eliminar: ' + err.message);
        }
    };

    return (
        <div className="entry-container">
            <div className="entry-header">
                <div className="entry-title-group">
                    <h2 className="entry-title">Catálogo de Productos</h2>
                    <p className="entry-subtitle">Gestión completa de productos del kiosko</p>
                </div>
                <Link to="/products" className="btn btn-secondary">
                    <ArrowLeft size={18} />
                    Volver a Registro
                </Link>
            </div>

            {deleteError && (
                <div style={{
                    background: 'rgba(255, 0, 100, 0.1)',
                    border: '1px solid rgba(255, 0, 100, 0.3)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    color: '#ff0066'
                }}>
                    {deleteError}
                </div>
            )}

            {saving && (
                <div style={{
                    background: 'rgba(0, 242, 255, 0.1)',
                    border: '1px solid rgba(0, 242, 255, 0.3)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    color: 'var(--neon-cyan)',
                    textAlign: 'center'
                }}>
                    Guardando cambios...
                </div>
            )}

            {loading ? (
                <div className="loading-text" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
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
            ) : products.length === 0 ? (
                <div className="no-movements" style={{
                    background: 'var(--bg-glass)',
                    backdropFilter: 'blur(var(--blur-std))',
                    border: 'var(--glass-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '3rem 2rem',
                    textAlign: 'center'
                }}>
                    <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: 'var(--text-dim)' }} />
                    <p style={{ color: 'var(--text-dim)' }}>No hay productos registrados aún.</p>
                </div>
            ) : (
                <div className="entry-table-container">
                    <table className="entry-table">
                        <thead>
                            <tr>
                                <th>Imagen</th>
                                <th>Nombre</th>
                                <th>Precio</th>
                                <th>Registrado</th>
                                <th style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id}>
                                    {editingProduct === product.id ? (
                                        <>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '180px' }}>
                                                    {/* Preview de imagen */}
                                                    {editForm.image_url && (
                                                        <div style={{ position: 'relative' }}>
                                                            <img
                                                                src={editForm.image_url}
                                                                alt="Preview"
                                                                style={{
                                                                    width: '100%',
                                                                    maxWidth: '120px',
                                                                    height: '80px',
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
                                                                onClick={() => setEditForm({ ...editForm, image_url: '' })}
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '-5px',
                                                                    right: '-5px',
                                                                    background: 'rgba(255, 0, 100, 0.9)',
                                                                    border: 'none',
                                                                    borderRadius: '50%',
                                                                    width: '20px',
                                                                    height: '20px',
                                                                    cursor: 'pointer',
                                                                    color: 'white',
                                                                    fontSize: '12px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                                title="Quitar imagen"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Botón subir archivo */}
                                                    <label style={{
                                                        padding: '0.4rem 0.6rem',
                                                        background: 'rgba(0, 242, 255, 0.1)',
                                                        border: '1px solid rgba(0, 242, 255, 0.3)',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem',
                                                        textAlign: 'center',
                                                        color: 'var(--neon-cyan)',
                                                        transition: 'all 0.2s'
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
                                                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                                                        o
                                                    </div>

                                                    {/* Input URL */}
                                                    <input
                                                        type="url"
                                                        className="input-field"
                                                        style={{ padding: '0.4rem', margin: 0, fontSize: '0.75rem' }}
                                                        value={editForm.image_url?.startsWith('data:') ? '' : editForm.image_url}
                                                        onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                                                        placeholder="🔗 Pegar URL"
                                                        disabled={uploadingImage}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="input-field"
                                                    style={{ padding: '0.5rem', margin: 0 }}
                                                    value={editForm.name}
                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    placeholder="Nombre"
                                                    autoFocus
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="input-field"
                                                    style={{ padding: '0.5rem', margin: 0 }}
                                                    value={editForm.price}
                                                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                                    placeholder="Precio"
                                                />
                                            </td>
                                            <td style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                                                {new Date(product.created_at).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => saveEdit(product.id)}
                                                        className="entry-action-btn edit"
                                                        style={{ color: 'var(--neon-green)' }}
                                                        title="Guardar"
                                                        disabled={saving}
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="entry-action-btn delete"
                                                        style={{ color: '#ff0066' }}
                                                        title="Cancelar"
                                                        disabled={saving}
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>
                                                {product.image_url ? (
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.name}
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
                                                {product.name}
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
                                                    ${parseFloat(product.price).toFixed(2)}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                                                {new Date(product.created_at).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => startEdit(product)}
                                                        className="entry-action-btn edit"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteProduct(product)}
                                                        className="entry-action-btn delete"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="5" className="entry-total-footer">
                                    Total Productos: {products.length}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ProductsList;
