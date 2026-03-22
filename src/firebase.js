import { initializeApp } from 'firebase/app'
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBqgmzrNelS701uQ1ngLvcoatUkcBuiRic",
  authDomain: "gen-lang-client-0681082317.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0681082317-default-rtdb.firebaseio.com",
  projectId: "gen-lang-client-0681082317",
  storageBucket: "gen-lang-client-0681082317.firebasestorage.app",
  messagingSenderId: "834918791822",
  appId: "1:834918791822:web:ef4b1dc9724967ab64a7df",
  measurementId: "G-4JWYMJ8NCZ"
}

// Primary app
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db   = getFirestore(app)
setPersistence(auth, browserLocalPersistence)

// Secondary app — used to create editor/client accounts without signing out admin
export const secondaryApp  = initializeApp(firebaseConfig, 'secondary')
export const secondaryAuth = getAuth(secondaryApp)

// Master admin email — set this to the real master admin email
export const MASTER_ADMIN_EMAIL = 'youreditorfriend@gmail.com'
