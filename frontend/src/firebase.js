// frontend/src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD4B5-_5OzlIVMiigBdfmoaO_wPcGPSM38",
  authDomain: "kosan-gang-saleh.firebaseapp.com",
  databaseURL: "https://kosan-gang-saleh-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kosan-gang-saleh",
  storageBucket: "kosan-gang-saleh.firebasestorage.app",
  messagingSenderId: "688565103003",
  appId: "1:688565103003:web:076578b9d638fd80cc593e",
  measurementId: "G-T4K2VPF8HB"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const rtdb = getDatabase(app);     // RTDB
export const auth = getAuth(app);      // Auth
