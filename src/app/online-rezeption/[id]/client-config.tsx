"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TabAllgemein } from "./tab-allgemein";
import { TabStandorte } from "./tab-standorte";
import { TabStartseite } from "./tab-startseite";
import { TabFormular } from "./tab-formular";
import { TabChat } from "./tab-chat";
import { TabVorschau } from "./tab-vorschau";
import type { FormType } from "@/lib/reception-form-templates";

export interface ClientData {
  id: string;
  name: string;
  slug: string;
  logoPath: string;
  widgetTitle: string;
  widgetSubtitle: string;
  accentColor: string;
  defaultCountryCode: string;
  elevenLabsAgentId: string;
  privacyPolicyText: string;
  privacyPolicyUrl: string;
  qa1Label: string; qa1Target: string;
  qa2Label: string; qa2Target: string;
  qa3Label: string; qa3Target: string;
  fachrichtung: string;
  introText: string;
  formSteps: FormType[];
  locations: {
    id: string; name: string; address: string; phone: string;
    openingHoursText: string; isDefault: boolean; order: number;
    openingHours: {
      id: string; dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean; note: string;
    }[];
  }[];
  news: { id: string; title: string; body: string; order: number }[];
}

const TABS = [
  { value: "allgemein",  label: "Allgemein" },
  { value: "standorte",  label: "Standorte" },
  { value: "startseite", label: "Startseite" },
  { value: "formular",   label: "Formular" },
  { value: "chat",       label: "Chat" },
  { value: "vorschau",   label: "Vorschau" },
];

export function ClientConfig({ client }: { client: ClientData }) {
  return (
    <Tabs defaultValue="allgemein">
      <TabsList className="mb-4 w-full justify-start" variant="line">
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="allgemein">
        <TabAllgemein client={client} />
      </TabsContent>
      <TabsContent value="standorte">
        <TabStandorte client={client} />
      </TabsContent>
      <TabsContent value="startseite">
        <TabStartseite client={client} />
      </TabsContent>
      <TabsContent value="formular">
        <TabFormular client={client} />
      </TabsContent>
      <TabsContent value="chat">
        <TabChat client={client} />
      </TabsContent>
      <TabsContent value="vorschau">
        <TabVorschau slug={client.slug} />
      </TabsContent>
    </Tabs>
  );
}
