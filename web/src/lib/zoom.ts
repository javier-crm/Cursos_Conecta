import "server-only";

// Integración con Zoom vía Server-to-Server OAuth.
// En marketplace.zoom.us crea una app "Server-to-Server OAuth" con los scopes:
// meeting:write:admin, meeting:read:admin, cloud_recording:read:admin.

export const zoomConfigured = Boolean(
  process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET,
);

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;

  const auth = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`,
  ).toString("base64");
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    { method: "POST", headers: { Authorization: `Basic ${auth}` } },
  );
  if (!res.ok) throw new Error(`Zoom OAuth ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export type ZoomMeeting = { id: string; join_url: string };

export async function createMeeting(input: {
  topic: string;
  startsAt: Date;
  durationMinutes: number;
}): Promise<ZoomMeeting> {
  const token = await getAccessToken();
  const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: input.topic,
      type: 2, // reunión programada
      start_time: input.startsAt.toISOString(),
      duration: input.durationMinutes,
      timezone: "America/Monterrey",
      settings: {
        join_before_host: false,
        waiting_room: true,
        auto_recording: "cloud",
        approval_type: 2,
        mute_upon_entry: true,
      },
    }),
  });
  if (!res.ok) throw new Error(`Zoom ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { id: number; join_url: string };
  return { id: String(data.id), join_url: data.join_url };
}
