import { NextRequest } from "next/server";

// Validates the static bearer token Make sends.
export function authorizeMake(req: NextRequest): boolean {
  const header = req.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "");
  const expected = process.env.MAKE_API_TOKEN || "";
  return expected.length > 0 && token === expected;
}
