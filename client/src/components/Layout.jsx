import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, UserPlus, ShoppingCart, Gift, BarChart2, Package, Settings, LogOut, Menu, X, ChevronDown, ChevronRight, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
    const location = useLocation();
    const { profile, logout } = useAuth();
    const isAdmin = profile?.role === 'admin';
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProductsOpen, setIsProductsOpen] = useState(false);

    const navItems = [
        { path: '/', label: 'Inicio', icon: Home, visible: true },
        { path: '/register', label: 'Clientes', icon: UserPlus, visible: isAdmin },
        {
            label: 'Productos',
            icon: Package,
            visible: isAdmin,
            hasSubmenu: true,
            submenu: [
                { path: '/products', label: 'Catálogo de Productos', icon: Package },
                { path: '/offers', label: 'Actualización de Ofertas', icon: Tag }
            ]
        },
        { path: '/sales', label: 'Ventas', icon: ShoppingCart, visible: isAdmin },
        { path: '/loyalty', label: 'Canje', icon: Gift, visible: true },
        { path: '/admin', label: 'Admin', icon: BarChart2, visible: isAdmin },
    ];

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const toggleProducts = () => {
        setIsProductsOpen(!isProductsOpen);
    };

    return (
        <div className="app-container">
            {/* Mobile Header with Hamburger */}
            <div className="mobile-header">
                <button
                    className="hamburger-btn"
                    onClick={toggleSidebar}
                    aria-label="Toggle menu"
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <h1 className="mobile-title">KIOSKO Club</h1>
                <div className="mobile-header-spacer"></div>
            </div>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={closeSidebar}
                    aria-hidden="true"
                ></div>
            )}

            {/* Sidebar */}
            <nav className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                {/* Logo Area */}
                <div className="logo-area">
                    <div className="logo-icon">
                        <Package size={28} />
                    </div>
                    <h1 className="heading-gradient">KioskoApp</h1>
                </div>

                {/* Navigation Items */}
                <div className="nav-links">
                    {navItems.filter(item => item.visible).map((item, index) => {
                        if (item.hasSubmenu) {
                            const Icon = item.icon;
                            const isSubmenuActive = item.submenu.some(sub => location.pathname === sub.path);

                            return (
                                <div key={index}>
                                    <button
                                        onClick={toggleProducts}
                                        className={`nav-item ${isSubmenuActive ? 'active' : ''}`}
                                    >
                                        <div className="nav-icon-col">
                                            <Icon size={30} />
                                        </div>
                                        <div className="nav-text-col">
                                            <span>{item.label}</span>
                                        </div>
                                        <div className="nav-chevron">
                                            {isProductsOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </div>
                                    </button>

                                    {isProductsOpen && (
                                        <div className="submenu">
                                            {item.submenu.map((subItem) => {
                                                const SubIcon = subItem.icon;
                                                const isActive = location.pathname === subItem.path;

                                                return (
                                                    <Link
                                                        key={subItem.path}
                                                        to={subItem.path}
                                                        className={`submenu-item ${isActive ? 'active' : ''}`}
                                                        onClick={closeSidebar}
                                                    >
                                                        <div className="nav-icon-col">
                                                            <SubIcon size={24} />
                                                        </div>
                                                        <div className="nav-text-col">
                                                            <span>{subItem.label}</span>
                                                        </div>
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

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`nav-item ${isActive ? 'active' : ''}`}
                                    onClick={closeSidebar}
                                >
                                    <div className="nav-icon-col">
                                        <Icon size={30} />
                                    </div>
                                    <div className="nav-text-col">
                                        <span>{item.label}</span>
                                    </div>
                                </Link>
                            );
                        }
                    })}
                </div>

                {/* Footer with Settings and Logout */}
                <div className="nav-footer">
                    {isAdmin && (
                        <Link to="/admin" className="nav-item" onClick={closeSidebar}>
                            <div className="nav-icon-col">
                                <Settings size={30} />
                            </div>
                            <div className="nav-text-col">
                                <span>Configuración</span>
                            </div>
                        </Link>
                    )}
                    <button
                        onClick={() => {
                            closeSidebar();
                            logout();
                        }}
                        className="nav-item w-full bg-transparent border-none text-left cursor-pointer"
                    >
                        <div className="nav-icon-col">
                            <LogOut size={30} />
                        </div>
                        <div className="nav-text-col">
                            <span>Cerrar Sesión</span>
                        </div>
                    </button>
                </div>
            </nav>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default Layout;
