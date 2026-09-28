"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import FormInput from "@/components/common/form-input";
import { useAuth } from "@/lib/context/auth-context";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { signInSchema } from "@/lib/schema/signin-schema";

type LoginSchema = z.infer<typeof signInSchema>;

export default function LoginPage() {
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginSchema) => {
    setIsLoading(true);
    try {
      await login(values.email, values.password);
      toast.success("Logged in");
    } catch (e: unknown) {
      console.error("Login error:", e);
      const errorMessage = e instanceof Error ? e.message : "Login failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-0">
        {/* Left Side: University Logo */}
        <div className="flex-1 flex justify-center lg:justify-end lg:pr-10">
          <div className="relative w-64 h-64 md:w-80 md:h-80 transition-transform hover:scale-105 duration-300">
            <Image
              src="/login.png"
              alt="University Logo"
              fill
              sizes="(max-width: 768px) 256px, 320px"
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Middle: The Vertical Divider with Text */}
        <div className="hidden lg:flex flex-col items-center">
          <div className="h-32 w-[1px] bg-border" />
          <span className="py-4 text-xs font-medium text-muted-foreground uppercase tracking-widest vertical-text">
            Log In
          </span>
          <div className="h-32 w-[1px] bg-border" />
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 flex justify-center lg:justify-start lg:pl-16">
          <div className="w-full max-w-[360px] space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">
                Welcome To ScholarPro!
              </h1>
              <p className="text-muted-foreground text-sm">
                Enter your details below to login
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormInput<LoginSchema>
                  control={form.control}
                  name="email"
                  label="Email"
                  placeholder="testing@example.com"
                  disabled={isLoading}
                />
                <FormInput<LoginSchema>
                  control={form.control}
                  name="password"
                  label="Password"
                  placeholder="••••••••••••"
                  type="password"
                  disabled={isLoading}
                />
                <div className="pt-2">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-muted-foreground hover:text-primary hover:underline underline-offset-4 transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-base font-semibold transition-all rounded-md"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Log In"}
                </Button>
              </form>
            </Form>

            <p className="text-center text-sm text-muted-foreground pt-1">
              Are you a student?{" "}
              <Link
                href="/students"
                className="font-semibold text-primary hover:underline underline-offset-4"
              >
                Go to the student portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
