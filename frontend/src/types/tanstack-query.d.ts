import type { QueryError } from './api'

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: QueryError
  }
}
