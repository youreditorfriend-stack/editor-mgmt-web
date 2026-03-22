import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, serverTimestamp, addDoc, limit
} from 'firebase/firestore'
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, signOut as fbSignOut,
  updatePassword
} from 'firebase/auth'
import { db, auth, secondaryAuth, MASTER_ADMIN_EMAIL } from './firebase'

// ─── Helpers ────────────────────────────────────────────────────────────────

function genId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

function genEditorCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'EF-'
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
  const user = await getUser(cred.user.uid)
  if (!user) throw new Error('account-not-found')
  if (user.status === 'pending')  throw new Error('account-pending')
  if (user.status === 'rejected') throw new Error('account-rejected')
  return user
}

export async function signUp(email, password, { name, role = 'admin', businessName = '' }) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
  const uid  = cred.user.uid

  // Determine if this is the master admin email
  const isMaster = email.trim().toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()
  const finalRole   = isMaster ? 'master_admin' : role
  const finalStatus = (isMaster || role === 'editor' || role === 'client') ? 'active' : 'pending'

  const userData = {
    uid,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: finalRole,
    status: finalStatus,
    businessName: businessName.trim(),
    createdAt: serverTimestamp(),
    totalEarnings: 0,
  }

  await setDoc(doc(db, 'Users', uid), userData)
  return { id: uid, ...userData }
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  const cred = await signInWithPopup(auth, provider)
  const uid  = cred.user.uid

  // Check if user already exists
  const existing = await getUser(uid)
  if (existing) {
    if (existing.status === 'pending')  throw new Error('account-pending')
    if (existing.status === 'rejected') throw new Error('account-rejected')
    return existing
  }

  // New Google user — create as admin (pending) or master_admin if matching email
  const email     = cred.user.email
  const isMaster  = email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()
  const role      = isMaster ? 'master_admin' : 'admin'
  const status    = isMaster ? 'active' : 'pending'

  const userData = {
    uid,
    name: cred.user.displayName || email.split('@')[0],
    email: email.toLowerCase(),
    role,
    status,
    businessName: '',
    createdAt: serverTimestamp(),
    totalEarnings: 0,
    photoURL: cred.user.photoURL || '',
  }

  await setDoc(doc(db, 'Users', uid), userData)

  if (status === 'pending') throw new Error('account-pending')
  return { id: uid, ...userData }
}

export function signOut() { return fbSignOut(auth) }

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'Users', uid))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

// ─── Master Admin ────────────────────────────────────────────────────────────

