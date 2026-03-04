import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function getRandom(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

// async function clearOldData(collectionName) {
//   const snapshot = await db.collection(collectionName).get();
//   const batch = db.batch();
//   snapshot.docs.forEach((doc) => batch.delete(doc.ref));
//   await batch.commit();
//   console.log(`✅ Semua data pada ${collectionName} dihapus.`);
// }

async function uploadDummyData() {
  const collectionName = "monitoring_listrik_mcb1";
  // await clearOldData(collectionName);

  const baseDate = new Date("2025-07-11");
  let id = 1;

  for (let day = 0; day < 40; day++) {
    for (let kamar = 1; kamar <= 3; kamar++) {
      const currentDate = new Date(baseDate);
      currentDate.setDate(currentDate.getDate() + day);

      const data = {
        id: id++,
        kamar: kamar,
        tegangan: getRandom(210, 230),
        arus: getRandom(0.1, 2),
        daya: 0, // akan dihitung
        kWh: getRandom(0.1, 2),
        powerFactor: getRandom(0.85, 1),
        timestamp: admin.firestore.Timestamp.fromDate(currentDate), // 🔥 gunakan Firestore Timestamp
      };

      data.daya = parseFloat((data.tegangan * data.arus).toFixed(2));

      const docRef = db.collection(collectionName).doc();
      await docRef.set(data);
      console.log(`Uploaded data ID: ${data.id}, kamar: ${kamar}, tanggal: ${currentDate.toDateString()}`);
    }
  }

  console.log("Selesai upload data dummy!");
  process.exit();
}

uploadDummyData().catch((err) => {
  console.error("Gagal upload data:", err);
  process.exit(1);
});
