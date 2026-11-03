import { create } from 'zustand'

interface ToastState {
  message: string | null
  show: (message: string) => void
}

let timer: number | undefined

export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message) => {
    window.clearTimeout(timer)
    set({ message })
    timer = window.setTimeout(() => set({ message: null }), 2400)
  },
}))
