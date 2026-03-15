import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getOAuth2Client } from "@/lib/google";

export async function GET(request: NextRequest) {
    const accessToken = request.cookies.get("google_access_token")?.value;
    const refreshToken = request.cookies.get("google_refresh_token")?.value;

    if (!accessToken) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken || undefined,
        });

        const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
        const { data } = await oauth2.userinfo.get();

        return NextResponse.json({
            name: data.name || "",
            given_name: data.given_name || "",
            email: data.email || "",
            picture: data.picture || "",
        });
    } catch {
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}
