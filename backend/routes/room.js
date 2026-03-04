import express from "express";
import { db, rtdb } from "../firebaseAdmin.js";
import admin from "firebase-admin";

const router = express.Router();

// Function penilaian status penggunaan
function evaluateStatus(penggunaan, batas) {
  if (batas === null || batas === "-" || isNaN(batas)) return "AMAN";
  const numericBatas = parseFloat(batas);
  const threshold = numericBatas - 10;
  if (penggunaan >= numericBatas) return "OVERLIMIT";
  if (penggunaan >= threshold) return "PERINGATAN";
  return "AMAN";
}

// Konfigurasi MCB
const MCB_CONFIG = {
  mcb1: { collection: "monitoring_listrik_mcb1", rooms: [1, 2, 3] },
  mcb2: { collection: "monitoring_listrik_mcb2", rooms: [4, 5, 6] },
  mcb3: { collection: "monitoring_listrik_mcb3", rooms: [7, 8, 9] },
  mcb4: { collection: "monitoring_listrik_mcb4", rooms: [10, 11, 12] },
};

function getMCBCollectionByRoomId(roomId) {
  for (const key in MCB_CONFIG) {
    if (MCB_CONFIG[key].rooms.includes(Number(roomId))) {
      return MCB_CONFIG[key].collection;
    }
  }
  return null;
}

// Sinkronisasi penggunaan_kwh ke kamar_kos
async function updatePenggunaanKwh(roomId) {
  try {
    const kamarRef = db.collection("kamar_kos").doc(roomId);
    const kamarSnap = await kamarRef.get();
    if (!kamarSnap.exists) return;

    const kamar = kamarSnap.data();
    const { tanggal_masuk, sisa_hari, batas_kwh } = kamar;
    if (!tanggal_masuk || !sisa_hari) return;

    const collectionName = getMCBCollectionByRoomId(roomId);
    if (!collectionName) return;

    const start = tanggal_masuk.toDate();
    const end = new Date(start);
    end.setDate(end.getDate() + Number(sisa_hari));

    const usageSnap = await db.collection(collectionName)
      .where("kamar", "==", Number(roomId))
      .where("timestamp", ">=", start)
      .where("timestamp", "<=", end)
      .get();

    const totalKwh = usageSnap.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (data.kWh || 0);
    }, 0);

    const status_penggunaan = evaluateStatus(totalKwh, batas_kwh);

    // Update ke Firestore
    await kamarRef.update({ penggunaan_kwh: totalKwh, status_penggunaan });

    // Tambahkan: auto matikan relay jika overlimit
if (status_penggunaan === "OVERLIMIT") {
  await rtdb.ref(`kamar_kos/${roomId}/relay_status`).set("OFF");
} else {
  await rtdb.ref(`kamar_kos/${roomId}/relay_status`).set("ON");
}

  } catch (err) {
    console.error("Gagal update kWh:", err);
  }
}

// GET all kamar
router.get("/kamar", async (req, res) => {
  try {
    const snap = await db.collection("kamar_kos").orderBy("id").get();
    const data = snap.docs.map((doc) => {
      const docData = doc.data();
      
      // Convert Firebase Timestamps to ISO strings
      if (docData.tanggal_masuk && docData.tanggal_masuk.toDate) {
        docData.tanggal_masuk = docData.tanggal_masuk.toDate().toISOString();
      }
      if (docData.tanggal_keluar && docData.tanggal_keluar.toDate) {
        docData.tanggal_keluar = docData.tanggal_keluar.toDate().toISOString();
      }
      
      return docData;
    });
    res.json(data);
  } catch (err) {
    console.error("Error get kamar:", err);
    res.status(500).json({ error: "Gagal ambil data kamar" });
  }
});

// GET kamar by id
router.get("/kamar/:id", async (req, res) => {
  try {
    const snap = await db.collection("kamar_kos").doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: "Kamar tidak ditemukan" });
    
    const docData = snap.data();
    
    // Convert Firebase Timestamps to ISO strings
    if (docData.tanggal_masuk && docData.tanggal_masuk.toDate) {
      docData.tanggal_masuk = docData.tanggal_masuk.toDate().toISOString();
    }
    if (docData.tanggal_keluar && docData.tanggal_keluar.toDate) {
      docData.tanggal_keluar = docData.tanggal_keluar.toDate().toISOString();
    }
    
    res.json(docData);
  } catch (err) {
    console.error("Error get kamar id:", err);
    res.status(500).json({ error: "Gagal ambil data kamar" });
  }
});

