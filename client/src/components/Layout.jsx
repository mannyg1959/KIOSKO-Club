
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, UserPlus, ShoppingCart, Gift, BarChart2, Package, Settings, LogOut, Menu, X, ChevronDown, ChevronRight, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
    const location = useLocation();
    const { profile, logout } = useAuth();
    const isAdmin = profile?.role === 'admin';
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProductsOpen, setIsProductsOpen] = useState(true);

    const navItems = [
        { path: '/', label: 'Inicio', icon: Home, visible: true },
        { path: '/register', label: 'Gestión Clientes', icon: UserPlus, visible: isAdmin },
        {
            label: 'Catálogo de Productos',
            icon: Package,
            visible: isAdmin,
            hasSubmenu: true,
            submenu: [
                { path: '/products', label: 'Lista de Productos', icon: Package },
                { path: '/offers', label: 'Actualización de Ofertas', icon: Tag }
            ]
        },
        { path: '/sales', label: 'Punto de Venta', icon: ShoppingCart, visible: isAdmin },
        { path: '/loyalty', label: 'Premios y Canje', icon: Gift, visible: true },
        { path: '/admin', label: 'Configuración', icon: Settings, visible: isAdmin },
    ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);
    const toggleProducts = () => setIsProductsOpen(!isProductsOpen);

    return (
        <div className="app-container">
            {/* Mobile Header */}
            <div className="mobile-header" style={{
                display: 'none', // Oculto por defecto en desktop, necesitaría media queries en CSS para mostrarlo
                padding: '1rem',
                borderBottom: '1px solid var(--border-color)',
                background: 'white',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <button onClick={toggleSidebar} style={{ background: 'none', border: 'none' }}>
                    <Menu size={24} />
                </button>
                <span style={{ fontWeight: 'bold' }}>KIOSKO Club</span>
            </div>

            {/* Sidebar */}
            <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                {/* Logo Area */}
                <div className="logo-area">
                    <div className="logo-icon">
                        <Package size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>KioskoApp</h1>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sistema de Gestión</p>
                    </div>
                </div>

                {/* Navigation Items */}
                <div className="nav-links" style={{ flex: 1 }}>
                    {navItems.filter(item => item.visible).map((item, index) => {
                        if (item.hasSubmenu) {
                            const Icon = item.icon;
                            const isSubmenuActive = item.submenu.some(sub => location.pathname === sub.path);

                            return (
                                <div key={index} style={{ marginBottom: '4px' }}>
                                    <button
                                        onClick={toggleProducts}
                                        className={`nav-item ${isSubmenuActive ? 'active' : ''}`}
                                        style={{ justifyContent: 'space-between', fontSize: 'inherit' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div className="nav-icon-col">
                                                <Icon size={20} />
                                            </div>
                                            <span>{item.label}</span>
                                        </div>
                                        {isProductsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </button>

                                    {isProductsOpen && (
                                        <div style={{
                                            paddingLeft: '1rem',
                                            marginTop: '4px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px'
                                        }}>
                                            {item.submenu.map((subItem) => {
                                                const isActive = location.pathname === subItem.path;
                                                return (
                                                    <Link
                                                        key={subItem.path}
                                                        to={subItem.path}
                                                        className={`nav-item ${isActive ? 'active' : ''}`}
                                                        onClick={closeSidebar}
                                                        style={{
                                                            fontSize: '0.9rem',
                                                            padding: '8px 12px'
                                                        }}
                                                    >
                                                        <span>{subItem.label}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        } else {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            if (item.openInNewTab) {
                                return (
                                    <a
                                        key={item.path}
                                        href={item.path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`nav-item ${isActive ? 'active' : ''}`}
                                        onClick={closeSidebar}
                                    >
                                        <div className="nav-icon-col">
                                            <Icon size={20} />
                                        </div>
                                        <span>{item.label}</span>
                                    </a>
                                );
                            }

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`nav-item ${isActive ? 'active' : ''}`}
                                    onClick={closeSidebar}
                                >
                                    <div className="nav-icon-col">
                                        <Icon size={20} />
                                    </div>
                                    <span>{item.label}</span>
                                </Link>
                            );
                        }
                    })}
                </div>

                {/* User Profile & Logout */}
                <div style={{
                    padding: '16px',
                    borderTop: '1px solid var(--border-color)',
                    background: '#F8FAFC'
                }}>
                    <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                        }}>
                            {profile?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {profile?.email?.split('@')[0]}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {isAdmin ? 'Administrador' : 'Cliente'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            closeSidebar();
                            logout();
                        }}
                        className="nav-item"
                        style={{ width: '100%', justifyContent: 'flex-start', marginTop: '8px' }}
                    >
                        <div className="nav-icon-col">
                            <LogOut size={20} />
                        </div>
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default Layout;
