"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

type StatusType =
  | "Approved"
  | "Pending"
  | "Rejected"
  | "Approved Override"
  | "Rejected Override";

const StatusBadge = ({ status }: { status: StatusType }) => {
  const statusColors: Record<StatusType, string> = {
    Approved: "bg-green-100 text-green-700 border-[#6DFB9E] hover:bg-green-100",
    Pending:
      "bg-yellow-100 text-yellow-700 border-[#FEED3D] hover:bg-yellow-100",
    Rejected: "bg-red-100 text-red-700 border-[#FF9191] hover:bg-red-100",
    "Approved Override":
      "bg-green-100 text-green-700 border-[#6DFB9E] hover:bg-green-100",
    "Rejected Override":
      "bg-red-100 text-red-700 border-[#FF9191] hover:bg-red-100",
  };

  const statusClass = statusColors[status] || "bg-gray-100 text-gray-700";

  return (
    <Badge variant="outline" className={`font-normal ${statusClass}`}>
      {status}
    </Badge>
  );
};

export function columns(
  onView: (row: Kycrequest) => void
): ColumnDef<Kycrequest>[] {
  return [
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
      cell: ({ row }) => (
        <Button
          className="text-[#414651]"
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onView(row.original);
          }}
        >
          View Detail
        </Button>
      ),
    },
  ];
}
