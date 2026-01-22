import {
  renderWelcomeEmail,
  renderMagicLinkEmail,
  sendEmail as centralSendEmail,
  getBranding,
} from "@jl0810/messaging";

// Branding definition for TAA since it's not yet in the @jl0810/messaging package
const branding = {
  appName: "TAA for the Masses",
  brandingColor: "#6366f1", // Indigo
  primaryColor: "#6366f1", // Required by AppBranding interface
  websiteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://taaforthemasses.com",
  supportEmail: "support@raydoug.com",
  logoUrl: "https://taaforthemasses.com/logo.png",
};

// Removed static variable to ensure runtime env access

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
  ): Promise<EmailConfig> {
    const dashboardUrl = `${this.baseUrl}/`;
    const html = await renderWelcomeEmail({
      branding,
      userName,
      dashboardUrl,
    });

    return {
      to: email,
      subject: `Welcome to ${branding.appName}, ${userName}! 🚀`,
      html,
    };
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

    const result = await centralSendEmail({
      to: config.to,
      from:
        process.env.EMAIL_FROM ||
        branding.supportEmail.replace("support@", "noreply@"),
      subject: config.subject,
      html: config.html,
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
