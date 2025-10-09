/**
 * API error response type
 *
 * Matches FastAPI HTTPException structure
 */
export interface QueryError {
  readonly response?: {
    readonly status: number
    readonly data?: {
      readonly detail?: string
    }
  }
  readonly message?: string
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  readonly data: T
  readonly message?: string
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  readonly total: number
  readonly page: number
  readonly page_size: number
  readonly total_pages: number
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  readonly items: T[]
  readonly meta: PaginationMeta
}
