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
                            Gestión completa de productos del kiosko
                        </p>
                    </div>
                    <Link to="/products" className="btn btn-secondary">
                        <ArrowLeft size={20} />
                        Volver a Registro
                    </Link>
                </div>

                {/* Error Messages */}
                {deleteError && (
                    <div className="error-message mb-4">{deleteError}</div>
                )}

                {saving && (
                    <div style={{
                        background: 'var(--info-light)',
                        color: 'var(--info)',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem',
                        textAlign: 'center',
                        fontWeight: '500'
                    }}>
                        Guardando cambios...
                    </div>
                )}

                {/* Table Section */}
                {loading ? (
                    <div className="text-center p-12 text-secondary">Cargando productos...</div>
                ) : error ? (
                    <div className="text-center p-8 text-error">{error}</div>
                ) : products.length === 0 ? (
                    <div className="text-center p-12 text-secondary">
                        <Package size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No hay productos registrados aún.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table style={{ fontSize: '0.85rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '80px', fontSize: '0.75rem' }}>IMAGEN</th>
                                    <th style={{ fontSize: '0.75rem' }}>NOMBRE</th>
                                    <th style={{ width: '120px', fontSize: '0.75rem' }}>PRECIO</th>
                                    <th style={{ width: '130px', fontSize: '0.75rem' }}>REGISTRADO</th>
                                    <th style={{ width: '120px', textAlign: 'center', fontSize: '0.75rem' }}>ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id}>
                                        {editingProduct === product.id ? (
                                            <>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '120px' }}>
                                                        {editForm.image_url && (
                                                            <div style={{ position: 'relative' }}>
                                                                <img
                                                                    src={editForm.image_url}
                                                                    alt="Preview"
                                                                    style={{
                                                                        width: '80px',
                                                                        height: '60px',
                                                                        objectFit: 'cover',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid var(--border-color)'
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
                                                                        background: 'var(--error)',
                                                                        border: 'none',
                                                                        borderRadius: '50%',
                                                                        width: '18px',
                                                                        height: '18px',
                                                                        cursor: 'pointer',
                                                                        color: 'white',
                                                                        fontSize: '11px',
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

                                                        <label style={{
                                                            padding: '0.3rem 0.5rem',
                                                            background: 'var(--primary-light)',
                                                            border: '1px solid var(--primary)',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.7rem',
                                                            textAlign: 'center',
                                                            color: 'var(--primary)'
                                                        }}>
                                                            {uploadingImage ? 'Subiendo...' : '📷 Subir'}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleImageUpload}
                                                                style={{ display: 'none' }}
                                                                disabled={uploadingImage}
                                                            />
                                                        </label>
                                                    </div>
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="input-field"
                                                        style={{ padding: '0.5rem', margin: 0, fontSize: '0.85rem' }}
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
                                                        style={{ padding: '0.5rem', margin: 0, fontSize: '0.85rem' }}
                                                        value={editForm.price}
                                                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                                        placeholder="Precio"
                                                    />
                                                </td>
                                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                    {new Date(product.created_at).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => saveEdit(product.id)}
                                                            className="btn btn-success"
                                                            style={{ padding: '0.4rem 0.6rem', minWidth: 'auto', height: 'auto' }}
                                                            title="Guardar"
                                                            disabled={saving}
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="btn btn-secondary"
                                                            style={{ padding: '0.4rem 0.6rem', minWidth: 'auto', height: 'auto' }}
                                                            title="Cancelar"
                                                            disabled={saving}
                                                        >
                                                            <X size={16} />
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
                                                    {product.name}
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
                                                        ${parseFloat(product.price).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                    {new Date(product.created_at).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => startEdit(product)}
                                                            className="btn btn-secondary"
                                                            style={{ padding: '0.4rem 0.6rem', minWidth: 'auto', height: 'auto' }}
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteProduct(product)}
                                                            className="btn btn-danger"
                                                            style={{ padding: '0.4rem 0.6rem', minWidth: 'auto', height: 'auto' }}
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={16} />
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
                                    <td colSpan="5" style={{ textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', padding: '1rem' }}>
                                        Total Productos: {products.length}
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

export default ProductsList;
