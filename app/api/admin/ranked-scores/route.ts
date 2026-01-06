import { NextResponse } from "next/server";

export async function GET(req: Request) {
  void req;
  return NextResponse.json(
    {
      error: "Deprecated endpoint. Ranked scores are not managed in admin; they will be fetched from a third-party API later.",
    },
    { status: 410 }
  );
}

export async function POST(req: Request) {
  void req;
  return NextResponse.json(
    {
      error: "Deprecated endpoint. Ranked scores are not managed in admin; they will be fetched from a third-party API later.",
    },
    { status: 410 }
  );
}

export async function DELETE(req: Request) {
  void req;
  return NextResponse.json(
    {
      error: "Deprecated endpoint. Ranked scores are not managed in admin; they will be fetched from a third-party API later.",
    },
    { status: 410 }
  );
}
