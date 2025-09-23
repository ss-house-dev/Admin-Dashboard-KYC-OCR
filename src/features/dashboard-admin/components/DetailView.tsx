"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Kycrequest } from "../components/column";
import { cn } from "@/lib/utils";
import type { KycRequestApi } from "../types/kyc";
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
  data: KycRequestApi | null;
  className?: string;
}) {
  if (!open) return null;
  return (
    <aside
      className={cn("border-l bg-background h-full overflow-auto", className)}
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
                {data.correlationId}
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>{" "}
                {data.email}
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>{" "}
                {data.status}
              </div>
              <div>
                <span className="text-muted-foreground">ID Number:</span>{" "}
                {data.idcardEdit?.idNumber}
              </div>
              <div>
                <span className="text-muted-foreground">Bookbank Account:</span>{" "}
                {data.bookbankOrigin?.accountNo}
              </div>
              <div>
                <span className="text-muted-foreground">
                  Match ID Card % (TH):
                </span>{" "}
                {data.idcardThaiNameMatchPercent ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">
                  Match ID Card % (EN):
                </span>{" "}
                {data.idcardEnglishNameMatchPercent ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">
                  Match Book Bank % (TH):
                </span>{" "}
                {data.bookbankThaiNameMatchPercent ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">
                  Match Book Bank % (EN):
                </span>{" "}
                {data.bookbankEnglishNameMatchPercent ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">
                  Match ID Card with Book Bank % (TH):
                </span>{" "}
                {data.crossThaiNameMatchPercent ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">
                  Match ID Card with Book Bank % (EN):
                </span>{" "}
                {data.crossEnglishNameMatchPercent ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">Title (TH):</span>{" "}
                {data.idcardEdit.titleNameThai ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">
                  Name ID Card Origin (TH):
                </span>{" "}
                {data.idcardOrigin.firstNameThai ?? "-"}{" "}
                {data.idcardOrigin.lastNameThai ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">
                  Name ID Card Origin (EN):
                </span>{" "}
                {data.idcardOrigin.firstNameEng ?? "-"}{" "}
                {data.idcardOrigin.lastNameEng ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">
                  Name ID Card Edit (TH):
                </span>{" "}
                {data.idcardEdit.firstNameThai ?? "-"}{" "}
                {data.idcardEdit.lastNameThai ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">
                  Name ID Card Edit (EN):
                </span>{" "}
                {data.idcardEdit.firstNameEng ?? "-"}{" "}
                {data.idcardEdit.lastNameEng ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">Date of Birth:</span>{" "}
                {data.idcardEdit.dateOfBirth ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">Date of Expiry:</span>{" "}
                {data.idcardEdit.dateOfExpiry ?? "-"}
              </div>

              <div>
                <span className="text-muted-foreground">
                  Name Book Bank Origin (TH):
                </span>{" "}
                {data.bookbankOrigin.accountNameThai ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">
                  Name Book Bank Origin (EN):
                </span>{" "}
                {data.bookbankOrigin.accountNameEng ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">
                  Name Book Bank Edit (TH):
                </span>{" "}
                {data.bookbankEdit.accountNameThai ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">
                  Name Book Bank Edit (EN):
                </span>{" "}
                {data.bookbankEdit.accountNameEng ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">bankName:</span>{" "}
                {data.bookbankEdit.bankName ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">branchNam:</span>{" "}
                {data.bookbankEdit.branchName ?? "-"}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No selection</p>
          )}
        </ScrollArea>
      </div>
    </aside>
  );
}
