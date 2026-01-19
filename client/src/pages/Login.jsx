
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
        <div className="login-page">
            <div className="login-dots"></div>
            <div className="login-card animate-fade-in">
                {/* Logo Area */}
                <div className="login-logo-container">
                    <div className="login-logo-circle">
                        <div className="login-logo-icon">
                            <Sparkles size={40} strokeWidth={2.5} />
                            <div className="star-badge">★</div>
                        </div>
                    </div>
                </div>

                <h1 className="login-title">
                    KIOSKO <span className="title-accent">CLUB</span>
                </h1>

                {isSignUp && (
                    <h2 className="text-xl font-bold mb-6 text-gray-700">Crear Cuenta</h2>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-input-wrapper">
                        <User className="input-icon" size={20} />
                        <input
                            type="email"
                            placeholder="Usuario"
                            className="login-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="login-input-wrapper">
                        <Lock className="input-icon" size={20} />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Contraseña"
                            className="login-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {error && <p className="login-error">{error}</p>}
                    {successMsg && <p className="text-green-600 text-sm mb-4 text-center">{successMsg}</p>}

                    <button type="submit" className="login-submit-btn" disabled={loading}>
                        {loading ? 'PROCESANDO...' : (isSignUp ? 'REGISTRARSE' : 'ACCEDER')}
                    </button>
                </form>

                <div className="login-register-toggle">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                    >
                        {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
                    </button>
                </div>

                {!isSignUp && <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>}
            </div>
        </div>
    );
};

export default Login;
