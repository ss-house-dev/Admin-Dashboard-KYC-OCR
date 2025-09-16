import React from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Kycrequest } from "./column";

type KycDetailSheetProps = {
  data: Kycrequest
}

export default function SidebarView({ data }: KycDetailSheetProps) {
  return (
    <Sheet>
      <SheetTrigger className="text-blue-600 hover:underline">
        View
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Details</SheetTitle>
          <SheetDescription>
            Transaction No: {data.transactionNo} <br />
            Name: {data.name} <br />
            Email: {data.email} <br />
            Status: {data.status}
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
