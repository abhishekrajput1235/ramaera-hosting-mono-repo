import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
    className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
    className = '',
}) => {
    // Debug logging
    console.log('Pagination Debug:', { currentPage, totalPages, totalItems, itemsPerPage });

    // Temporarily always show pagination for debugging
    // if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 sm:px-6 ${className}`}>
            {/* Mobile view - Simple prev/next with page info */}
            <div className="flex sm:hidden w-full items-center justify-between">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`inline-flex items-center px-3 py-2 rounded-md border border-slate-700 bg-slate-800 text-sm font-medium ${currentPage === 1
                        ? 'text-slate-500 cursor-not-allowed'
                        : 'text-slate-300 hover:bg-slate-700'
                        }`}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                </button>
                <p className="text-sm text-slate-400">
                    Page <span className="font-medium text-white">{currentPage}</span> of{' '}
                    <span className="font-medium text-white">{totalPages}</span>
                </p>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`inline-flex items-center px-3 py-2 rounded-md border border-slate-700 bg-slate-800 text-sm font-medium ${currentPage === totalPages
                        ? 'text-slate-500 cursor-not-allowed'
                        : 'text-slate-300 hover:bg-slate-700'
                        }`}
                >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                </button>
            </div>

            {/* Desktop view */}
            <div className="hidden sm:flex flex-1 items-center justify-between">
                <div>
                    <p className="text-sm text-slate-400">
                        Showing <span className="font-medium text-white">{startItem}</span> to{' '}
                        <span className="font-medium text-white">{endItem}</span> of{' '}
                        <span className="font-medium text-white">{totalItems}</span> results
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-700 bg-slate-800 text-sm font-medium ${currentPage === 1
                                ? 'text-slate-500 cursor-not-allowed'
                                : 'text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            <span className="sr-only">Previous</span>
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>

                        {/* Page Numbers */}
                        {[...Array(totalPages)].map((_, idx) => {
                            const pageNumber = idx + 1;
                            // Show first, last, current, and adjacent pages
                            if (
                                pageNumber === 1 ||
                                pageNumber === totalPages ||
                                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                            ) {
                                return (
                                    <button
                                        key={pageNumber}
                                        onClick={() => onPageChange(pageNumber)}
                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNumber
                                            ? 'z-10 bg-blue-600 border-blue-600 text-white'
                                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                            }`}
                                    >
                                        {pageNumber}
                                    </button>
                                );
                            } else if (
                                (pageNumber === currentPage - 2 && pageNumber > 1) ||
                                (pageNumber === currentPage + 2 && pageNumber < totalPages)
                            ) {
                                return (
                                    <span
                                        key={pageNumber}
                                        className="relative inline-flex items-center px-4 py-2 border border-slate-700 bg-slate-800 text-sm font-medium text-slate-400"
                                    >
                                        ...
                                    </span>
                                );
                            }
                            return null;
                        })}

                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-700 bg-slate-800 text-sm font-medium ${currentPage === totalPages
                                ? 'text-slate-500 cursor-not-allowed'
                                : 'text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            <span className="sr-only">Next</span>
                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
};
