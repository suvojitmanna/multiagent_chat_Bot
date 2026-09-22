import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "food-deleviery.firebaseapp.com",
  projectId: "food-deleviery",
  storageBucket: "food-deleviery.firebasestorage.app",
  messagingSenderId: "925878813627",
  appId: "1:925878813627:web:0b85c9358ff811cb933a9e",
  measurementId: "G-HD656R2VQ0",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();


export {app, analytics, auth, googleProvider}
