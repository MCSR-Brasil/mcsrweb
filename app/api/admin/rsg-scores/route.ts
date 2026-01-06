import { NextResponse } from "next/server";

export async function GET(req: Request) {
  void req;
  return NextResponse.json(
    {
      error: "Deprecated endpoint. RSG ranking is derived from runs; admin does not manage RSG scores directly.",
    },
    { status: 410 }
  );
}

export async function POST(req: Request) {
  void req;
  return NextResponse.json(
    {
      error: "Deprecated endpoint. RSG ranking is derived from runs; admin does not manage RSG scores directly.",
    },
    { status: 410 }
  );
}

export async function DELETE(req: Request) {
  void req;
  return NextResponse.json(
    {
      error: "Deprecated endpoint. RSG ranking is derived from runs; admin does not manage RSG scores directly.",
    },
    { status: 410 }
  );
}
