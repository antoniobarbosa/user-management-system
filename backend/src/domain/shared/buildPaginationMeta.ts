export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: totalPages > 0 && page < totalPages,
    hasPrev: page > 1,
  };
}
