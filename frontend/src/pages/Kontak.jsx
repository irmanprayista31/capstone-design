import { useState, useEffect } from 'react';
import './Kontak.css'; 
import logo from '../assets/LogoWeb.png';
import notificationIcon from '../assets/notification.svg';
import globeIcon from '../assets/language.svg';
import copyrightIcon from '../assets/copyright.svg';
import lightModeIcon from '../assets/lightmode.svg';
import darkModeIcon from '../assets/darkmode.svg';
import hamburgerIcon from '../assets/hamburger.svg';
import tripledotIcon from '../assets/other.svg';
import translations from '../components/Bahasa.js';
import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useNotifications from '../hooks/Notification.js';

const Kontak = () => {
// ============ LANGUAGE ============
    const dropdownRef = useRef(null);
    const globeRef = useRef(null);
    const [language, setLanguage] = useState(localStorage.getItem('language') || 'id');
    const [showDropdown, setShowDropdown] = useState(false);
    const t = translations[language];
    const handleLanguageChange = (lang) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
        setShowDropdown(false);
    };
    // ==============================

    // ========= NOTIFICATION FUNCTIONALITY ========
    const notificationRef = useRef(null);
    const notificationIconRef = useRef(null);
    const [showNotification, setShowNotification] = useState(false);
    const { savedNotifications, deleteNotification } = useNotifications(); 
    // =============================================

    // ============ DARK MODE MANAGEMENT ============
    const [darkMode, setDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('darkMode');
        return savedMode === 'true';
    });
    useEffect(() => {
        document.body.className = darkMode ? 'kontak-dark-mode' : 'kontak-light-mode';
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);
    // ==============================

    // ============ DROPDOWN MANAGEMENT ============
    const otherMenuRef = useRef(null);
    const otherIconRef = useRef(null);
    const [showNavRightDropDown, setShowNavRightDropDown] = useState(false);
    useEffect(() => {
        const handleClickOutsideDropdown = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                globeRef.current &&
                !globeRef.current.contains(event.target)
            ) {
                setShowDropdown(false);
            }
            if (
                otherMenuRef.current &&
                !otherMenuRef.current.contains(event.target) &&
                otherIconRef.current &&
                !otherIconRef.current.contains(event.target)
            ) {
                setShowNavRightDropDown(false);
            }
            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target) &&
                notificationIconRef.current &&
                !notificationIconRef.current.contains(event.target)
            ) {
                setShowNotification(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutsideDropdown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutsideDropdown);
        };
    }, []);
    // ====================================

    // ============ SIDEBAR MANAGEMENT ============
    const toggleSidebar = () => {
        const sidebar = document.getElementById("kontak-sidebar");
        if (sidebar) {
            sidebar.classList.toggle("kontak-open-sidebar");
        }
    };
    const closeSidebar = () => {
        const sidebar = document.getElementById("kontak-sidebar");
        if (sidebar) {
            sidebar.classList.remove("kontak-open-sidebar");
        }
    };
    useEffect(() => {
        const handleClickOutsideSidebar = (event) => {
            const sidebar = document.getElementById("kontak-sidebar");
            const hamburger = document.querySelector(".kontak-hamburger");
            if (
                sidebar &&
                !sidebar.contains(event.target) &&
                hamburger &&
                !hamburger.contains(event.target)
            ) {
                sidebar.classList.remove("kontak-open-sidebar");
            }
        };
        document.addEventListener("mousedown", handleClickOutsideSidebar);
        return () => {
            document.removeEventListener("mousedown", handleClickOutsideSidebar);
        };
    }, []);
    // =========================================

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const [email, setEmail] = useState('');
    const [pesan, setPesan] = useState('');
    const [status,] = useState('');
    const [loading, setLoading] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL_KAMAR;

    const handleKirimPesan = async () => {
    setLoading(true);

    if (!isValidEmail(email)) {
        toast.error(t.emailTidakSesuai, {
            position: 'top-right',
            autoClose: 2000,
            closeButton: false,
            pauseOnHover: false,
        });
        setLoading(false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/kontak`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, pesan }),
        });

        const result = await response.json();

        if (response.ok) {
            toast.success(t.pesanBerhasilTerkirim, {
                position: 'top-right',
                autoClose: 1500,
                closeButton: false,
                pauseOnHover: false,
            });
            setEmail('');
            setPesan('');
        } else {
            toast.error(t.pesanGagalTerkirim, {
                position: 'top-right',
                autoClose: 2000,
                closeButton: false,
                pauseOnHover: false,
            });
        }
    } catch (error) {
        toast.error(t.errorKirimPesan, {
            position: 'top-right',
            autoClose: 2000,
            closeButton: false,
            pauseOnHover: false,
        });
    }

    setLoading(false);
    };

    return (
        <div className="kontak-halaman">
            <ToastContainer />
            <div className="kontak-navbar">
                <div className="kontak-navbar-left">
                    <button className="kontak-hamburger" onClick={toggleSidebar}>
                        <img src={hamburgerIcon} alt="Menu Sidebar" />
                    </button>
                    <img src={logo} alt="Logo" className="kontak-logo-web" />
                    <a>Senergy</a>
                </div>
                <div className="kontak-navbar-right">
                    <div className="kontak-navbar-other-dropdown">
                        <img
                            ref={otherIconRef}
                            src={tripledotIcon}
                            alt="Menu"
                            className="kontak-other-icon"
                            onClick={() => setShowNavRightDropDown(!showNavRightDropDown)}
                        />
                        {showNavRightDropDown && (
                            <div className="kontak-navbar-other-dropdown-menu" ref={otherMenuRef}>
                                <Link to="/kontak">{t.berandaKontak}</Link>
                                <Link to="/beranda">{t.berandaBeranda}</Link>
                                <Link to="/akun">{t.berandaAkun}</Link>
                            </div>
                        )}
                    </div>
                    <div className="kontak-navbar-right-desktop">
                        <Link to="/kontak">{t.berandaKontak}</Link>
                        <Link to="/beranda">{t.berandaBeranda}</Link>
                        <Link to="/akun">{t.berandaAkun}</Link>
                    </div>
                    <div className="kontak-garis"></div>
                    <div className="kontak-navbar-notification"> 
                        <div className="kontak-notification-icon-container">
                            <img 
                                ref={notificationIconRef}
                                src={notificationIcon} 
                                alt="Notifikasi" 
                                className="kontak-notification-icon" 
                                onClick={() => setShowNotification(!showNotification)}
                            />
                            {savedNotifications.length > 0 && (
                                <div className={`kontak-notification-badge ${savedNotifications.length > 99 ? 'large-count' : ''}`}>
                                    {savedNotifications.length > 99 ? '99+' : savedNotifications.length}
                                </div>
                            )}
                        </div>
                        {showNotification && (
                            <div className="kontak-navbar-notification-dropdown" ref={notificationRef}>
                                <div className="kontak-notification-kolom">
                                    {savedNotifications.length === 0 ? (
                                        <div className="kontak-notification-item">
                                            <div className="kontak-notification-judul-nolimit">{t.tidakAdaNotifikasiOverlimit}</div>
                                        </div>
                                    ) : (
                                        savedNotifications.map((notif, index) => (
                                            <div key={index} className="kontak-notification-item">
                                                <div className="kontak-notification-judul">{t.kamar} {notif.id}</div>
                                                <div className="kontak-notification-isi">
                                                    <span>{t.namaPenggunaKos}: {notif.nama || '-'}</span>
                                                    <span>{t.editPenggunaan}: {notif.penggunaan?.toFixed(2)} kWh</span>
                                                    <span>{t.tanggalNotifikasi}: {notif.tanggal}</span>
                                                    <span>Status: {t.infoMelebihi}</span>
                                                </div>
                                                <button className="kontak-hapus-notifikasi-btn" onClick={() => deleteNotification(notif.id)}>
                                                    {t.hapusNotifikasi}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="kontak-language-switch">
                        <img
                            ref={globeRef}
                            src={globeIcon}
                            alt="Pilih Bahasa"
                            className="kontak-globe-icon"
                            onClick={() => setShowDropdown(!showDropdown)}
                        />
                        {showDropdown && (
                            <div className="kontak-dropdown-language" ref={dropdownRef}>
                                <div onClick={() => handleLanguageChange('id')}>Indonesian</div>
                                <div onClick={() => handleLanguageChange('en')}>English</div>
                            </div>
                        )}
                    </div>
                    <button 
                        className={"kontak-mode-toggle " + (darkMode ? "kontak-dark" : "kontak-light")}
                        onClick={() => setDarkMode(!darkMode)}
                        title="Toggle Theme"
                    >
                        {darkMode ? (
                            <img src={darkModeIcon} alt="Dark Mode" className="kontak-mode-icon" />
                        ) : (
                            <img src={lightModeIcon} alt="Light Mode" className="kontak-mode-icon" />
                        )}
                    </button>
                </div>
            </div>
            <div className="kontak-sidebar" id="kontak-sidebar">
                <Link to="/kamar" onClick={closeSidebar}>{t.berandaKamar}</Link>
                <Link to="/grafik" onClick={closeSidebar}>{t.berandaGrafik}</Link>
            </div>
            <div className="kontak-main-content">
                <div className="kontak-feature-grid">
                    <div className="kontak-wrapper">
                        <h2 className="kontak-title">{t.judulHalamanKontak}</h2>
                        <div className="kontak-container">
                            <div className="kontak-logo">
                                <img src={logo} alt="Senergy Logo" className="kontak-logo-image" />
                                <h3 className="kontak-logo-text">Senergy</h3>
                            </div>
                            <div className="kontak-form">
                                <label className="kontak-form-label">{t.email}</label>
                                <input
                                    type="email"
                                    className="kontak-form-input"
                                    placeholder={t.placeholderEmail}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <label className="kontak-form-label">{t.labelPesanAnda}</label>
                                <textarea
                                    className="kontak-form-textarea"
                                    placeholder={t.placeholderPesan}
                                    rows="6"
                                    value={pesan}
                                    onChange={(e) => setPesan(e.target.value)}
                                />
                                <button className="kontak-form-button" onClick={handleKirimPesan} disabled={loading}>
                                    {loading ? t.mengirim : t.pesanKirim}
                                </button>

                                {status && 
                                    <p style={{ marginTop: '10px' }}>
                                        {status}
                                    </p>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <footer className="kontak-footer-edit">
                <img src={copyrightIcon} className="kontak-footer-icon" />
                <p>{t.berandaHakCipta}</p>
            </footer>
        </div>
    );
};

export default Kontak;