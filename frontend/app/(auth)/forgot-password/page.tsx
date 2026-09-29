"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import FormInput from "../../../components/common/form-input";
import { useRouter } from "next/navigation";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { authService } from "@/api/service/auth.service";
import { toast } from "sonner";
import { Check } from "lucide-react";

// Schema for forgot password
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordSchemaProps = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordPage() {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const forgotPasswordForm = useForm<ForgotPasswordSchemaProps>({
    mode: "onSubmit",
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordSchemaProps) => {
    setIsLoading(true);

    try {
      const result = await authService.sendForgotPasswordLink(values.email);

      if (result.success) {
        toast.success(result.message || "Reset link sent to your email");
        setIsSubmitted(true);
      } else {
        toast.error(String(result.error || "Failed to send reset link"));
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
              <p className="text-2xl font-bold">Check Your Email</p>
            </div>

            <p className="text-base text-muted-foreground mb-8">
              We have sent a password reset link to your email address. Please
              check your inbox and follow the instructions.
            </p>

            <Button
              onClick={() => router.push("/login")}
              className="w-full text-white"
            >
              Back to Login
            </Button>

            <p className="text-sm text-muted-foreground mt-4">
              Did not receive the email?{" "}
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-primary font-medium hover:underline"
              >
                Try again
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }
  //hhhh
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
          <div className="mb-6">
            <p className="text-2xl font-bold">Forgot Password?</p>
            <p className="text-base font-light text-muted-foreground mt-2">
              No worries! Enter your email address and we will send you a link
              to reset your password.
            </p>
          </div>

          <Form {...forgotPasswordForm}>
            <form
              onSubmit={forgotPasswordForm.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <FormInput<ForgotPasswordSchemaProps>
                    control={forgotPasswordForm.control}
                    name="email"
                    label="Email Address"
                    placeholder="email@example.com"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
