import express from 'express';
import bcrypt from 'bcrypt';
import { db } from '../firebaseAdmin.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// --Daftar
router.post('/register', async (req, res) => {
  const { full_name, phone_number, email, password } = req.body;
  try {
    const usersRef = db.collection('users');
    const phoneSnap = await usersRef.where('phone_number', '==', phone_number).get();
    if (!phoneSnap.empty) return res.status(400).json({ code: 'PHONE_ALREADY_EXISTS' });

    const emailSnap = await usersRef.where('email', '==', email).get();
    if (!emailSnap.empty) return res.status(400).json({ code: 'EMAIL_ALREADY_EXISTS' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    await db.collection('users').doc(userId).set({
      id: userId,
      full_name,
      phone_number,
      email,
      password: hashedPassword
    });

    return res.status(200).json({ code: 'REGISTRATION_SUCCESS' });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ code: 'REGISTRATION_FAILED' });
  }
});

// --Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userSnap = await db.collection('users').where('email', '==', email).get();
    if (userSnap.empty) return res.status(401).json({ code: 'WRONG_EMAIL' });

    const userData = userSnap.docs[0].data();
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) return res.status(401).json({ code: 'WRONG_PASSWORD' });

    return res.status(200).json({
      code: 'LOGIN_SUCCESS',
      user: {
        id: userData.id,
        full_name: userData.full_name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ code: 'LOGIN_ERROR' });
  }
});

// --Pengecekkan Email
router.post('/verify-email', async (req, res) => {
  const { email } = req.body;
  try {
    const snap = await db.collection('users').where('email', '==', email).get();
    if (snap.empty) return res.status(404).json({ code: 'EMAIL_NOT_FOUND' });
    return res.status(200).json({ code: 'EMAIL_FOUND' });
  } catch (err) {
    console.error('Verify email error:', err);
    return res.status(500).json({ code: 'EMAIL_VERIFICATION_FAILED' });
  }
});


// --Ubah kata sandi
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const snap = await db.collection('users').where('email', '==', email).get();
    if (snap.empty) return res.status(404).json({ code: 'EMAIL_NOT_FOUND' });

    const userRef = snap.docs[0].ref;
    const currentData = snap.docs[0].data();

    const isSame = await bcrypt.compare(newPassword, currentData.password);
    if (isSame) return res.status(400).json({ code: 'PASSWORD_SAME_AS_OLD' });

    const hashedNew = await bcrypt.hash(newPassword, 10);
    await userRef.update({ password: hashedNew });
    return res.status(200).json({ code: 'RESET_SUCCESS' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ code: 'RESET_FAILED' });
  }
});

// --Ambil data user berdasarkan ID untuk tampil di halaman akun
router.get('/user/:id', async (req, res) => {
  try {
    const docSnap = await db.collection('users').doc(req.params.id).get();
    if (!docSnap.exists) return res.status(404).json({ code: 'USER_NOT_FOUND' });
    res.status(200).json(docSnap.data());
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ code: 'GET_USER_FAILED' });
  }
});

// Update data user berdasarkan ID di halaman akun ke database
router.put('/user/:id', async (req, res) => {
  const { full_name, phone_number, email, password } = req.body;
  try {
    const userRef = db.collection('users').doc(req.params.id);
    const snap = await userRef.get();
    if (!snap.exists) return res.status(404).json({ code: 'USER_NOT_FOUND' });

    // Cek duplikat email/phone
    const dupeSnap = await db.collection('users')
      .where('id', '!=', req.params.id)
      .where('email', '==', email)
      .get();
    if (!dupeSnap.empty) return res.status(400).json({ code: 'EMAIL_ALREADY_EXISTS' });

    const phoneSnap = await db.collection('users')
      .where('id', '!=', req.params.id)
      .where('phone_number', '==', phone_number)
      .get();
    if (!phoneSnap.empty) return res.status(400).json({ code: 'PHONE_ALREADY_EXISTS' });

    let updateData = { full_name, phone_number, email };
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await userRef.update(updateData);
    res.status(200).json({ code: 'UPDATE_SUCCESS' });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ code: 'UPDATE_FAILED' });
  }
});

// --Hapus akun berdasarkan ID
router.delete('/user/:id', async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.params.id);
    const snap = await userRef.get();
    if (!snap.exists) return res.status(404).json({ code: 'USER_NOT_FOUND' });
    await userRef.delete();
    res.status(200).json({ code: 'DELETE_SUCCESS' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ code: 'DELETE_FAILED' });
  }
});

export default router;