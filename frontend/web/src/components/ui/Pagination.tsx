interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingsCount?: number;
}

function generatePages(
  current: number,
  total: number,
  siblings: number
): (number | string)[] {
  const pages: (number | string)[] = [];
  const leftSiblingIndex = Math.max(current - siblings, 1);
  const rightSiblingIndex = Math.min(current + siblings, total);

  const showLeftDots = leftSiblingIndex > 2;
  const showRightDots = rightSiblingIndex < total - 2;

  // Always show first page
  pages.push(1);

  if (showLeftDots) {
    pages.push('...');
  } else if (leftSiblingIndex > 2) {
    for (let i = 2; i < leftSiblingIndex; i++) {
      pages.push(i);
    }
  }

  // Show sibling pages
  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    pages.push(i);
  }

  if (showRightDots) {
    pages.push('...');
  } else if (rightSiblingIndex < total - 2) {
    for (let i = rightSiblingIndex + 1; i < total; i++) {
      pages.push(i);
    }
  }

  // Always show last page
  if (total > 1) {
    pages.push(total);
  }

  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingsCount = 1,
}: PaginationProps) {
  const pages = generatePages(currentPage, totalPages, siblingsCount);

  return (
    <div className="flex items-center justify-center gap-1">
      {/* Previous button */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
        title="Previous page"
        className="px-3 py-2 rounded-lg border-2 border-stroke hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Page numbers */}
      {pages.map((page, idx) => (
        <div key={idx}>
          {page === '...' ? (
            <span className="px-2 py-2 text-text">...</span>
          ) : (
            <button
              type="button"
              onClick={() => onPageChange(page as number)}
              aria-label={`Go to page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
              className={`
                px-3 py-2 rounded-lg border-2 transition-colors
                ${
                  currentPage === page
                    ? 'bg-accent border-accent text-surface font-medium'
                    : 'border-stroke hover:border-accent text-text'
                }
              `}
            >
              {page}
            </button>
          )}
        </div>
      ))}

      {/* Next button */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
        title="Next page"
        className="px-3 py-2 rounded-lg border-2 border-stroke hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}
