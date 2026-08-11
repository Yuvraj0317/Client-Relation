import React from 'react';

interface Column<T> {
  header: string;
  accessor?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No records found',
  onRowClick,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark rounded-xl overflow-hidden shadow-sm">
        <div className="p-8 text-center">
          <div className="inline-block w-8 h-8 border-3 border-ocean-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">Fetching dataset...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark rounded-xl shadow-sm">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark rounded-xl shadow-sm transition-colors duration-200">
      <table className="w-full text-left text-sm text-slate-800 dark:text-slate-200">
        <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200 dark:border-surface-borderDark">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={`px-5 py-3.5 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
          {data.map((row, rowIdx) => (
            <tr
              key={row.id || rowIdx}
              onClick={() => onRowClick && onRowClick(row)}
              className={`transition-colors ${
                onRowClick
                  ? 'cursor-pointer hover:bg-ocean-50/50 dark:hover:bg-ocean-950/30'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
              }`}
            >
              {columns.map((col, colIdx) => (
                <td key={colIdx} className={`px-5 py-3.5 font-normal text-slate-700 dark:text-slate-300 ${col.className || ''}`}>
                  {col.cell
                    ? col.cell(row)
                    : col.accessor
                    ? (row[col.accessor] as unknown as React.ReactNode)
                    : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
