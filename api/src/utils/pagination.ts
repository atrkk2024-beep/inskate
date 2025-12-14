export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function getPaginationParams(query: PaginationQuery, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(maxLimit, Math.max(1, query.limit || defaultLimit));
  const skip = (page - 1) * limit;
  const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

  return { page, limit, skip, sortOrder };
}

export function createPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

