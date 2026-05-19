import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Mail, 
  Lock, 
  Key, 
  Save, 
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface AdminAccountSettingsProps {
  currentAdminEmail?: string;
  onAdminUpdated?: (adminData: { id: number; email: string }) => void;
}

const AdminAccountSettings = ({ 
  currentAdminEmail = "admin@zetech.ac.ke", 
  onAdminUpdated 
}: AdminAccountSettingsProps) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newEmail: currentAdminEmail,
    newPassword: "",
    confirmNewPassword: ""
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Current password is always required
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    // At least one field should be updated
    if (formData.newEmail === currentAdminEmail && !formData.newPassword) {
      newErrors.general = "Either new email or new password must be provided";
    }

    // Email validation
    if (formData.newEmail && formData.newEmail !== currentAdminEmail) {
      if (!formData.newEmail.includes('@') || !formData.newEmail.includes('.')) {
        newErrors.newEmail = "Please enter a valid email address";
      }
    }

    // Password validation
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = "New password must be at least 6 characters long";
      }
      
      if (formData.newPassword !== formData.confirmNewPassword) {
        newErrors.confirmNewPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updateData: any = {
        currentPassword: formData.currentPassword
      };

      // Only include fields that are being updated
      if (formData.newEmail !== currentAdminEmail) {
        updateData.newEmail = formData.newEmail;
      }

      if (formData.newPassword) {
        updateData.newPassword = formData.newPassword;
        updateData.confirmNewPassword = formData.confirmNewPassword;
      }

      const response = await api.admin.updateAccount(updateData);
      
      if (response.message) {
        toast.success(response.message);
        
        // Reset form
        setFormData({
          currentPassword: "",
          newEmail: response.admin?.email || formData.newEmail,
          newPassword: "",
          confirmNewPassword: ""
        });
        
        // Clear errors
        setErrors({});
        
        // Notify parent component
        if (onAdminUpdated && response.admin) {
          onAdminUpdated(response.admin);
        }
      }
    } catch (error: any) {
      console.error("Failed to update admin account:", error);
      const errorMessage = error.message || "Failed to update admin account";
      toast.error(errorMessage);
      
      // Set error from response if available
      if (error.message) {
        setErrors({ general: error.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const isEmailChanged = formData.newEmail !== currentAdminEmail;
  const isPasswordChanged = !!formData.newPassword;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Admin Account Settings
        </CardTitle>
        <CardDescription>
          Update your admin email and password. You'll need to enter your current password for security.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Current Password *
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                placeholder="Enter your current password"
                className={`pr-10 ${errors.currentPassword ? "border-red-500" : ""}`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isSubmitting}
              >
                {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* Email Update */}
          <div className="space-y-2">
            <Label htmlFor="newEmail" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Admin Email
            </Label>
            <Input
              id="newEmail"
              type="email"
              value={formData.newEmail}
              onChange={(e) => handleInputChange("newEmail", e.target.value)}
              placeholder="admin@zetech.ac.ke"
              className={errors.newEmail ? "border-red-500" : ""}
              disabled={isSubmitting}
            />
            {errors.newEmail && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.newEmail}
              </p>
            )}
            {isEmailChanged && (
              <p className="text-sm text-blue-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Email will be updated from {currentAdminEmail} to {formData.newEmail}
              </p>
            )}
          </div>

          {/* Password Update */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <Label>Update Password</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange("newPassword", e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  className={`pr-10 ${errors.newPassword ? "border-red-500" : ""}`}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isSubmitting}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.newPassword}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmNewPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={formData.confirmNewPassword}
                  onChange={(e) => handleInputChange("confirmNewPassword", e.target.value)}
                  placeholder="Confirm new password"
                  className={`pr-10 ${errors.confirmNewPassword ? "border-red-500" : ""}`}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isSubmitting}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmNewPassword && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.confirmNewPassword}
                </p>
              )}
            </div>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.general}
              </p>
            </div>
          )}

          {/* Success Message */}
          {isEmailChanged || isPasswordChanged ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                You're about to update your admin credentials. Make sure you remember the new details.
              </p>
            </div>
          ) : null}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || (!isEmailChanged && !isPasswordChanged)}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Updating..." : "Update Account"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminAccountSettings;
