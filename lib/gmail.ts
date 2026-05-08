import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { prisma } from "@/lib/db";

const GOOGLE_PROVIDER = "google";

function getOAuthClient(): OAuth2Client {
  const clientId = process.env.AUTH_GOOGLE_ID ?? "";
  const clientSecret = process.env.AUTH_GOOGLE_SECRET ?? "";
  if (!clientId || !clientSecret) {
    throw new Error("Missing AUTH_GOOGLE_ID or AUTH_GOOGLE_SECRET");
  }
  return new OAuth2Client(clientId, clientSecret);
}

function tokenExpired(expiresAtSeconds: number | null | undefined): boolean {
  if (expiresAtSeconds == null) return true;
  const ms = expiresAtSeconds * 1000;
  return ms < Date.now() + 60_000;
}

/**
 * Returns a valid Gmail access token for the user's Google Account row,
 * refreshing and persisting tokens when needed.
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: GOOGLE_PROVIDER },
  });
  if (!account) {
    throw new Error("No Google account linked. Sign in with Google.");
  }
  if (!account.refresh_token && !account.access_token) {
    throw new Error("Google account has no tokens. Re-connect Google with consent.");
  }

  const oauth2 = getOAuthClient();
  oauth2.setCredentials({
    access_token: account.access_token ?? undefined,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at != null ? account.expires_at * 1000 : undefined,
  });

  const needsRefresh =
    tokenExpired(account.expires_at) || !account.access_token;

  if (needsRefresh) {
    if (!account.refresh_token) {
      throw new Error("Access token expired and no refresh token stored. Sign in again with Google.");
    }
    const { credentials } = await oauth2.refreshAccessToken();
    const expiresAtSec =
      credentials.expiry_date != null
        ? Math.floor(credentials.expiry_date / 1000)
        : null;

    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: credentials.access_token ?? account.access_token,
        refresh_token: credentials.refresh_token ?? account.refresh_token,
        expires_at: expiresAtSec,
        token_type: credentials.token_type ?? account.token_type,
      },
    });

    oauth2.setCredentials({
      ...credentials,
      refresh_token: credentials.refresh_token ?? account.refresh_token,
    });
  }

  const token = oauth2.credentials.access_token ?? account.access_token;
  if (!token) {
    throw new Error("Could not obtain Google access token");
  }
  return token;
}

function encodeSubjectLine(subject: string): string {
  if (/^[\x00-\x7f]*$/.test(subject)) return subject;
  const b64 = Buffer.from(subject, "utf8").toString("base64");
  return `=?UTF-8?B?${b64}?=`;
}

function escapeHeaderDisplayName(name: string): string {
  return name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function toRfc2822(params: {
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  body: string;
}): string {
  const subj = encodeSubjectLine(params.subject);
  const from = /^[\x00-\x7f]+$/.test(params.fromName)
    ? `${params.fromName} <${params.fromEmail}>`
    : `"${escapeHeaderDisplayName(params.fromName)}" <${params.fromEmail}>`;
  const body = params.body.replace(/\r?\n/g, "\r\n");
  return [
    `From: ${from}`,
    `To: ${params.to}`,
    `Subject: ${subj}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
  ].join("\r\n");
}

function toBase64Url(raw: string): string {
  return Buffer.from(raw, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export type SendEmailParams = {
  userId: string;
  to: string;
  subject: string;
  body: string;
  threadId?: string;
};

export async function sendEmail(
  params: SendEmailParams,
): Promise<{ messageId: string; threadId: string }> {
  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!user?.email) {
    throw new Error("Your profile has no email address for the From header.");
  }

  const fromName = (user.name ?? "").trim() || "Me";
  const rfc = toRfc2822({
    fromName,
    fromEmail: user.email,
    to: params.to.trim(),
    subject: params.subject,
    body: params.body,
  });

  const accessToken = await getValidAccessToken(params.userId);
  const oauth2 = getOAuthClient();
  oauth2.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2 });
  const raw = toBase64Url(rfc);

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
      ...(params.threadId ? { threadId: params.threadId } : {}),
    },
  });

  const messageId = res.data.id ?? "";
  const threadId = res.data.threadId ?? "";
  if (!messageId) {
    throw new Error("Gmail send returned no message id");
  }
  return { messageId, threadId };
}
