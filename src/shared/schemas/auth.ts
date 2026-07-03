import { z } from "zod";

// ── Login ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ── Signup (Asceoft team member) ─────────────────────────────────────────────

export const signupSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    phone: z.string().min(1, "Phone number is required"),
    jobTitle: z.string().optional(),
    department: z.string().min(1, "Department is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

// ── Client signup ────────────────────────────────────────────────────────────

export const clientSignupSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    companyName: z.string().min(1, "Company name is required"),
    email: z.string().min(1, "Email address is required").email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    streetNumber: z.string().min(1, "Street number is required"),
    streetName: z.string().min(1, "Street name is required"),
    city: z.string().min(1, "City is required"),
    country: z.string().min(1, "Country is required"),
    tin: z.string().min(1, "TIN is required").regex(/^\d+$/, "TIN must be numeric"),
    phone: z.string().min(1, "Phone number is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ClientSignupInput = z.infer<typeof clientSignupSchema>;

// ── OTP verification ─────────────────────────────────────────────────────────

export const otpSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d{6}$/, "Code must be numeric"),
});

export type OtpInput = z.infer<typeof otpSchema>;
