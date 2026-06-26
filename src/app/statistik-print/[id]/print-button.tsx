"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button type="button" onClick={() => window.print()} className="print:hidden">
      <Download className="size-4" />
      Speichern
    </Button>
  );
}
