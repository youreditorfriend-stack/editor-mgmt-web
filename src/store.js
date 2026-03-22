import { create } from 'zustand'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { getUser } from './services'

export const useAuthStore = create((set, get) => ({
  user:    null,
  loading: true,

  init() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        set({ user: null, loading: false })
        return
      }
      try {
        const user = await getUser(firebaseUser.uid)
        set({ user, loading: false })
      } catch {
        set({ user: null, loading: false })
      }
    })
  },

  setUser:   (user) => set({ user }),
  clearUser: ()     => set({ user: null }),
  refreshUser: async () => {
    const { user } = get()
    if (!user) return
    const fresh = await getUser(user.id)
    if (fresh) set({ user: fresh })
  },
}))
