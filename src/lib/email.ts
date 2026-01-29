import {
  renderWelcomeEmail,
  sendEmail as centralSendEmail,
  getBranding,
} from "@jl0810/messaging";

/**
 * Standardized disclosure block for manual HTML emails
 * (Implemented locally because production build version of @jl0810/messaging is out of sync)
 */
function renderDisclosure(branding: any): string {
  if (!branding.disclosure) return "";
  return `
<div style="margin-top: 40px; padding: 20px; border-top: 1px solid rgba(0,0,0,0.05); background-color: #fffbeb; border-radius: 12px; border: 1px solid #fef3c7; font-family: sans-serif;">
  <p style="font-size: 12px; color: #92400e; margin: 0; line-height: 1.6;">
    <strong style="color: #b45309;">NOT FINANCIAL ADVICE.</strong> 
    ${branding.disclosure.replace("NOT FINANCIAL ADVICE. ", "")}
  </p>
</div>
    `;
}

// Get centralized TAA Branding
const branding = getBranding("taa");

export interface EmailConfig {
  to: string;
  subject: string;
  html: string;
}

/**
 * Email utility service for sending transactional emails
 * @module lib/email
 */
export class EmailService {
  private static baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://taaforthemasses.com";

  /**
   * Send welcome email to new users
   */
  static async sendWelcomeEmail(
    email: string,
    userName: string,
  ): Promise<boolean> {
    const dashboardUrl = `${this.baseUrl}/`;

    // The central renderWelcomeEmail now includes the disclosure via branding
    const html = await renderWelcomeEmail({
      branding,
      userName,
      dashboardUrl,
    });

    return await sendEmail({
      to: email,
      subject: `Welcome to ${branding.appName}, ${userName}! 🚀`,
      html,
    });
  }
}

/**
 * Send an email using central Mail API
 */
export async function sendEmail(config: EmailConfig): Promise<boolean> {
  try {
    const apiKey = process.env.USESEND_API_KEY;
    if (!apiKey) {
      console.error("❌ USESEND_API_KEY is missing. Email skipped.");
      return false;
    }

    // append disclosure for manual HTML if it's not already there (safety check)
    let finalHtml = config.html;
    if (!finalHtml.includes("NOT FINANCIAL ADVICE")) {
      finalHtml = `${finalHtml}${renderDisclosure(branding)}`;
    }

    const result = await centralSendEmail({
      to: config.to,
      from:
        process.env.EMAIL_FROM ||
        branding.supportEmail.replace("support@", "noreply@"),
      subject: config.subject,
      html: finalHtml,
      apiKey: apiKey,
      apiUrl:
        process.env.USESEND_API_URL ||
        (process.env.NODE_ENV === "production"
          ? "http://usesend:3000/api/v1"
          : "https://mail.raydoug.com/api/v1"),
    });

    console.log("📧 Central Email sent successfully:", result);
    return true;
  } catch (error) {
    console.error("Failed to send central email:", error);
    return false;
  }
}
