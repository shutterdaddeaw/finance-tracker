import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// ⚠️ นำค่า Config จาก Firebase Console มาใส่ที่นี่
const firebaseConfig = {
  apiKey: "AIzaSyA2pjmfCQPu5Tjd1r8OIKYZdUl04kWdJNY",
  authDomain: "finance-tracker-bb833.firebaseapp.com",
  projectId: "finance-tracker-bb833",
  storageBucket: "finance-tracker-bb833.firebasestorage.ap",
  messagingSenderId: "1007151866134",
  appId: "1:1007151866134:web:7e83dd83e042c9f6f77037"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();