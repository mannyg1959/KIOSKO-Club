import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { executeWithRetry, handleSupabaseError } from '../lib/supabaseHelpers';
import { ShoppingCart, Search, CheckCircle, Plus, Minus, Trash2, QrCode, X, Package, ChevronLeft } from 'lucide-react';
import QrScanner from '../components/QrScanner';

const SalesEntry = () => {
    // Client State
    const [phone, setPhone] = useState('');
    const [client, setClient] = useState(null);

    // Products & Cart
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);

    // UI States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [showCart, setShowCart] = useState(false);
    const [discountCode, setDiscountCode] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        // Filter products based on search
        if (searchTerm.trim() === '') {
            setFilteredProducts(products);
        } else {
            const filtered = products.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredProducts(filtered);
        }
    }, [searchTerm, products]);

    const fetchProducts = async () => {
        try {
            const result = await executeWithRetry(
                () => supabase.from('products').select('*').gt('stock', 0).order('name'),
                { maxRetries: 2, timeout: 30000 }
            );
            if (result.data) {
                setProducts(result.data);
                setFilteredProducts(result.data);
            }
        } catch (error) {
            console.error('[fetchProducts] Error:', handleSupabaseError(error));
        }
    };

    const handleScan = (decodedText) => {
        if (decodedText) {
            setPhone(decodedText);
            setShowScanner(false);
            searchClient(null, decodedText);
        }
    };

    const searchClient = async (e, phoneOverride = null) => {
        if (e) e.preventDefault();
        const searchPhone = phoneOverride || phone;

        setLoading(true);
        setError(null);
        setClient(null);

        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('phone', searchPhone)
                .single();

            if (error) throw new Error('Cliente no encontrado.');
            setClient(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            setCart(cart.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const updateQuantity = (productId, delta) => {
        setCart(cart.map(item => {
            if (item.id === productId) {
                const newQuantity = item.quantity + delta;
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    const tax = subtotal * 0.21; // 21% IVA
    const totalAmount = subtotal + tax;
    const pointsEarned = Math.floor(totalAmount);

    const handleSale = async () => {
        if (!client || cart.length === 0) return;

        setLoading(true);
        setError(null);

        try {
            // 1. Record Sale
            const { error: saleError } = await supabase
                .from('sales')
                .insert([{
                    client_id: client.id,
                    amount: totalAmount,
                    points_earned: pointsEarned,
                    items: JSON.stringify(cart.map(p => ({ name: p.name, qty: p.quantity, price: p.price })))
                }]);

            if (saleError) throw saleError;

            // 2. Update Points
            const { error: updateError } = await supabase
                .from('clients')
                .update({ points_balance: client.points_balance + pointsEarned })
                .eq('id', client.id);

            if (updateError) throw updateError;

            // 3. Update Stock
            for (const item of cart) {
                await supabase.rpc('decrement_stock', { row_id: item.id, count: item.quantity });
            }

            // Success
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setClient(null);
                setPhone('');
                setCart([]);
                setShowCart(false);
                setSearchTerm('');
            }, 3000);

        } catch (err) {
            setError('Error al registrar la venta: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: 'var(--spacing-lg)' }}>
            {/* STEP 1: Client Identification */}
            {!client ? (
                <div className="card" style={{ maxWidth: '500px', margin: '40px auto', padding: '2.5rem' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem', textAlign: 'center' }}>
                        Punto de Venta
                    </h2>
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        Identifica al cliente para comenzar
                    </p>

                    {/* QR Scanner Overlay */}
                    {showScanner && (
                        <div style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 100,
                            background: 'rgba(0,0,0,0.7)',
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div className="card" style={{ maxWidth: '400px', background: '#1a1a1a', color: 'white', padding: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3>Escanear Código QR</h3>
                                    <button onClick={() => setShowScanner(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                                        <X size={24} />
                                    </button>
                                </div>
                                <QrScanner onScan={handleScan} />
                            </div>
                        </div>
                    )}

                    <form onSubmit={searchClient}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="input-label">Número de Teléfono</label>
                            <input
                                type="tel"
                                placeholder="Ej: 04241234567"
                                className="input-field"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                autoFocus
                                style={{ fontSize: '1.1rem', padding: '0.75rem' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem' }}>
                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ fontSize: '1rem', padding: '0.75rem' }}>
                                <Search size={20} />
                                {loading ? 'Buscando...' : 'Buscar Cliente'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowScanner(true)}
                                className="btn btn-secondary"
                                title="Escanear QR"
                                style={{ padding: '0.75rem' }}
                            >
                                <QrCode size={24} />
                            </button>
                        </div>

                        {error && (
                            <div className="error-message" style={{ marginTop: '1rem' }}>
                                {error}
                            </div>
                        )}
                    </form>
                </div>
            ) : showCart ? (
                /* STEP 3: Cart Summary & Checkout */
                <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                        <button onClick={() => setShowCart(false)} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>{client.name}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                                ¡Tiene premios disponibles! • Estado de Fidelización: {client.points_balance}pts
                            </p>
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Resumen de Compra</h3>
                        <div className="table-container">
                            <table style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '0.75rem' }}>IMAGEN</th>
                                        <th style={{ textAlign: 'left', padding: '0.75rem' }}>NOMBRE</th>
                                        <th style={{ textAlign: 'right', padding: '0.75rem' }}>PRECIO</th>
                                        <th style={{ textAlign: 'center', padding: '0.75rem' }}>CANTIDAD</th>
                                        <th style={{ width: '40px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map((item) => (
                                        <tr key={item.id}>
                                            <td style={{ padding: '0.75rem' }}>
                                                <div style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    background: '#f0f0f0',
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }} />
                                                    ) : (
                                                        <Package size={24} color="var(--text-tertiary)" />
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem', fontWeight: '500' }}>{item.name}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--success)', fontWeight: '600' }}>
                                                ${parseFloat(item.price).toFixed(2)}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                        style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            borderRadius: '50%',
                                                            border: '1px solid var(--border-color)',
                                                            background: 'white',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                        style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            borderRadius: '50%',
                                                            border: '1px solid var(--primary)',
                                                            background: 'var(--primary)',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--error)' }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totals */}
                    <div style={{ background: '#f8f9fa', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '1rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                            <span style={{ fontWeight: '600' }}>${subtotal.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', fontSize: '1rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Impuestos (21%)</span>
                            <span style={{ fontWeight: '600' }}>${tax.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: '700' }}>
                            <span>Total</span>
                            <span style={{ color: 'var(--primary)' }}>${totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Discount Code */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <input
                            type="text"
                            placeholder="Código de descuento..."
                            className="input-field"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                        />
                        <button className="btn btn-secondary">Aplicar</button>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                            onClick={handleSale}
                            disabled={loading || cart.length === 0}
                            className="btn btn-primary"
                            style={{ fontSize: '1.1rem', padding: '1rem' }}
                        >
                            {loading ? 'Procesando...' : 'Finalizar compra'}
                        </button>
                        <button
                            onClick={() => setShowCart(false)}
                            className="btn btn-secondary"
                            style={{ fontSize: '1rem' }}
                        >
                            <ChevronLeft size={18} />
                            Continuar comprando
                        </button>
                    </div>

                    {error && (
                        <div className="error-message" style={{ marginTop: '1rem' }}>
                            {error}
                        </div>
                    )}
                </div>
            ) : (
                /* STEP 2: Product Selection */
                <div>
                    {/* Header with Client Info */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>{client.name}</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                                    ¡Tiene premios disponibles! Puede canjear: <strong style={{ color: 'var(--primary)' }}>Bebida Gratis</strong> (20 pts)
                                </p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                                    Estado de Fidelización: <strong>{client.points_balance}pts</strong>
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCart(true)}
                                className="btn btn-primary"
                                style={{ position: 'relative', padding: '0.75rem 1.5rem' }}
                                disabled={cart.length === 0}
                            >
                                <ShoppingCart size={20} />
                                Ver carrito
                                {cartItemCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-8px',
                                        right: '-8px',
                                        background: 'var(--error)',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        fontWeight: '700'
                                    }}>
                                        {cartItemCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <label className="input-label" style={{ marginBottom: '0.5rem' }}>Producto</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                className="input-field"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingRight: '3rem' }}
                            />
                            <Search
                                size={20}
                                style={{
                                    position: 'absolute',
                                    right: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-tertiary)'
                                }}
                            />
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="card">
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Resumen de Compra</h3>

                        {filteredProducts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                                <p>No se encontraron productos</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '0.75rem' }}>IMAGEN</th>
                                            <th style={{ textAlign: 'left', padding: '0.75rem' }}>NOMBRE</th>
                                            <th style={{ textAlign: 'right', padding: '0.75rem' }}>PRECIO</th>
                                            <th style={{ width: '100px', textAlign: 'center' }}>ACCIÓN</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.map((product) => {
                                            const inCart = cart.find(item => item.id === product.id);
                                            return (
                                                <tr key={product.id}>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <div style={{
                                                            width: '50px',
                                                            height: '50px',
                                                            background: '#f0f0f0',
                                                            borderRadius: '8px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            {product.image_url ? (
                                                                <img src={product.image_url} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }} />
                                                            ) : (
                                                                <Package size={24} color="var(--text-tertiary)" />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{product.name}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--success)', fontWeight: '600', fontSize: '1.1rem' }}>
                                                        ${parseFloat(product.price).toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                        <button
                                                            onClick={() => addToCart(product)}
                                                            className="btn btn-primary"
                                                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                                        >
                                                            <Plus size={16} />
                                                            {inCart ? `Agregar (${inCart.quantity})` : 'Agregar'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Cancel Button */}
                    <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                        <button
                            onClick={() => {
                                setClient(null);
                                setCart([]);
                                setSearchTerm('');
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            Cancelar / Cambiar Cliente
                        </button>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {success && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 100,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div className="card" style={{ maxWidth: '400px', textAlign: 'center', padding: '2.5rem' }}>
                        <div style={{ margin: '0 auto 1.5rem', color: 'var(--success)' }}>
                            <CheckCircle size={64} style={{ margin: '0 auto' }} />
                        </div>
                        <h3 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>¡Venta Exitosa!</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            Se registró la compra correctamente
                        </p>
                        <p style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary)' }}>
                            +{pointsEarned} puntos asignados
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesEntry;
