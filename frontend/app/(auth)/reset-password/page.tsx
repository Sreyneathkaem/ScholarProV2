"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import FormInput from "../../../components/common/form-input";
import { useRouter } from "next/navigation";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { resetPasswordSchema } from "@/lib/schema/reset-password-schema";
type ResetPasswordSchemaProps = z.infer<typeof resetPasswordSchema>;

function ResetPasswordPage() {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const resetForm = useForm<ResetPasswordSchemaProps>({
    mode: "onSubmit",
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: ResetPasswordSchemaProps) => {
    console.log("Reset password submitted:", values);

    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
        {/* Left Image Section */}
        <div className="col-span-1 items-center justify-center flex">
          {/* <img
            src="/login.png"
            alt="Description of image"
            className="object-cover w-[466px] h-[464px]"
          /> */}

          <Image
            src="/login.png"
            alt="Login visual"
            width={466}
            height={464}
            className="object-cover w-[466px] h-[464px]"
          />
        </div>

        {/* Right Success Message Section */}
        <div className="flex items-center justify-center p-8">
          <div className="w-[400px] text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold">Password Reset Successfully!</p>
            </div>

            <p className="text-base text-muted-foreground mb-8">
              Your password has been reset successfully. You can now login with
              your new password.
            </p>

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

  return (
    <div className="min-h-screen grid grid-cols-2">
      {/* Left Image Section */}
      <div className="col-span-1 items-center justify-center flex">
        <Image
          src="/login.png"
          alt="Login visual"
          width={466}
          height={464}
          className="object-cover w-[466px] h-[464px]"
        />
      </div>

      {/* Right Form Section */}
      <div className="flex items-center justify-center p-8">
        <div className="w-[400px]">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>

          <p className="text-2xl font-bold mt-4">Reset Password</p>
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

                <Button type="submit" className="w-full mt-2 text-white">
                  Create New Password
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
