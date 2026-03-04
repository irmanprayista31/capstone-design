// backend/routes/graph.js - Versi Firebase
import express from "express";
import { db } from "../firebaseAdmin.js";

const router = express.Router();

// ====== Konfigurasi MCB - Data mapping untuk setiap MCB ======
const MCB_CONFIG = {
    mcb1: { collection: "monitoring_listrik_mcb1", rooms: [1, 2, 3], roomNames: ["Kamar 1", "Kamar 2", "Kamar 3"] },
    mcb2: { collection: "monitoring_listrik_mcb2", rooms: [4, 5, 6], roomNames: ["Kamar 4", "Kamar 5", "Kamar 6"] },
    mcb3: { collection: "monitoring_listrik_mcb3", rooms: [7, 8, 9], roomNames: ["Kamar 7", "Kamar 8", "Kamar 9"] },
    mcb4: { collection: "monitoring_listrik_mcb4", rooms: [10, 11, 12], roomNames: ["Kamar 10", "Kamar 11", "Kamar 12"] },
};

// ====== Endpoint untuk mendapatkan MCB yang tersedia ======
router.get("/mcb-config", (req, res) => {
    const result = Object.keys(MCB_CONFIG).map((id) => ({
        id,
        name: `MCB ${id.replace("mcb", "")}`,
        roomNames: MCB_CONFIG[id].roomNames,
    }));
    res.json(result);
});

// ====== Endpoint grafik berdasarkan rentang waktu ======
router.get("/harian/:mcbId", async (req, res) => {
    const { mcbId } = req.params;
    const { startDate, endDate } = req.query;

    if (!MCB_CONFIG[mcbId]) {
        return res.status(400).json({ error: `MCB ${mcbId} tidak ditemukan` });
    }

    const config = MCB_CONFIG[mcbId];
    const snapshot = await db.collection(config.collection).get();

    // Filter dan proses data
    const rawData = snapshot.docs.map((doc) => {
        const d = doc.data();
        if (d.timestamp && typeof d.timestamp.toDate === "function") {
            
        }
        return d;
    }).filter((d) => {
        const date = new Date(d.timestamp);
        if (startDate && date < new Date(startDate)) return false;
        if (endDate && date > new Date(endDate)) return false;
        return config.rooms.includes(d.kamar);
    });


    const grouped = {};
    rawData.forEach((entry) => {
        if (!entry.timestamp) return; // Skip jika tidak ada timestamp

        const ts = new Date(entry.timestamp);
        if (isNaN(ts)) return; // Skip jika timestamp tidak valid

        const dateStr = ts.toISOString().split("T")[0];

        if (!grouped[dateStr]) {
            grouped[dateStr] = {
                timestamp: dateStr,
                tanggal: dateStr,
                hari_tanggal: ts.getDate(),
                hari_dalam_minggu: ts.getDay() || 7,
                nama_hari: ts.toLocaleDateString("id-ID", { weekday: "long" }),
                minggu_ke: Math.ceil(ts.getDate() / 7),
                minggu_absolut: getWeekNumber(ts),
                bulan: ts.toLocaleDateString("id-ID", { month: "long" }),
                bulan_num: ts.getMonth() + 1,
                tahun: ts.getFullYear(),
            };

            config.rooms.forEach((_, idx) => {
                grouped[dateStr][`room${idx + 1}`] = 0;
            });
        }

        const idx = config.rooms.indexOf(entry.kamar);
        if (idx >= 0) grouped[dateStr][`room${idx + 1}`] += entry.kWh;
    });

    const formattedResults = Object.values(grouped);

    // Summary
    const tarifPerKwh = 1445;
    const summary = {
        label: "Total",
        jumlah_hari: formattedResults.length,
        tanggal_mulai: formattedResults[0]?.tanggal,
        tanggal_akhir: formattedResults[formattedResults.length - 1]?.tanggal,
        total_keseluruhan: 0,
        tarif_total: 0,
        rooms: [],
    };
    config.roomNames.forEach((_, idx) => {
        const total = formattedResults.reduce((sum, r) => sum + (r[`room${idx + 1}`] || 0), 0);
        const tarif = total * tarifPerKwh;
        summary.total_keseluruhan += total;
        summary.tarif_total += tarif;
        summary.rooms.push({ name: config.roomNames[idx], total, tarif });
    });

    res.json({
        data: formattedResults,
        summary,
        mcbConfig: { id: mcbId, roomNames: config.roomNames },
    });
});

// Endpoint grafik per menit (realtime demo)
router.get("/permenit/:mcbId", async (req, res) => {
    const { mcbId } = req.params;
    const { startDateTime, endDateTime } = req.query;

    const realtimeCollection = process.env.REALTIME_COLLECTION || "monitoring_percobaan";// 🔧 Gunakan tabel percobaan

    try {
        const snapshot = await db.collection(realtimeCollection)
          .where("timestamp", ">=", new Date(startDateTime))
          .where("timestamp", "<=", new Date(endDateTime))
          .orderBy("timestamp")
          .get();

          const rawData = snapshot.docs.map(doc => {
              const d = doc.data();
              if (d.timestamp && typeof d.timestamp.toDate === "function") {
                  d.timestamp = d.timestamp.toDate().toISOString();
              }
              return d;
          });

          res.json({
              data: rawData,
          });
    } catch (err) {
        console.error("Error fetch permenit:", err);
        res.status(500).json({ error: "Gagal mengambil data permenit" });
    }
});



function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

export default router;
