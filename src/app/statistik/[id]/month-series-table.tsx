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

export interface SeriesColumn<T> {
  key: keyof T;
  label: string;
}

/** Eingabe für "X pro Monat"-Tabellen mit Monat + mehreren Zahlenspalten (Status, Kanal, ...). */
export function MonthSeriesTable<T extends { month: string } & Record<string, string | number>>({
  rows,
  onChange,
  columns,
  emptyRow,
}: {
  rows: T[];
  onChange: (rows: T[]) => void;
  columns: SeriesColumn<T>[];
  emptyRow: T;
}) {
  const update = (i: number, patch: Partial<T>) => {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Monat</TableHead>
            {columns.map((c) => (
              <TableHead key={String(c.key)} className="w-24">
                {c.label}
              </TableHead>
            ))}
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              <TableCell>
                <Input
                  value={row.month as string}
                  onChange={(e) => update(i, { month: e.target.value } as Partial<T>)}
                  placeholder="Monat"
                  className="h-8"
                />
              </TableCell>
              {columns.map((c) => (
                <TableCell key={String(c.key)}>
                  <Input
                    type="number"
                    value={row[c.key] as number}
                    onChange={(e) =>
                      update(i, { [c.key]: Number(e.target.value) } as Partial<T>)
                    }
                    className="h-8"
                  />
                </TableCell>
              ))}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="border-t p-1.5">
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange([...rows, emptyRow])}>
          <Plus className="size-3.5" />
          Zeile hinzufügen
        </Button>
      </div>
    </div>
  );
}
