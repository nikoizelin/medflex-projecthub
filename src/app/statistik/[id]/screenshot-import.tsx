"use client";

import { useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ExtractedStats } from "@/lib/stat-report";

export function ScreenshotImport({ onImport }: { onImport: (data: ExtractedStats) => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const importNow = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/statistik/extract", { method: "POST", body: formData });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Extraktion fehlgeschlagen");
      onImport(body as ExtractedStats);
      toast.success("Daten aus Datei übernommen – bitte prüfen");
      setOpen(false);
      setFile(null);
      setPreview(null);
    } catch {
      toast.error("Extraktion fehlgeschlagen. Bitte Datei prüfen oder erneut versuchen.");
    } finally {
      setLoading(false);
    }
  };

  const isPdf = file?.type === "application/pdf";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setFile(null);
          setPreview(null);
        }
      }}
    >
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Upload className="size-4" />
        Datei importieren
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Statistik-Datei importieren</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Lade einen Screenshot oder ein PDF aus Elastic hoch. Erkannte Werte werden automatisch
          eingetragen und im Formular als &quot;bitte prüfen&quot; markiert.
        </p>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="text-sm"
        />
        {preview && isPdf && (
          <div className="flex items-center gap-2 rounded-md border p-2.5 text-sm">
            <FileText className="size-5 shrink-0 text-muted-foreground" />
            <span className="truncate">{file?.name}</span>
          </div>
        )}
        {preview && !isPdf && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Vorschau" className="max-h-48 w-full rounded-md border object-contain" />
        )}
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Abbrechen</DialogClose>
          <Button type="button" onClick={importNow} disabled={!file || loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {loading ? "Analysiere…" : "Importieren"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
