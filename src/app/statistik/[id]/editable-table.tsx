"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LabelValue } from "@/lib/stat-report";

/** Tabellen-Eingabe für ein Diagramm: feste Zeilen (Label gesperrt), feste Anzahl Zeilen (Label editierbar) oder frei erweiterbar. */
export function EditableTable({
  rows,
  onChange,
  labelHeader,
  valueHeader,
  fixedLabels,
  allowAddRemove = !fixedLabels,
  valueSuffix,
}: {
  rows: LabelValue[];
  onChange: (rows: LabelValue[]) => void;
  labelHeader: string;
  valueHeader: string;
  fixedLabels?: boolean;
  allowAddRemove?: boolean;
  valueSuffix?: string;
}) {
  const update = (i: number, patch: Partial<LabelValue>) => {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{labelHeader}</TableHead>
            <TableHead className="w-32">{valueHeader}</TableHead>
            {allowAddRemove && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              <TableCell>
                {fixedLabels ? (
                  <span className="text-sm">{row.label}</span>
                ) : (
                  <Input
                    value={row.label}
                    onChange={(e) => update(i, { label: e.target.value })}
                    placeholder="Bezeichnung"
                    className="h-8"
                  />
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="text"
                    value={row.value}
                    onChange={(e) => update(i, { value: Number(e.target.value) })}
                    className="h-8"
                  />
                  {valueSuffix && (
                    <span className="text-xs text-muted-foreground">{valueSuffix}</span>
                  )}
                </div>
              </TableCell>
              {allowAddRemove && (
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {allowAddRemove && (
        <div className="border-t p-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange([...rows, { label: "", value: 0 }])}
          >
            <Plus className="size-3.5" />
            Zeile hinzufügen
          </Button>
        </div>
      )}
    </div>
  );
}
