import { z } from 'zod';

// ============================================================
// Auth Validation Schemas (Zod)
// Used in routes to validate request bodies before they reach
// the controller layer.
// ============================================================

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be under 100 characters')
      .trim(),
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^(?:\+91|91)?[6-9]\d{9}$/.test(val.replace(/[\s-]/g, '')),
        {
          message: 'Invalid Indian phone number (e.g. 9876543210 or +919876543210)',
        }
      )
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    role: z.enum(['PATIENT', 'DOCTOR']).default('PATIENT'),
    // Doctor-specific fields (required if role === DOCTOR)
    specialization: z.string().min(2).optional(),
    qualification: z.string().min(2).optional(),
    experience: z.number().int().min(0).max(60).optional(),
    consultationFee: z.number().positive().optional(),
    registrationNumber: z.string().min(3).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const sendOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    purpose: z.enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'PHONE_VERIFICATION']),
  }),
});

export const verifyOTPSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase().trim(),
    otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only digits'),
    purpose: z.enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'PHONE_VERIFICATION']),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase().trim(),
    otp: z.string().length(6).regex(/^\d+$/),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[a-z]/, 'Must contain lowercase')
      .regex(/[0-9]/, 'Must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

// Type exports for use in controllers
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type SendOTPInput = z.infer<typeof sendOTPSchema>['body'];
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
