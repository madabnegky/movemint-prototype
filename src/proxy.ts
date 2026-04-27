import { NextRequest, NextResponse } from "next/server";

// HTTP Basic Auth gate for /admin/pricing-model.
//
// Why this approach: it's the simplest server-side password gate that hides
// the password from the JS bundle. The browser handles the credential prompt
// natively and remembers the answer for the session.
//
// Local dev: skipped, so `npm run dev` is always open. Production: requires
// the ADMIN_PASSWORD env var to match. Username is fixed to "movemint".
//
// File is named proxy.ts — the Next.js 16+ rename of middleware.ts. Same
// behavior, runs at the edge.

const REALM = "Movemint Pricing Model";
const USERNAME = "movemint";

export function proxy(req: NextRequest) {
  // Skip in local development for ergonomics.
  if (process.env.NODE_ENV !== "production") return NextResponse.next();

  const expected = process.env.ADMIN_PASSWORD;
  // Fail closed: if no password is configured in production, deny access.
  if (!expected) {
    return new NextResponse("Pricing model is not configured. Set ADMIN_PASSWORD env var.", {
      status: 503,
    });
  }

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = atob(header.slice("Basic ".length));
    const [user, ...passParts] = decoded.split(":");
    const pass = passParts.join(":"); // passwords may contain colons
    if (user === USERNAME && pass === expected) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${REALM}"` },
  });
}

export const config = {
  matcher: ["/admin/pricing-model/:path*"],
};
