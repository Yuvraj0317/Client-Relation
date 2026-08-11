import React from 'react';

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-surface-cardDark border border-mono-200 dark:border-surface-borderDark rounded-2xl p-8 text-center space-y-3">
        <div className="inline-block w-6 h-6 border-2 border-mono-900 dark:border-white border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-mono-500 dark:text-mono-400">Loading operations dataset...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-cardDark border border-mono-200 dark:border-surface-borderDark rounded-2xl p-12 text-center">
        <p className="text-sm font-semibold text-mono-600 dark:text-mono-300">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-cardDark border border-mono-200 dark:border-surface-borderDark rounded-2xl overflow-hidden shadow-sm transition-colors duration-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-mono-100 dark:bg-mono-950 border-b border-mono-200 dark:border-mono-800 text-mono-600 dark:text-mono-400 font-mono uppercase text-[11px] tracking-wider">
              {columns.map((col, i) => (
                <th key={i} className={`px-4 py-3.5 font-extrabold ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-mono-100 dark:divide-mono-900/60">
            {data.map((row, index) => (
              <tr
                key={row.id || index}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition ${
                  onRowClick ? 'cursor-pointer hover:bg-mono-100/60 dark:hover:bg-mono-900/40' : ''
                }`}
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className={`px-4 py-3.5 text-mono-900 dark:text-mono-100 ${col.className || ''}`}>
                    {col.cell
                      ? col.cell(row)
                      : col.accessor
                      ? String(row[col.accessor] ?? '')
                      : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
