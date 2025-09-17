"use client";

import { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const total = table.getPageCount();
  const curr = table.getState().pagination.pageIndex + 1;

  // แสดง ... เมื่อมีมากกว่า 2–3 หน้า
  const getPages = (total: number, curr: number) => {
    const pages: (number | string)[] = [];
    if (total <= 4) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }
    if (curr <= 3) {
      pages.push(1, 2, 3, "…");
      return pages;
    }
    if (curr >= total - 2) {
      pages.push("…", total - 2, total - 1, total);
      return pages;
    }
    pages.push("…", curr - 1, curr, curr + 1, "…");
    return pages;
  };

  const pages = getPages(total, curr);

  return (
    <nav
      aria-label="Pagination"
      className="w-full flex items-center justify-center gap-4 py-2"
    >
      {/* Previous */}
      <Button
        variant="outline"
        className="h-9 px-3 gap-2"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="font-semibold">Previous</span>
      </Button>

      {/* Numbers + Ellipsis (อยู่ตรงกลาง) */}
      <div className="flex items-center gap-3">
        {pages.map((p, i) =>
          typeof p === "string" ? (
            <span
              key={`dots-${i}`}
              className="text-muted-foreground select-none"
            >
              {p}
            </span>
          ) : (
            <button
              key={p}
              onClick={() => table.setPageIndex(p - 1)}
              aria-current={p === curr ? "page" : undefined}
              className={cn(
                "h-9 w-9 rounded-md text-sm font-medium transition-colors",
                p === curr
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p}
            </button>
          )
        )}
      </div>

      {/* Next */}
      <Button
        variant="outline"
        className="h-9 px-3 gap-2"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        <span className="font-semibold">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
