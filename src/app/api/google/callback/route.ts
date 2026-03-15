import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client } from "@/lib/google";

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    if (!code) {
        return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    try {
        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);

        // Build the redirect response
        const redirectUrl = new URL("/crm/calendario", request.url);
        const response = NextResponse.redirect(redirectUrl);

        // Store tokens in httpOnly cookies
        const cookieOptions = {
            httpOnly: true,
            secure: false, // localhost
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            sameSite: "lax" as const,
        };

        if (tokens.access_token) {
            response.cookies.set("google_access_token", tokens.access_token, cookieOptions);
        }
        if (tokens.refresh_token) {
            response.cookies.set("google_refresh_token", tokens.refresh_token, cookieOptions);
        }
        if (tokens.expiry_date) {
            response.cookies.set("google_token_expiry", String(tokens.expiry_date), cookieOptions);
        }

        return response;
    } catch (error) {
        console.error("Google OAuth callback error:", error);
        return NextResponse.json({ error: "Failed to exchange code for tokens" }, { status: 500 });
    }
}
