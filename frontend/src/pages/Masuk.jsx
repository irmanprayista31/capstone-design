import { useState, useEffect } from 'react';
import './Masuk_Daftar_Lupa.css';
import logo from '../assets/LogoWeb.png';
import translations from '../components/Bahasa.js';
import globeIcon from '../assets/language.svg';
import showIcon from '../assets/unhide.svg';
import hideIcon from '../assets/hide.svg';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { useEmailValidation, usePasswordValidation } from '../components/Login_Signup_Account.js';

const Masuk = () => {
    // === DARK MODE FUNCTIONALITY ===
    const [darkMode] = useState(() => {
        const savedMode = localStorage.getItem('darkMode');
        return savedMode === 'true';
    });
    useEffect(() => {
        document.body.className = darkMode ? 'login-dark-mode' : 'login-light-mode';
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);
    // ================================

    // ========== STATE MANAGEMENT ==========
    const [language, setLanguage] = useState(localStorage.getItem('language') || 'id');
    const [showPassword, setShowPassword] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [canRegister, setCanRegister] = useState(true);
    const [checkingUsers, setCheckingUsers] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
    // ========== HOOKS & UTILITIES ==========
    const t = translations[language];
    const navigate = useNavigate();
    const emailValidation = useEmailValidation(t);
    const passwordValidation = usePasswordValidation(t, emailValidation.email);

    // ========== CHECK USER COUNT ON COMPONENT MOUNT ==========
    useEffect(() => {
        checkUserCount();
    }, []);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const checkUserCount = async () => {
        if (!navigator.onLine) {
            setCanRegister(false); // langsung nonaktifkan jika offline
            setCheckingUsers(false);
            return;
        }

        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, limit(1));
            const querySnapshot = await getDocs(q);
            setCanRegister(querySnapshot.empty);
        } catch (error) {
            console.error('Error checking user count:', error);
            setCanRegister(false);
        } finally {
            setCheckingUsers(false);
        }
    };

    // ========== LANGUAGE FUNCTIONS ==========
    const handleLanguageChange = (lang) => {
        setLanguage(lang);
        setShowDropdown(false);
        localStorage.setItem('language', lang);
    };

    const toggleLanguageDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    // ========== PASSWORD VISIBILITY FUNCTIONS ==========
    const togglePassword = () => {
        setShowPassword(!showPassword);
    };

    // ========== AUTHENTICATION FUNCTIONS ==========
    const location = useLocation();
    const redirectPath = location.state?.from || '/beranda';

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                emailValidation.email,
                passwordValidation.password
            );
            const user = userCredential.user;

            const now = Date.now();
            localStorage.setItem('userId', user.uid);
            localStorage.setItem('loginTime', now.toString());

            const lastVisited = redirectPath;

            toast.success(t.masukBerhasil, {
                position: 'top-right',
                autoClose: 1000,
                closeButton: false,
                pauseOnHover: false,
            });

            setTimeout(() => navigate(lastVisited), 2000);
        } catch (error) {
            console.error('Firebase login error:', error.code);
            handleLoginError(error); 
        }
    };
    
    const handleLoginError = (error) => {
        const toastConfig = {
            position: 'top-right',
            autoClose: 2000,
            closeButton: false,
            pauseOnHover: false,
        };

        switch (error.code) {
            case 'auth/invalid-credential':
                toast.error(t.emailAtauPasswordSalah, toastConfig);
                break;
            case 'auth/network-request-failed':
                toast.error(t.masalahJaringan, toastConfig);
                break;
            default:
                toast.error(t.terjadiKesalahan, toastConfig);
                break;
        }
    };
    // ======================================================

    return (
        <div className="login-flex-container">
            <ToastContainer />
            <div className="login-left-column">
                <div className="login-logo-wrapper">
                    <img src={logo} alt="Logo Senergy" className="login-logo-img" />
                    <h1>Senergy</h1>
                </div>
                <p className="login-description">{t.selamatDatang}</p>
            </div>
            <div className="login-right-column">
                <div className="login-header-controls">
                    <div className="login-language-switch">
                        <img
                            src={globeIcon}
                            alt="Pilih Bahasa"
                            className="login-globe-icon"
                            onClick={toggleLanguageDropdown}
                        />
                        {showDropdown && (
                            <div className="login-dropdown-language">
                                <div onClick={() => handleLanguageChange('id')}>Indonesian</div>
                                <div onClick={() => handleLanguageChange('en')}>English</div>
                            </div>
                        )}
                    </div>
                </div>
                <h2>{t.masuk}</h2>
                <form onSubmit={handleLogin}>
                    <label htmlFor="email">{t.email}</label>
                    <div className="login-email-wrapper">
                        <input
                            type="email"
                            id="email"
                            value={emailValidation.email}
                            onChange={emailValidation.handleEmailChange}
                            placeholder={t.placeholderEmail}
                            className={
                                emailValidation.emailError
                                    ? 'error'
                                    : emailValidation.isEmailValid
                                    ? 'valid'
                                    : ''
                            }
                            required
                        />
                        {emailValidation.emailError && (
                            <span className="login-email-error-message">
                                {emailValidation.emailError}
                            </span>
                        )}
                        {/* {emailValidation.isEmailValid && (
                            <span className="login-email-valid-message">
                                {t.formatValidEmail}
                            </span>
                        )} */}
                    </div>
                    <label htmlFor="password">{t.kataSandi}</label>
                    <div className="login-password-wrapper">
                        <div className="login-password-input-container">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={passwordValidation.password}
                                onChange={passwordValidation.handlePasswordChange}
                                placeholder={t.placeholderKataSandi}
                                className={
                                    passwordValidation.passwordError
                                        ? 'error'
                                        : passwordValidation.isPasswordValid
                                        ? 'valid'
                                        : ''
                                }
                                required
                            />
                            <img
                                src={showPassword ? showIcon : hideIcon}
                                alt={showPassword ? 'Show Password' : 'Hide Password'}
                                className="login-icon"
                                onClick={togglePassword}
                            />
                        </div>
                        {passwordValidation.passwordError && (
                            <span className="login-password-error-message">
                                {passwordValidation.passwordError}
                            </span>
                        )}
                        {/* {passwordValidation.isPasswordValid && (
                            <span className="login-password-valid-message">
                                {t.passwordValid}
                            </span>
                        )} */}
                    </div>
                    <div className="login-forgot">
                        <Link to="/lupa-password">{t.lupaKataSandi}</Link>
                    </div>
                    <button type="submit">{t.masuk}</button>
                    {!checkingUsers && isOnline && canRegister && (
                        <p className="login-register">
                            {t.belumPunyaAkun}{' '}
                            <Link to="/daftar">{t.daftarDisini}</Link>
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Masuk;