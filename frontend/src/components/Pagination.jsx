import { ChevronLeftIcon, ChevronRightIcon } from './Icons.jsx';

/** Compact page list: 1 … 4 5 [6] 7 8 … 20 */
function pageItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (unused, index) => index + 1);
  }

  const items = new Set([1, totalPages, currentPage]);
  if (currentPage - 1 > 1) items.add(currentPage - 1);
  if (currentPage + 1 < totalPages) items.add(currentPage + 1);
  if (currentPage <= 3) items.add(2).add(3).add(4);
  if (currentPage >= totalPages - 2) items.add(totalPages - 1).add(totalPages - 2).add(totalPages - 3);

  const pages = [...items].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);

  const withGaps = [];
  let previous = 0;
  for (const page of pages) {
    if (previous && page - previous > 1) withGaps.push(`gap-${page}`);
    withGaps.push(page);
    previous = page;
  }
  return withGaps;
}

export function Pagination({ meta, pageSize, onPageChange, onPageSizeChange, itemLabel = 'users' }) {
  const { page = 1, total = 0, totalPages = 0 } = meta ?? {};

  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, total);

  return (
    <div className="pagination">
      <div className="pagination__summary">
        {total === 0 ? (
          `No ${itemLabel} found`
        ) : (
          <>
            Showing <strong>{firstRow}</strong>–<strong>{lastRow}</strong> of <strong>{total}</strong> {itemLabel}
          </>
        )}
      </div>

      <div className="pagination__controls">
        {onPageSizeChange ? (
          <>
            <label htmlFor="page-size" className="pagination__summary" style={{ marginRight: 2 }}>
              Rows
            </label>
            <select
              id="page-size"
              className="select"
              style={{ width: 74, padding: '5px 26px 5px 8px' }}
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </>
        ) : null}

        <button
          type="button"
          className="page-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeftIcon />
        </button>

        {pageItems(page, totalPages).map((item) =>
          typeof item === 'number' ? (
            <button
              key={item}
              type="button"
              className={`page-btn${item === page ? ' is-active' : ''}`}
              onClick={() => onPageChange(item)}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </button>
          ) : (
            <span key={item} className="page-ellipsis">
              …
            </span>
          ),
        )}

        <button
          type="button"
          className="page-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={totalPages === 0 || page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}
