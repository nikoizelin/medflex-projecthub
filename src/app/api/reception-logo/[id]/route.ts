import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const client = await prisma.receptionClient.findUnique({
    where: { id },
    select: { logoPath: true },
  });

  if (!client?.logoPath) {
    return new NextResponse(null, { status: 404 });
  }

  // If already a proxy URL (loop protection) or empty, 404
  if (!client.logoPath.startsWith("http")) {
    return new NextResponse(null, { status: 404 });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  // Extract file path from the stored Supabase public URL
  // Format: https://xxx.supabase.co/storage/v1/object/public/reception-assets/logos/xxx.ext
  const urlObj = new URL(client.logoPath);
  const pathParts = urlObj.pathname.split("/storage/v1/object/public/reception-assets/");
  const filePath = pathParts[1];

  if (!filePath) {
    return new NextResponse(null, { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from("reception-assets")
    .download(filePath);

  if (error || !data) {
    console.error("Logo proxy download failed:", error?.message);
    return new NextResponse(null, { status: 502 });
  }

  const buffer = await data.arrayBuffer();
  const contentType = data.type || "image/png";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
