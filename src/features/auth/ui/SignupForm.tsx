"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import { PasswordInput } from "@/features/auth/ui/PasswordInput";
import { ProfileType } from "@/shared/types";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const supabase = createClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function userSignUp(user: ProfileType, password: string) {
    return await supabase.auth.signUp({
      email: user.email,
      password: password,
      options: {
        data: {
          first_name: user.first_name,
          last_name: user.last_name,
          job_title: user.job_title,
          department_id: user.department_id,
          phone: user.phone,
          is_deleted: user.is_deleted,
          deleted_at: user.deleted_at,
        },
        emailRedirectTo: "http://localhost:3000/login",
      },
    });
  }

  const handleSignUp = async (e: React.BaseSyntheticEvent) => {
    setError(null);
    setLoading(false);
    e.preventDefault();

    // basic validation
    const missingFields: string[] = [];

    if (!firstName) missingFields.push("first name");
    if (!lastName) missingFields.push("last name");
    if (!email) missingFields.push("email");
    if (!phone) missingFields.push("phone number");
    if (!department) missingFields.push("department");
    if (!password) missingFields.push("password");
    if (!confirmPassword) missingFields.push("confirm password");

    // check password mismatch separately — only if both are filled
    const passwordMismatch =
      password && confirmPassword && password !== confirmPassword;

    if (missingFields.length >= 3) {
      setError("Multiple fields are missing.");
      return;
    } else if (missingFields.length === 2) {
      setError(
        `Please input your ${missingFields[0]} and ${missingFields[1]}.`,
      );
      return;
    } else if (missingFields.length === 1) {
      setError(`Please input your ${missingFields[0]}.`);
      return;
    } else if (passwordMismatch) {
      setError("Password and confirmed password do not match.");
      return;
    }

    setLoading(true);

    const user: ProfileType = {
      profile_id: "",
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      image_id: null,
      client_id: null,
      department_id: department,
      email: email,
      job_title: jobTitle.trim().length == 0 ? null : jobTitle,
      is_deleted: false,
      deleted_at: null,
    };

    const { data, error: signUpError } = await userSignUp(user, password);

    //catch the sign in error
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    //only triggers if CONFIRM EMAIL option in Supabase is off (shud be on by default tho)
    if (data.session) {
      router.push("/login");
      router.refresh();
    } else {
      setError(
        "Account created! Check your email to confirm your account before logging in.",
      );
      console.log(data);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      {/* First Name + Last Name */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Label htmlFor="firstname" className="mb-1.5">
            First Name
          </Label>
          <Input
            id="firstname"
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="lastname" className="mb-1.5">
            Last Name
          </Label>
          <Input
            id="lastname"
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>

      {/* Work Email */}
      <div>
        <Label htmlFor="email" className="mb-1.5">
          Work Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* Phone Number */}
      <div>
        <Label htmlFor="phone" className="mb-1.5">
          Phone Number
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1 (555) 000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      {/* Job Title + Department */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Label htmlFor="jobtitle" className="mb-1.5">
            Job Title
          </Label>
          <Input
            id="jobtitle"
            type="text"
            placeholder="e.g. Product Manager"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="department" className="mb-1.5">
            Department
          </Label>
          <Input
            id="department"
            type="text"
            placeholder="e.g. Engineering"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <Label htmlFor="password" className="mb-1.5">
          Password
        </Label>
        <PasswordInput
          id="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {/* Confirm Password */}
      <div>
        <Label htmlFor="confirm-password" className="mb-1.5">
          Confirm Password
        </Label>
        <PasswordInput
          id="confirm-password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" className="mt-2" disabled={loading}>
        {loading ? "Creating account..." : "Join Workspace"}
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

      {/* Sign in link */}
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
