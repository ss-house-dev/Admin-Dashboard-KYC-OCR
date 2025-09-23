"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value?: string;                   
  placeholder?: string;
  className?: string;
  onChangeValue?: (val: string) => void; 
  onSearch: (value: string) => void;
};

export function SearchView({
  value = "",
  placeholder = "Search...",
  className,
  onChangeValue,
  onSearch,
}: Props) {
  const doSearch = () => onSearch(value.trim());

  return (
    <div className={cn("relative", className)}>
      <Input
        value={value}
        onChange={(e) => onChangeValue?.(e.target.value)} 
        placeholder={placeholder}
        className={cn(
          "h-10 pl-4 pr-12 rounded-lg",
          "text-[#666666] border-[#E5E7EB]"
        )}
        onKeyDown={(e) => e.key === "Enter" && doSearch()}
      />
      <Button
        type="button"
        onClick={doSearch}
        className={cn(
          "absolute right-1.5 top-1/2 -translate-y-1/2",
          "h-8 w-8 rounded-lg p-0 shadow",
          "bg-[#246BEC] text-white hover:bg-blue-600/90"
        )}
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
}