// POST /kamar/:id/register
router.post("/kamar/:id/register", async (req, res) => {
  const { nama_lengkap, nomor_telepon_pengguna_kos, batas_kwh, sisa_hari } = req.body;
  const id = req.params.id;
  try {
    const ref = db.collection("kamar_kos").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Kamar tidak ditemukan" });

    const data = snap.data();
    if (data.status_kamar === 1) return res.status(400).json({ error: "Kamar sudah ditempati" });

    await ref.update({
      nama_lengkap,
      nomor_telepon_pengguna_kos,
      status_kamar: 1,
      sisa_hari: Number(sisa_hari) || 30,
      penggunaan_kwh: 0,
      batas_kwh: Number(batas_kwh) || null,
      tanggal_masuk: admin.firestore.Timestamp.now(),
      status_penggunaan: "AMAN"
    });
    await updatePenggunaanKwh(id); // aktifkan sinkron status + relay
    res.json({ message: "Pendaftaran berhasil", roomId: id, nama_lengkap });
  } catch (err) {
    console.error("Register kamar gagal:", err);
    res.status(500).json({ error: "Gagal registrasi kamar" });
  }
});

// PUT /kamar/:id/tenant
router.put("/kamar/:id/tenant", async (req, res) => {
  const { nama_lengkap, nomor_telepon_pengguna_kos, batas_kwh } = req.body;
  const id = req.params.id;
  try {
    const ref = db.collection("kamar_kos").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Kamar tidak ditemukan" });

    const penggunaan_kwh = snap.data().penggunaan_kwh || 0;
    const status_penggunaan = evaluateStatus(penggunaan_kwh, batas_kwh);

    await ref.update({ nama_lengkap, nomor_telepon_pengguna_kos, batas_kwh, status_penggunaan });
    await updatePenggunaanKwh(id); // aktifkan sinkron status + relay

    res.json({ message: "Update berhasil", roomId: id });
  } catch (err) {
    console.error("Update tenant gagal:", err);
    res.status(500).json({ error: "Gagal update data" });
  }
});

// DELETE /kamar/:id/tenant
router.delete("/kamar/:id/tenant", async (req, res) => {
  const id = req.params.id;
  try {
    const ref = db.collection("kamar_kos").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Kamar tidak ditemukan" });

    await ref.update({
      nama_lengkap: "-",
      nomor_telepon_pengguna_kos: "-",
      status_kamar: 0,
      sisa_hari: "-",
      penggunaan_kwh: "-",
      batas_kwh: "-",
      status_penggunaan: null,
      tanggal_masuk: null,
      tanggal_keluar: new Date()
    });

    res.json({ message: "Kamar dikosongkan", roomId: id });
  } catch (err) {
    console.error("Hapus tenant gagal:", err);
    res.status(500).json({ error: "Gagal hapus data" });
  }
});

// POST /kamar/:id/sinkron-kwh
router.post("/kamar/:id/sinkron-kwh", async (req, res) => {
  try {
    await updatePenggunaanKwh(req.params.id);
    res.json({ message: `Kamar ${req.params.id} disinkronkan.` });
  } catch (err) {
    console.error("Sinkronisasi gagal:", err);
    res.status(500).json({ error: "Gagal sinkronkan kWh" });
  }
});

// PUT /kamar/:id/kwh
router.put("/kamar/:id/kwh", async (req, res) => {
  const { penggunaan_kwh } = req.body;
  const id = req.params.id;
  try {
    const ref = db.collection("kamar_kos").doc(id);
    await ref.update({ penggunaan_kwh });
    res.json({ message: "kWh diperbarui", roomId: id });
  } catch (err) {
    console.error("Update kWh gagal:", err);
    res.status(500).json({ error: "Gagal update kWh" });
  }
});

// PUT /kamar/:id/sisa-hari
router.put("/kamar/:id/sisa-hari", async (req, res) => {
  const { sisa_hari } = req.body;
  const id = req.params.id;
  try {
    const ref = db.collection("kamar_kos").doc(id);
    await ref.update({ sisa_hari });
    res.json({ message: "Sisa hari diperbarui", roomId: id });
  } catch (err) {
    console.error("Update sisa hari gagal:", err);
    res.status(500).json({ error: "Gagal update sisa hari" });
  }
});

// PUT /kamar/:id/relay
router.put("/kamar/:id/relay", async (req, res) => {
  const { relay_status } = req.body;
  const id = req.params.id;

  if (!["ON", "OFF"].includes(relay_status)) {
    return res.status(400).json({ error: "relay_status harus 'ON' atau 'OFF'" });
  }

  try {
    await rtdb.ref(`kamar_kos/${id}/relay_status`).set(relay_status); // pakai rtdb
    res.json({ message: `Relay kamar ${id} berhasil diatur ke ${relay_status}` });
  } catch (err) {
    console.error("Gagal update relay:", err);
    res.status(500).json({ error: "Gagal update relay" });
  }
});

export default router;