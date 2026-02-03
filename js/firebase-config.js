// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCpe7zKDZ5vF-zMDYcOMYZDnad8yUeCfVQ",
  authDomain: "cyberevents-ac603.firebaseapp.com",
  projectId: "cyberevents-ac603",
  storageBucket: "cyberevents-ac603.firebasestorage.app",
  messagingSenderId: "336506814059",
  appId: "1:336506814059:web:c48356c920826d5c867b2e",
  measurementId: "G-5S7YVX75WJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };