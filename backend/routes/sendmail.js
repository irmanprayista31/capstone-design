import express from "express";
import nodemailer from "nodemailer";
const router = express.Router();

// ======= Konfigurasi Email Developer ========
const EMAIL_PENERIMA = 'smartenergygangsaleh@gmail.com'; // <- Ganti dengan email developer
const APP_PASSWORD = 'amvv grff osap woyj';    // <- Ganti dengan app password 16 digit dari Gmail

// ========== Endpoint Kirim Pesan ==========
router.post('/kontak', async (req, res) => {
    const { email, pesan } = req.body;

    if (!email || !pesan) {
        return res.status(400).json({ message: 'Email dan pesan wajib diisi.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Format email tidak valid.' });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: EMAIL_PENERIMA,
                pass: APP_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: `"Pemilik Kos" <${email}>`,
            to: EMAIL_PENERIMA,
            subject: 'Pesan dari Halaman Kontak Senergy',
            text: `Email pengirim: ${email}\n\nPesan:\n${pesan}`,
        });

        res.status(200).json({ message: 'Pesan berhasil dikirim ke developer.' });
    } catch (err) {
        console.error('Gagal kirim email:', err);
        res.status(500).json({ message: 'Gagal mengirim pesan. Silakan coba lagi.' });
    }
});

export default router;
