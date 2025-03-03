// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: "pet-adopt-d5b2a.firebaseapp.com",
  projectId: "pet-adopt-d5b2a",
  storageBucket: "pet-adopt-d5b2a.appspot.com",
  messagingSenderId: "608454042309",
  appId: "1:608454042309:web:f94f237f561e8a506ac6ac",
  measurementId: "G-NE0VJH4RF7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);  //--> eğer database (default) kullanılıyorsa app,(default) yazmaya gerek yok
//const analytics = getAnalytics(app);