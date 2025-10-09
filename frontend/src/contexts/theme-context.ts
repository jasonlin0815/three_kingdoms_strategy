import { createContext } from 'react'

type Theme = 'dark' | 'light'

export interface ThemeProviderState {
  readonly theme: Theme
  readonly setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'light',
  setTheme: () => null,
}

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState)
