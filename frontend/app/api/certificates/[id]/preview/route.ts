import { NextRequest, NextResponse } from "next/server";

const API_URL = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080"
).replace(/\/$/, "");

async function fetchCertificateFromBackend(id: string) {
  const endpoints = [
    `${API_URL}/api/certificates/${id}/preview`,
    `${API_URL}/api/certificates/${id}`
  ];

  let lastResponse: Response | null = null;

  for (const url of endpoints) {
    const response = await fetch(url, { cache: "no-store" });
    lastResponse = response;
    if (response.ok) return response;
    if (response.status !== 404) return response;
  }

  return lastResponse;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Invalid certificate id" }, { status: 400 });
  }

  try {
    const upstream = await fetchCertificateFromBackend(id);
    if (!upstream) {
      return NextResponse.json({ message: "Certificate not found" }, { status: 404 });
    }

    if (!upstream.ok) {
      const message = (await upstream.text().catch(() => "")).trim() || upstream.statusText;
      return NextResponse.json(
        { message: message || "Certificate could not be loaded" },
        { status: upstream.status }
      );
    }

    const bytes = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") ?? "application/pdf";
    const disposition = upstream.headers.get("content-disposition");
    const inlineDisposition =
      disposition?.replace(/^attachment/i, "inline") ??
      'inline; filename="document.pdf"';

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType.includes("pdf") ? "application/pdf" : contentType,
        "Content-Disposition": inlineDisposition,
        "Cache-Control": "private, max-age=60"
      }
    });
  } catch {
    return NextResponse.json(
      { message: "Could not reach the file server. Check API configuration." },
      { status: 502 }
    );
  }
}
