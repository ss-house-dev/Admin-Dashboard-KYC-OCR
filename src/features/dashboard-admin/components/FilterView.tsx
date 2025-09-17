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
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

const fmtDisplay = (d?: Date) => (d ? d.toLocaleDateString() : undefined);

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

  return (
    <div className="mt-4 flex flex-wrap items-end gap-4">
      {/* Status */}
      <div className="flex flex-col">
        <label className="mb-1 text-xs text-gray-500">Status</label>
        <Select value={status} onValueChange={onChangeStatus}>
          <SelectTrigger className="h-10 w-[152px] rounded-md text-[#666666] border-[#E5E7EB]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="approved override">Approved Override</SelectItem>
            <SelectItem value="rejected override">Rejected Override</SelectItem>
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
            open={openEnd}
            onOpenChange={(o) => {
              setOpenEnd(o);
              if (o) setOpenStart(false);
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[152px] justify-between font-normal rounded-md text-[#666666] border-[#E5E7EB]"
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
        <Button variant="outline" onClick={onClear} className="h-10 w-[166px] rounded-md text-[#666666] border-[#9CA3AF]">
          Clear All filter
        </Button>
      </div>
    </div>
  );
}
