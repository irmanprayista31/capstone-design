import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import Masuk from './pages/Masuk';
import Daftar from './pages/Daftar';
import LupaPassword from './pages/LupaPassword';
import Beranda from './pages/Beranda';
import Akun from './pages/Akun'; 
import Grafik from './pages/Grafik'; 
import Kamar from './pages/Kamar'; 
import Kontak from './pages/Kontak'; 
import PrivateRoute from './components/PrivateRoute';

const SESSION_DURATION = 2 * 60 * 60 * 1000;

function App() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const interval = setInterval(() => {
            const userId = localStorage.getItem('userId');
            const loginTime = localStorage.getItem('loginTime');
            const now = Date.now();

            if (userId && loginTime) {
                const elapsed = now - parseInt(loginTime, 10);
                if (elapsed > SESSION_DURATION) {
                    localStorage.setItem('lastVisitedPage', location.pathname);
                    localStorage.removeItem('userId');
                    localStorage.removeItem('loginTime');
                    localStorage.setItem('sessionExpired', 'true');
                    navigate('/', { state: { from: location.pathname } });
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [navigate]);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const loginTime = localStorage.getItem('loginTime');

        if (userId && loginTime) {
            localStorage.setItem('lastVisitedPage', location.pathname);
            const now = Date.now();
            const elapsed = now - parseInt(loginTime, 10);
            if (elapsed <= SESSION_DURATION) {
                localStorage.setItem('loginTime', now.toString());
            }
        }
    }, [location.pathname]);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const loginTime = localStorage.getItem('loginTime');
        const lastPage = localStorage.getItem('lastVisitedPage');
        const now = Date.now();

        if (userId && loginTime && location.pathname === '/') {
            const elapsed = now - parseInt(loginTime, 10);
            if (elapsed <= SESSION_DURATION && lastPage && lastPage !== '/') {
                navigate(lastPage, { replace: true });
            }
        }
    }, [location.pathname]);

    return (
        <>
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<Masuk />} />
                <Route path="/daftar" element={<Daftar />} />
                <Route path="/lupa-password" element={<LupaPassword />} />

                {/* Private routes */}
                <Route path="/beranda" element={<PrivateRoute><Beranda /></PrivateRoute>} />
                <Route path="/akun" element={<PrivateRoute><Akun /></PrivateRoute>} />
                <Route path="/grafik" element={<PrivateRoute><Grafik /></PrivateRoute>} />
                <Route path="/kamar" element={<PrivateRoute><Kamar /></PrivateRoute>} />
                <Route path="/kontak" element={<PrivateRoute><Kontak /></PrivateRoute>} />
            </Routes>
        </>
    );
}

export default App;