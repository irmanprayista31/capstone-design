// hooks/useNotifications.js
import { useState, useEffect } from 'react';

const useNotifications = () => {
    const [savedNotifications, setSavedNotifications] = useState([]);

    // Menyimpan Data Notifikasi
    useEffect(() => {
        const loadNotifications = () => {
            const saved = JSON.parse(localStorage.getItem('savedOverlimitNotifications') || '[]');
            setSavedNotifications(saved);
        };

        loadNotifications();

        // Untuk update data notifikasi jika ada perubahan
        const handleStorageChange = (e) => {
            if (e.key === 'savedOverlimitNotifications') {
                loadNotifications();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        const handleCustomUpdate = () => {
            loadNotifications();
        };

        window.addEventListener('notificationsUpdated', handleCustomUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('notificationsUpdated', handleCustomUpdate);
        };
    }, []);

    // Untuk menambahkan data ke notifikasi
    const addNotifications = (newNotifications) => {
        const existing = JSON.parse(localStorage.getItem('savedOverlimitNotifications') || '[]');
        const existingIds = new Set(existing.map(n => n.id));
        const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
        
        if (uniqueNew.length > 0) {
            const combined = [...existing, ...uniqueNew];
            localStorage.setItem('savedOverlimitNotifications', JSON.stringify(combined));
            setSavedNotifications(combined);
            
            window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        }
    };

    // Untuk hapus data di notifikasi
    const deleteNotification = (id) => {
        setSavedNotifications(prev => {
            const updated = prev.filter(notif => notif.id !== id);
            localStorage.setItem('savedOverlimitNotifications', JSON.stringify(updated));
            
            window.dispatchEvent(new CustomEvent('notificationsUpdated'));
            
            return updated;
        });
    };

    // Update jumlah data notifikasi (diambil dari halaman kamar.jsx)
    const updateNotifications = (kamarData) => {
        const overlimit = kamarData.filter(kamar => kamar.status_penggunaan === 'OVERLIMIT');
        const notifData = overlimit.map(k => ({
            id: k.id,
            nama: k.nama_lengkap,
            penggunaan: k.penggunaan_kwh,
            tanggal: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
            status: 'OVERLIMIT'
        }));

        addNotifications(notifData);
    };

    return {
        savedNotifications,
        deleteNotification,
        addNotifications,
        updateNotifications
    };
};

export default useNotifications;