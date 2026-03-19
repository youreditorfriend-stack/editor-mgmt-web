import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, serverTimestamp, addDoc
} from 'firebase/firestore'
import { signInWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth'
import { db, auth } from './firebase'


// ─── Auth ──────────────────────────────────────────────────────────────────

export async function signIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
  return getUser(cred.user.uid)
}

export function signOut() { return fbSignOut(auth) }

// ─── Users ─────────────────────────────────────────────────────────────────

export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'Users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export function onEditors(callback) {
  const q = query(collection(db, 'Users'), where('role', '==', 'editor'))
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

// ─── AppConfig (SDUI) ──────────────────────────────────────────────────────

export function onWorkspaceSettings(callback) {
  return onSnapshot(
    doc(db, 'AppConfig', 'editor_workspace_settings'),
    snap => {
      if (!snap.exists()) {
        callback(defaultColumns())
        return
      }
      const data = snap.data()
      const cols = [...(data.columns || [])].sort((a, b) => a.order - b.order)
      callback(cols)
    }
  )
}

export async function saveWorkspaceSettings(columns) {
  const ordered = columns.map((c, i) => ({ ...c, order: i }))
  await setDoc(doc(db, 'AppConfig', 'editor_workspace_settings'), {
    columns: ordered,
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser?.uid ?? ''
  })
}

function defaultColumns() {
  return [
    { id: 'col_date', name: 'Date', type: 'date', required: false, order: 0, selectOptions: [] },
    { id: 'col_project', name: 'Project', type: 'text', required: false, order: 1, selectOptions: [] },
    { id: 'col_duration', name: 'Duration (min)', type: 'math', required: false, order: 2, selectOptions: [] },
    { id: 'col_amount', name: 'Amount (₹)', type: 'math', required: true, order: 3, selectOptions: [] },
    { id: 'col_status', name: 'Status', type: 'select', required: false, order: 4, selectOptions: ['Pending', 'In Review', 'Done'] },
  ]
}

// ─── Tasks ─────────────────────────────────────────────────────────────────

export function onEditorTasks(editorId, callback) {
  const q = query(
    collection(db, 'Tasks'),
    where('editorID', '==', editorId),
    orderBy('assignedDate', 'desc')
  )
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

export function onAllTasks(callback) {
  const q = query(collection(db, 'Tasks'), orderBy('assignedDate', 'desc'))
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

export async function createTask({ editorId, title, description }) {
  const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  await setDoc(doc(db, 'Tasks', id), {
    editorID: editorId,
    assignedBy: auth.currentUser?.uid ?? '',
    title,
    description: description || '',
    status: 'pending',
    assignedDate: serverTimestamp(),
    completedDate: null,
    dynamicData: {}
  })
}

export async function updateTaskStatus(taskId, status) {
  const update = { status }
  if (status === 'completed') update.completedDate = serverTimestamp()
  await updateDoc(doc(db, 'Tasks', taskId), update)
}

export async function updateTaskDynamicData(taskId, dynamicData) {
  await updateDoc(doc(db, 'Tasks', taskId), { dynamicData })
}

export async function deleteTask(taskId) {
  await deleteDoc(doc(db, 'Tasks', taskId))
}

// ─── Stats ─────────────────────────────────────────────────────────────────

export function calcEditorStats(tasks) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const completed = tasks.filter(t => t.status === 'completed')
  const pending = tasks.filter(t => t.status !== 'completed')

  let monthEarnings = 0
  completed.forEach(t => {
    const completedDate = t.completedDate?.toDate?.() ?? null
    if (completedDate && completedDate >= monthStart) {
      const amt = t.dynamicData?.col_amount
      if (typeof amt === 'number') monthEarnings += amt
    }
  })

  return {
    monthEarnings,
    completedCount: completed.length,
    pendingCount: pending.length,
  }
}
