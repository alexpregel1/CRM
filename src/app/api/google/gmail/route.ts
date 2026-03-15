import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getOAuth2Client } from "@/lib/google";

function parseFrom(from: string): { name: string; email: string } {
    const match = from.match(/^"?([^"<]*)"?\s*<?([^>]*)>?$/);
    if (match) {
        const name = match[1].trim();
        const email = match[2].trim();
        return { name: name || email, email: email || name };
    }
    return { name: from, email: from };
}

export async function GET(request: NextRequest) {
    const accessToken = request.cookies.get("google_access_token")?.value;
    const refreshToken = request.cookies.get("google_refresh_token")?.value;

    if (!accessToken) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken || undefined });

        const gmail = google.gmail({ version: "v1", auth: oauth2Client });
        const list = await gmail.users.messages.list({ userId: "me", labelIds: ["INBOX"], maxResults: 8 });
        const messages = list.data.messages || [];

        const emails = await Promise.all(
            messages.map(async (msg) => {
                const detail = await gmail.users.messages.get({
                    userId: "me",
                    id: msg.id!,
                    format: "metadata",
                    metadataHeaders: ["From", "Subject", "Date"],
                });
                const headers = detail.data.payload?.headers || [];
                const get = (name: string) => headers.find(h => h.name === name)?.value || "";
                const { name, email } = parseFrom(get("From"));
                return {
                    id: msg.id,
                    subject: get("Subject") || "(Sin asunto)",
                    from_name: name,
                    from_email: email,
                    date: get("Date"),
                    snippet: detail.data.snippet || "",
                };
            })
        );

        return NextResponse.json({ emails });
    } catch {
        return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
    }
}
