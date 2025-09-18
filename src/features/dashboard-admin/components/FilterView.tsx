"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectGroup,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
  status: string;
  start?: Date;
  end?: Date;
  onChangeStatus: (v: string) => void;
  onChangeStart: (d?: Date) => void;
  onChangeEnd: (d?: Date) => void;
  onApply: () => void;
  onClear: () => void;
};

const STATUS_COLOR: Record<string, string> = {
  all: "bg-gray-300",
  approved: "bg-[#10B981]",
  pending: "bg-[#F59E0B]",
  rejected: "bg-[#EF4444]",
  "approved override": "bg-[#10B981]",
  "rejected override": "bg-[#EF4444]",
};

const STATUS_LABEL: Record<string, string> = {
  all: "All Status",
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
  "approved override": "Approved Override",
  "rejected override": "Rejected Override",
};

function Dot({ color }: { color?: string }) {
  return (
    <span className={cn("h-2.5 w-2.5 rounded-full", color ?? "bg-gray-300")} />
  );
}

export function FilterView({
  status,
  start,
  end,
  onChangeStatus,
  onChangeStart,
  onChangeEnd,
  onApply,
  onClear,
}: Props) {
  // ✅ เก็บเฉพาะ state "UI" ของ popover ภายใน component นี้
  const [openStart, setOpenStart] = React.useState(false);
  const [openEnd, setOpenEnd] = React.useState(false);

  const fmtDisplay = (d?: Date) => (d ? d.toLocaleDateString() : undefined);

  return (
    <div className="mt-4 flex flex-wrap items-end gap-4">
      {/* Status */}
      <div className="flex flex-col">
        <label className="mb-1 text-xs text-gray-500">Status</label>
        <Select value={status} onValueChange={onChangeStatus}>
          {/* 🔵 Trigger: แสดง dot + label แทน SelectValue */}
          <SelectTrigger className="h-10 w-4xs rounded-md border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              {status !== "all" && <Dot color={STATUS_COLOR[status]} />}
              <span>{STATUS_LABEL[status] ?? STATUS_LABEL.all}</span>
            </div>
          </SelectTrigger>

          <SelectContent>
            {/* All */}
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <span>{STATUS_LABEL.all}</span>
              </div>
            </SelectItem>

            <SelectGroup>
              <SelectLabel>STANDARD</SelectLabel>

              <SelectItem value="approved">
                <div className="flex items-center gap-2">
                  <Dot color={STATUS_COLOR.approved} />
                  <span>{STATUS_LABEL.approved}</span>
                </div>
              </SelectItem>

              <SelectItem value="pending">
                <div className="flex items-center gap-2">
                  <Dot color={STATUS_COLOR.pending} />
                  <span>{STATUS_LABEL.pending}</span>
                </div>
              </SelectItem>

              <SelectItem value="rejected">
                <div className="flex items-center gap-2">
                  <Dot color={STATUS_COLOR.rejected} />
                  <span>{STATUS_LABEL.rejected}</span>
                </div>
              </SelectItem>
            </SelectGroup>

            <SelectGroup>
              <SelectLabel>OVERRIDE</SelectLabel>

              <SelectItem value="approved override">
                <div className="flex items-center gap-2">
                  <Dot color={STATUS_COLOR["approved override"]} />
                  <span>{STATUS_LABEL["approved override"]}</span>
                </div>
              </SelectItem>

              <SelectItem value="rejected override">
                <div className="flex items-center gap-2">
                  <Dot color={STATUS_COLOR["rejected override"]} />
                  <span>{STATUS_LABEL["rejected override"]}</span>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div className="flex flex-col">
        <label className="mb-1 text-xs text-gray-500">Date Range</label>
        <div className="flex gap-3">
          {/* Start Date */}
          <Popover
            open={openStart}
            onOpenChange={(o) => {
              setOpenStart(o);
              if (o) setOpenEnd(false);
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[152px] justify-between font-normal rounded-md text-[#666666] border-[#E5E7EB]"
              >
                {fmtDisplay(start) ?? "Start Date"}
                <CalendarIcon className="ml-2 h-4 w-4 opacity-70" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="start"
            >
              <Calendar
                mode="single"
                captionLayout="dropdown"
                selected={start}
                onSelect={(d) => {
                  onChangeStart(d);
                  // ถ้าเลือก start > end ให้เคลียร์ end (กฎนี้อยู่ฝั่ง container จะดีกว่า แต่แถม safety ให้ด้วย)
                  if (d && end && d > end) onChangeEnd(undefined);
                  setOpenStart(false);
                }}
              />
            </PopoverContent>
          </Popover>

          {/* End Date */}
          <Popover
            open={!!start && openEnd}
            onOpenChange={(o) => {
              if (!start) return;
              setOpenEnd(o);
              if (o) setOpenStart(false);
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[152px] justify-between font-normal rounded-md text-[#666666] border-[#E5E7EB]"
                disabled={!start}
              >
                {fmtDisplay(end) ?? "End Date"}
                <CalendarIcon className="ml-2 h-4 w-4 opacity-70" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="start"
            >
              <Calendar
                mode="single"
                captionLayout="dropdown"
                selected={end}
                onSelect={(d) => {
                  // ถ้าเลือก end < start ให้ขยับ start ตาม (หรือจะบล็อกก็ได้)
                  if (d && start && d < start) onChangeStart(d);
                  onChangeEnd(d);
                  setOpenEnd(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={onApply}
          className="h-10 w-[166px] rounded-md bg-blue-600 text-white hover:bg-blue-600/90"
        >
          Apply Filters
        </Button>
        <Button
          variant="outline"
          onClick={onClear}
          className="h-10 w-[166px] rounded-md text-[#666666] border-[#9CA3AF]"
        >
          Clear All filter
        </Button>
      </div>
    </div>
  );
}
