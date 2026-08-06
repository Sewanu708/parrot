"use client";

import * as TableSDK from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData> {
  columns: any[];
  data: TData[];
  emptyText?: string;
}

const useTableHook =
  (TableSDK as any).useLegacyTable ||
  (TableSDK as any).useReactTable ||
  (TableSDK as any).useTable;

const getCoreRowModelFn =
  (TableSDK as any).getCoreRowModel ||
  (TableSDK as any).createCoreRowModel;

export function DataTable<TData>({
  columns,
  data,
  emptyText = "No results found.",
}: DataTableProps<TData>) {
  const table = useTableHook({
    data,
    columns,
    ...(getCoreRowModelFn ? { getCoreRowModel: getCoreRowModelFn() } : {}),
  });

  const headerGroups = table.getHeaderGroups ? table.getHeaderGroups() : (table.headerGroups || []);
  const rows = table.getRowModel ? table.getRowModel().rows : (table.rows || []);

  return (
    <div className="rounded-xl border border-[#e9e9e7] dark:border-[#2d2d2d] bg-white dark:bg-[#191919] overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-neutral-50/80 dark:bg-neutral-900/50">
          {headerGroups.map((headerGroup: any) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header: any) => {
                return (
                  <TableHead
                    key={header.id}
                    className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 py-3"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows?.length ? (
            rows.map((row: any) => {
              const cells = typeof row.getVisibleCells === "function"
                ? row.getVisibleCells()
                : (row.cells || row.getAllCells?.() || []);

              return (
                <TableRow
                  key={row.id}
                  className="hover:bg-neutral-50/50 dark:hover:bg-white/2 border-b border-[#e9e9e7]/60 dark:border-[#2d2d2d]/60 last:border-0"
                >
                  {cells.map((cell: any) => (
                    <TableCell key={cell.id} className="py-3 px-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-xs text-neutral-500"
              >
                {emptyText}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