export function onPendingAdmins(callback) {
  const q = query(
    collection(db, 'Users'),
    where('role', '==', 'admin'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

export function onAllAdmins(callback) {
  const q = query(
    collection(db, 'Users'),
    where('role', '==', 'admin'),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

export async function approveAdmin(uid) {
  await updateDoc(doc(db, 'Users', uid), {
    status: 'active',
    approvedAt: serverTimestamp(),
    approvedBy: auth.currentUser?.uid ?? '',
  })
}

export async function rejectAdmin(uid) {
  await updateDoc(doc(db, 'Users', uid), {
    status: 'rejected',
    rejectedAt: serverTimestamp(),
  })
}

export function onSystemStats(callback) {
  // Listen to all users for system-wide stats
  return onSnapshot(collection(db, 'Users'), snap => {
    const users   = snap.docs.map(d => d.data())
    const admins  = users.filter(u => u.role === 'admin')
    const editors = users.filter(u => u.role === 'editor')
    const clients = users.filter(u => u.role === 'client')
    callback({
      totalAdmins:          admins.length,
      pendingAdmins:        admins.filter(u => u.status === 'pending').length,
      activeAdmins:         admins.filter(u => u.status === 'active').length,
      totalEditors:         editors.length,
      totalClients:         clients.length,
    })
  })
}

// ─── Admin: Editors ──────────────────────────────────────────────────────────

export function onMyEditors(adminId, callback) {
  const q = query(
    collection(db, 'Users'),
    where('role', '==', 'editor'),
    where('adminId', '==', adminId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

export async function createEditor(adminId, { name, email, password }) {
  // Create auth account without signing out admin
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password)
  const uid  = cred.user.uid
  const code = genEditorCode()

  await setDoc(doc(db, 'Users', uid), {
    uid,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: 'editor',
    status: 'active',
    adminId,
    editorCode: code,
    createdAt: serverTimestamp(),
    totalEarnings: 0,
  })

  await secondaryAuth.signOut()
  return { uid, editorCode: code }
}

export async function deleteEditor(editorId) {
  await deleteDoc(doc(db, 'Users', editorId))
  // Note: Firebase Auth user remains (requires Admin SDK to delete fully)
}

// ─── Admin: Clients ──────────────────────────────────────────────────────────

export function onMyClients(adminId, callback) {
  const q = query(
    collection(db, 'Users'),
    where('role', '==', 'client'),
    where('adminId', '==', adminId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

export async function createClient(adminId, { name, email, company = '', password }) {
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password)
  const uid  = cred.user.uid

  await setDoc(doc(db, 'Users', uid), {
    uid,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: 'client',
    status: 'active',
    adminId,
    company: company.trim(),
    createdAt: serverTimestamp(),
  })

  await secondaryAuth.signOut()
  return uid
}

export async function deleteClient(clientId) {
  await deleteDoc(doc(db, 'Users', clientId))
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export function onMyTasks(adminId, callback) {
  const q = query(
    collection(db, 'Tasks'),
    where('adminId', '==', adminId),
    orderBy('assignedDate', 'desc')
  )
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

export function onEditorTasks(editorId, callback) {
  const q = query(
    collection(db, 'Tasks'),
    where('editorId', '==', editorId),
    orderBy('assignedDate', 'desc')
  )
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

export function onClientTasks(clientId, callback) {
  const q = query(
    collection(db, 'Tasks'),
    where('clientId', '==', clientId),
    orderBy('assignedDate', 'desc')
  )
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

export async function createTask(adminId, { editorId, clientId = '', title, description = '', editorAmount = 0, clientAmount = 0, deadline = null }) {
  const id = genId()
  await setDoc(doc(db, 'Tasks', id), {
    adminId,
    editorId,
    clientId,
    title: title.trim(),
    description: description.trim(),
    status: 'pending',
    editorAmount: Number(editorAmount) || 0,
    clientAmount: Number(clientAmount) || 0,
    assignedDate: serverTimestamp(),
    deadline: deadline || null,
    completedDate: null,
    order: Date.now(),
    dynamicData: {},
  })
  return id
}

export async function updateTask(taskId, data) {
  await updateDoc(doc(db, 'Tasks', taskId), { ...data })
}

export async function updateTaskStatus(taskId, status) {
  const update = { status }
  if (status === 'completed') update.completedDate = serverTimestamp()
  await updateDoc(doc(db, 'Tasks', taskId), update)
}

export async function deleteTask(taskId) {
  await deleteDoc(doc(db, 'Tasks', taskId))
}

export async function reorderTasks(tasks) {
  // Update order field for each task
  await Promise.all(
    tasks.map((t, i) => updateDoc(doc(db, 'Tasks', t.id), { order: i }))
  )
}

// ─── Workspace Columns (per-admin) ───────────────────────────────────────────

export function onWorkspaceColumns(adminId, callback) {
  return onSnapshot(
    doc(db, 'AppConfig', `workspace_${adminId}`),
    snap => {
      if (!snap.exists()) { callback(defaultColumns()); return }
      const cols = [...(snap.data().columns || [])].sort((a, b) => a.order - b.order)
      callback(cols)
    }
  )
}

export async function saveWorkspaceColumns(adminId, columns) {
  await setDoc(doc(db, 'AppConfig', `workspace_${adminId}`), {
    columns: columns.map((c, i) => ({ ...c, order: i })),
    updatedAt: serverTimestamp(),
  })
}

function defaultColumns() {
  return [
    { id: 'col_date',     name: 'Date',        type: 'date',   required: false, order: 0, selectOptions: [] },
    { id: 'col_project',  name: 'Project',      type: 'text',   required: true,  order: 1, selectOptions: [] },
    { id: 'col_duration', name: 'Duration (m)', type: 'math',   required: false, order: 2, selectOptions: [] },
    { id: 'col_amount',   name: 'Amount (₹)',   type: 'math',   required: true,  order: 3, selectOptions: [] },
  ]
}

// ─── Stats Calculations ──────────────────────────────────────────────────────

export function calcAdminStats(tasks) {
  const completed = tasks.filter(t => t.status === 'completed')
  const active    = tasks.filter(t => t.status !== 'completed')

  const totalRevenue = completed.reduce((s, t) => s + (Number(t.clientAmount) || 0), 0)
  const totalPaid    = completed.reduce((s, t) => s + (Number(t.editorAmount) || 0), 0)
  const totalProfit  = totalRevenue - totalPaid

  // Monthly breakdown for last 6 months
  const monthly = buildMonthlyData(completed, 'clientAmount', 6)

  return { totalRevenue, totalPaid, totalProfit, activeCount: active.length, completedCount: completed.length, monthly }
}

export function calcEditorStats(tasks) {
  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const completed  = tasks.filter(t => t.status === 'completed')
  const pending    = tasks.filter(t => t.status === 'pending')
  const inProgress = tasks.filter(t => t.status === 'in_progress')

  let monthEarnings = 0
  completed.forEach(t => {
    const d = t.completedDate?.toDate?.() ?? null
    if (d && d >= monthStart) monthEarnings += Number(t.editorAmount) || 0
  })

  const totalEarnings = completed.reduce((s, t) => s + (Number(t.editorAmount) || 0), 0)
  const monthly = buildMonthlyData(completed, 'editorAmount', 6)

  return { totalEarnings, monthEarnings, completedCount: completed.length, pendingCount: pending.length, inProgressCount: inProgress.length, monthly }
}

export function calcClientStats(tasks) {
  const total     = tasks.length
  const completed = tasks.filter(t => t.status === 'completed').length
  const active    = tasks.filter(t => t.status !== 'completed').length
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0
  return { total, completed, active, pct }
}

function buildMonthlyData(completedTasks, amountField, months) {
  const now = new Date()
  const data = []

  for (let i = months - 1; i >= 0; i--) {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const label = d.toLocaleString('default', { month: 'short' })

    const amount = completedTasks
      .filter(t => {
        const td = t.completedDate?.toDate?.() ?? null
        return td && td >= d && td < end
      })
      .reduce((s, t) => s + (Number(t[amountField]) || 0), 0)

    data.push({ month: label, amount })
  }
  return data
}

// ─── Math eval (re-export from inline) ───────────────────────────────────────

export function evalMath(expr) {
  if (!expr || typeof expr !== 'string') return null
  const cleaned = expr.replace(/[^0-9+\-*/().\s]/g, '').trim()
  if (!cleaned) return null
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function('return ' + cleaned)()
    if (typeof result !== 'number' || !isFinite(result)) return null
    return Math.round(result * 100) / 100
  } catch { return null }
}

export function isMathExpr(val) {
  return typeof val === 'string' && /[+\-*/]/.test(val)
}
