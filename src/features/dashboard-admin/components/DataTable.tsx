"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type PaginationState,
  type OnChangeFn,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "./DataTable-pagination";

/** payload ที่ DetailView ยิงออกมาเมื่ออัปเดตสถานะสำเร็จ */
type KycStatusUpdatedDetail = {
  companyId: string;
  requestId: string;
  correlationId: string; // == transactionNo ในตาราง
  newStatus:
    | "Approved"
    | "Pending"
    | "Rejected"
    | "Approved Override"
    | "Rejected Override";
  apiStatus:
    | "approved"
    | "rejected"
    | "approved override"
    | "rejected override";
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  onView?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
  pagination,
  onPaginationChange,
  onView,
}: DataTableProps<TData, TValue>) {
  /** เก็บ state ภายในเพื่อให้ patch แถวได้แบบไม่รีหน้า */
  const [rows, setRows] = React.useState<TData[]>(data);

  /** sync เมื่อ data จากภายนอกเปลี่ยน (เช่น re-fetch) */
  React.useEffect(() => {
    setRows(data);
  }, [data]);

  /** ฟังอีเวนต์จาก DetailView → แก้สถานะของแถวที่ transactionNo ตรงกับ correlationId */
  React.useEffect(() => {
    const handler = (ev: Event) => {
      const e = ev as CustomEvent<KycStatusUpdatedDetail>;
      const d = e.detail;
      if (!d) return;

      setRows((prev) =>
        prev.map((r) => {
          const ro = r as unknown as Record<string, unknown>;
          const txn = ro["transactionNo"];
          if (typeof txn === "string" && txn === d.correlationId) {
            const next: Record<string, unknown> = {
              ...ro,
              status: d.newStatus,
            };

            // Debug ให้เห็นว่าปรับสำเร็จ
            console.groupCollapsed("[DataTable] kyc:status-updated applied");
            console.table({
              correlationId: d.correlationId,
              newStatus: d.newStatus,
            });
            console.groupEnd();

            return next as unknown as TData;
          }
          return r;
        })
      );
    };

    window.addEventListener("kyc:status-updated", handler as EventListener);
    return () =>
      window.removeEventListener(
        "kyc:status-updated",
        handler as EventListener
      );
  }, []);

  const table = useReactTable({
    data: rows, // ⬅ ใช้ state ภายในแทน props.data
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: pagination ? { pagination } : undefined,
    onPaginationChange,
  });

  return (
    <>
      <div
        className={cn(
          "rounded-md border overflow-x-auto",
          className,
          table.getRowModel().rows?.length === 0 && "h-full"
        )}
      >
        <div className="flex justify-between space-x-6 lg:space-x-8 px-6 p-5">
          <p className="text-xl font-medium pt-1">Verification</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger
              aria-labelledby="rows-per-page-label"
              className="h-9 w-[180px] justify-between"
            >
              <SelectValue />
            </SelectTrigger>

            <SelectContent side="top">
              {[10, 20, 50, 100, 200].map((n) => (
                <SelectItem key={n} value={`${n}`}>
                  {`Limit to ${n} rows`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Table className="w-full ">
          <TableHeader className="top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onView?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-80 text-center"
                >
                  No verification
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* แสดง Pagination เฉพาะตอนมีข้อมูล */}
      {table.getRowModel().rows?.length > 0 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <DataTablePagination table={table} />
        </div>
      )}
    </>
  );
}
