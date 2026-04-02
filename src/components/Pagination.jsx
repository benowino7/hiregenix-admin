// src/components/common/Pagination.jsx
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
    showingFrom,
    showingTo
}) => {
    const generatePageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            // Show all pages if total is less than max
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // Show pages around current page
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(currentPage + 1, totalPages - 1); i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            // Always show last page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const pageNumbers = generatePageNumbers();

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
            {/* Results info */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing <span className="font-medium text-gray-900 dark:text-white">{showingFrom}</span> to{' '}
                <span className="font-medium text-gray-900 dark:text-white">{showingTo}</span> of{' '}
                <span className="font-medium text-gray-900 dark:text-white">{totalItems}</span> results
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-2">
                {/* First page */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-colors ${currentPage === 1
                            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    aria-label="First page"
                >
                    <ChevronsLeft size={20} />
                </button>

                {/* Previous page */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-colors ${currentPage === 1
                            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    aria-label="Previous page"
                >
                    <ChevronLeft size={20} />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                    {pageNumbers.map((page, index) => (
                        page === '...' ? (
                            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                                ...
                            </span>
                        ) : (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`min-w-[40px] px-3 py-2 rounded-lg font-medium transition-all ${currentPage === page
                                        ? 'bg-theme_color text-white shadow-md'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {page}
                            </button>
                        )
                    ))}
                </div>

                {/* Next page */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-colors ${currentPage === totalPages
                            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    aria-label="Next page"
                >
                    <ChevronRight size={20} />
                </button>

                {/* Last page */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-colors ${currentPage === totalPages
                            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    aria-label="Last page"
                >
                    <ChevronsRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;