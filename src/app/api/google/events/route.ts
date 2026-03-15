import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getOAuth2Client, TARGET_CALENDAR_ID } from "@/lib/google";
import { detectarDJs, detectarPacks } from "@/lib/djs";

export async function GET(request: NextRequest) {
    const accessToken = request.cookies.get("google_access_token")?.value;
    const refreshToken = request.cookies.get("google_refresh_token")?.value;

    if (!accessToken) {
        return NextResponse.json({ error: "Not authenticated", authUrl: "/api/google/auth" }, { status: 401 });
    }

    try {
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken || undefined,
        });

        oauth2Client.on("tokens", (tokens) => {
            if (tokens.access_token) {
                oauth2Client.setCredentials(tokens);
            }
        });

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const twelveMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 12, 0);

        const eventsResponse = await calendar.events.list({
            calendarId: TARGET_CALENDAR_ID,
            timeMin: threeMonthsAgo.toISOString(),
            timeMax: twelveMonthsFromNow.toISOString(),
            singleEvents: true,
            orderBy: "startTime",
            maxResults: 250,
        });

        const events = (eventsResponse.data.items || []).map((event) => {
            const start = event.start?.dateTime || event.start?.date || "";
            const end = event.end?.dateTime || event.end?.date || "";
            const startDate = new Date(start);
            const endDate = new Date(end);

            return {
                id: event.id || "",
                titulo: event.summary || "Sin título",
                descripcion: event.description || "",
                fecha: startDate.toISOString().split("T")[0],
                hora_inicio: event.start?.dateTime
                    ? startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false })
                    : "Todo el día",
                hora_fin: event.end?.dateTime
                    ? endDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false })
                    : "",
                ubicacion: event.location || "",
                status: event.status === "confirmed" ? "confirmado"
                    : event.status === "tentative" ? "tentativo"
                        : "confirmado",
                googleLink: event.htmlLink || "",
                colorId: event.colorId || null,
                attendees: (event.attendees || []).map(a => ({ email: a.email || "", displayName: a.displayName || "", responseStatus: a.responseStatus || "" })),
                organizer: event.organizer ? { email: event.organizer.email || "", displayName: event.organizer.displayName || "" } : null,
                esRecurrente: !!(event.recurringEventId || event.recurrence?.length),
                djs_detectados: detectarDJs((event.summary || "") + " " + (event.description || "")),
                packs_detectados: detectarPacks((event.summary || "") + " " + (event.description || ""))
            };
        });

        const response = NextResponse.json({ events, calendarId: TARGET_CALENDAR_ID });

        const currentCredentials = oauth2Client.credentials;
        if (currentCredentials.access_token && currentCredentials.access_token !== accessToken) {
            response.cookies.set("google_access_token", currentCredentials.access_token, {
                httpOnly: true, secure: false, path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax",
            });
        }

        return response;

    } catch (error: unknown) {
        console.error("Google Calendar API error:", error);
        const err = error as { code?: number };
        if (err.code === 401) {
            const response = NextResponse.json({ error: "Token expired", authUrl: "/api/google/auth" }, { status: 401 });
            response.cookies.delete("google_access_token");
            response.cookies.delete("google_refresh_token");
            response.cookies.delete("google_token_expiry");
            return response;
        }
        return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }
}
