import { useState, useEffect } from 'react';
import './Masuk_Daftar_Lupa.css';
import logo from '../assets/LogoWeb.png';
import translations from '../components/Bahasa.js';
import globeIcon from '../assets/language.svg';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { auth, db } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

const LupaPassword = () => {
    // ========= LANGUAGE ==========
    const [language, setLanguage] = useState(localStorage.getItem('language') || 'id');
    const [showDropdown, setShowDropdown] = useState(false);
    const t = translations[language];
    const handleLanguageChange = (lang) => {
        setLanguage(lang);
        setShowDropdown(false);
        localStorage.setItem('language', lang);
    };
    // =============================

    // ========= Navigate ==========
    const navigate = useNavigate();
    // =============================

    // ========== EMAIL VALIDATION ==========
    const commonEmailDomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
        'yahoo.co.id', 'ymail.com', 'live.com', 'icloud.com'
    ];
    const checkEmailTypo = (email) => {
        if (!email.includes('@')) return false;
        const [, domain] = email.split('@');
        const lowerDomain = domain.toLowerCase();
        const isValidDomain = commonEmailDomains.includes(lowerDomain);
        if (!isValidDomain) {
            return {
                hasTypo: true,
                message: t.formatTidakValidEmail
            };
        }
        return false;
    };
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [errorType, setErrorType] = useState('');
    const validateEmail = (emailValue) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidFormat = emailRegex.test(emailValue);
        if (!emailValue) {
            setEmailError('');
            setIsEmailValid(false);
            setErrorType('');
        } else if (!isValidFormat) {
            if (!emailValue.includes('@')) {
                setEmailError(t.simbolEmail);
                setErrorType('simbolEmail');
            } else if (emailValue.split('@').length > 2) {
                setEmailError(t.satuSimbolEmail);
                setErrorType('satuSimbolEmail');
            } else if (!emailValue.includes('.') || emailValue.split('@')[1]?.split('.').length < 2) {
                setEmailError(t.domainTitikEmail);
                setErrorType('domainTitikEmail');
            } else if (emailValue.startsWith('@') || emailValue.endsWith('@')) {
                setEmailError(t.awalAkhirEmail);
                setErrorType('awalAkhirEmail');
            } else if (emailValue.includes('..')) {
                setEmailError(t.titikGandaEmail);
                setErrorType('titikGandaEmail');
            } else if (emailValue.includes('  ')) {
                setEmailError(t.tidakSpasiEmail);
                setErrorType('tidakSpasiEmail');
            } else {
                setEmailError(t.formatTidakValidEmail);
                setErrorType('formatTidakValidEmail');
            }
            setIsEmailValid(false);
        } else {
            const typoInfo = checkEmailTypo(emailValue);
            if (typoInfo && typoInfo.hasTypo) {
                setEmailError(typoInfo.message);
                setErrorType('formatTidakValidEmail');
                setIsEmailValid(false);
            } else {
                setEmailError('');
                setErrorType('');
                setIsEmailValid(true);
            }
        }
    };
    const handleEmailChange = (e) => {
        const emailValue = e.target.value;
        setEmail(emailValue);
        validateEmail(emailValue);
    };

    // Update error messages when language changes
    useEffect(() => {
        if (errorType) {
            switch (errorType) {
                case 'simbolEmail':
                    setEmailError(t.simbolEmail);
                    break;
                case 'satuSimbolEmail':
                    setEmailError(t.satuSimbolEmail);
                    break;
                case 'domainTitikEmail':
                    setEmailError(t.domainTitikEmail);
                    break;
                case 'awalAkhirEmail':
                    setEmailError(t.awalAkhirEmail);
                    break;
                case 'titikGandaEmail':
                    setEmailError(t.titikGandaEmail);
                    break;
                case 'tidakSpasiEmail':
                    setEmailError(t.tidakSpasiEmail);
                    break;
                case 'formatTidakValidEmail':
                    setEmailError(t.formatTidakValidEmail);
                    break;
                default:
                    break;
            }
        }
    }, [language, errorType, t]);
    // ======================================

    // ========= Kirim konfirmasi Email untuk Ubah password ==========
    const changePassword = async (e) => {
        e.preventDefault();
        try {
            // Cek apakah email ada di Firestore
            const q = query(collection(db, 'users'), where('email', '==', email));
            const snap = await getDocs(q);

            if (snap.empty) {
                toast.error(t.emailTidakTerdaftar, { position: 'top-right', autoClose: 2000, closeButton: false, pauseOnHover: false });
                return;
            }

            // Kirim email reset password via Firebase Auth
            await sendPasswordResetEmail(auth, email);
            toast.success(t.emailKirimBerhasil, { position: 'top-right', autoClose: 1000, closeButton: false, pauseOnHover: false });
            setTimeout(() => navigate('/'), 2000);
        } catch (error) {
            console.error("Reset password error:", error);
            if (error.code === 'auth/user-not-found') {
                toast.error(t.emailKirimBerhasil, { position: 'top-right', autoClose: 2000, closeButton: false, pauseOnHover: false });
            } else {
                toast.error(t.emailGagalKirim, { position: 'top-right', autoClose: 2000, closeButton: false, pauseOnHover: false });
            }
        }
    };
    // =============================================

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
                <div className="login-language-switch">
                    <img
                        src={globeIcon}
                        alt="Pilih Bahasa"
                        className="login-globe-icon"
                        onClick={() => setShowDropdown(!showDropdown)}
                    />
                    {showDropdown && (
                        <div className="login-dropdown-language">
                            <div onClick={() => handleLanguageChange('id')}>Indonesian</div>
                            <div onClick={() => handleLanguageChange('en')}>English</div>
                        </div>
                    )}
                </div>
                <h2>{t.halamanLupaPassword}</h2>
                <form onSubmit={changePassword}>
                    <label htmlFor="email">{t.email}</label>
                    <div className="login-email-wrapper">
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder={t.placeholderEmail}
                            required
                        />
                        {emailError && <span className="login-email-error-message">{emailError}</span>}
                        {/* {isEmailValid && !emailError && <span className="login-email-valid-message">{t.emailValid || 'Email valid'}</span>} */}
                    </div>
                    <button type="submit" disabled={!isEmailValid}>
                        {t.pesanKirim}
                    </button>
                    <p className="login-register">
                        {t.sudahIngatKataSandi} <Link to="/">{t.masukDisini}</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LupaPassword;