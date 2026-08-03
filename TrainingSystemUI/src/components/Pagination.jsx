function Pagination({ page, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const getPages = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }
        pages.push(1);
        if (page > 3) pages.push("...");
        let start = Math.max(2, page - 1);
        let end = Math.min(totalPages - 1, page + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (page < totalPages - 2) pages.push("...");
        pages.push(totalPages);
        return pages;
    };

    const pages = getPages();

    return (
        <div className="pagination">
            <span className="pagination-info">Page {page} of {totalPages}</span>

            <button
                className="pagination-btn"
                disabled={page <= 1}
                onClick={() => onPageChange(1)}
                title="First page"
                aria-label="First page"
            >
                <span className="pagination-btn-icon" aria-hidden="true">«</span>
            </button>
            <button
                className="pagination-btn"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                title="Previous page"
                aria-label="Previous page"
            >
                <span className="pagination-btn-icon" aria-hidden="true">‹</span>
            </button>

            {pages.map((p, i) =>
                p === "..." ? (
                    <span key={`ellipsis-${i}`} className="pagination-ellipsis" aria-hidden="true">•••</span>
                ) : (
                    <button
                        key={p}
                        className={`pagination-btn ${p === page ? "active" : ""}`}
                        onClick={() => onPageChange(p)}
                        aria-current={p === page ? "page" : undefined}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                className="pagination-btn"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                title="Next page"
                aria-label="Next page"
            >
                <span className="pagination-btn-icon" aria-hidden="true">›</span>
            </button>
            <button
                className="pagination-btn"
                disabled={page >= totalPages}
                onClick={() => onPageChange(totalPages)}
                title="Last page"
                aria-label="Last page"
            >
                <span className="pagination-btn-icon" aria-hidden="true">»</span>
            </button>
        </div>
    );
}

export default Pagination;
