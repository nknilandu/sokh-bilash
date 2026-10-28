
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { AuthContext } from "../../../providers/AuthProvider";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  image_url: "",
  password: "",
  confirmPassword: "",
  agree: false,
};

const Register = () => {
  const navigate = useNavigate();

  const {
    createUser,
    updateUserProfile,
    sendVerificationEmail,
  } = useContext(AuthContext);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [formError, setFormError] = useState("");

  // Clean up local image preview
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Field validation
  const validateField = (name, value, data = form) => {
    switch (name) {
      case "name":
        if (!value.trim()) return "আপনার পুরো নাম লিখুন";
        if (value.trim().length < 2)
          return "নাম কমপক্ষে ২ অক্ষরের হতে হবে";
        break;

      case "email":
        if (!value.trim()) return "ইমেইল অ্যাড্রেস লিখুন";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
          return "সঠিক ইমেইল অ্যাড্রেস লিখুন";
        break;

      case "phone":
        if (!value.trim()) return "মোবাইল নম্বর লিখুন";
        if (!/^01[3-9]\d{8}$/.test(value.trim()))
          return "সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন";
        break;

      case "password":
        if (!value) return "পাসওয়ার্ড লিখুন";
        if (value.length < 8)
          return "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে";
        break;

      case "confirmPassword":
        if (!value) return "পাসওয়ার্ড নিশ্চিত করুন";
        if (value !== data.password)
          return "পাসওয়ার্ড দুটি মিলছে না";
        break;

      case "agree":
        if (!value)
          return "শর্তাবলি ও গোপনীয়তা নীতিতে সম্মতি দিন";
        break;

      default:
        break;
    }

    return "";
  };

  // Firebase error messages
  const getFirebaseError = (error) => {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "এই ইমেইল দিয়ে ইতোমধ্যে অ্যাকাউন্ট তৈরি করা হয়েছে।";

      case "auth/invalid-email":
        return "সঠিক ইমেইল অ্যাড্রেস লিখুন।";

      case "auth/weak-password":
        return "আরও শক্তিশালী পাসওয়ার্ড ব্যবহার করুন।";

      case "auth/network-request-failed":
        return "ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।";

      case "auth/too-many-requests":
        return "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।";

      case "auth/operation-not-allowed":
        return "Email/Password Authentication চালু নেই।";

      default:
        return "অ্যাকাউন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।";
    }
  };

  // Input style
  const inputClass = (field) => `
    w-full rounded-lg border bg-secondary/5
    px-4 py-3 text-sm text-primary outline-none
    transition-all duration-200
    placeholder:text-muted/60
    ${
      errors[field]
        ? "border-red-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/10"
        : "border-transparent hover:border-secondary/20 focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/10"
    }
  `;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const newValue = type === "checkbox" ? checked : value;
    const nextForm = { ...form, [name]: newValue };

    setForm(nextForm);
    setFormError("");

    setErrors((prev) => ({
      ...prev,
      [name]:
        touched[name] || prev[name]
          ? validateField(name, newValue, nextForm)
          : "",
      ...(name === "password" &&
      (touched.confirmPassword || prev.confirmPassword)
        ? {
            confirmPassword: validateField(
              "confirmPassword",
              nextForm.confirmPassword,
              nextForm
            ),
          }
        : {}),
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouched((prev) => ({ ...prev, [name]: true }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  // Upload photo to ImgBB (development setup)
  const handleImageUpload = async (e) => {
    console.log("Profile image selected");

    const file = e.target.files?.[0];
    if (!file || uploading) return;

    e.target.value = "";

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        file.type
      )
    ) {
      setErrors((prev) => ({
        ...prev,
        image_url: "শুধু JPG, PNG অথবা WebP ছবি দিন",
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        image_url: "ছবির সাইজ সর্বোচ্চ ৫ MB হতে পারবে",
      }));
      return;
    }

    const apiKey = import.meta.env.VITE_IMGBB_API_KEY;

    if (!apiKey) {
      setErrors((prev) => ({
        ...prev,
        image_url: "ImgBB API key পাওয়া যায়নি",
      }));
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setErrors((prev) => ({ ...prev, image_url: "" }));
    setForm((prev) => ({ ...prev, image_url: "" }));

    try {
      const imageData = new FormData();
      imageData.append("image", file);

      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          body: imageData,
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success || !result.data?.url) {
        throw new Error("Upload failed");
      }

      setForm((prev) => ({
        ...prev,
        image_url: result.data.url,
      }));

      console.log("Profile image uploaded successfully");
    } catch {
      setErrors((prev) => ({
        ...prev,
        image_url: "ছবি আপলোড হয়নি। আবার চেষ্টা করুন",
      }));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    if (uploading) return;

    console.log("Remove image clicked");

    setPreview("");
    setForm((prev) => ({ ...prev, image_url: "" }));
    setErrors((prev) => ({ ...prev, image_url: "" }));
  };

  // Register with Firebase
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (uploading || submitting) return;

    setFormError("");

    const newErrors = {};

    Object.keys(initialForm).forEach((field) => {
      newErrors[field] = validateField(
        field,
        form[field],
        form
      );
    });

    setErrors(newErrors);

    setTouched(
      Object.fromEntries(
        Object.keys(initialForm).map((field) => [field, true])
      )
    );

    if (Object.values(newErrors).some(Boolean)) return;

    setSubmitting(true);

    // Step 1: Create Firebase account
    try {
      await createUser(form.email.trim(), form.password);

      console.log("Firebase account created");
    } catch (error) {
      console.error("Registration error:", error.code);

      const errorMessage = getFirebaseError(error);

      if (
        error.code === "auth/email-already-in-use" ||
        error.code === "auth/invalid-email"
      ) {
        setErrors((prev) => ({
          ...prev,
          email: errorMessage,
        }));
      } else if (error.code === "auth/weak-password") {
        setErrors((prev) => ({
          ...prev,
          password: errorMessage,
        }));
      } else {
        setFormError(errorMessage);
      }

      setSubmitting(false);
      return;
    }

    // Step 2: Update Firebase profile
    try {
      await updateUserProfile({
        displayName: form.name.trim(),
        photoURL: form.image_url || null,
      });

      console.log("User profile updated");
    } catch (error) {
      console.error("Profile update failed:", error.code);
    }

    // Step 3: Send verification email
    let verificationEmailSent = false;

    try {
      await sendVerificationEmail();

      verificationEmailSent = true;
      console.log("Verification email sent");
    } catch (error) {
      console.error(
        "Verification email could not be sent:",
        error.code
      );
    }

    // Step 4: Navigate to verification page.
    // If sending failed, the user can resend from that page.
    navigate("/verify-email", {
      replace: true,
      state: { verificationEmailSent },
    });

    setSubmitting(false);

    // TODO: Save name, email, phone and image_url to MongoDB.
    // New accounts must be assigned the customer role
    // by the trusted backend, never by the frontend.
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-base-300/50 bg-white p-5 shadow-[0_10px_40px_rgba(49,0,57,0.08)] sm:p-7">
        {/* Header */}
        <div className="mb-5">
          <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-secondary">
            <Sparkles size={12} />
            নতুন সদস্য · ACCOUNT REGISTRATION
          </div>

          <h1 className="text-2xl font-bold leading-tight text-primary sm:text-[28px]">
            নতুন অ্যাকাউন্ট তৈরি করুন
          </h1>

          <p className="mt-1.5 text-xs leading-5 text-muted">
            শখবিলাসের সাথে যুক্ত হয়ে আপনার প্রিয় উপহারের
            অভিজ্ঞতা আরও সহজ করুন।
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-3.5"
        >
          {/* Profile photo */}
          <div
            className={`rounded-xl border p-3 ${
              errors.image_url
                ? "border-red-300 bg-red-50"
                : "border-transparent bg-secondary/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex size-13 shrink-0 items-center justify-center overflow-hidden rounded-full border border-secondary/15 bg-white">
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound
                    size={25}
                    className="text-secondary/60"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-primary">
                  প্রোফাইল ছবি (ঐচ্ছিক / Profile Photo)
                </h3>

                <p className="mt-0.5 text-[10px] text-muted">
                  আপনার সুন্দর একটি প্রোফাইল ছবি যোগ করুন
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="register-image"
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-secondary/15 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-secondary transition hover:border-secondary/40 ${
                      uploading || submitting
                        ? "pointer-events-none opacity-60"
                        : ""
                    }`}
                  >
                    {uploading ? (
                      <LoaderCircle
                        size={12}
                        className="animate-spin"
                      />
                    ) : (
                      <Camera size={12} />
                    )}

                    {uploading
                      ? "আপলোড হচ্ছে..."
                      : "ছবি নির্বাচন করুন"}
                  </label>

                  <input
                    id="register-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploading || submitting}
                    className="sr-only"
                  />

                  {preview && !uploading && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={submitting}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 hover:underline"
                    >
                      <X size={12} />
                      সরান
                    </button>
                  )}
                </div>

                <p className="mt-1 text-[10px] text-muted/70">
                  JPG, PNG, WebP (সর্বোচ্চ ৫ MB)
                </p>
              </div>
            </div>

            {form.image_url && (
              <p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-green-700">
                <CheckCircle2 size={12} />
                ছবি আপলোড সম্পন্ন হয়েছে
              </p>
            )}

            {errors.image_url && (
              <p
                role="alert"
                className="mt-2 text-xs text-red-600"
              >
                {errors.image_url}
              </p>
            )}
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="register-name"
              className="mb-1.5 block text-xs font-semibold text-primary"
            >
              পূর্ণ নাম (Full Name)
              <span className="ml-1 text-red-500">*</span>
            </label>

            <div className="relative">
              <UserRound
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/60"
              />

              <input
                id="register-name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="উদাঃ আপনার নাম"
                autoComplete="name"
                aria-invalid={!!errors.name}
                disabled={submitting}
                className={`${inputClass("name")} pl-10`}
              />
            </div>

            {errors.name && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="register-email"
              className="mb-1.5 block text-xs font-semibold text-primary"
            >
              ইমেইল অ্যাড্রেস (Email)
              <span className="ml-1 text-red-500">*</span>
            </label>

            <div className="relative">
              <Mail
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/60"
              />

              <input
                id="register-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="example@gmail.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                disabled={submitting}
                className={`${inputClass("email")} pl-10`}
              />
            </div>

            {errors.email && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="register-phone"
              className="mb-1.5 block text-xs font-semibold text-primary"
            >
              মোবাইল নম্বর (Mobile Number)
              <span className="ml-1 text-red-500">*</span>
            </label>

            <div className="relative">
              <Phone
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/60"
              />

              <input
                id="register-phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                maxLength={11}
                value={form.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="01XXXXXXXXX"
                autoComplete="tel"
                aria-invalid={!!errors.phone}
                disabled={submitting}
                className={`${inputClass("phone")} pl-10`}
              />
            </div>

            {errors.phone && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {errors.phone}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="register-password"
              className="mb-1.5 block text-xs font-semibold text-primary"
            >
              পাসওয়ার্ড (Password)
              <span className="ml-1 text-red-500">*</span>
            </label>

            <div className="relative">
              <LockKeyhole
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/60"
              />

              <input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="কমপক্ষে ৮ অক্ষর"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                disabled={submitting}
                className={`${inputClass("password")} pl-10 pr-11`}
              />

              <button
                type="button"
                onClick={() => {
                  console.log("Password visibility clicked");
                  setShowPassword((prev) => !prev);
                }}
                aria-label={
                  showPassword
                    ? "পাসওয়ার্ড লুকান"
                    : "পাসওয়ার্ড দেখুন"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:text-secondary"
              >
                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>

            {errors.password && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="register-confirm"
              className="mb-1.5 block text-xs font-semibold text-primary"
            >
              পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)
              <span className="ml-1 text-red-500">*</span>
            </label>

            <div className="relative">
              <LockKeyhole
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/60"
              />

              <input
                id="register-confirm"
                name="confirmPassword"
                type={
                  showConfirmPassword ? "text" : "password"
                }
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="পাসওয়ার্ড আবার লিখুন"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                disabled={submitting}
                className={`${inputClass("confirmPassword")} pl-10 pr-11`}
              />

              <button
                type="button"
                onClick={() => {
                  console.log("Confirm password visibility clicked");
                  setShowConfirmPassword((prev) => !prev);
                }}
                aria-label={
                  showConfirmPassword
                    ? "পাসওয়ার্ড লুকান"
                    : "পাসওয়ার্ড দেখুন"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:text-secondary"
              >
                {showConfirmPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>

            {errors.confirmPassword && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Terms */}
          <div>
            <div className="flex items-start gap-2.5">
              <input
                id="register-agree"
                type="checkbox"
                name="agree"
                checked={form.agree}
                onChange={handleChange}
                disabled={submitting}
                className="checkbox checkbox-secondary checkbox-xs mt-1 rounded-sm"
              />

              <div className="text-[11px] leading-5 text-muted">
                <label
                  htmlFor="register-agree"
                  className="cursor-pointer"
                >
                  আমি শখবিলাসের{" "}
                </label>

                <Link
                  to="/terms"
                  className="font-semibold text-secondary hover:underline"
                >
                  শর্তাবলি
                </Link>

                {" "}ও{" "}

                <Link
                  to="/privacy-policy"
                  className="font-semibold text-secondary hover:underline"
                >
                  গোপনীয়তা নীতি
                </Link>

                {" "}মেনে নিচ্ছি।
                <span className="ml-1 text-red-500">*</span>
              </div>
            </div>

            {errors.agree && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {errors.agree}
              </p>
            )}
          </div>

          {/* General Error */}
          {formError && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-600"
            >
              {formError}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading || submitting}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-3 text-sm font-bold text-white shadow-[0_4px_12px_rgba(118,37,138,0.18)] transition-all duration-200 hover:bg-primary hover:shadow-lg active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting || uploading ? (
              <>
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
                {uploading
                  ? "ছবি আপলোড হচ্ছে..."
                  : "অ্যাকাউন্ট তৈরি হচ্ছে..."}
              </>
            ) : (
              <>
                অ্যাকাউন্ট তৈরি করুন (Create Account)
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 border-t border-base-300/70 pt-5">
          <p className="text-center text-xs text-muted">
            ইতোমধ্যে অ্যাকাউন্ট আছে?{" "}
            <Link
              to="/login"
              className="font-bold text-secondary hover:text-primary hover:underline"
            >
              লগইন করুন (Log In) →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
