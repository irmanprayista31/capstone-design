import { useState, useEffect } from 'react';
import './Masuk_Daftar_Lupa.css';
import logo from '../assets/LogoWeb.png';
import translations from '../components/Bahasa.js';
import globeIcon from '../assets/language.svg';
import showIcon from '../assets/unhide.svg';
import hideIcon from '../assets/hide.svg';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useSignupForm } from '../components/Login_Signup_Account.js';

const Daftar = () => {
    // ========= STATE MANAGEMENT =========
    const [language, setLanguage] = useState(localStorage.getItem('language') || 'id');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [canRegister, setCanRegister] = useState(true);
    
    const t = translations[language];
    const navigate = useNavigate();

    // ========= CHECK USER COUNT ON MOUNT =========
    useEffect(() => {
        checkUserCount();
    }, []);

    const checkUserCount = async () => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, limit(1));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                setCanRegister(false);
                setTimeout(() => navigate('/'), 2000);
            } else {
                setCanRegister(true);
            }
        } catch (error) {
            console.error('Error checking user count:', error);
            setCanRegister(false);
            toast.error(t.daftarTerjadiKesalahan, {
                position: 'top-right',
                autoClose: 2000,
                closeButton: false,
                pauseOnHover: false
            });
        }
    };

    // ========= LANGUAGE =========
    const handleLanguageChange = (lang) => {
        setLanguage(lang);
        setShowDropdown(false);
        localStorage.setItem('language', lang);
    };

    // ========= PASSWORD =========
    const togglePassword = () => {
        setShowPassword(!showPassword);
    };

    // ========= Handle Firebase =========
    const { fullName, phone, email, password, isFormValid } = useSignupForm(t);
    const handleSignup = async (e) => {
        e.preventDefault();
        
        if (!canRegister) {
            return;
        }

        if (!isFormValid) {
            toast.error(t.mohonLengkapiForm, {
                position: 'top-right',
                autoClose: 2000,
                closeButton: false,
                pauseOnHover: false
            });
            return;
        }

        try {
            const usersRef = collection(db, 'users');
            const userCountQuery = query(usersRef, limit(1));
            const userCountSnapshot = await getDocs(userCountQuery);
            
            if (!userCountSnapshot.empty) {
                navigate('/');
                return;
            }

            const formattedPhone = phone.phoneNumber.startsWith('8') 
                ? '0' + phone.phoneNumber 
                : phone.phoneNumber;

            const phoneQuery = query(
                collection(db, 'users'),
                where('phone_number', '==', formattedPhone)
            );
            const phoneSnapshot = await getDocs(phoneQuery);
            
            if (!phoneSnapshot.empty) {
                toast.error(t.nomorTelahDigunakan, {
                    position: 'top-right',
                    autoClose: 2000,
                    closeButton: false,
                    pauseOnHover: false
                });
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                email.email, 
                password.password
            );
            const user = userCredential.user;
            
            await setDoc(doc(db, 'users', user.uid), {
                id: user.uid,
                full_name: fullName.fullName.trim(),
                phone_number: formattedPhone,
                email: email.email,
                createdAt: new Date(),
                isActive: true
            });

            toast.success(t.daftarBerhasil, {
                position: 'top-right',
                autoClose: 1000,
                closeButton: false,
                pauseOnHover: false
            });
            
            setTimeout(() => navigate('/'), 2000);

        } catch (error) {
            console.error('Register error:', error);
            const code = error.code;
            
            if (code === 'auth/email-already-in-use') {
                toast.error(t.emailTelahDigunakan, {
                    position: 'top-right',
                    autoClose: 2000,
                    closeButton: false,
                    pauseOnHover: false
                });
            } else if (code === 'auth/network-request-failed') {
                toast.error(t.masalahJaringan, {
                    position: 'top-right',
                    autoClose: 2000,
                    closeButton: false,
                    pauseOnHover: false
                });
            } else {
                toast.error(t.daftarTerjadiKesalahan, {
                    position: 'top-right',
                    autoClose: 2000,
                    closeButton: false,
                    pauseOnHover: false
                });
            }
        }
    };

    // ========= REGISTRATION BLOCKED STATE =========
    if (!canRegister) {
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
                    <div>
                        <h2>{t.pendaftaranTidakTersedia}</h2>
                        <Link to="/">
                            {t.kembaliKeLogin}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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
                            onClick={() => setShowDropdown(!showDropdown)} 
                        />
                        {showDropdown && (
                            <div className="login-dropdown-language">
                                <div onClick={() => handleLanguageChange('id')}>Indonesian</div>
                                <div onClick={() => handleLanguageChange('en')}>English</div>
                            </div>
                        )}
                    </div>
                </div>
                <h2>{t.daftar}</h2>
                <form onSubmit={handleSignup}>
                    <label htmlFor="full_name">{t.namaLengkap}</label>
                    <div className="login-email-wrapper">
                        <input 
                            type="text"
                            id="full_name"
                            value={fullName.fullName}
                            onChange={fullName.handleFullNameChange}
                            placeholder={t.placeholderNamalengkap}
                            className={fullName.fullNameError ? 'error' : fullName.isFullNameValid ? 'valid' : ''}
                            required
                        />
                        {fullName.fullNameError && (
                            <span className="login-telepon-error-message">{fullName.fullNameError}</span>
                        )}
                        {fullName.isFullNameValid && (
                            <span className="login-telepon-valid-message">
                                {t.namaLengkapValid}
                            </span>
                        )}
                    </div>
                    <label htmlFor="phone_number">{t.nomorTelepon}</label>
                    <div className="login-email-wrapper">
                        <div className="login-phone-input-container">
                            <span className="login-phone-prefix">+62</span>
                            <input 
                                type="tel"
                                id="phone_number"
                                value={phone.phoneNumber}
                                onChange={phone.handlePhoneChange}
                                placeholder={t.placeholderNomorTelepon}
                                className={phone.phoneError ? 'error login-phone-input' : phone.isPhoneValid ? 'valid login-phone-input' : 'login-phone-input'}
                                required
                            />
                        </div>
                        {phone.phoneError && (
                            <span className="login-telepon-error-message">{phone.phoneError}</span>
                        )}
                        {phone.isPhoneValid && (
                            <span className="login-telepon-valid-message">
                                {t.nomorTeleponValid}
                            </span>
                        )}
                    </div>
                    <label htmlFor="email">{t.email}</label>
                    <div className="login-email-wrapper">
                        <input 
                            type="email" 
                            id="email"
                            value={email.email}
                            onChange={email.handleEmailChange}
                            placeholder={t.placeholderEmail}
                            className={email.emailError ? 'error' : email.isEmailValid ? 'valid' : ''}
                            required 
                        />
                        {email.emailError && (
                            <span className="login-email-error-message">{email.emailError}</span>
                        )}
                        {email.isEmailValid && (
                            <span className="login-email-valid-message">
                                {t.formatValidEmail}
                            </span>
                        )}
                    </div>
                    <label htmlFor="password">{t.kataSandi}</label>
                    <div className="login-password-wrapper">
                        <div className="login-password-input-container">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password.password}
                                onChange={password.handlePasswordChange}
                                placeholder={t.placeholderKataSandi}
                                className={password.passwordError ? 'error' : password.isPasswordValid ? 'valid' : ''}
                                required
                            />
                            <img
                                src={showPassword ? showIcon : hideIcon}
                                alt={showPassword ? "Show Password" : "Hide Password"}
                                className="login-icon"
                                onClick={togglePassword}
                            />
                            {password.password && (
                                <div className="password-strength-indicator">
                                    <span>
                                        {password.getPasswordStrength().text}
                                    </span>
                                </div>
                            )}
                        </div>
                        {password.passwordError && (
                            <span className="login-password-error-message">
                                {password.passwordError}
                            </span>
                        )}
                        {password.isPasswordValid && (
                            <span className="login-password-valid-message">
                                {t.passwordValid}
                            </span>
                        )}
                    </div>
                    <button 
                        type="submit"
                        disabled={!isFormValid || !canRegister}
                    >
                        {t.daftar}
                    </button>
                    <p className="login-register">
                        {t.sudahPunyaAkun} <Link to="/">{t.masukDisini}</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Daftar;