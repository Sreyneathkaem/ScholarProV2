"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import FormInput from "../../../components/common/form-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import Image from "next/image";
import { committeeAcceptSchema } from "@/lib/schema/comittee-login-schema";
import { authService } from "@/api/service/auth.service";
import { useAuth } from "@/lib/context/auth-context";
import { toast } from "sonner";

type CommitteeAcceptSchemaProps = z.infer<typeof committeeAcceptSchema>;

export default function CommitteeLoginClient() {
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);
  const [validating, setValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidInvite, setIsValidInvite] = useState<boolean | null>(null);

  const acceptForm = useForm<CommitteeAcceptSchemaProps>({
    mode: "onSubmit",
    resolver: zodResolver(committeeAcceptSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: CommitteeAcceptSchemaProps) => {
    const id = searchParams.get("id");
    const token = searchParams.get("token");

    if (!id || !token) {
      toast.error("Missing invite token");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.registerWithInvite(
        id,
        token,
        values.email,
        values.password,
      );

      if (!res.success) {
        toast.error(res.error?.message || "Registration failed");
        return;
      }

      await login(values.email, values.password);
      toast.success("Account created successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Registration failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const id = searchParams.get("id");
    const token = searchParams.get("token");

    if (!id || !token) {
      setIsValidInvite(false);
      return;
    }

    setValidating(true);

    authService
      .validateInvite(id, token)
      .then((res) => {
        if (res.success && res.email) {
          acceptForm.setValue("email", res.email);
          setIsValidInvite(true);
        } else {
          setIsValidInvite(false);
          toast.error("Invalid or expired invite link");
        }
      })
      .catch(() => {
        setIsValidInvite(false);
        toast.error("Invalid or expired invite link");
      })
      .finally(() => setValidating(false));
  }, [searchParams, acceptForm]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-0">
        <div className="flex-1 flex justify-center lg:justify-end lg:pr-10">
          <div className="relative w-64 h-64 md:w-80 md:h-80">
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

        <div className="hidden lg:flex flex-col items-center">
          <div className="h-32 w-px bg-border" />
          <span className="py-4 text-xs font-medium text-muted-foreground uppercase tracking-widest vertical-text">
            Accept Invite
          </span>
          <div className="h-32 w-px bg-border" />
        </div>

        <div className="flex-1 flex justify-center lg:justify-start lg:pl-16">
          <div className="w-full max-w-[360px] space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">
                Welcome To ScholarPro!
              </h1>
              <p className="text-muted-foreground text-sm">
                Set up your password to accept the invitation
              </p>
            </div>

            <Form {...acceptForm}>
              <form
                onSubmit={acceptForm.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormInput
                  control={acceptForm.control}
                  name="email"
                  label="Email"
                  disabled
                />

                <FormInput
                  control={acceptForm.control}
                  name="password"
                  label="New Password"
                  type="password"
                />

                <FormInput
                  control={acceptForm.control}
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                />

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={rememberMe}
                    onCheckedChange={(v) => setRememberMe(v === true)}
                  />
                  <Label>I agree to the terms and conditions</Label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-base font-semibold rounded-md"
                  disabled={
                    validating || isSubmitting || isValidInvite === false
                  }
                >
                  {validating
                    ? "Validating..."
                    : isSubmitting
                      ? "Creating account..."
                      : "Accept Invitation"}
                </Button>

                {isValidInvite === false && (
                  <p className="text-sm text-destructive">
                    This invite link is invalid or expired.
                  </p>
                )}
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
