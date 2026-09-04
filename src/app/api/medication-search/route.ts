import { NextRequest, NextResponse } from "next/server";

type CompendiumProduct = { productNumber: number; description: string; hasChildDosage: boolean };
type CompendiumBrand = { description: string; products?: CompendiumProduct[] };
type CompendiumResult = { brands?: CompendiumBrand[] };

export type MedResult = { id: number; name: string };

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  try {
    const url = `https://compendium.ch/search/autocomplete?q=${encodeURIComponent(q)}&lang=de`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return NextResponse.json([]);

    const data = await res.json() as CompendiumResult;
    const results: MedResult[] = [];

    for (const brand of data.brands ?? []) {
      for (const product of brand.products ?? []) {
        if (product.description) {
          results.push({ id: product.productNumber, name: product.description });
        }
      }
    }

    return NextResponse.json(results.slice(0, 20));
  } catch {
    return NextResponse.json([]);
  }
}
