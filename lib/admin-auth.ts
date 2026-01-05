import { NextResponse } from "next/server";

function getProvidedSecret(req: Request): string {
  const header = req.headers.get("authorization");
  if (header && header.toLowerCase().startsWith("bearer ")) {
    return header.slice("bearer ".length).trim();
  }
  return (req.headers.get("x-admin-secret") ?? "").trim();
}

export function requireAdmin(req: Request): NextResponse | null {
  const expected = (process.env.ADMIN_SECRET ?? "").trim();
  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_SECRET is not configured" },
      { status: 500 }
    );
  }

  const provided = getProvidedSecret(req);
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
