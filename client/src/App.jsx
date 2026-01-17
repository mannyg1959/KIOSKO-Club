import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import RegisterClient from './pages/RegisterClient';
import SalesEntry from './pages/SalesEntry';
import Loyalty from './pages/Loyalty';
import AdminDashboard from './pages/AdminDashboard';
import Products from './pages/Products';
import Login from './pages/Login';
import CompleteProfile from './pages/CompleteProfile';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user, profile } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />

        {/* Complete Profile Route - for users without client_id */}
        <Route
          path="/complete-profile"
          element={user && !profile?.client_id ? <CompleteProfile /> : <Navigate to="/" />}
        />

        <Route path="/*" element={
          user ? (
            // If user doesn't have client_id, redirect to complete profile
            !profile?.client_id ? (
              <Navigate to="/complete-profile" />
            ) : (
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />

                  {/* Protected Admin Routes */}
                  {profile?.role === 'admin' && (
                    <>
                      <Route path="/register" element={<RegisterClient />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/sales" element={<SalesEntry />} />
                    </>
                  )}

                  {/* Shared/Client Routes */}
                  <Route path="/loyalty" element={<Loyalty />} />

                  {profile?.role === 'admin' && (
                    <Route path="/admin" element={<AdminDashboard />} />
                  )}

                  {/* Redirect others to Home */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Layout>
            )
          ) : (
            <Navigate to="/login" />
          )
        } />
      </Routes>
    </Router>
  );
}

export default App;
