// Import Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTdnXdYB3kxvSfcUtJ4muj7twOWRlWIOQ",
  authDomain: "arduinotempmonitor.firebaseapp.com",
  databaseURL: "https://arduinotempmonitor-default-rtdb.firebaseio.com",
  projectId: "arduinotempmonitor",
  storageBucket: "arduinotempmonitor.appspot.com",
  messagingSenderId: "147978830807",
  appId: "1:147978830807:web:394e09cdc252819cc04192",
  measurementId: "G-PS1X0CKN2G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Database
const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database };

