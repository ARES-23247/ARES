import { Resend } from "resend";

/**
 * Send an email using Resend.
 * @param apiKey The Resend API key
 * @param to recipient email
 * @param subject email subject
 * @param html HTML content of the email
 */
export async function sendEmail(apiKey: string, to: string, subject: string, html: string) {
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: "ARES Robotics <no-reply@ares23247.team>",
    to: [to],
    subject,
    html,
  });

  if (error) {
    console.error("[Resend] Error sending email:", error);
    throw new Error(`Email delivery failed: ${error.message}`);
  }

  return data;
}
