import { Link, useLocation } from 'react-router-dom';
import { Home, UserPlus, ShoppingCart, Gift, BarChart2, Package, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
    const location = useLocation();
    const { profile, logout } = useAuth();
    const isAdmin = profile?.role === 'admin';

    const navItems = [
        { path: '/', label: 'Inicio', icon: Home, visible: true },
        { path: '/register', label: 'Clientes', icon: UserPlus, visible: isAdmin },
        { path: '/products', label: 'Productos', icon: Package, visible: isAdmin },
        { path: '/sales', label: 'Ventas', icon: ShoppingCart, visible: isAdmin },
        { path: '/loyalty', label: 'Canje', icon: Gift, visible: true },
        { path: '/admin', label: 'Admin', icon: BarChart2, visible: isAdmin },
    ];

    return (
        <div className="app-container">
            <nav className="sidebar">
                {/* Logo Area */}
                <div className="logo-area">
                    <div className="logo-icon">
                        <Package size={28} />
                    </div>
                    <h1 className="heading-gradient">KioskoApp</h1>
                </div>

                {/* Navigation Items */}
                <div className="nav-links">
                    {navItems.filter(item => item.visible).map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                            >
                                <div className="nav-icon-col">
                                    <Icon size={30} />
                                </div>
                                <div className="nav-text-col">
                                    <span>{item.label}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Footer with Settings and Logout */}
                <div className="nav-footer">
                    {isAdmin && (
                        <Link to="/admin" className="nav-item">
                            <div className="nav-icon-col">
                                <Settings size={30} />
                            </div>
                            <div className="nav-text-col">
                                <span>Configuración</span>
                            </div>
                        </Link>
                    )}
                    <button onClick={logout} className="nav-item w-full bg-transparent border-none text-left cursor-pointer">
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
