import { google } from "googleapis";

export function getOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
}

export const SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/gmail.readonly",
];

// ID directo del calendario "FECHAS DJ'S"
export const TARGET_CALENDAR_ID = "c_f790766d18a929bc588ac04a5d523515d22f0ad7194fba9fb3fcf6b8352afdc9@group.calendar.google.com";
