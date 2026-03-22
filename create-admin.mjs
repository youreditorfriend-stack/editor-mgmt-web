import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBqgmzrNelS701uQ1ngLvcoatUkcBuiRic",
  authDomain: "gen-lang-client-0681082317.firebaseapp.com",
  projectId: "gen-lang-client-0681082317",
  storageBucket: "gen-lang-client-0681082317.firebasestorage.app",
  messagingSenderId: "834918791822",
  appId: "1:834918791822:web:ef4b1dc9724967ab64a7df",
}

const app  = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db   = getFirestore(app)

const EMAIL    = 'youreditorfriend+admin@gmail.com'
const PASSWORD = 'Ef2023'
const NAME     = 'Admin'

try {
  const cred = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD)
  const uid  = cred.user.uid

  await setDoc(doc(db, 'Users', uid), {
    uid,
    name: NAME,
    email: EMAIL.toLowerCase(),
    role: 'admin',
    status: 'active',
    businessName: 'Editor Friend',
    createdAt: serverTimestamp(),
    totalEarnings: 0,
  })

  console.log('✓ Admin created successfully!')
  console.log('  Email:', EMAIL)
  console.log('  UID:', uid)
  process.exit(0)
} catch (err) {
  if (err.code === 'auth/email-already-in-use') {
    console.log('⚠ This email is already registered.')
  } else {
    console.error('✗ Error:', err.message)
  }
  process.exit(1)
}
