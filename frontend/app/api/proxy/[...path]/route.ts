import { NextRequest, NextResponse } from "next/server";

const API_URL = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080"
).replace(/\/$/, "");

async function forward(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join("/");
  const target = `${API_URL}/${path}${request.nextUrl.search}`;

  const headers = new Headers();
  const accept = request.headers.get("accept");
  if (accept) headers.set("Accept", accept);

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store"
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(target, init);
  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) responseHeaders.set("Content-Type", upstreamType);

  const disposition = upstream.headers.get("content-disposition");
  if (disposition) responseHeaders.set("Content-Disposition", disposition);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;

  if (!path?.length) {
    return NextResponse.json({ message: "Missing proxy path" }, { status: 400 });
  }

  try {
    return await forward(request, path);
  } catch {
    return NextResponse.json(
      {
        message:
          "Backend unreachable. Set API_URL or NEXT_PUBLIC_API_URL on Vercel to your Render API URL."
      },
      { status: 502 }
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
