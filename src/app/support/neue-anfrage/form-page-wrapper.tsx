"use client";

import { useEffect } from "react";
import { Poppins } from "next/font/google";
import { ChangeRequestForm } from "./change-request-form";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"] });

export function FormPageWrapper() {
  // Einbettung per iframe: Höhe an die umgebende Seite melden, damit kein Scrollbalken entsteht
  useEffect(() => {
    if (window.parent === window) return;
    const send = () =>
      window.parent.postMessage(
        { type: "medflex-support-height", height: document.documentElement.scrollHeight },
        "*"
      );
    const observer = new ResizeObserver(send);
    observer.observe(document.body);
    send();
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`form-light-override ${poppins.className}`}
      style={
        {
          color: "#292e33",
          "--primary": "#064b91",
          "--primary-foreground": "#ffffff",
          "--ring": "#064b91",
        } as React.CSSProperties
      }
    >
      <div className="bg-white px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#064b91]">Änderungsanfrage</h1>
            <p className="mt-1 text-sm text-[#292e33]/70">
              Teilen Sie uns Ihr Anliegen zu Telefonassistent, MedFlex-App oder Ihre Wünsche mit.
              Wir melden uns in Kürze bei Ihnen.
            </p>
          </div>

          <ChangeRequestForm />
        </div>
      </div>
    </div>
  );
}
