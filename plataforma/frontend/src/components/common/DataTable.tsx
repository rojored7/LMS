import React, { useState, useMemo } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  pageSize?: number;
  pageSizeOptions?: number[];
  showPagination?: boolean;
  showPageSizeSelector?: boolean;
  onRowClick?: (item: T) => void;
  rowKey: (item: T) => string | number;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
}

function DataTable<T>({
  data,
  columns,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  showPagination = true,
  showPageSizeSelector = true,
  onRowClick,
  rowKey,
  emptyMessage = 'No hay datos para mostrar',
  loading = false,
  className = '',
  striped = true,
  hoverable = true,
  compact = false,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    const column = columns.find(col => col.key === sortColumn);
    if (!column || !column.sortable) return data;

    return [...data].sort((a, b) => {
      const aValue = column.accessor(a);
      const bValue = column.accessor(b);

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (aValue > bValue) comparison = 1;
      if (aValue < bValue) comparison = -1;

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection, columns]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;

    const startIndex = (currentPage - 1) * currentPageSize;
    const endIndex = startIndex + currentPageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, currentPageSize, showPagination]);

  const totalPages = Math.ceil(sortedData.length / currentPageSize);

  const handleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable) return;

    if (sortColumn === column.key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column.key);
      setSortDirection('asc');
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setCurrentPageSize(newSize);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const renderSortIcon = (column: DataTableColumn<T>) => {
    if (!column.sortable) return null;

    if (sortColumn !== column.key) {
      return (
        <span className="ml-1 text-gray-400">
          <ChevronUpIcon className="w-3 h-3 inline" />
          <ChevronDownIcon className="w-3 h-3 inline -ml-1" />
        </span>
      );
    }

    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4 ml-1 inline text-blue-600" />
    ) : (
      <ChevronDownIcon className="w-4 h-4 ml-1 inline text-blue-600" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`data-table-container ${className} max-w-full`}>
      <div className="overflow-x-auto">
        <table className={`
          min-w-full divide-y divide-gray-200
          ${compact ? 'text-sm' : 'text-base'}
        `}>
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  className={`
                    px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                    ${column.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''}
                    ${column.className || ''}
                    ${compact ? 'px-4 py-2' : 'px-6 py-3'}
                  `}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {renderSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`bg-white divide-y divide-gray-200 ${striped ? 'striped' : ''}`}>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr
                  key={rowKey(item)}
                  className={`
                    ${striped && index % 2 === 0 ? 'bg-white' : striped ? 'bg-gray-50' : ''}
                    ${hoverable ? 'hover:bg-gray-100' : ''}
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {columns.map(column => (
                    <td
                      key={column.key}
                      className={`
                        ${compact ? 'px-4 py-2' : 'px-6 py-4'}
                        whitespace-nowrap text-gray-900
                        ${column.className || ''}
                      `}
                    >
                      {column.accessor(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && sortedData.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
          <div className="flex items-center">
            {showPageSizeSelector && (
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700">Mostrar</label>
                <select
                  value={currentPageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {pageSizeOptions.map(size => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-700">registros</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Mostrando {((currentPage - 1) * currentPageSize) + 1} a{' '}
              {Math.min(currentPage * currentPageSize, sortedData.length)} de{' '}
              {sortedData.length} registros
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`
                px-3 py-1 text-sm border border-gray-300 rounded-l-md
                ${currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'}
              `}
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`
                    px-3 py-1 text-sm border-t border-b border-gray-300
                    ${pageNum === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'}
                  `}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`
                px-3 py-1 text-sm border border-gray-300 rounded-r-md
                ${currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'}
              `}
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;