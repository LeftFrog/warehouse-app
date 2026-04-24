import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD0VfCLgl6y8QrqAz1fs1s33VxQ6iI3bT0",
  authDomain: "easywarehouse-f37c6.firebaseapp.com",
  projectId: "easywarehouse-f37c6",
  storageBucket: "easywarehouse-f37c6.firebasestorage.app",
  messagingSenderId: "1004464937545",
  appId: "1:1004464937545:web:1ab48f1092668e1bf73d98",
  measurementId: "G-6YSG7YYXD6"
};

export const auth = getAuth(initializeApp(firebaseConfig));
const analytics = getAnalytics(app);