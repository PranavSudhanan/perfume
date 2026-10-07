import "server-only";

/**
 * Text messages go through one of two providers, chosen by which keys are set
 * (or by SMS_PROVIDER when both are):
 *   - Fast2SMS — Indian mobile numbers, using its "Quick SMS" route.
 *   - Twilio   — any country.
 */
export type SmsProvider = "fast2sms" | "twilio";

const TIMEOUT_MS = 8_000;

function configured(provider: SmsProvider) {
  if (provider === "fast2sms") return Boolean(process.env.FAST2SMS_API_KEY);
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM,
  );
}

export function smsProvider(): SmsProvider | null {
  const chosen = process.env.SMS_PROVIDER?.trim().toLowerCase();
  if (chosen === "fast2sms" || chosen === "twilio") return configured(chosen) ? chosen : null;
  if (configured("fast2sms")) return "fast2sms";
  if (configured("twilio")) return "twilio";
  return null;
}

/**
 * Normalises what a customer typed ("090000 11111", "+91 90000-11111") to
 * E.164. Numbers without a country code get SMS_COUNTRY_CODE (default 91, India).
 */
export function toE164(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+")) return `+${digits}`;
  const countryCode = (process.env.SMS_COUNTRY_CODE ?? "91").replace(/\D/g, "") || "91";
  const national = digits.replace(/^0+/, "");
  return national.length > 10 && national.startsWith(countryCode)
    ? `+${national}`
    : `+${countryCode}${national}`;
}

async function viaFast2Sms(to: string, body: string) {
  const match = /^\+91(\d{10})$/.exec(to);
  if (!match) throw new Error("Fast2SMS only delivers to Indian mobile numbers.");
  const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: process.env.FAST2SMS_API_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      route: "q",
      message: body,
      // Anything outside basic Latin has to be sent as a Unicode message.
      language: /[^\x20-\x7E\n]/.test(body) ? "unicode" : "english",
      numbers: match[1],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as {
    return?: boolean;
    message?: string | string[];
  } | null;
  if (!response.ok || data?.return !== true) {
    const reason = Array.isArray(data?.message) ? data.message.join(" ") : data?.message;
    throw new Error(`Fast2SMS refused the message: ${reason ?? `HTTP ${response.status}`}`);
  }
}

async function viaTwilio(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID ?? "";
  const from = (process.env.TWILIO_FROM ?? "").trim();
  const form = new URLSearchParams({ To: to, Body: body });
  // TWILIO_FROM is either a phone number or a Messaging Service id ("MG…").
  form.set(from.startsWith("MG") ? "MessagingServiceSid" : "From", from);
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN ?? ""}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(`Twilio refused the message: ${data?.message ?? `HTTP ${response.status}`}`);
  }
}

/** Sends one text message. Throws if no provider is set up or the provider refuses it. */
export async function sendSms(phone: string, body: string) {
  const provider = smsProvider();
  if (!provider) throw new Error("No SMS provider is set up.");
  const to = toE164(phone);
  if (provider === "fast2sms") await viaFast2Sms(to, body);
  else await viaTwilio(to, body);
}
