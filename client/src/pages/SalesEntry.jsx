
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { executeWithRetry, handleSupabaseError } from '../lib/supabaseHelpers';
import { ShoppingCart, Search, CheckCircle, Plus, Trash2, QrCode, X } from 'lucide-react';
import QrScanner from '../components/QrScanner';
import LoyaltyModal from '../components/LoyaltyModal';

const SalesEntry = () => {
    const [phone, setPhone] = useState('');
    const [client, setClient] = useState(null);
    const [products, setProducts] = useState([]);
    const [prizes, setPrizes] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // New States
    const [showScanner, setShowScanner] = useState(false);
    const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchPrizes();
    }, []);

    const fetchProducts = async () => {
        try {
            const result = await executeWithRetry(
                () => supabase.from('products').select('*').gt('stock', 0),
                { maxRetries: 2, timeout: 30000 }
            );
            if (result.data) setProducts(result.data);
        } catch (error) {
            console.error('[fetchProducts] Error:', handleSupabaseError(error));
        }
    };

    const fetchPrizes = async () => {
        try {
            const result = await executeWithRetry(
                () => supabase.from('prizes').select('*').order('points', { ascending: true }),
                { maxRetries: 2, timeout: 30000 }
            );
            if (result.data) setPrizes(result.data);
        } catch (error) {
            console.error('[fetchPrizes] Error:', handleSupabaseError(error));
        }
    };

    const handleScan = (decodedText) => {
        if (decodedText) {
            setPhone(decodedText);
            setShowScanner(false);
            searchClient(null, decodedText); // Auto-search
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
            setShowLoyaltyModal(true); // Trigger modal on success

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        setCart([...cart, product]);
    };

    const removeFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const totalAmount = cart.reduce((sum, item) => sum + Number(item.price), 0);
    const pointsEarned = Math.floor(totalAmount);

    const handleSale = async (e) => {
        e.preventDefault();
        if (!client || cart.length === 0) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // 1. Record Sale
            const { error: saleError } = await supabase
                .from('sales')
                .insert([{
                    client_id: client.id,
                    amount: totalAmount,
                    points_earned: pointsEarned,
                    items: JSON.stringify(cart.map(p => p.name))
                }]);

            if (saleError) throw saleError;

            // 2. Update Points
            const { error: updateError } = await supabase
                .from('clients')
                .update({ points_balance: client.points_balance + pointsEarned })
                .eq('id', client.id);

            if (updateError) throw updateError;

            // 3. Update Stock (Optional but good)
            for (const item of cart) {
                await supabase.rpc('decrement_stock', { row_id: item.id, count: 1 });
            }

            // Success
            setSuccess(true);
            setCart([]);
            setClient({ ...client, points_balance: client.points_balance + pointsEarned });
            setTimeout(() => {
                setSuccess(false);
                setClient(null);
                setPhone('');
            }, 3000);

        } catch (err) {
            setError('Error al registrar la venta: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            {!client ? (
                <div className="glass-card" style={{ maxWidth: '500px', margin: '40px auto', padding: '2rem' }}>
                    <h2 className="text-center" style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Registrar Venta</h2>

                    {/* Scanner Overlay */}
                    {showScanner && (
                        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                            <div className="glass-card" style={{ maxWidth: '300px', background: 'black', color: 'white' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button onClick={() => setShowScanner(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                                        <X size={24} />
                                    </button>
                                </div>
                                <h3 className="text-center" style={{ marginBottom: '1rem' }}>Escanear QR</h3>
                                <QrScanner onScan={(result) => handleScan(result)} />
                            </div>
                        </div>
                    )}

                    <form onSubmit={searchClient}>
                        <div className="input-group">
                            <label className="input-label">Identificar Cliente</label>
                            <div className="flex gap-2">
                                <input
                                    type="tel"
                                    placeholder="Número de teléfono"
                                    className="input-field"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required={!showScanner}
                                    autoFocus
                                />
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    <Search size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowScanner(true)}
                                    className="btn btn-secondary"
                                    title="Escanear QR"
                                >
                                    <QrCode size={20} />
                                </button>
                            </div>
                        </div>
                        {error && <p className="text-red-500 text-center text-sm">{error}</p>}
                    </form>
                </div>
            ) : (
                <div className="sales-content">
                    {/* Header Section */}
                    <div className="client-header">
                        <div>
                            <h2 className="client-name">
                                {client.name || 'Cliente'}
                            </h2>
                            <div className="loyalty-info">
                                {(() => {
                                    const affordablePrizes = prizes.filter(p => p.points <= client.points_balance);
                                    const nextPrize = prizes.find(p => p.points > client.points_balance);

                                    if (affordablePrizes.length > 0) {
                                        const bestPrize = affordablePrizes[affordablePrizes.length - 1];
                                        return (
                                            <>
                                                ¡Tiene premios disponibles! <br />
                                                Puede canjear: <strong className="loyalty-highlight">{bestPrize.name}</strong> ({bestPrize.points} pts)
                                            </>
                                        );
                                    } else if (nextPrize) {
                                        const pointsNeeded = nextPrize.points - client.points_balance;
                                        return (
                                            <>
                                                Aún no tiene premios disponibles. <br />
                                                Faltan <strong className="loyalty-highlight">{pointsNeeded} pts</strong> para {nextPrize.name}
                                            </>
                                        );
                                    } else {
                                        return "No hay premios configurados o ha alcanzado el máximo.";
                                    }
                                })()}
                            </div>
                        </div>

                        <div className="loyalty-badge-container">
                            <span className="loyalty-label">
                                Estado de Fidelización
                            </span>
                            <div className="points-badge">
                                {client.points_balance}pts
                            </div>

                            <button
                                onClick={handleSale}
                                disabled={loading || cart.length === 0}
                                className="btn btn-primary w-full"
                            >
                                {loading ? 'Procesando...' : 'Proceder con la Compra'}
                            </button>
                        </div>
                    </div>

                    {/* Product Selection Title */}
                    <div className="flex justify-between items-center mb-3">
                        <h3
                            className="sales-section-title"
                            onClick={() => document.getElementById('product-selector').classList.toggle('hidden')}
                        >
                            Seleccionar Productos
                        </h3>
                        <button
                            className="text-sm"
                            style={{ color: '#1976D2', cursor: 'pointer', border: 'none', background: 'none', fontWeight: 'bold' }}
                            onClick={() => document.getElementById('product-selector').classList.toggle('hidden')}
                        >
                            {products.length > 0 ? "Mostrar/Ocultar Menú" : "Cargando..."}
                        </button>
                    </div>

                    {/* Product Selector (Card Grid) */}
                    <div id="product-selector" className="glass-card mb-6 hidden" style={{ position: 'absolute', width: '90%', left: '5%', zIndex: 10 }}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {products.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    style={{
                                        padding: '1rem',
                                        textAlign: 'left',
                                        border: '1px solid #E0E0E0',
                                        borderRadius: '0.5rem',
                                        background: '#FAFAFA',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{product.name}</span>
                                    <span style={{ color: '#0D47A1', fontWeight: 'bold' }}>${product.price}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sales Table (Cart) */}
                    <div className="sales-table-card">
                        <table className="sales-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th className="text-right">Precio</th>
                                    <th style={{ width: '40px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="text-center" style={{ padding: '2rem', color: '#9E9E9E' }}>
                                            No hay productos seleccionados
                                        </td>
                                    </tr>
                                ) : (
                                    cart.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.name}</td>
                                            <td className="text-right">${item.price}</td>
                                            <td className="text-center">
                                                <button
                                                    onClick={() => removeFromCart(index)}
                                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#E57373' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Total Footer */}
                        {cart.length > 0 && (
                            <div className="total-row">
                                <span className="total-label">Total</span>
                                <span className="total-value">${totalAmount.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 text-right">
                        <button
                            onClick={() => setClient(null)}
                            style={{ background: 'none', border: 'none', color: '#757575', textDecoration: 'underline', cursor: 'pointer' }}
                        >
                            Cancelar / Cambiar Cliente
                        </button>
                    </div>
                </div>
            )}

            {success && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="glass-card p-8 text-center" style={{ maxWidth: '400px', background: 'white' }}>
                        <div style={{ margin: '0 auto 1rem', color: '#43A047' }}>
                            <CheckCircle size={64} style={{ margin: '0 auto' }} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>¡Venta Exitosa!</h3>
                        <p style={{ color: '#757575', marginBottom: '1.5rem' }}>Puntos asignados correctamente.</p>
                        <button
                            onClick={() => {
                                setSuccess(false);
                                setClient(null);
                                setPhone('');
                            }}
                            className="btn btn-primary"
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesEntry;
