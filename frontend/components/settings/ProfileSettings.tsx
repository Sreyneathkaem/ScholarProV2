"use client";

import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Camera, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { apiClient } from "@/api/api";
import { getProfile, updateProfile } from "@/api/service/user.service";
import { API_ENDPOINTS } from "@/api/endpoint";

// Type definitions
interface FormDataState {
  fullName: string;
  email: string;
  role: string;
  department: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  profileImage: string;
  phoneNumber?: string;
}

// Password Strength Helper
const checkStrength = (pass: string) => {
  let score = 0;
  if (!pass) return { score: 0, text: "", color: "bg-accent" };
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;

  if (score <= 1) return { score: 25, text: "Weak", color: "bg-red-500" };
  if (score === 2 || score === 3)
    return { score: 50, text: "Moderate", color: "bg-yellow-500" };
  return { score: 100, text: "Strong", color: "bg-green-500" };
};

// Requirement item
function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div
      className={`flex items-center text-xs transition-colors duration-200 ${met ? "text-green-600" : "text-muted-foreground"}`}
    >
      {met ? (
        <Check size={12} className="mr-1.5" />
      ) : (
        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mr-2" />
      )}
      {text}
    </div>
  );
}

// Password Input
interface PasswordInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  showStrength?: boolean;
}

function PasswordInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  showStrength = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const strength = checkStrength(value ?? "");

  const hasLength = (value ?? "").length >= 8;
  const hasUpper = /[A-Z]/.test(value ?? "");
  const hasNumber = /[0-9]/.test(value ?? "");
  const hasSpecial = /[^A-Za-z0-9]/.test(value ?? "");

  return (
    <div className="w-full">
      <Label htmlFor={name}>{label}</Label>

      <div className="relative mt-2">
        <Input
          id={name}
          type={showPassword ? "text" : "password"}
          name={name}
          value={value ?? ""} // ⬅ FIXED: ALWAYS PROVIDE A STRING
          onChange={onChange}
          placeholder={placeholder}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {showStrength && value && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${strength.color}`}
                style={{ width: `${strength.score}%` }}
              ></div>
            </div>
            <span className="text-xs font-medium">{strength.text}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <RequirementItem met={hasLength} text="8+ characters" />
            <RequirementItem met={hasUpper} text="Uppercase letter" />
            <RequirementItem met={hasNumber} text="Number (0-9)" />
            <RequirementItem met={hasSpecial} text="Special char (!@#)" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfileSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [tempProfileImage, setTempProfileImage] = useState("");
  const [tempFullName, setTempFullName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // FORM STATE (Controlled Inputs)
  const [formData, setFormData] = useState<FormDataState>({
    fullName: "",
    email: "",
    role: "",
    department: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    profileImage: "",
    phoneNumber: "",
  });

  // FETCH PROFILE
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await getProfile();
        const userData = response?.data ?? response ?? {};

        // ⬅ FIX: ensure ALL fields become strings, not undefined or null
        setFormData((prev) => ({
          ...prev,
          fullName: userData.name ?? "",
          email: userData.email ?? "",
          role: userData.role ?? "User",
          department: "General",
          phoneNumber: userData.phoneNumber ?? "",
          profileImage: userData.profileUrl
            ? `${userData.profileUrl}?t=${Date.now()}`
            : "",
        }));
      } catch (error) {
        console.error("Profile load error:", error);
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // INPUT HANDLER (SAFE)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // ⬅ FIX: always update using a string
    setFormData((prev) => ({ ...prev, [name]: value ?? "" }));
  };

  // IMAGE CHANGE
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return toast.error("Upload an image");
    if (file.size > 1 * 1024 * 1024) return toast.error("Max size 1MB");

    setTempProfileImage(URL.createObjectURL(file));
    setSelectedFile(file);
    setImageError(false);
  };

  const handleProfileImageClick = () => fileInputRef.current?.click();

  const handleOpenProfileModal = () => {
    setTempProfileImage(formData.profileImage);
    setTempFullName(formData.fullName);
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    if (tempProfileImage.startsWith("blob:"))
      URL.revokeObjectURL(tempProfileImage);
  };

  // UPDATE PROFILE IMAGE + NAME
  const handleUpdateProfile = async () => {
    if (!tempFullName.trim()) return toast.error("Name required");

    setIsLoading(true);
    try {
      if (selectedFile) {
        const fd = new FormData();
        fd.append("profileUrl", selectedFile);
        fd.append("name", tempFullName);

        const res = await updateProfile(fd);
        const newData = res.data ?? res;
        setFormData((prev) => ({
          ...prev,
          fullName: newData.name ?? tempFullName,
          profileImage: newData.profileUrl
            ? `${newData.profileUrl}?t=${Date.now()}`
            : prev.profileImage,
        }));
      } else {
        const res = await updateProfile({ name: tempFullName });
        const newData = res.data ?? res;
        setFormData((prev) => ({
          ...prev,
          fullName: newData.name ?? tempFullName,
        }));
      }

      toast.success("Profile updated");
      handleCloseProfileModal();
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // UPDATE PERSONAL INFO
  const handleUpdatePersonalInfo = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        name: formData.fullName,
        department: formData.department,
        phoneNumber: formData.phoneNumber,
      });

      toast.success("Personal info updated");
    } catch {
      toast.error("Update failed");
    } finally {
      setIsLoading(false);
    }
  };

  // UPDATE PASSWORD
  const handleUpdatePassword = async () => {
    if (!formData.currentPassword) return toast.error("Enter current password");
    if (formData.newPassword !== formData.confirmPassword)
      return toast.error("Passwords do not match");

    const np = formData.newPassword;

    if (np.length < 8) return toast.error("Min 8 characters");
    if (!/[A-Z]/.test(np)) return toast.error("Needs uppercase");
    if (!/[0-9]/.test(np)) return toast.error("Needs a number");
    if (!/[^A-Za-z0-9]/.test(np)) return toast.error("Needs special char");

    setIsLoading(true);

    try {
      await apiClient.patch(API_ENDPOINTS.RESET_PASSWORD_AUTH, {
        oldPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      toast.success("Password updated");

      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch {
      toast.error("Failed to update password");
    }

    setIsLoading(false);
  };

  if (isPageLoading) return <div>Loading...</div>;

  // RENDER UI
  return (
    <div className="space-y-6">
      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur">
          <div className="max-w-sm mx-auto mt-20 bg-card p-6 rounded-lg shadow-lg relative">
            <button
              onClick={handleCloseProfileModal}
              className="absolute right-4 top-4"
            >
              <X />
            </button>

            <h3 className="text-xl font-bold mb-6 text-center">
              Edit Profile Photo
            </h3>

            <div className="flex flex-col items-center">
              <div
                className="w-40 h-40 rounded-full overflow-hidden bg-muted border cursor-pointer"
                onClick={handleProfileImageClick}
              >
                {tempProfileImage && !imageError ? (
                  <img
                    src={tempProfileImage}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                    alt={"Profile image"}
                  />
                ) : (
                  <Camera className="w-full h-full text-muted-foreground" />
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
              />
            </div>

            <div className="flex gap-3 mt-8">
              <Button
                onClick={handleUpdateProfile}
                disabled={isLoading}
                className="flex-1 bg-[#0F386C] text-white"
              >
                {isLoading ? "Saving..." : "Save Photo"}
              </Button>

              <Button
                onClick={handleCloseProfileModal}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <Card className="bg-[#0F386C] text-white border-none">
        <CardContent className="p-8">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full overflow-hidden cursor-pointer border-2 border-border"
              onClick={handleOpenProfileModal}
            >
              {formData.profileImage ? (
                <img
                  src={formData.profileImage}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  alt={"Profile image"}
                />
              ) : (
                <Camera className="w-full h-full text-muted-foreground p-4" />
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold">{formData.fullName}</h2>
              <p className="text-blue-100">{formData.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PERSONAL INFO */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Full Name</Label>
              <Input
                name="fullName"
                value={formData.fullName ?? ""} // ⬅ FIXED: safe fallback
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                value={formData.email ?? ""}
                disabled
                className="mt-2 bg-muted"
              />
            </div>

            <div>
              <Label>Phone Number</Label>
              <Input
                name="phoneNumber"
                value={formData.phoneNumber ?? ""} // ⬅ FIXED
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Department</Label>
              <Input
                name="department"
                value={formData.department ?? ""} // ⬅ FIXED
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>

            <div className="col-span-2 flex justify-end">
              <Button
                onClick={handleUpdatePersonalInfo}
                className="bg-[#0F386C] text-white"
              >
                Save Personal Info
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECURITY */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>

        <CardContent>
          <PasswordInput
            label="Current Password"
            name="currentPassword"
            value={formData.currentPassword ?? ""} // ⬅ FIX
            onChange={handleInputChange}
            placeholder="Enter current password"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <PasswordInput
              label="New Password"
              name="newPassword"
              value={formData.newPassword ?? ""} // ⬅ FIX
              onChange={handleInputChange}
              placeholder="Enter new password"
              showStrength={true}
            />

            <div>
              <PasswordInput
                label="Confirm Password"
                name="confirmPassword"
                value={formData.confirmPassword ?? ""} // ⬅ FIX
                onChange={handleInputChange}
                placeholder="Confirm new password"
              />

              {formData.confirmPassword && (
                <p
                  className={`text-xs mt-2 ${
                    formData.newPassword === formData.confirmPassword
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {formData.newPassword === formData.confirmPassword
                    ? "Passwords match"
                    : "Passwords do not match"}
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={handleUpdatePassword}
            className="mt-8 bg-[#0F386C] text-white"
            disabled={isLoading}
          >
            Reset Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
