import { Link } from 'react-router-dom';
import { UserPlus, ShoppingCart, Gift, BarChart2, Package, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
    const { user, profile, logout } = useAuth();
    const isAdmin = profile?.role === 'admin';

    const actions = [
        {
            path: '/register',
            label: 'Registrar Cliente',
            description: 'Añade nuevos clientes y genera códigos QR',
            icon: UserPlus,
            visible: isAdmin
        },
        {
            path: '/products',
            label: 'Gestionar Productos',
            description: 'Administra tu inventario de productos',
            icon: Package,
            visible: isAdmin
        },
        {
            path: '/sales',
            label: 'Registrar Venta',
            description: 'Procesa ventas y asigna puntos',
            icon: ShoppingCart,
            visible: isAdmin
        },
        {
            path: '/admin',
            label: 'Administración',
            description: 'Revisa métricas y estadísticas',
            icon: BarChart2,
            visible: isAdmin
        },
    ].filter(a => a.visible);

    return (
        <div className="page-container">
            <div className="dashboard-header">
                <div className="dashboard-title-group">
                    <Sparkles size={28} className="text-gray-800" />
                    <h1 className="dashboard-title">Bienvenido, {profile?.client?.name || user?.email}</h1>
                </div>
                <p className="dashboard-subtitle">
                    Has iniciado sesión como {profile?.role || 'Visitante'}.
                </p>
                {profile?.client && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Puntos Acumulados</p>
                                <p className="text-3xl font-bold text-blue-600">{profile.client.points_balance || 0}</p>
                            </div>
                            <Gift size={40} className="text-blue-400" />
                        </div>
                        <Link to="/loyalty" className="btn btn-primary mt-3 w-full">
                            Canjear Puntos
                        </Link>
                    </div>
                )}
                {!profile && (
                    <button onClick={logout} className="btn btn-secondary btn-sm mt-2">
                        Cerrar Sesión para reintentar
                    </button>
                )}
            </div>

            <div className="dashboard-grid">
                {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <Link key={action.path} to={action.path} className="dashboard-card">
                            <div className="dashboard-card-icon-box">
                                <Icon size={28} />
                            </div>
                            <h3 className="dashboard-card-title">{action.label}</h3>
                            <p className="dashboard-card-desc">{action.description}</p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default Home;
