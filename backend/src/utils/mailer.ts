import nodemailer from 'nodemailer';
import { env } from '../config/env';
import logger from './logger';

// ============================================================
// Mailer Utility — Nodemailer with Gmail/SMTP
// Used for: OTP emails, appointment reminders, confirmations
// ============================================================

// Singleton transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
    });
  }
  return transporter;
}

// ── Email Templates ──────────────────────────────────────────

function otpTemplate(otp: string, purpose: string, name: string): string {
  const purposeText: Record<string, string> = {
    EMAIL_VERIFICATION: 'verify your email address',
    PASSWORD_RESET: 'reset your password',
    PHONE_VERIFICATION: 'verify your phone number',
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OTP Verification</title>
    </head>
    <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;">🏥 Healthcare System</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Secure Authentication</p>
        </div>
        <!-- Body -->
        <div style="padding:40px 32px;">
          <p style="margin:0 0 16px;color:#333;font-size:16px;">Hi <strong>${name}</strong>,</p>
          <p style="margin:0 0 24px;color:#666;font-size:15px;">
            Use the OTP below to ${purposeText[purpose] ?? 'complete your request'}. 
            This code expires in <strong>10 minutes</strong>.
          </p>
          <!-- OTP Box -->
          <div style="background:#f0f4ff;border:2px dashed #667eea;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
            <p style="margin:0 0 8px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Your OTP</p>
            <p style="margin:0;font-size:42px;font-weight:700;letter-spacing:12px;color:#667eea;font-family:monospace;">${otp}</p>
          </div>
          <p style="margin:0;color:#999;font-size:13px;">
            ⚠️ Do not share this OTP with anyone. Our team will never ask for it.
          </p>
        </div>
        <!-- Footer -->
        <div style="background:#f9f9f9;padding:16px 32px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;color:#aaa;font-size:12px;">© 2026 Healthcare Appointment System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function appointmentConfirmTemplate(details: {
  patientName: string;
  doctorName: string;
  specialization: string;
  dateTime: string;
  type: string;
  appointmentId: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <div style="background:linear-gradient(135deg,#11998e 0%,#38ef7d 100%);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;">✅ Appointment Confirmed!</h1>
        </div>
        <div style="padding:40px 32px;">
          <p style="color:#333;font-size:16px;">Hi <strong>${details.patientName}</strong>,</p>
          <p style="color:#666;">Your appointment has been successfully booked.</p>
          <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:20px;border-radius:8px;margin:24px 0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:6px 0;color:#888;font-size:13px;">Doctor</td><td style="padding:6px 0;color:#333;font-weight:600;">Dr. ${details.doctorName}</td></tr>
              <tr><td style="padding:6px 0;color:#888;font-size:13px;">Specialization</td><td style="padding:6px 0;color:#333;">${details.specialization}</td></tr>
              <tr><td style="padding:6px 0;color:#888;font-size:13px;">Date & Time</td><td style="padding:6px 0;color:#333;font-weight:600;">${details.dateTime}</td></tr>
              <tr><td style="padding:6px 0;color:#888;font-size:13px;">Type</td><td style="padding:6px 0;color:#333;">${details.type}</td></tr>
              <tr><td style="padding:6px 0;color:#888;font-size:13px;">Booking ID</td><td style="padding:6px 0;color:#667eea;font-family:monospace;font-size:12px;">${details.appointmentId}</td></tr>
            </table>
          </div>
          <p style="color:#999;font-size:13px;">Please arrive 10 minutes early. Carry a valid ID proof.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ── Send Functions ───────────────────────────────────────────

export interface SendOTPOptions {
  to: string;
  name: string;
  otp: string;
  purpose: string;
}

export async function sendOTPEmail(options: SendOTPOptions): Promise<void> {
  const subjectMap: Record<string, string> = {
    EMAIL_VERIFICATION: '🔐 Verify Your Email — OTP',
    PASSWORD_RESET: '🔑 Reset Your Password — OTP',
    PHONE_VERIFICATION: '📱 Verify Your Phone — OTP',
  };

  try {
    await getTransporter().sendMail({
      from: env.EMAIL_FROM,
      to: options.to,
      subject: subjectMap[options.purpose] ?? '🔐 Your OTP Code',
      html: otpTemplate(options.otp, options.purpose, options.name),
    });
    logger.info(`OTP email sent to ${options.to} [${options.purpose}]`);
  } catch (error) {
    logger.error(`Failed to send OTP email to ${options.to}:`, error);
    // Don't throw — email failure shouldn't crash the request in dev
    if (env.NODE_ENV === 'production') throw error;
  }
}

export async function sendAppointmentConfirmation(
  to: string,
  details: Parameters<typeof appointmentConfirmTemplate>[0]
): Promise<void> {
  try {
    await getTransporter().sendMail({
      from: env.EMAIL_FROM,
      to,
      subject: `✅ Appointment Confirmed — Dr. ${details.doctorName}`,
      html: appointmentConfirmTemplate(details),
    });
    logger.info(`Appointment confirmation sent to ${to}`);
  } catch (error) {
    logger.error(`Failed to send appointment confirmation to ${to}:`, error);
    if (env.NODE_ENV === 'production') throw error;
  }
}
