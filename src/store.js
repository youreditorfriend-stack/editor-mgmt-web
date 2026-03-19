import { create } from 'zustand'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { getUser } from './services'

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  init() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        set({ user: null, loading: false })
        return
      }
      const user = await getUser(firebaseUser.uid)
      set({ user, loading: false })
    })
  },

  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))
