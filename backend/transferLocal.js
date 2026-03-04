import admin from 'firebase-admin';
import { rtdb, db as firestore } from './firebaseAdmin.js';

console.log("Listening for RTDB changes...");

rtdb.ref('monitoring_listrik_mcb1').on('child_added', async (snapshot) => {
  const data = snapshot.val();
  const pushId = snapshot.key;

  if (!data || !data.timestamp) return;

  try {
    const existing = await firestore.collection("monitoring_percobaan")
      .where("timestamp", "==", admin.firestore.Timestamp.fromMillis(data.timestamp))
      .limit(1)
      .get();

    if (!existing.empty) {
      console.log(`Data already exists in Firestore, skipping: ${pushId}`);
      return;
    }

    await firestore.collection("monitoring_percobaan").add({
      mcb: data.mcb,
      kamar: data.kamar,
      tegangan: data.tegangan,
      arus: data.arus,
      daya: data.daya,
      kWh: data.kWh,
      powerFactor: data.powerFactor,
      timestamp: admin.firestore.Timestamp.fromMillis(data.timestamp)
    });

    console.log(`Data synced to Firestore: ${pushId}`);
  } catch (err) {
    console.error(`Gagal transfer data ${pushId}:`, err.message);
  }
});
