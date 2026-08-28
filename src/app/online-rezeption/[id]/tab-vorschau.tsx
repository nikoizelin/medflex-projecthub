"use client";

import { useState } from "react";
import { RefreshCw, ExternalLink, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TabVorschau({ slug }: { slug: string }) {
  const widgetUrl = `/widget/${slug}`;
  const [key, setKey] = useState(0);
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          So sieht das Widget auf einer Website aus.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            <button
              onClick={() => setMode("desktop")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors ${
                mode === "desktop"
                  ? "bg-background text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Monitor className="size-3.5" />
              Desktop
            </button>
            <button
              onClick={() => setMode("mobile")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors border-l ${
                mode === "mobile"
                  ? "bg-background text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Smartphone className="size-3.5" />
              Mobile
            </button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setKey((k) => k + 1)}
            className="h-7 gap-1.5 px-2.5 text-xs"
          >
            <RefreshCw className="size-3.5" />
            Neu laden
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(widgetUrl, "_blank")}
            className="h-7 gap-1.5 px-2.5 text-xs"
          >
            <ExternalLink className="size-3.5" />
            Vollbild
          </Button>
        </div>
      </div>

      {/* Browser Chrome */}
      <div className="overflow-hidden rounded-xl border shadow-sm">
        {/* Fake browser bar */}
        <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-red-400" />
            <div className="size-2.5 rounded-full bg-yellow-400" />
            <div className="size-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
            www.beispiel-praxis.ch
          </div>
        </div>

        {/* Fake website + widget iframe */}
        <div
          className="relative bg-gray-50 transition-all"
          style={{
            height: mode === "desktop" ? 520 : 640,
            width: "100%",
          }}
        >
          {/* Fake website content */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="h-12 bg-white border-b px-6 flex items-center gap-4">
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="flex gap-3 ml-auto">
                <div className="h-3 w-12 rounded bg-gray-200" />
                <div className="h-3 w-12 rounded bg-gray-200" />
                <div className="h-3 w-12 rounded bg-gray-200" />
              </div>
            </div>
            <div className="px-8 pt-8 space-y-4">
              <div className="h-6 w-64 rounded bg-gray-200" />
              <div className="h-3 w-96 rounded bg-gray-200" />
              <div className="h-3 w-80 rounded bg-gray-200" />
              <div className="mt-6 grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 rounded-lg bg-gray-200" />
                ))}
              </div>
              <div className="space-y-2 pt-4">
                <div className="h-3 w-full rounded bg-gray-200" />
                <div className="h-3 w-5/6 rounded bg-gray-200" />
                <div className="h-3 w-4/6 rounded bg-gray-200" />
              </div>
            </div>
          </div>

          {/* Widget iframe — transparent, full-size, pointer-events passthrough */}
          <iframe
            key={key}
            src={widgetUrl}
            title="Widget Vorschau"
            allow="microphone"
            className="absolute inset-0 size-full border-none"
            style={{
              background: "transparent",
              pointerEvents: "auto",
            }}
          />
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="text-xs font-medium">Einbindungs-Code</p>
        <code className="mt-1.5 block rounded bg-background px-3 py-2 text-xs text-muted-foreground">
          {`<script src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js?id=${slug}"></script>`}
        </code>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Diesen Code vor dem schliessenden <code className="rounded bg-muted px-1">&lt;/body&gt;</code>-Tag der Ziel-Website einfügen.
        </p>
      </div>
    </div>
  );
}
