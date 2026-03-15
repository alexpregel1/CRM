import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
    return await updateSession(request);
}

export const config = {
    matcher: [
        /*
         * Match all request paths EXCEPT:
         * - _next/static / _next/image (Next.js internals)
         * - favicon.ico + static assets
         * - /login (login page itself — handled inside updateSession)
         * - /api/google/* (Google OAuth flow must work without a session)
         * - /api/dj-disponibilidad (public form endpoint, no auth required)
         * - /disponibilidad* (public DJ availability HTML form)
         */
        "/((?!_next/static|_next/image|favicon.ico|login|api/google|api/dj-disponibilidad|disponibilidad|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
