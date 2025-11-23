"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    pageSizeOptions?: number[];
    showPageSizeSelector?: boolean;
    showItemsInfo?: boolean;
    className?: string;
    currentPageItems?: number;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [5, 10, 15, 20, 30, 50],
    showPageSizeSelector = true,
    showItemsInfo = true,
    className = "",
    currentPageItems
}) => {
    // Ensure we have valid numbers
    const validCurrentPage = Number(currentPage) || 1;
    const validTotalItems = Number(totalItems) || 0;
    const validPageSize = Number(pageSize) || 10;

    const totalPages = Math.ceil(validTotalItems / validPageSize);
    const startItem = validTotalItems === 0 ? 0 : (validCurrentPage - 1) * validPageSize + 1;
    const endItem = Math.min(validCurrentPage * validPageSize, validTotalItems);

    const itemsOnCurrentPage = currentPageItems !== undefined
        ? currentPageItems
        : (validTotalItems === 0 ? 0 : Math.min(validPageSize, validTotalItems - (validCurrentPage - 1) * validPageSize));

    const handlePageChange = (page: number) => {
        const validPage = Number(page);
        if (validPage >= 1 && validPage <= totalPages) {
            onPageChange(validPage);
        }
    };

    const handlePageSizeChange = (value: string) => {
        const newPageSize = Number(value);
        if (newPageSize && newPageSize > 0) {
            onPageSizeChange(newPageSize);
        }
    };

    const getVisiblePages = () => {
        if (totalPages <= 1) return [];

        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        // Calculate the range around current page
        const start = Math.max(2, validCurrentPage - delta);
        const end = Math.min(totalPages - 1, validCurrentPage + delta);

        for (let i = start; i <= end; i++) {
            range.push(i);
        }

        // Add first page
        if (validCurrentPage - delta > 2) {
            rangeWithDots.push(1, "...");
        } else {
            rangeWithDots.push(1);
        }

        // Add middle range
        rangeWithDots.push(...range);

        // Add last page
        if (validCurrentPage + delta < totalPages - 1) {
            rangeWithDots.push("...", totalPages);
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages);
        }

        // Remove duplicates
        return rangeWithDots.filter((item, index, arr) => {
            if (typeof item === 'number') {
                return arr.indexOf(item) === index;
            }
            return true;
        });
    };

    // Don't render if no items or only one page
    if (validTotalItems === 0) {
        return null;
    }

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 ${className}`}>
            {/* Items info */}
            {showItemsInfo && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {itemsOnCurrentPage} of {validTotalItems} entries
                </div>
            )}

            {/* Pagination controls */}
            <div className="flex items-center gap-2">
                {/* First and Previous buttons */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={validCurrentPage === 1}
                    className="h-8 w-8 p-0"
                    title="First page"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(validCurrentPage - 1)}
                    disabled={validCurrentPage === 1}
                    className="h-8 w-8 p-0"
                    title="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                    {getVisiblePages().map((page, index) => (
                        <React.Fragment key={`page-${index}-${page}`}>
                            {page === "..." ? (
                                <span className="px-2 text-gray-400">...</span>
                            ) : (
                                <Button
                                    variant={validCurrentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePageChange(page as number)}
                                    className="h-8 w-8 p-0"
                                    title={`Page ${page}`}
                                >
                                    {page}
                                </Button>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Next and Last buttons */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(validCurrentPage + 1)}
                    disabled={validCurrentPage === totalPages}
                    className="h-8 w-8 p-0"
                    title="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={validCurrentPage === totalPages}
                    className="h-8 w-8 p-0"
                    title="Last page"
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Page size selector */}
            {showPageSizeSelector && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Show:</span>
                    <Select
                        value={validPageSize.toString()}
                        onValueChange={handlePageSizeChange}
                    >
                        <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {pageSizeOptions.map((size) => (
                                <SelectItem key={size} value={size.toString()}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    );
};

export default Pagination;