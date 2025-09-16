"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import SidebarView from "./SidebarView";

export type Kycrequest = {
  transactionNo: string;
  name: string;
  email: string;
  submissionDate: string;
  submissionTime: string;
  status:
    | "Approved"
    | "Pending"
    | "Rejected"
    | "Approved Override"
    | "Rejected Override";
};

type StatusType = "Approved" | "Pending" | "Rejected" | "Approved Override" | "Rejected Override";

const StatusBadge = ({ status }: { status: StatusType }) => {
  const statusColors: Record<StatusType, string> = {
    "Approved": "bg-green-100 text-green-700 hover:bg-green-100",
    "Pending": "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    "Rejected": "bg-red-100 text-red-700 hover:bg-red-100",
    "Approved Override": "bg-green-100 text-green-700 hover:bg-green-100",
    "Rejected Override": "bg-red-100 text-red-700 hover:bg-red-100",
  };
  
  const statusClass = statusColors[status] || "bg-gray-100 text-gray-700";

  return (
    <Badge variant="outline" className={`border-none font-normal ${statusClass}`}>
      {status}
    </Badge>
  );
};

export const columns: ColumnDef<Kycrequest>[] = [
  {
    accessorKey: "transactionNo",
    header: "Transaction no.",
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const name = row.original.name;
      const email = row.original.email;

      return (
        <div className="flex flex-col">
          <span className="font-medium">{name}</span>
          <span className="text-sm text-muted-foreground">{email}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "submissionDate",
    header: "Submission Date",
    cell: ({ row }) => {
      const submissionDate = row.original.submissionDate;
      const submissionTime = row.original.submissionTime;

      return (
        <div className="flex flex-col">
          <span className="font-medium">{submissionDate}</span>
          <span className="text-sm text-muted-foreground">
            {submissionTime}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "detail", 
    header: "Detail",
    cell: ({ row }) => <SidebarView data={row.original} />,
  },
];
