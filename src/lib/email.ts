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
    let html: string;

    try {
      html = await renderWelcomeEmail({
        branding,
        userName,
        dashboardUrl,
      });

      // React 19 / Next.js 15+ streaming error detection
      if (
        html.includes("Objects are not valid as a React child") ||
        html.includes("Switched to client rendering")
      ) {
        throw new Error("Render failed");
      }
    } catch (e) {
      console.warn("⚠️ Email rendering failed, using fallback template:", e);
      html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <img src="${branding.logoUrl}" alt="${branding.appName}" style="width: 48px; height: 48px; border-radius: 8px;" />
                    <h1 style="color: #333;">Welcome to ${branding.appName}, ${userName}! 🚀</h1>
                    <p>We're excited to have you on board.</p>
                    <a href="${dashboardUrl}" style="display: inline-block; background-color: ${branding.brandingColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
                    <p>If you have any questions, reply to this email.</p>
                </div>
            `;
    }

    return {
      to: email,
      subject: `Welcome to ${branding.appName}, ${userName}! 🚀`,
      html,
    };
  }

  /**
   * Send magic link email
   */
  static async sendMagicLinkEmail(
    email: string,
    magicLink: string,
  ): Promise<EmailConfig> {
    let html: string;

    try {
      html = await renderMagicLinkEmail({
        magicLink,
        branding,
        userEmail: email,
      });

      // React 19 / Next.js 15+ streaming error detection
      if (
        html.includes("Objects are not valid as a React child") ||
        html.includes("Switched to client rendering")
      ) {
        throw new Error("Render failed");
      }
    } catch (e) {
      console.warn("⚠️ Email rendering failed, using fallback template:", e);
      html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <img src="${branding.logoUrl}" alt="${branding.appName}" style="width: 48px; height: 48px; border-radius: 8px;" />
                    <h1 style="color: #333;">Sign in to ${branding.appName}</h1>
                    <p>Click the button below to sign in:</p>
                    <a href="${magicLink}" style="display: inline-block; background-color: ${branding.brandingColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Sign In</a>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">Or copy this link: <br/><a href="${magicLink}">${magicLink}</a></p>
                </div>
            `;
    }

    return {
      to: email,
      subject: `Sign in to ${branding.appName}`,
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
