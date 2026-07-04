"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { ClientType, ProfileType } from "@/types";
import { AuthResponse } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getProfileByEmail } from "@/actions/profileActions";
import {
  clientSelectByNameTin,
  clientCreate,
  clientDeleteByID,
} from "@/actions/clientActions";

type Fields = {
  // TODO: confirm these map to User.firstName and User.lastName on the backend
  // (per Byron's data model: User → Client → Contract)
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  password: string;
  confirmPassword: string;
  streetNumber: string;
  streetName: string;
  city: string;
  country: string;
  tin: string;
  phone: string;
};

type Errors = Partial<Record<keyof Fields, string>>;

export function ClientSignupForm() {
  const router = useRouter();
  const supabase = createClient();

  const [fields, setFields] = useState<Fields>({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    streetNumber: "",
    streetName: "",
    city: "",
    country: "",
    tin: "",
    phone: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  function set(key: keyof Fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFields((prev) => ({ ...prev, [key]: e.target.value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };
  }

  function setNumeric(key: keyof Fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "");
      setFields((prev) => ({ ...prev, [key]: digits }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };
  }

  function validate(): Errors {
    const e: Errors = {};
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email);

    if (!fields.firstName.trim()) e.firstName = "First name is required.";
    if (!fields.lastName.trim()) e.lastName = "Last name is required.";
    if (!fields.companyName.trim()) e.companyName = "Company name is required.";
    if (!fields.email) e.email = "Email address is required.";
    else if (!emailOk) e.email = "Enter a valid email address.";
    if (!fields.password) e.password = "Password is required.";
    if (!fields.confirmPassword)
      e.confirmPassword = "Please confirm your password.";
    else if (fields.password && fields.password !== fields.confirmPassword)
      e.confirmPassword = "Passwords do not match.";
    if (!fields.streetNumber.trim()) e.streetNumber = "Required.";
    if (!fields.streetName.trim()) e.streetName = "Street name is required.";
    if (!fields.city.trim()) e.city = "City is required.";
    if (!fields.country.trim()) e.country = "Country is required.";
    if (!fields.tin) e.tin = "TIN is required.";
    if (!fields.phone) e.phone = "Phone number is required.";

    return e;
  }

  async function userSignUp(
    user: ProfileType,
    password: string,
  ): Promise<{
    signupError: string | null;
    data: AuthResponse["data"] | null;
  }> {
    //check if email is already linked to an existing user
    const { success, data: existingProfile } = await getProfileByEmail(
      user.email,
    );

    //if email is linked to an existing user
    //return error message and null user data
    if (success && existingProfile) {
      return {
        signupError: "An account with this email already exists.",
        data: null,
      };
    }

    //else, try signing up the user
    const res = await supabase.auth.signUp({
      email: user.email,
      password: password,
      options: {
        data: {
          first_name: user.first_name,
          last_name: user.last_name,
          job_title: user.job_title,
          client_id: user.client_id,
          department_id: user.department_id,
          phone: user.phone,
          is_deleted: user.is_deleted,
          deleted_at: user.deleted_at,
        },
        emailRedirectTo: "http://localhost:3000/signup-callback",
      },
    });
    //check if user was successfully signed up
    if (!res.data.user)
      return {
        signupError: "Account could not be registered, please try again.",
        data: null,
      };

    return { signupError: null, data: res.data };
  }

  async function handleSignUp(e: React.BaseSyntheticEvent) {
    setLoading(false);
    e.preventDefault();
    setStatus(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setShowResend(false);

    //check if client exists
    let client = await clientSelectByNameTin(fields.companyName, fields.tin);

    //if client doesn't exist, we insert them into our database
    if (!client) {
      try {
        const address =
          fields.streetNumber.trim() +
          " " +
          fields.streetName.trim() +
          ", " +
          fields.city.trim() +
          ", " +
          fields.country.trim();

        const new_client: ClientType = {
          client_id: "",
          client_name: fields.companyName.trim(),
          tin: fields.tin.trim(),
          billing_address: address,
          is_deleted: false,
          deleted_at: null,
        };

        client = await clientCreate(new_client);

        //error check
        if (!client) {
          setStatus({ type: "error", text: "Unable to save company data" });
          return;
        }
      } catch (error: any) {
        setStatus({ type: "error", text: error });
        if (client) await clientDeleteByID(client.client_id);
        return;
      }
    }

    //create new profile
    const user: ProfileType = {
      profile_id: "",
      first_name: fields.firstName.trim(),
      last_name: fields.lastName.trim(),
      phone: fields.phone.trim(),
      image_id: null,
      client_id: client?.client_id,
      department_id: null,
      email: fields.email.trim(),
      job_title: null,
      is_deleted: false,
      deleted_at: null,
    };

    const { data, signupError } = await userSignUp(user, fields.password);

    //catch the sign in error
    if (signupError) {
      setStatus({ type: "error", text: signupError });
      if (client) await clientDeleteByID(client.client_id);
      setLoading(false);
      return;
    }

    //only triggers if CONFIRM EMAIL option in Supabase is off (shud be on by default tho)
    if (data?.session) {
      router.push("/login");
      router.refresh();
    } else if (data?.user) {
      setStatus({
        type: "success",
        text: "Account created! Check your email to confirm your account before logging in.",
      });
      setShowResend(true);
      setLoading(false);
    } else {
      setStatus({ type: "error", text: "Something went wrong. Please try again." });
      setLoading(false);
    }
  }

  async function resendConfirmationEmail() {
    setResendLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: fields.email,
      options: {
        emailRedirectTo: "http://localhost:3000/signup-callback",
      },
    });
    setResendLoading(false);
    setStatus(
      error
        ? { type: "error", text: error.message }
        : {
            type: "success",
            text: "Confirmation email resent. Please check your inbox.",
          },
    );
  }

  function errClass(key: keyof Fields) {
    return errors[key] ? "border-red-400 focus:ring-red-400" : "";
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4" noValidate>
      {/* First Name + Last Name */}
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <Label htmlFor="firstName" className="mb-1.5">
            First Name
          </Label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            placeholder="Jane"
            value={fields.firstName}
            onChange={set("firstName")}
            className={errClass("firstName")}
          />
          {errors.firstName && (
            <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Label htmlFor="lastName" className="mb-1.5">
            Last Name
          </Label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            placeholder="Smith"
            value={fields.lastName}
            onChange={set("lastName")}
            className={errClass("lastName")}
          />
          {errors.lastName && (
            <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Company Name */}
      <div>
        <Label htmlFor="companyName" className="mb-1.5">
          Company Name
        </Label>
        <Input
          id="companyName"
          name="companyName"
          type="text"
          placeholder="Acme Corporation"
          value={fields.companyName}
          onChange={set("companyName")}
          className={errClass("companyName")}
        />
        {errors.companyName && (
          <p className="text-xs text-red-500 mt-1">{errors.companyName}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="email" className="mb-1.5">
          Email Address
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          value={fields.email}
          onChange={set("email")}
          className={errClass("email")}
        />
        {errors.email && (
          <p className="text-xs text-red-500 mt-1">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <Label htmlFor="password" className="mb-1.5">
          Password
        </Label>
        <PasswordInput
          id="password"
          name="password"
          placeholder="Create a password"
          value={fields.password}
          onChange={set("password")}
          className={errClass("password")}
        />
        {errors.password && (
          <p className="text-xs text-red-500 mt-1">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <Label htmlFor="confirmPassword" className="mb-1.5">
          Confirm Password
        </Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          placeholder="Confirm your password"
          value={fields.confirmPassword}
          onChange={set("confirmPassword")}
          className={errClass("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Address */}
      <div className="pt-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Address
        </p>

        {/* Street Number + Street Name */}
        <div className="flex gap-3 mb-3">
          <div className="w-[30%] shrink-0">
            <Label htmlFor="streetNumber" className="mb-1.5">
              Street No.
            </Label>
            <Input
              id="streetNumber"
              name="streetNumber"
              type="text"
              placeholder="123"
              value={fields.streetNumber}
              onChange={set("streetNumber")}
              className={errClass("streetNumber")}
            />
            {errors.streetNumber && (
              <p className="text-xs text-red-500 mt-1">{errors.streetNumber}</p>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Label htmlFor="streetName" className="mb-1.5">
              Street Name
            </Label>
            <Input
              id="streetName"
              name="streetName"
              type="text"
              placeholder="Main Street"
              value={fields.streetName}
              onChange={set("streetName")}
              className={errClass("streetName")}
            />
            {errors.streetName && (
              <p className="text-xs text-red-500 mt-1">{errors.streetName}</p>
            )}
          </div>
        </div>

        {/* City + Country */}
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            <Label htmlFor="city" className="mb-1.5">
              City
            </Label>
            <Input
              id="city"
              name="city"
              type="text"
              placeholder="New York"
              value={fields.city}
              onChange={set("city")}
              className={errClass("city")}
            />
            {errors.city && (
              <p className="text-xs text-red-500 mt-1">{errors.city}</p>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Label htmlFor="country" className="mb-1.5">
              Country
            </Label>
            <Input
              id="country"
              name="country"
              type="text"
              placeholder="United States"
              value={fields.country}
              onChange={set("country")}
              className={errClass("country")}
            />
            {errors.country && (
              <p className="text-xs text-red-500 mt-1">{errors.country}</p>
            )}
          </div>
        </div>
      </div>

      {/* TIN */}
      <div>
        <Label htmlFor="tin" className="mb-1.5">
          TIN (Tax Identification Number)
        </Label>
        <Input
          id="tin"
          name="tin"
          type="text"
          inputMode="numeric"
          placeholder="000000000"
          value={fields.tin}
          onChange={setNumeric("tin")}
          className={errClass("tin")}
        />
        {errors.tin && (
          <p className="text-xs text-red-500 mt-1">{errors.tin}</p>
        )}
      </div>

      {/* Phone Number */}
      <div>
        <Label htmlFor="phone" className="mb-1.5">
          Phone Number
        </Label>
        <Input
          id="phone"
          name="phone"
          type="text"
          inputMode="numeric"
          placeholder="12025550100"
          value={fields.phone}
          onChange={setNumeric("phone")}
          className={errClass("phone")}
        />
        {errors.phone && (
          <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
        )}
      </div>

      {status && (
        <p
          className={`text-sm rounded-md px-3 py-2 border ${
            status.type === "success"
              ? "text-green-700 bg-green-50 border-green-200"
              : "text-red-600 bg-red-50 border-red-200"
          }`}
        >
          {status.text}
        </p>
      )}

      {showResend && (
        <Button
          type="button"
          variant="ghost"
          onClick={resendConfirmationEmail}
          disabled={resendLoading}
        >
          {resendLoading ? "Resending..." : "Resend confirmation email"}
        </Button>
      )}

      <Button type="submit" className="mt-2" disabled={loading}>
        {loading ? "Creating account..." : "Sign Up"}
      </Button>

      {/* OR divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
          <span className="bg-[#F8F9FB] px-3 text-gray-400">OR</span>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-indigo-600 hover:text-indigo-500 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
