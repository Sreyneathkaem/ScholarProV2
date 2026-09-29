"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import FormInput from "../../../components/common/form-input";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { resetPasswordSchema } from "@/lib/schema/reset-password-schema";
import { authService } from "@/api/service/auth.service";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

type ResetPasswordSchemaProps = z.infer<typeof resetPasswordSchema>;

function SetForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  const resetForm = useForm<ResetPasswordSchemaProps>({
    mode: "onSubmit",
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Validate token on mount
  useEffect(() => {
    const id = searchParams?.get("id");
    const token = searchParams?.get("token");

    if (!id || !token) {
      setIsValidToken(false);
      setValidating(false);
      toast.error("Invalid reset link");
      return;
    }

    authService
      .validateForgotPasswordToken(id, token)
      .then((result) => {
        if (result.success) {
          setIsValidToken(true);
          if (result.email) {
            setUserEmail(result.email);
          }
        } else {
          setIsValidToken(false);
          toast.error(String(result.error || "Invalid or expired link"));
        }
      })
      .catch((error) => {
        console.error("Token validation error:", error);
        setIsValidToken(false);
        toast.error("Invalid or expired link");
      })
      .finally(() => setValidating(false));
  }, [searchParams]);

  const onSubmit = async (values: ResetPasswordSchemaProps) => {
    const id = searchParams?.get("id");
    const token = searchParams?.get("token");

    if (!id || !token) {
      toast.error("Missing reset token");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Resetting password with id:", id, "token:", token);
      const result = await authService.resetForgotPassword(
        id,
        token,
        values.password,
      );

      console.log("Reset password result:", result);

      if (result.success) {
        toast.success(result.message || "Password reset successfully");
        console.log("Password reset successful for email:", userEmail);
        setIsSubmitted(true);
      } else {
        toast.error(String(result.error || "Failed to reset password"));
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while validating
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Validating reset link...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (!isValidToken) {
    return (
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
        {/* Left Image Section - Hidden on mobile */}
        <div className="hidden md:flex md:col-span-1 items-center justify-center">
          <Image
            src="/login.png"
            alt="Login visual"
            width={466}
            height={464}
            className="object-cover w-[466px] h-[464px]"
          />
        </div>

        {/* Right Error Message Section */}
        <div className="flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-[400px] mx-auto text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-2xl font-bold">Invalid Reset Link</p>
            </div>

            <p className="text-base text-muted-foreground mb-8">
              This password reset link is invalid or has expired. Please request
              a new one.
            </p>

            <Button
              onClick={() => router.push("/forgot-password")}
              className="w-full text-white"
            >
              Request New Link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show success message after password reset
  if (isSubmitted) {
    return (
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
        {/* Left Image Section - Hidden on mobile */}
        <div className="hidden md:flex md:col-span-1 items-center justify-center">
          <Image
            src="/login.png"
            alt="Login visual"
            width={466}
            height={464}
            className="object-cover w-[466px] h-[464px]"
          />
        </div>

        {/* Right Success Message Section */}
        <div className="flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-[400px] mx-auto text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold">Password Reset Successfully!</p>
            </div>

            <p className="text-base text-muted-foreground mb-4">
              Your password has been reset successfully. You can now login with
              your new password.
            </p>

            {userEmail && (
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-muted-foreground">Login with email:</p>
                <p className="text-base font-medium text-foreground">
                  {userEmail}
                </p>
              </div>
            )}

            <Button
              onClick={() => router.push("/login")}
              className="w-full text-white"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show password reset form
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left Image Section - Hidden on mobile */}
      <div className="hidden md:flex md:col-span-1 items-center justify-center">
        <Image
          src="/login.png"
          alt="Login visual"
          width={466}
          height={464}
          className="object-cover w-[466px] h-[464px]"
        />
      </div>

      {/* Right Form Section */}
      <div className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[400px] mx-auto">
          <p className="text-2xl font-bold mt-4">Reset Your Password</p>
          <p className="text-base font-light mb-10">
            Enter your new password below
          </p>

          <Form {...resetForm}>
            <form
              onSubmit={resetForm.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5 relative">
                  <FormInput<ResetPasswordSchemaProps>
                    control={resetForm.control}
                    name="password"
                    label="New Password"
                    placeholder="Enter your new password"
                    type="password"
                  />
                </div>
                <div className="flex flex-col space-y-1.5 relative">
                  <FormInput<ResetPasswordSchemaProps>
                    control={resetForm.control}
                    name="confirmPassword"
                    label="Confirm Password"
                    placeholder="Confirm your new password"
                    type="password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full mt-2 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default function SetForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <SetForgotPasswordContent />
    </Suspense>
  );
}
