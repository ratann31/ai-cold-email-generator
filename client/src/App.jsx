import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOtp from './pages/VerifyOtp';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import { useAuth } from './context/AuthContext';
import { getStoredToken } from './utils/authStorage';

function App() {
    const { user, loading } = useAuth();
    const isAuthenticated = Boolean(user && getStoredToken());

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;

    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Toaster position="top-right" />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
                <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/dashboard" />} />
                <Route path="/verify-otp" element={<VerifyOtp />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
                    <Route index element={<Dashboard />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
