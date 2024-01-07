import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut,
    sendPasswordResetEmail,
    confirmPasswordReset
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyB_-CJ6ucrUYweynVjhM-mutrpszxoBe24",
    authDomain: "k-edu-users.firebaseapp.com",
    projectId: "k-edu-users",
    storageBucket: "k-edu-users.appspot.com",
    messagingSenderId: "331556415659",
    appId: "1:331556415659:web:895262505f70163088efee"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, confirmPasswordReset }