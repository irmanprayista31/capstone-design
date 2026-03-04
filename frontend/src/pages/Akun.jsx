import { useState, useEffect, useRef } from 'react';
import './Akun.css'; 
import logo from '../assets/LogoWeb.png';
import notificationIcon from '../assets/notification.svg';
import globeIcon from '../assets/language.svg';
import copyrightIcon from '../assets/copyright.svg';
import lightModeIcon from '../assets/lightmode.svg';
import darkModeIcon from '../assets/darkmode.svg';
import hamburgerIcon from '../assets/hamburger.svg';
import tripledotIcon from '../assets/other.svg';
import translations from '../components/Bahasa.js';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { auth, db } from '../firebase';
import useNotifications from '../hooks/Notification.js';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { verifyBeforeUpdateEmail } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

const Akun = () => {
    // ========= NOTIFICATION FUNCTIONALITY ========
    const notificationRef = useRef(null);
    const notificationIconRef = useRef(null);
    const [showNotification, setShowNotification] = useState(false);
    const { savedNotifications, deleteNotification } = useNotifications(); 
    // =============================================

    // =========== Menu sidebar kiri ===========
    const toggleSidebar = () => {
        const sidebar = document.getElementById("akun-sidebar");
        if (sidebar) {
            sidebar.classList.toggle("akun-open-sidebar");
        }
    };
    const closeSidebar = () => {
        const sidebar = document.getElementById("akun-sidebar");
        if (sidebar) {
            sidebar.classList.remove("akun-open-sidebar");
        }
    };
    useEffect(() => {
        const handleClickOutside = (event) => {
            const sidebar = document.getElementById("akun-sidebar");
            const hamburger = document.querySelector(".akun-hamburger");
            if (
                sidebar &&
                !sidebar.contains(event.target) &&
                !hamburger.contains(event.target)
            ) {
                sidebar.classList.remove("akun-open-sidebar");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    // ========================================

    // ====== Menu lainnya (Three Dots): kontak, akun, dan beranda ======
    const otherMenuThreeDots = useRef(null);
    const otherIconThreeDots = useRef(null);
    const [showNavRightDropDown, setShowNavRightDropDown] = useState(false);
    useEffect(() => {
        const handleClickOutsideDropdown = (event) => {
            if (
                dropdownLanguage.current &&
                !dropdownLanguage.current.contains(event.target) &&
                globeLanguage.current &&
                !globeLanguage.current.contains(event.target)
            ) {
                setShowDropdownLanguage(false);
            }
            if (
                otherMenuThreeDots.current &&
                !otherMenuThreeDots.current.contains(event.target) &&
                otherIconThreeDots.current &&
                !otherIconThreeDots.current.contains(event.target)
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
    // ========================================

    // =========== Bahasa ===========
    const dropdownLanguage = useRef(null);
    const globeLanguage = useRef(null);
    const [language, setLanguage] = useState(localStorage.getItem('language') || 'id');
    const [showDropdownLanguage, setShowDropdownLanguage] = useState(false);
    const t = translations[language];
    const handleLanguageChange = (lang) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
        setShowDropdownLanguage(false);
    };
    // ==============================

    // =========== Darkmode dan lightmode ===========
    const [darkMode, setDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('darkMode');
        return savedMode === 'true'; 
    });
    useEffect(() => {
        document.body.className = darkMode ? 'akun-dark-mode' : 'akun-light-mode';
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);
    // =============================================

    // =========== tempat penyimpanan data di browser (Web Storage API) ===========
    const uid = localStorage.getItem('userId');
    // ============================================================================

    // ========== Tampilkan data akun ==========
    const [userData, setUserData] = useState({});
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const docRef = doc(db, 'users', uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                }
            } catch (err) {
                console.error('Gagal ambil data user:', err);
                toast.error(t.gagalAmbilData, { position: 'top-right', autoClose: 2000, closeButton: false, pauseOnHover: false });
            }
        };
        if (uid) fetchUserData();
    }, [uid]);
    // =========================================
    
    // ======== Tombol logout =========
    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.removeItem('userId');
        toast.success(t.keluarBerhasil, { position: 'top-right', autoClose: 1000, closeButton: false, pauseOnHover: false });
        setTimeout(() => navigate('/'), 2000);
    };
    // ================================

    // ======== Ubah data user di halaman akun ========
    const [editData, setEditData] = useState({
        full_name: '',
        phone_number: '',
        email: '',
        password: ''
    });
    const handleChange = (e) => {
        const { id, value } = e.target;
        setEditData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleUpdate = async () => {
        const payload = {};
        Object.keys(editData).forEach((key) => {
            if (editData[key].trim() !== '') payload[key] = editData[key];
        });
        
        if (Object.keys(payload).length === 0) return;

        try {
            if (payload.email) {
                if (payload.email !== userData.email) {
                    const emailExists = await checkEmailExists(payload.email);
                    if (emailExists) {
                    toast.error(t.emailTelahDigunakan, {
                            position: 'top-right',
                            autoClose: 2000,
                            closeButton: false,
                            pauseOnHover: false
                        });
                        return;
                    }
                    setPendingUpdate(payload);
                    setShowPasswordModal(true);
                    return;
                } else {
                    toast.error(t.emailTelahDigunakan, {
                        position: 'top-right',
                        autoClose: 2000,
                        closeButton: false,
                        pauseOnHover: false
                    });
                    return;
                }
                }
            if (payload.phone_number) {
                const phoneExists = await checkPhoneNumberExists(payload.phone_number);
                if (phoneExists) {
                    toast.error(t.nomorTelahDigunakan, { 
                        position: 'top-right', 
                        autoClose: 2000, 
                        closeButton: false, 
                        pauseOnHover: false 
                    });
                    return;
                }
            }

            if (payload.email) {
                if (payload.email !== userData.email) {
                    setPendingUpdate(payload);
                    setShowPasswordModal(true);
                    return;
                }
            }
            await performUpdate(payload);

        } catch (error) {
            console.error('Update error:', error);
            toast.error(t.gagalUbahData, { 
                position: 'top-right', 
                autoClose: 2000, 
                closeButton: false, 
                pauseOnHover: false 
            });
        }
    };
    // ================================================

    // ======== Hapus akun users ========
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [confirmEmail, setConfirmEmail] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [stepConfirm, setStepConfirm] = useState(1);
    
    const handleDeleteAccount = () => {
        setShowDeleteModal(true);
        setStepConfirm(1);
        setConfirmEmail('');
        setConfirmPassword('');
    };

    const handleConfirmDelete = async () => {
        if (confirmEmail !== userData.email) {
            toast.error(t.gagalHapusAkun, { 
                position: 'top-right', 
                autoClose: 2000, 
                closeButton: false, 
                pauseOnHover: false 
            });
            return;
        }

        if (!confirmPassword.trim()) {
            toast.error(t.passwordTidakBolehKosong, { 
                position: 'top-right', 
                autoClose: 2000, 
                closeButton: false, 
                pauseOnHover: false 
            });
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(userData.email, confirmPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);

            await deleteDoc(doc(db, 'users', uid));

            await deleteUser(auth.currentUser);

            localStorage.removeItem('userId');

            setShowDeleteModal(false);

            toast.success(t.tampilanSetelahDelete, { 
                position: 'top-right', 
                autoClose: 1000, 
                closeButton: false, 
                pauseOnHover: false 
            });

            setTimeout(() => navigate('/'), 2000);

        } catch (error) {
            console.error('Delete account error:', error);

            if (error.code === 'auth/wrong-password') {
                toast.error(t.passwordSalah, { 
                    position: 'top-right', 
                    autoClose: 2000, 
                    closeButton: false, 
                    pauseOnHover: false 
                });
            } else if (error.code === 'auth/requires-recent-login') {
                toast.error(t.perluLoginUlang, { 
                    position: 'top-right', 
                    autoClose: 2000, 
                    closeButton: false, 
                    pauseOnHover: false 
                });
            } else {
                toast.error(t.errorHapusAkun, { 
                    position: 'top-right', 
                    autoClose: 2000, 
                    closeButton: false, 
                    pauseOnHover: false 
                });
            }
        }
    };
    // ================================================
    
    // ====== Tambahkan state untuk modal verifikasi password ======
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [verificationPassword, setVerificationPassword] = useState('');
    const [pendingUpdate, setPendingUpdate] = useState({});
    // ================================================

    // ====== Pengecekan email ada atau tidak ======
    const checkEmailExists = async (email) => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email));
            const querySnapshot = await getDocs(q);

            return !querySnapshot.empty;
        } catch (error) {
            console.error('Error checking email:', error);
            return false;
        }
    };
    // ============================================

    // ====== Function untuk mengecek apakah nomor telepon sudah digunakan ========
    const checkPhoneNumberExists = async (phoneNumber) => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('phone_number', '==', phoneNumber));
            const querySnapshot = await getDocs(q);

            // return !querySnapshot.empty && querySnapshot.docs[0].id !== uid;
            return !querySnapshot.empty;
        } catch (error) {
            console.error('Error checking phone number:', error);
            return false;
        }
    };
    // ================================================

    // ======= Function untuk mengecek apakah email sudah digunakan ========
    const verifyPassword = async (inputPassword) => {
        try {
            if (!auth.currentUser || !auth.currentUser.email) {
                throw new Error("User tidak login atau email tidak tersedia");
            }

            const credential = EmailAuthProvider.credential(auth.currentUser.email, inputPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            return true;
        } catch (error) {
            console.error('Error verifying password:', error);
            return false;
        }
    };
    // ================================================
    
    // ======== Function untuk melakukan update sebenarnya =========
    const performUpdate = async (payload) => {
        try {
            const userRef = doc(db, 'users', uid);

            const { email, ...restPayload } = payload;

            if (email && email !== auth.currentUser.email) {
                await verifyBeforeUpdateEmail(auth.currentUser, email);

                toast.info(t.verifikasiEmailBaru, {
                    position: 'top-right',
                    autoClose: 3000,
                    closeButton: false,
                    pauseOnHover: false
                });

                setTimeout(() => {
                    localStorage.removeItem('userId');
                    toast.info(t.perluLoginUlang, { 
                        position: 'top-right', 
                        autoClose: 1000, 
                        closeButton: false, 
                        pauseOnHover: false 
                    });
                    setTimeout(() => navigate('/'), 2000);
                }, 3500);
                return; 
            }

            if (Object.keys(restPayload).length > 0 || email) {
                await updateDoc(userRef, payload);
            }

            toast.success(t.dataBerhasilDiubah, {
                position: 'top-right',
                autoClose: 1000,
                closeButton: false,
                pauseOnHover: false
            });

            setEditData({ full_name: '', phone_number: '', email: '', password: '' });

            const updatedSnap = await getDoc(userRef);
            setUserData(updatedSnap.data());

        } catch (error) {
            console.error('Perform update error:', error);
            toast.error(t.gagalUbahData, {
                position: 'top-right',
                autoClose: 2000,
                closeButton: false,
                pauseOnHover: false
            });
        }
    };
    // ================================================

    // ======= Function untuk handle verifikasi password ========
    const handlePasswordVerification = async () => {
        const isValidPassword = await verifyPassword(verificationPassword);
        
        if (isValidPassword) {
            setShowPasswordModal(false);
            setVerificationPassword('');
            await performUpdate(pendingUpdate);
            setPendingUpdate({});
        } else {
            toast.error(t.passwordSalah, { 
                position: 'top-right', 
                autoClose: 2000, 
                closeButton: false, 
                pauseOnHover: false 
            });
        }
    };
    // ================================================

    // ======== Function untuk cancel verifikasi password ========
    const handleCancelPasswordVerification = () => {
        setShowPasswordModal(false);
        setVerificationPassword('');
        setPendingUpdate({});
    };
    // ================================================

    // ===== Konfirmasi bahwa email berhasil ubah =====
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const firestoreEmail = userData?.email;
                const authEmail = user.email;

                if (firestoreEmail && authEmail && firestoreEmail !== authEmail) {
                    try {
                        const userRef = doc(db, 'users', user.uid);
                        await updateDoc(userRef, { email: authEmail });
                        setUserData((prev) => ({ ...prev, email: authEmail }));

                        toast.success(t.dataBerhasilDiubah, {
                            position: 'top-right',
                            autoClose: 2000,
                            closeButton: false,
                            pauseOnHover: false
                        });
                        
                    } catch (error) {
                        console.error("Gagal update email ke Firestore:", error);
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [userData?.email]);
    // ================================================

    return (
        <div className="akun-navbar-container">
            <ToastContainer />
            <div className="akun-navbar">
                <div className="akun-navbar-left">
                    <button className="akun-hamburger" onClick={toggleSidebar}>
                        <img src={hamburgerIcon} alt="Menu Sidebar" />
                    </button>
                    <img src={logo} alt="Logo" className="akun-logo-web" />
                    <a>Senergy</a>
                </div>
                <div className="akun-navbar-right">
                    <div className="akun-navbar-other-dropdown">
                        <img
                            ref={otherIconThreeDots}
                            src={tripledotIcon}
                            alt="Menu"
                            className="akun-other-icon"
                            onClick={() => setShowNavRightDropDown(!showNavRightDropDown)}
                        />
                        {showNavRightDropDown && (
                            <div className="akun-navbar-other-dropdown-menu" ref={otherMenuThreeDots}>
                                <Link to="/kontak">{t.berandaKontak}</Link>
                                <Link to="/beranda">{t.berandaBeranda}</Link>
                                <Link to="/akun">{t.berandaAkun}</Link>
                            </div>
                        )}
                    </div>
                    <div className="akun-navbar-right-desktop">
                        <Link to="/kontak">{t.berandaKontak}</Link>
                        <Link to="/beranda">{t.berandaBeranda}</Link>
                        <Link to="/akun">{t.berandaAkun}</Link>
                    </div>
                    <div className="akun-garis"></div>
                    <div className="akun-navbar-notification"> 
                        <div className="akun-notification-icon-container">
                            <img 
                                ref={notificationIconRef}
                                src={notificationIcon} 
                                alt="Notifikasi" 
                                className="akun-notification-icon" 
                                onClick={() => setShowNotification(!showNotification)}
                            />
                            {savedNotifications.length > 0 && (
                                <div className={`akun-notification-badge ${savedNotifications.length > 99 ? 'large-count' : ''}`}>
                                    {savedNotifications.length > 99 ? '99+' : savedNotifications.length}
                                </div>
                            )}
                        </div>
                        {showNotification && (
                            <div className="akun-navbar-notification-dropdown" ref={notificationRef}>
                                <div className="akun-notification-kolom">
                                    {savedNotifications.length === 0 ? (
                                        <div className="akun-notification-item">
                                            <div className="akun-notification-judul-nolimit">{t.tidakAdaNotifikasiOverlimit}</div>
                                        </div>
                                    ) : (
                                        savedNotifications.map((notif, index) => (
                                            <div key={index} className="akun-notification-item">
                                                <div className="akun-notification-judul">{t.kamar} {notif.id}</div>
                                                <div className="akun-notification-isi">
                                                    <span>{t.namaPenggunaKos}: {notif.nama || '-'}</span>
                                                    <span>{t.editPenggunaan}: {notif.penggunaan?.toFixed(2)} kWh</span>
                                                    <span>{t.tanggalNotifikasi}: {notif.tanggal}</span>
                                                    <span>Status: {t.infoMelebihi}</span>
                                                </div>
                                                <button className="akun-hapus-notifikasi-btn" onClick={() => deleteNotification(notif.id)}>
                                                    {t.hapusNotifikasi}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="akun-language-switch">
                        <img
                            ref={globeLanguage}
                            src={globeIcon}
                            alt="Pilih Bahasa"
                            className="akun-globe-icon"
                            onClick={() => setShowDropdownLanguage(!showDropdownLanguage)}
                        />
                        {showDropdownLanguage && (
                            <div className="akun-dropdown-language" ref={dropdownLanguage}>
                                <div onClick={() => handleLanguageChange('id')}>Indonesian</div>
                                <div onClick={() => handleLanguageChange('en')}>English</div>
                            </div>
                        )}
                    </div>
                    <button 
                        className={"akun-mode-toggle " + (darkMode ? "akun-dark" : "akun-light")}
                        onClick={() => setDarkMode(!darkMode)}
                        title="Toggle Theme"
                    >
                        {darkMode ? (
                            <img src={darkModeIcon} alt="Dark Mode" className="akun-mode-icon" />
                        ) : (
                            <img src={lightModeIcon} alt="Light Mode" className="akun-mode-icon" />
                        )}
                    </button>
                </div>
            </div>
            <div className="akun-sidebar" id="akun-sidebar">
                <Link to="/kamar" onClick={closeSidebar}>{t.berandaKamar}</Link>
                <Link to="/grafik" onClick={closeSidebar}>{t.berandaGrafik}</Link>
            </div>
            <div className="akun-main-content">
                <div className="akun-feature-grid">
                    <div className="akun-akun-user">
                        <div className="akun-form">
                            <label htmlFor="full_name">{t.namaLengkap}</label>
                            <input 
                                type="text"
                                id="full_name"
                                value={editData.full_name}
                                onChange={handleChange}
                                placeholder={t.placeholderNamalengkap}
                            />
                            <label htmlFor="phone_number">{t.nomorTelepon}</label>
                            <input 
                                type="tel"
                                id="phone_number"
                                value={editData.phone_number}
                                onChange={handleChange}
                                placeholder={t.placeholderNomorTelepon}
                            />
                            <label htmlFor="email">{t.email}</label>
                            <input
                                type="email"
                                id="email"
                                value={editData.email}
                                onChange={handleChange}
                                placeholder={t.placeholderEmail}
                            />
                            <button onClick={handleUpdate}>{t.ubahDataUser}</button>
                        </div>
                        <div className="akun-form">
                            <label htmlFor="full_name">{t.namaLengkap}</label>
                            <input 
                                type="text"
                                value={userData.full_name || ''}
                                id="full_name_readonly"
                                readOnly
                            />
                            <label htmlFor="phone_number">{t.nomorTelepon}</label>
                            <input 
                                type="tel"
                                value={userData.phone_number || ''}
                                id="phone_number_readonly"
                                readOnly
                            />
                            <label htmlFor="email">{t.email}</label>
                            <input
                                type="email"
                                value={userData.email || ''}
                                id="email_readonly"
                                readOnly
                            />
                            <button onClick={handleLogout}>{t.keluarDataUser}</button>
                        </div>
                    </div>
                    <div className="akun-hapus-akun">
                        <button onClick={handleDeleteAccount} className="akun-button-hapus" >{t.hapusDataUser}</button>
                    </div>
                    {showDeleteModal && (
                        <div className="akun-hapus-overlay">
                            <div className="akun-hapus-box">
                                {stepConfirm === 1 ? (
                                    <>
                                        <p>{t.hapusAkun}</p>
                                        <div className="akun-hapus-buttons">
                                            <button onClick={() => setStepConfirm(2)}>{t.ya}</button>
                                            <button onClick={() => setShowDeleteModal(false)}>{t.tidak}</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <label htmlFor="email">{t.email}</label>
                                        <input
                                            type="email"
                                            placeholder={t.placeholderEmail}
                                            value={confirmEmail}
                                            onChange={(e) => setConfirmEmail(e.target.value)}
                                        />
                                        <label htmlFor="password">{t.password}</label>
                                        <input
                                            type="password"
                                            placeholder={t.placeholderKataSandi}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <div className="akun-hapus-buttons">
                                            <button onClick={handleConfirmDelete}>{t.konfirmasiHapus}</button>
                                            <button onClick={() => setShowDeleteModal(false)}>{t.batalHapus}</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    {showPasswordModal && (
                        <div className="akun-hapus-overlay">
                            <div className="akun-hapus-box">
                                <label htmlFor="password">{t.password}</label>
                                <input
                                    type="password"
                                    placeholder={t.placeholderKataSandi}
                                    value={verificationPassword}
                                    onChange={(e) => setVerificationPassword(e.target.value)}
                                />
                                <div className="akun-hapus-buttons">
                                    <button onClick={handlePasswordVerification}>
                                        {t.konfirmasiHapus}
                                    </button>
                                    <button onClick={handleCancelPasswordVerification}>
                                        {t.batalHapus}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <footer className="akun-footer-edit">
                <img src={copyrightIcon} className="akun-footer-icon" />
                <p>{t.berandaHakCipta}</p>
            </footer>
        </div>
    );
};

export default Akun;