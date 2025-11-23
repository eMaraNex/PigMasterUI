"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    className?: string;
    render?: (value: any, row: any, index: number) => React.ReactNode;
}

interface TableAction {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: (row: any) => void;
    className?: string;
    condition?: (row: any) => boolean;
}

interface TableProps {
    data: any[];
    columns: TableColumn[];
    actions?: TableAction[];
    loading?: boolean;
    selectable?: boolean;
    selectedItems?: string[];
    onSelectionChange?: (selectedIds: string[]) => void;
    idField?: string;
    sortField?: string;
    sortOrder?: "asc" | "desc";
    onSort?: (field: string) => void;
    emptyState?: {
        title: string;
        description: string;
        action?: {
            label: string;
            onClick: () => void;
        };
    };
    className?: string;
    rowClassName?: string;
    headerClassName?: string;
}

const Table: React.FC<TableProps> = ({
    data = [],
    columns = [],
    actions = [],
    loading = false,
    selectable = false,
    selectedItems = [],
    onSelectionChange,
    idField = "id",
    sortField,
    sortOrder = "asc",
    onSort,
    emptyState,
    className = "",
    rowClassName = "",
    headerClassName = "",
}) => {
    const handleSelectAll = (checked: boolean) => {
        if (onSelectionChange && data.length > 0) {
            const allIds = data.map((row) => row[idField]).filter(id => id != null);
            onSelectionChange(checked ? allIds : []);
        }
    };

    const handleSelectItem = (id: string) => {
        if (onSelectionChange && id != null) {
            const isSelected = selectedItems.includes(id);
            if (isSelected) {
                onSelectionChange(selectedItems.filter((item) => item !== id));
            } else {
                onSelectionChange([...selectedItems, id]);
            }
        }
    };

    const handleSort = (field: string) => {
        if (onSort && field) {
            onSort(field);
        }
    };

    const getSortIcon = (field: string) => {
        if (sortField !== field) return null;
        return sortOrder === "asc" ? (
            <ChevronUp className="h-4 w-4 text-blue-500" />
        ) : (
            <ChevronDown className="h-4 w-4 text-blue-500" />
        );
    };

    const validSelectedItems = selectedItems.filter(item => item != null);
    const validDataWithIds = data.filter(row => row[idField] != null);
    const isAllSelected = validSelectedItems.length === validDataWithIds.length && validDataWithIds.length > 0;
    const isIndeterminate = validSelectedItems.length > 0 && validSelectedItems.length < validDataWithIds.length;

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className={`border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 ${headerClassName}`}>
                            {selectable && (
                                <th className="text-left p-4 w-12">
                                    <Checkbox
                                        checked={isAllSelected}
                                        ref={(ref) => {
                                            if (ref && "indeterminate" in ref) {
                                                (ref as HTMLInputElement).indeterminate = isIndeterminate;
                                            }
                                        }}
                                        onCheckedChange={handleSelectAll}
                                        className="rounded-md"
                                    />
                                </th>
                            )}
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`text-left p-4 font-semibold text-gray-900 dark:text-gray-100 ${column.sortable ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" : ""
                                        } ${column.className || ""}`}
                                    style={column.width ? { width: column.width } : {}}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                >
                                    <div className="flex items-center gap-2">
                                        {column.label}
                                        {column.sortable && getSortIcon(column.key)}
                                    </div>
                                </th>
                            ))}
                            {actions.length > 0 && (
                                <th className="text-right p-4 font-semibold text-gray-900 dark:text-gray-100">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {data.map((row, index) => {
                                const rowId = row[idField];
                                if (rowId == null) return null;

                                return (
                                    <motion.tr
                                        key={rowId}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className={`border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group ${rowClassName}`}
                                    >
                                        {selectable && (
                                            <td className="p-4">
                                                <Checkbox
                                                    checked={selectedItems.includes(rowId)}
                                                    onCheckedChange={() => handleSelectItem(rowId)}
                                                    className="rounded-md"
                                                />
                                            </td>
                                        )}
                                        {columns.map((column) => (
                                            <td key={column.key} className={`p-4 ${column.className || ""}`}>
                                                {column.render
                                                    ? column.render(row[column.key], row, index)
                                                    : (row[column.key] ?? '')
                                                }
                                            </td>
                                        ))}
                                        {actions.length > 0 && (
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    {actions.map((action, actionIndex) => {
                                                        const shouldShow = action.condition ? action.condition(row) : true;
                                                        if (!shouldShow) return null;

                                                        return (
                                                            <Button
                                                                key={actionIndex}
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => action.onClick(row)}
                                                                className={`h-8 w-8 p-0 rounded-lg ${action.className || ""}`}
                                                                title={action.label}
                                                            >
                                                                <action.icon className="h-4 w-4" />
                                                            </Button>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        )}
                                    </motion.tr>
                                );
                            })}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {data.length === 0 && emptyState && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                >
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="h-8 w-8 text-gray-400">📋</div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {emptyState.title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        {emptyState.description}
                    </p>
                    {emptyState.action && (
                        <Button
                            onClick={emptyState.action.onClick}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
                        >
                            {emptyState.action.label}
                        </Button>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default Table;