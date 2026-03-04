import { useState, useEffect } from 'react';
import './Kamar.css'; 
import logo from '../assets/LogoWeb.png';
import notificationIcon from '../assets/notification.svg';
import useNotifications from '../hooks/Notification.js';
import globeIcon from '../assets/language.svg';
import copyrightIcon from '../assets/copyright.svg';
import lightModeIcon from '../assets/lightmode.svg';
import darkModeIcon from '../assets/darkmode.svg';
import hamburgerIcon from '../assets/hamburger.svg';
import tripledotIcon from '../assets/other.svg';
import kamarKosIcon from '../assets/kamarkos.svg';
import translations from '../components/Bahasa.js';
import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Kamar = () => {
    // ===== Pengaturan Darkmode =====
    const [darkMode, setDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('darkMode');
        return savedMode === 'true'; 
    });
    useEffect(() => {
        document.body.className = darkMode ? 'kamar-dark-mode' : 'kamar-light-mode';
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);
    // ================================

    // ========= Ganti Bahasa =========
    const [language, setLanguage] = useState(localStorage.getItem('language') || 'id');
    const handleLanguageChange = (lang) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
        setShowDropdown(false);
    };
    const t = translations[language];
    // ==============================

    // ========= 3 Menu + Globe + Lonceng Dropdown ========
    const dropdownRef = useRef(null);
    const globeRef = useRef(null);
    const otherMenuRef = useRef(null);
    const otherIconRef = useRef(null);
    const notificationRef = useRef(null);
    const notificationIconRef = useRef(null);
    const [showNotification, setShowNotification] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNavRightDropDown, setShowNavRightDropDown] = useState(false);
    const { savedNotifications, deleteNotification, updateNotifications } = useNotifications();
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
                setShowNotification(false)
            }
        };
        document.addEventListener('mousedown', handleClickOutsideDropdown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutsideDropdown);
        };
    }, []);
    // ===================================

    // ========== Sidebar ==========
    const toggleSidebar = () => {
        const sidebar = document.getElementById("kamar-sidebar");
        if (sidebar) {
            sidebar.classList.toggle("kamar-open-sidebar");
        }
    };
    const closeSidebar = () => {
        const sidebar = document.getElementById("kamar-sidebar");
        if (sidebar) {
            sidebar.classList.remove("kamar-open-sidebar");
        }
    };
    useEffect(() => {
        const handleClickOutside = (event) => {
            const sidebar = document.getElementById("kamar-sidebar");
            const hamburger = document.querySelector(".kamar-hamburger");
            if (
                sidebar &&
                !sidebar.contains(event.target) &&
                !hamburger.contains(event.target)
            ) {
                sidebar.classList.remove("kamar-open-sidebar");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    // ==============================

    // ========== API Base URL + Input kamar dari firebase ==========
    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL_KAMAR;
    const [kamarData, setKamarData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchKamarData();
    }, []);

    const fetchKamarData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/kamar`);
            if (!response.ok) {
                throw new Error('Failed to fetch room data');
            }

            const data = await response.json();
            setKamarData(data);
            setError(null);

            const initialPowerStatus = {};
            data.forEach(kamar => {
                const savedStatus = localStorage.getItem(`powerStatus_${kamar.id}`);

                if (kamar.status_kamar === 0) {
                    initialPowerStatus[kamar.id] = false;
                } else {
                    if (kamar.status_penggunaan === 'OVERLIMIT') {
                        initialPowerStatus[kamar.id] = false;
                    } else if (kamar.status_penggunaan === 'PERINGATAN' || kamar.status_penggunaan === 'AMAN') {
                        if (savedStatus === 'ON') {
                            initialPowerStatus[kamar.id] = true;
                        } else if (savedStatus === 'OFF') {
                            initialPowerStatus[kamar.id] = false;
                        } else {
                            initialPowerStatus[kamar.id] = true;
                        }
                    } else {
                        initialPowerStatus[kamar.id] = false;
                    }
                }
            });
            setKamarPowerStatus(initialPowerStatus);
            updateNotifications(data);

        } catch (err) {
            console.error('Error fetching room data:', err);
            setError(t.gagalMemuatKamar);
        } finally {
            setLoading(false);
        }
    };
    // ========================================

    // ========== Tombol on/off kamar ==========
    const [kamarPowerStatus, setKamarPowerStatus] = useState({});
    const togglePowerStatus = async (roomId) => {
        const kamar = kamarData.find(k => k.id === roomId);
        if (!kamar || kamar.status_penggunaan === "OVERLIMIT") {
            toast.error(`${t.relaykamar} ${roomId} ${t.dinonaktifkanKamar}`, { position: 'top-right', autoClose: 2500, closeButton: false, pauseOnHover: false });
            return;
        }
        const newStatus = !kamarPowerStatus[roomId]; 

        localStorage.setItem(`powerStatus_${roomId}`, newStatus ? 'ON' : 'OFF');

        setKamarPowerStatus((prevStatus) => ({
            ...prevStatus,
            [roomId]: newStatus,
        }));
        try {
            await fetch(`${API_BASE_URL}/kamar/${roomId}/relay`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    relay_status: newStatus ? "ON" : "OFF",
                }),
            });
        } catch (err) {
            console.error("Gagal update relay:", err);
        }
    };
    // ==============================

    // ========== Status Layout Kamar ==========
    const translateStatusPenggunaan = (status) => {
        if (!status) return null;
        switch (status.toUpperCase()) {
            case 'AMAN':
            return t.infoAman;
            case 'PERINGATAN':
            return t.infoPeringatan;
            case 'OVERLIMIT':
            return t.infoMelebihi;
            default:
            return status;
        }
    };
    // ==============================

    // ===== Notifikasi peringatan dan overlimit tiap kamar (toast) =====
    const showKamarNotifikasi = (kamar) => {
        if (!kamar) return;

        if (kamar.status_penggunaan === 'PERINGATAN') {
            toast.warning(`${t.kamar} ${kamar.id} ${t.peringatanKwh}`, {
                position: 'top-right',
                autoClose: 2500,
                closeButton: false, 
                pauseOnHover: false
            });
        } else if (kamar.status_penggunaan === 'OVERLIMIT') {
            toast.error(`${t.kamar} ${kamar.id} ${t.melebihiKwh}`, {
                position: 'top-right',
                autoClose: 2500,
                closeButton: false, 
                pauseOnHover: false
            });
        }
    };
    // ==============================

    // ========== REGISTRASI KAMAR ==========
    const [selectedKamarId, setSelectedKamarId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        nama_lengkap: '',
        nomor_telepon_pengguna_kos: '',
        sisa_hari: 30,
        batas_kwh: ''
    });
    const handleFormInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const handleTombolGunakanKamar = (roomData) => {
        if (roomData.status_kamar === 0) {
            setSelectedKamarId(roomData.id);
            setShowForm(true);
        }
    };
    const registerTenant = async (roomId, tenantData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/kamar/${roomId}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tenantData),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Registration failed');
            }
            return result;
        } catch (err) {
            console.error('Error registering tenant:', err);
            throw err;
        }
    };

    const handleSubmitForm = async () => {
        if (!formData.nama_lengkap.trim() || !formData.nomor_telepon_pengguna_kos.trim()) {
            toast.error(t.namaDanNomorWajibKamar, { position: 'top-right', autoClose: 2000, closeButton: false, pauseOnHover: false });
            return;
        }
        try {
            await registerTenant(selectedKamarId, formData);
            await fetch(`${API_BASE_URL}/kamar/${selectedKamarId}/sinkron-kwh`, {
                method: "POST",
            });

            toast.success(t.berhasilDaftarKamar, { position: 'top-right', autoClose: 1500, closeButton: false, pauseOnHover: false });
            setShowForm(false);
            setFormData({ nama_lengkap: '', nomor_telepon_pengguna_kos: '' });
            setTimeout(async () => {
                const response = await fetch(`${API_BASE_URL}/kamar`);
                if (!response.ok) throw new Error("Gagal fetch data");
                const data = await response.json();
                setKamarData(data);

                const updatedKamar = data.find(k => k.id === selectedKamarId);
                showKamarNotifikasi(updatedKamar);

                // Perbarui power status berdasarkan status penggunaan
                if (updatedKamar && updatedKamar.status_kamar === 1) {
                    setKamarPowerStatus(prev => ({
                        ...prev,
                        [updatedKamar.id]: updatedKamar.status_penggunaan === 'AMAN' || updatedKamar.status_penggunaan === 'PERINGATAN'
                    }));
                }
            }, 300);
        } catch (err) {
            toast.error(t.gagalDaftarKamar, { position: 'top-right', autoClose: 2000, closeButton: false, pauseOnHover: false });
        }
    };
    // ======================================

    // ======== Tombol Edit Kamar ========
    const [showEditForm, setShowEditForm] = useState(false);
    const [selectedKamarData, setSelectedKamarData] = useState(null);
    const [showBiayaModal, setShowBiayaModal] = useState(false);
    const [estimasiBiaya, setEstimasiBiaya] = useState(0);
    const [tambahanKwh, setTambahanKwh] = useState(0);
    let submitReadyRef = useRef(false);
    const [editFormData, setEditFormData] = useState({
        nama_lengkap: '',
        nomor_telepon_pengguna_kos: '',
        batas_kwh: '',
        tambahan_kwh: ''
    });
    
    const handleEditFormInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const handleEditTenant = (roomData) => {
        setSelectedKamarId(roomData.id);
        setSelectedKamarData(roomData);
        setEditFormData({
            nama_lengkap: roomData.nama_lengkap,
            nomor_telepon_pengguna_kos: roomData.nomor_telepon_pengguna_kos,
            batas_kwh: roomData.batas_kwh || '',
            tambahan_kwh: ''
        });
        setShowEditForm(true);
    };
    const updateTenant = async (roomId, tenantData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/kamar/${roomId}/tenant`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tenantData),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Update failed');
            }
            return result;
        } catch (err) {
            console.error('Error updating tenant:', err);
            throw err;
        }
    };
    const submitTenantUpdate = async (batasBaru) => {
        try {
            await updateTenant(selectedKamarId, {
                nama_lengkap: editFormData.nama_lengkap,
                nomor_telepon_pengguna_kos: editFormData.nomor_telepon_pengguna_kos,
                batas_kwh: batasBaru
            });

            toast.success(t.berhasilEditKamar, { position: 'top-right', autoClose: 1500, closeButton: false, pauseOnHover: false });
            setSelectedKamarData(null);
            setShowEditForm(false);
            setEditFormData({ nama_lengkap: '', nomor_telepon_pengguna_kos: '', batas_kwh: '', tambahan_kwh: 0 });

            await fetch(`${API_BASE_URL}/kamar/${selectedKamarId}/sinkron-kwh`, { method: "POST" });

            setTimeout(async () => {
                const response = await fetch(`${API_BASE_URL}/kamar`);
                const data = await response.json();
                setKamarData(data);

                const updatedKamar = data.find(k => k.id === selectedKamarId);
                showKamarNotifikasi(updatedKamar);

                if (updatedKamar) {
                    setKamarPowerStatus(prev => ({
                        ...prev,
                        [updatedKamar.id]: updatedKamar.status_penggunaan === 'AMAN' || updatedKamar.status_penggunaan === 'PERINGATAN'
                    }));
                }
            }, 300);
        } catch (err) {
            console.error('Gagal mengupdate data. Silakan coba lagi.', err);
            toast.error(t.gagalUpdateKamar, { position: 'top-right', autoClose: 2000, closeButton: false, pauseOnHover: false });
        }
    };
    const handleSubmitEditForm = async () => {
        if (!editFormData.nama_lengkap.trim() || !editFormData.nomor_telepon_pengguna_kos.trim()) {
            toast.error(t.namaDanNomorWajibKamar, { position: 'top-right', autoClose: 2000, closeButton: false, pauseOnHover: false });
            return;
        }
        const batasKwhLama = parseFloat(editFormData.batas_kwh || 0);
        const tambahan = parseFloat(editFormData.tambahan_kwh || 0);
        const batasBaru = batasKwhLama + tambahan;
        const tarif = 1445;
        const estimasi = tambahan * tarif;

        if (tambahan < 0) {
            toast.error(t.editKwhTidakNegatif, { position: 'top-right', autoClose: 2000, closeButton: false, pauseOnHover: false });
            return;
        }

        if (tambahan > 0) {
            setEstimasiBiaya(estimasi);
            setTambahanKwh(tambahan);
            submitReadyRef.current = true;
            setShowBiayaModal(true);
            return;
        }
        await submitTenantUpdate(batasBaru);
    };
    useEffect(() => {
        if (showForm || showEditForm) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showForm, showEditForm]);
    // ====================================

    // ======== Tombol Delete Kamar ========
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const handleDeleteTenant = (roomId) => {
        setSelectedRoomId(roomId);
        setShowDeleteModal(true);
    };
    const deleteTenant = async (roomId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/kamar/${roomId}/tenant`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Delete failed');
            }
            return result;
        } catch (err) {
            console.error('Error deleting tenant:', err);
            throw err;
        }
    };
    const handleConfirmDeleteTenant = async () => {
        try {
            const result = await deleteTenant(selectedRoomId);
            console.log('Tenant deleted:', result);
            toast.success(t.berhasilHapusKamar, { position: 'top-right', autoClose: 1500, closeButton: false, pauseOnHover: false });
            setTimeout(() => {
                fetchKamarData();
                setShowDeleteModal(false);
                setSelectedRoomId(null);
            }, 2500);
        } catch (err) {
            toast.error(t.gagalHapusKamar, { position: 'top-right', autoClose: 2000, closeButton: false, pauseOnHover: false });
        }
    };
    // =====================================

    // ========== Pengaturan convert timestamp ke tampilan user ==========
    const convertFirebaseTimestamp = (timestamp) => {
        if (!timestamp) return null;

        if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
        }

        if (timestamp && timestamp._seconds) {
            return new Date(timestamp._seconds * 1000);
        }
        
        try {
            return new Date(timestamp);
        } catch (error) {
            console.error('Error converting timestamp:', error);
            return null;
        }
    };
    // =====================================
    
    // ========== Pengaturan warna status pada Layout kamar ==========
    const getStatusColor = (status_penggunaan) => {
        if (status_penggunaan === 'OVERLIMIT') return 'lebihBatas'; 
        if (status_penggunaan === 'PERINGATAN') return 'peringatan';
        return 'aman';
    };
    // ===============================================================

    // ========== Update data kamar (Penyewa kost) setelah edit dan hapus ==========
    const renderKamarItem = (roomData) => {
        let isPowerOn = kamarPowerStatus[roomData.id]; 

        if (roomData.status_penggunaan === 'OVERLIMIT') {
            isPowerOn = false;
        }

        const buttonLabel = isPowerOn ? 'NYALA' : 'MATI';
        const buttonColor = isPowerOn ? '#27ae60' : '#C40000';

        return (
            <div key={roomData.id} className="kamar-item">
                <h3>{t.kamarKos} {roomData.id}</h3>
                <div className="kamar-list">
                    <div className="kamar-keterangan-isi">
                        <img src={kamarKosIcon} alt="Kamar Icon" className="kamar-icon" />
                        <div className="kamar-info">
                            <p>
                                <strong>{t.namaPenggunaKos}</strong>: {roomData.nama_lengkap}
                            </p>
                            <p>
                                <strong>{t.nomorPenggunaKos}</strong>: {roomData.nomor_telepon_pengguna_kos}
                            </p>
                            <p>
                                <strong>{t.sisa}</strong>: {roomData.sisa_hari} {roomData.sisa_hari !== '-' ? t.hariPenggunakos : ''}
                            </p>
                            <p>
                                <strong>{t.editPenggunaan}</strong>: {typeof roomData.penggunaan_kwh === 'number' && !isNaN(roomData.penggunaan_kwh)? `${roomData.penggunaan_kwh.toFixed(2)} kWh`: '-'}
                            </p>
                            <p>
                                {roomData.batas_kwh !== undefined && roomData.batas_kwh !== '-' ? (
                                    <>
                                        <strong>{t.batasKwhKamar}</strong>: {roomData.batas_kwh} kWh
                                    </>
                                ) : ''}
                            </p>
                            <p>
                                {roomData.tanggal_masuk && (
                                    <>
                                        <strong>{t.awalDaftarKamar}</strong>: {convertFirebaseTimestamp(roomData.tanggal_masuk)?.toLocaleDateString('id-ID') || 'Invalid Date'}
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="kamar-tombol-kamar">
                        {roomData.status_penggunaan && (
                            <label 
                                className={`kamar-status-label ${getStatusColor(roomData.status_penggunaan)}`}
                            >
                                Status: {translateStatusPenggunaan(roomData.status_penggunaan)}
                            </label>
                        )}
                        <button
                            className="kamar-on-off"
                            style={{ backgroundColor: buttonColor }}
                            onClick={() => togglePowerStatus(roomData.id)}
                            disabled={roomData.status_kamar === 0 || roomData.status_penggunaan === 'OVERLIMIT'}
                        >
                            {buttonLabel === 'NYALA' ? t.tombolOnKontrol : t.tombolOffKontrol}
                        </button>
                        <button
                            className={`kamar-status-gunakan ${roomData.status_kamar ? 'active' : 'inactive'}`}
                            onClick={() => handleTombolGunakanKamar(roomData)}
                            disabled={roomData.status_kamar === 1}
                        >
                            {roomData.status_kamar ? t.kamarSedangDigunakan : t.gunakanKamar}
                        </button>
                        {roomData.status_kamar === 1 && (
                            <div className="kamar-tombol-edit-hapus">
                                <button
                                    className="kamar-tombol-edit"
                                    onClick={() => handleEditTenant(roomData)}
                                    title="Edit Data Penghuni"
                                >
                                    {t.editTombolKamar}
                                </button>
                                <button
                                    className="kamar-tombol-hapus"
                                    onClick={() => handleDeleteTenant(roomData.id)}
                                    title="Hapus Penghuni"
                                >
                                    {t.hapusTombolKamar}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };
    // =====================================

    // ========== Tampilan coba lagi ketika error jaringan ==========
    if (error) {
        return (
            <div className="kamar-error-container">
                <div className="kamar-error">
                    <p>{error}</p>
                    <button onClick={fetchKamarData}>{t.cobaLagi}</button>
                </div>
            </div>
        );
    }
    // =========================================

    // ========= Loading ketika error jaringan ==========
    const LoadingSpinner = ({ size = 50, strokeWidth = 4 }) => {
        const radius = (size - strokeWidth) / 3;
        const circumference = radius * 0.34 * Math.PI;
        const strokeDasharray = circumference;
        const strokeDashoffset = circumference * 2;
        const spinnerColor = darkMode ? '#ffffff' : '#000000';
        return (
            <div className="kamar-loading">
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    className="kamar-loading-spinner"
                >
                    <defs>
                        <linearGradient id="kamarLoadingGradient">
                            <stop offset="0%" stopColor={spinnerColor} stopOpacity="1" />
                            <stop offset="0%" stopColor={spinnerColor} stopOpacity="1" />
                            <stop offset="0%" stopColor={spinnerColor} stopOpacity="1" />
                            <stop offset="0%" stopColor={spinnerColor} stopOpacity="1" />
                        </linearGradient>
                    </defs>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="url(#kamarLoadingGradient)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                    />
                </svg>
            </div>
        );
    };
    // ==========================================================

    return (
        <div className="kamar-halaman">
            <ToastContainer />
            <div className="kamar-navbar">
                <div className="kamar-navbar-left">
                    <button className="kamar-hamburger" onClick={toggleSidebar}>
                        <img src={hamburgerIcon} alt="Menu Sidebar" />
                    </button>
                    <img src={logo} alt="Logo" className="kamar-logo-web" />
                    <a>Senergy</a>
                </div>
                <div className="kamar-navbar-right">
                    <div className="kamar-navbar-other-dropdown">
                        <img
                            ref={otherIconRef}
                            src={tripledotIcon}
                            alt="Menu"
                            className="kamar-other-icon"
                            onClick={() => setShowNavRightDropDown(!showNavRightDropDown)}
                        />
                        {showNavRightDropDown && (
                            <div className="kamar-navbar-other-dropdown-menu" ref={otherMenuRef}>
                                <Link to="/kontak">{t.berandaKontak}</Link>
                                <Link to="/beranda">{t.berandaBeranda}</Link>
                                <Link to="/akun">{t.berandaAkun}</Link>
                            </div>
                        )}
                    </div>
                    <div className="kamar-navbar-right-desktop">
                        <Link to="/kontak">{t.berandaKontak}</Link>
                        <Link to="/beranda">{t.berandaBeranda}</Link>
                        <Link to="/akun">{t.berandaAkun}</Link>
                    </div>
                    <div className="kamar-garis"></div>
                    <div className="kamar-navbar-notification"> 
                        <div className="kamar-notification-icon-container">
                            <img 
                                ref={notificationIconRef}
                                src={notificationIcon} 
                                alt="Notifikasi" 
                                className="kamar-notification-icon" 
                                onClick={() => setShowNotification(!showNotification)}
                            />
                            {savedNotifications.length > 0 && (
                                <div className={`kamar-notification-badge ${savedNotifications.length > 99 ? 'large-count' : ''}`}>
                                    {savedNotifications.length > 99 ? '99+' : savedNotifications.length}
                                </div>
                            )}
                        </div>
                        {showNotification && (
                            <div className="kamar-navbar-notification-dropdown" ref={notificationRef}>
                                <div className="kamar-notification-kolom">
                                    {savedNotifications.length === 0 ? (
                                        <div className="kamar-notification-item">
                                            <div className="kamar-notification-judul-nolimit">{t.tidakAdaNotifikasiOverlimit}</div>
                                        </div>
                                    ) : (
                                        savedNotifications.map((notif, index) => (
                                            <div key={index} className="kamar-notification-item">
                                                <div className="kamar-notification-judul">{t.kamar} {notif.id}</div>
                                                <div className="kamar-notification-isi">
                                                    <span>{t.namaPenggunaKos}: {notif.nama || '-'}</span>
                                                    <span>{t.editPenggunaan}: {notif.penggunaan?.toFixed(2)} kWh</span>
                                                    <span>{t.tanggalNotifikasi}: {notif.tanggal}</span>
                                                    <span>Status: {t.infoMelebihi}</span>
                                                </div>
                                                <button className="kamar-hapus-notifikasi-btn" onClick={() => deleteNotification(notif.id)}>
                                                    {t.hapusNotifikasi}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="kamar-language-switch">
                        <img
                            ref={globeRef}
                            src={globeIcon}
                            alt="Pilih Bahasa"
                            className="kamar-globe-icon"
                            onClick={() => setShowDropdown(!showDropdown)}
                        />
                        {showDropdown && (
                            <div className="kamar-dropdown-language" ref={dropdownRef}>
                                <div onClick={() => handleLanguageChange('id')}>Indonesian</div>
                                <div onClick={() => handleLanguageChange('en')}>English</div>
                            </div>
                        )}
                    </div>
                    <button 
                        className={"kamar-mode-toggle " + (darkMode ? "kamar-dark" : "kamar-light")}
                        onClick={() => setDarkMode(!darkMode)}
                        title="Toggle Theme"
                    >
                        {darkMode ? (
                            <img src={darkModeIcon} alt="Dark Mode" className="kamar-mode-icon" />
                        ) : (
                            <img src={lightModeIcon} alt="Light Mode" className="kamar-mode-icon" />
                        )}
                    </button>
                </div>
            </div>
            <div className="kamar-sidebar" id="kamar-sidebar">
                <Link to="/kamar" onClick={closeSidebar}>{t.berandaKamar}</Link>
                <Link to="/grafik" onClick={closeSidebar}>{t.berandaGrafik}</Link>
            </div>
            <div className="kamar-main-content">
                <div className="kamar-feature-grid">
                    {loading ? (
                        <LoadingSpinner />
                    ) : (
                        <div className="kamar-grid">
                            {kamarData.map(roomData => renderKamarItem(roomData))}
                        </div>
                    )}
                </div>
            </div>
            {showForm && (
                <div className="kamar-daftar-overlay">
                    <div className="kamar-daftar-container">
                        <h2 className="kamar-daftar-title">{t.pendaftaranKamar}</h2>
                        <div className="kamar-daftar-content">
                            <div className="kamar-daftar-left">
                                <h3>{t.kamar} {selectedKamarId}</h3>
                                <div className="kamar-daftar-icon">
                                    <img src={kamarKosIcon} alt="Kamar Icon" className="kamar-daftar-icon-kamar" />
                                </div>
                            </div>
                            <div className="kamar-daftar-right">
                                <label className="kamar-daftar-labelnama">{t.namaLengkap}</label>
                                <input 
                                    type="text" 
                                    name="nama_lengkap"
                                    className="kamar-daftar-inputnama" 
                                    placeholder={t.placeholderNamalengkap}
                                    value={formData.nama_lengkap}
                                    onChange={handleFormInputChange}
                                    required
                                />
                                <label className="kamar-daftar-labelnomor">{t.nomorTelepon}</label>
                                <input 
                                    type="text" 
                                    name="nomor_telepon_pengguna_kos"
                                    className="kamar-daftar-inputnomor" 
                                    placeholder={t.placeholderNomorTelepon}
                                    value={formData.nomor_telepon_pengguna_kos}
                                    onChange={handleFormInputChange}
                                    required
                                />
                                <label className="kamar-daftar-labelbatas">{t.labelBatasKwh}</label>
                                <input 
                                    type="number" 
                                    name="batas_kwh"
                                    className="kamar-daftar-inputbatas" 
                                    placeholder={t.placeholderBatasKwh}
                                    value={formData.batas_kwh}
                                    onChange={handleFormInputChange}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    required
                                />
                                <label className="kamar-daftar-labelsisa">{t.labelSisaHari}</label>
                                <input 
                                    type="number" 
                                    name="sisa_hari"
                                    className="kamar-daftar-inputsisa" 
                                    placeholder={t.placeholderSisaHari}
                                    value={formData.sisa_hari}
                                    onChange={handleFormInputChange}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    required
                                />
                                <button className="kamar-daftar-button-kamar" onClick={handleSubmitForm}>
                                    {t.gunakanKamar}
                                </button>
                                <button className="kamar-daftar-button-tutup" onClick={() => setShowForm(false)}>
                                    {t.tutupDaftarKamar}
                                </button>
                            </div>
                        </div>
                        <p>{t.catatanDaftarKamar}</p>
                    </div>
                </div>
            )}
            {showEditForm && (
                <div className="kamar-daftar-overlay">
                    <div className="kamar-daftar-container">
                        <h2 className="kamar-daftar-title">{t.editJudul}</h2>
                        <div className="kamar-daftar-content">
                            <div className="kamar-daftar-left">
                                <h3>{t.kamar} {selectedKamarId}</h3>
                                <div className="kamar-daftar-icon">
                                    <img src={kamarKosIcon} alt="Kamar Icon" className="kamar-daftar-icon-kamar" />
                                </div>
                                {selectedKamarData && (
                                    <div className="kamar-data-sedang-digunakan">
                                        <table>
                                            <tbody>
                                            <tr>
                                                <td>{t.sisa}</td>
                                                <td>: {selectedKamarData.sisa_hari} {t.hariPenggunakos}</td>
                                            </tr>
                                            <tr>
                                                <td>{t.editPenggunaan}</td>
                                                <td>: {selectedKamarData.penggunaan_kwh.toFixed(2)} kWh</td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="kamar-daftar-right">
                                <label className="kamar-daftar-labelnama">{t.namaLengkap}</label>
                                <input 
                                    type="text" 
                                    name="nama_lengkap"
                                    className="kamar-daftar-inputnama" 
                                    placeholder={t.placeholderNamalengkap}
                                    value={editFormData.nama_lengkap}
                                    onChange={handleEditFormInputChange}
                                />
                                <label className="kamar-daftar-labelnomor">{t.nomorTelepon}</label>
                                <input 
                                    type="text" 
                                    name="nomor_telepon_pengguna_kos"
                                    className="kamar-daftar-inputnomor" 
                                    placeholder={t.placeholderNomorTelepon}
                                    value={editFormData.nomor_telepon_pengguna_kos}
                                    onChange={handleEditFormInputChange}
                                />
                                <label className="kamar-daftar-labelbatas">{t.labelBatasKwh}</label>
                                <input 
                                    type="number" 
                                    name="batas_kwh"
                                    className="kamar-daftar-inputbatas" 
                                    placeholder={t.placeholderBatasKwh}
                                    value={editFormData.batas_kwh}
                                    onChange={handleEditFormInputChange}
                                    onWheel={(e) => e.currentTarget.blur()}
                                />
                                {selectedKamarData?.status_penggunaan === 'OVERLIMIT' && (
                                <>
                                    <label className="kamar-daftar-labeltambahan">{t.labelTambahanKwh}</label>
                                    <input 
                                        type="number" 
                                        name="tambahan_kwh"
                                        className="kamar-daftar-inputtambahan" 
                                        placeholder={t.placeholderTambahanKwh}
                                        value={editFormData.tambahan_kwh}
                                        onWheel={(e) => e.currentTarget.blur()}
                                        onChange={(e) =>
                                            setEditFormData(prev => ({
                                                ...prev,
                                                tambahan_kwh: parseFloat(e.target.value),
                                            }))
                                        }
                                    />
                                    <label className="kamar-estimasi-biaya">
                                        {t.editBiayaTambahan}: Rp {(editFormData.tambahan_kwh * 1445).toLocaleString()}
                                    </label>
                                </>
                                )}

                                <button className="kamar-daftar-button-kamar" onClick={handleSubmitEditForm}>
                                    {t.editTombolPerbarui}
                                </button>
                                <button className="kamar-daftar-button-tutup" onClick={() => setShowEditForm(false)}>
                                    {t.tombolPembatalan}
                                </button>
                            </div>
                        </div>
                        <p>{t.editInfo}</p>
                    </div>
                </div>
            )}
            {showBiayaModal && (
                <div className="kamar-hapus-overlay">
                    <div className="kamar-hapus-box">
                        <p>{t.konfirmasiTambahKwh1} {tambahanKwh} {t.konfirmasiTambahKwh2} <strong>Rp {estimasiBiaya.toLocaleString()}</strong>. {t.konfirmasiTambahKwh3}</p>
                        <div className="kamar-hapus-buttons">
                            <button
                                onClick={async () => {
                                    setShowBiayaModal(false);
                                    await submitTenantUpdate(parseFloat(editFormData.batas_kwh || 0) + tambahanKwh);
                                }}
                            >
                                {t.ya}
                            </button>
                            <button onClick={() => setShowBiayaModal(false)}>{t.tidak}</button>
                        </div>
                    </div>
                </div>
            )}
            {showDeleteModal && (
                <div className="kamar-hapus-overlay">
                    <div className="kamar-hapus-box">
                        <p>{t.konfirmasiHapusKamar} {selectedRoomId}?</p>
                        <div className="kamar-hapus-buttons">
                            <button onClick={handleConfirmDeleteTenant}>{t.ya}</button>
                            <button onClick={() => setShowDeleteModal(false)}>{t.tidak}</button>
                        </div>
                    </div>
                </div>
            )}
            <footer className="kamar-footer-edit">
                <img src={copyrightIcon} className="kamar-footer-icon" />
                <p>{t.berandaHakCipta}</p>
            </footer>
        </div>
    );
};

export default Kamar;