"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export default function DetailView({
  open,
  onClose,
  width = 360,
  data,
  className,
}: {
  open: boolean;
  onClose: () => void;
  width?: number;
  data: any;
  className?: string;
}) {
  if (!open) return null; // ซ่อนไปเลยเมื่อปิด (กริดจะเหลือ 1 คอลัมน์)
  return (
    <aside
      className={cn(
        // อยู่ใน flow ของกริดคอลัมน์ขวา
        "border-l bg-background h-full overflow-auto",
        className
      )}
      style={{ width }}
      aria-hidden={!open}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-4">
          <h2 className="font-semibold">Application Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4 text-[#9CA3AF]" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100%-57px)] p-4">
          {data ? (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Transaction:</span>{" "}
                {data.transactionNo}
              </div>
              <div>
                <span className="text-muted-foreground">Name:</span> {data.name}
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>{" "}
                {data.email}
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>{" "}
                {data.status}
              </div>
              {/* เติม field เพิ่มได้ */}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No selection</p>
          )}
        </ScrollArea>
      </div>
    </aside>
  );
}
