import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Eye, EyeOff, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BannerLogin from '../assets/Banner_Login.png';

const Login = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const { login, signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');
        try {
            if (isSignUp) {
                await signUp(email, password);
                setSuccessMsg('¡Registro exitoso! Ya puedes iniciar sesión.');
                setIsSignUp(false);
            } else {
                await login(email, password);
                navigate('/');
            }
        } catch (err) {
            setError(err.message || 'Error en la operación.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div style={{
                    width: '100%',
                    marginBottom: '2rem',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <img
                        src={BannerLogin}
                        alt="Bienvenido"
                        style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block'
                        }}
                    />
                </div>

                <div className="auth-header" style={{ marginTop: 0 }}>
                    <h1 className="auth-title">Kiosko Club</h1>
                    <p className="auth-subtitle">
                        {isSignUp ? 'Crea una cuenta para empezar' : 'Bienvenido de nuevo'}
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && (
                        <div className="error-message">
                            <div className="flex items-center justify-center gap-2">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    {successMsg && (
                        <div className="success-message">
                            <div className="flex items-center justify-center gap-2">
                                <CheckCircle size={18} />
                                <span>{successMsg}</span>
                            </div>
                        </div>
                    )}

                    <div className="input-group-icon">
                        <User className="input-icon" size={20} />
                        <input
                            type="email"
                            placeholder="Correo electrónico"
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group-icon">
                        <Lock className="input-icon" size={20} />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Contraseña"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex="-1"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={loading}
                        style={{ height: '48px', fontSize: '1rem' }}
                    >
                        {loading ? 'Procesando...' : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión')}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>O</span>
                </div>

                <div className="auth-footer">
                    <p>
                        {isSignUp ? '¿Ya tienes una cuenta? ' : '¿No tienes cuenta? '}
                        <button
                            className="link-primary"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError('');
                                setSuccessMsg('');
                            }}
                        >
                            {isSignUp ? 'Inicia Sesión' : 'Regístrate'}
                        </button>
                    </p>

                    {!isSignUp && (
                        <p style={{ marginTop: '1rem' }}>
                            <a href="#" className="link-primary" style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                                ¿Olvidaste tu contraseña?
                            </a>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
