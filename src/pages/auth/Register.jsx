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
import Swal from "sweetalert2";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const initialForm = {
  name: "",
  email: "",
  phone: "",
  image_url: "",
  password: "",
  confirmPassword: "",
  agree: false,
};

// ================= Validation =================

const validateField = (name, value, form) => {
  switch (name) {
    case "name":
      if (!value.trim()) return "আপনার পুরো নাম লিখুন";
      if (value.trim().length < 2) return "নাম কমপক্ষে ২ অক্ষরের হতে হবে";
      return "";

    case "email":
      if (!value.trim()) return "ইমেইল অ্যাড্রেস লিখুন";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
        return "সঠিক ইমেইল অ্যাড্রেস লিখুন";
      return "";

    case "phone":
      if (!value.trim()) return "মোবাইল নম্বর লিখুন";
      if (!/^01[3-9]\d{8}$/.test(value.trim()))
        return "সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন";
      return "";

    case "password":
      if (!value) return "পাসওয়ার্ড লিখুন";
      if (value.length < 8) return "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে";
      return "";

    case "confirmPassword":
      if (!value) return "পাসওয়ার্ড নিশ্চিত করুন";
      if (value !== form.password) return "পাসওয়ার্ড দুটি মিলছে না";
      return "";

    case "agree":
      return value ? "" : "শর্তাবলিতে সম্মতি দিন";

    default:
      return "";
  }
};

// ================= Firebase Errors =================

const firebaseErrorMessage = (error) => {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "এই ইমেইল দিয়ে ইতোমধ্যে অ্যাকাউন্ট আছে।";

    case "auth/invalid-email":
      return "সঠিক ইমেইল অ্যাড্রেস লিখুন।";

    case "auth/weak-password":
      return "আরও শক্তিশালী পাসওয়ার্ড দিন।";

    case "auth/network-request-failed":
      return "ইন্টারনেট সংযোগ পরীক্ষা করুন।";

    case "auth/too-many-requests":
      return "অনেকবার চেষ্টা হয়েছে। পরে আবার চেষ্টা করুন।";

    case "auth/operation-not-allowed":
      return "Firebase Email/Password Authentication চালু নেই।";

    default:
      return "অ্যাকাউন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।";
  }
};

// ================= Reusable Input =================

const FormInput = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  icon: Icon,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
  disabled,
  rightAction,
}) => (
  <div>
    <label
      htmlFor={`register-${name}`}
      className="mb-1.5 block text-xs font-semibold text-primary"
    >
      {label}
      <span className="ml-1 text-red-500">*</span>
    </label>

    <div className="relative">
      <Icon
        size={17}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/60"
      />

      <input
        id={`register-${name}`}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={!!error}
        className={`w-full rounded-lg border bg-secondary/5
          py-3 pl-10 text-sm text-primary outline-none
          transition-all duration-200
          placeholder:text-muted/60
          ${rightAction ? "pr-12" : "pr-4"}
          ${
            error
              ? "border-red-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/10"
              : "border-transparent hover:border-secondary/20 focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/10"
          }
          disabled:cursor-not-allowed disabled:opacity-60`}
      />

      {rightAction && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightAction}
        </div>
      )}
    </div>

    {error && (
      <p role="alert" className="mt-1 text-xs text-red-600">
        {error}
      </p>
    )}
  </div>
);

// ================= Register Page =================

const Register = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formError, setFormError] = useState("");

  // Reuse Firebase account when retrying database save
  const [registeredFirebaseUser, setRegisteredFirebaseUser] = useState(null);

  // Clean up image preview URLs
  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // ================= Form Change =================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const nextValue = type === "checkbox" ? checked : value;
    const nextForm = { ...form, [name]: nextValue };

    setForm(nextForm);
    setFormError("");

    setErrors((prev) => ({
      ...prev,
      [name]:
        touched[name] || prev[name]
          ? validateField(name, nextValue, nextForm)
          : "",
      ...(name === "password" &&
      (touched.confirmPassword || prev.confirmPassword)
        ? {
            confirmPassword: validateField(
              "confirmPassword",
              nextForm.confirmPassword,
              nextForm,
            ),
          }
        : {}),
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value, form),
    }));
  };

  // ================= Image Upload =================

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file || uploading || submitting) return;

    e.target.value = "";

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        image_url: "শুধু JPG, PNG অথবা WebP ছবি দিন",
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        image_url: "ছবির সাইজ সর্বোচ্চ ৫ MB",
      }));
      return;
    }

    const apiKey = import.meta.env.VITE_IMGBB_API_KEY;

    if (!apiKey) {
      setErrors((prev) => ({
        ...prev,
        image_url: "ছবি আপলোডের সার্ভিস পাওয়া যাচ্ছে না",
      }));

      Swal.fire({
        title: "ছবি ছাড়াও অ্যাকাউন্ট তৈরি করতে পারবেন।",
        icon: "warning",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });

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
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success || !result.data?.url) {
        throw new Error("Image upload failed");
      }

      setForm((prev) => ({
        ...prev,
        image_url: result.data.url,
      }));

      setErrors((prev) => ({
        ...prev,
        image_url: "",
      }));
    } catch (error) {
      console.error("Image Upload Error:", error);

      // Photo is optional.
      // Clear failed upload without blocking registration.
      setPreview("");

      setForm((prev) => ({
        ...prev,
        image_url: "",
      }));

      setErrors((prev) => ({
        ...prev,
        image_url: "",
      }));

      Swal.fire({
        title: "ছবি আপলোড হয়নি। ছবি ছাড়াও অ্যাকাউন্ট তৈরি করতে পারবেন।",
        icon: "warning",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    if (uploading || submitting) return;

    setPreview("");

    setForm((prev) => ({
      ...prev,
      image_url: "",
    }));

    setErrors((prev) => ({
      ...prev,
      image_url: "",
    }));
  };

  // ================= Registration =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting || uploading || !auth) return;

    setFormError("");

    const validationFields = [
      "name",
      "email",
      "phone",
      "password",
      "confirmPassword",
      "agree",
    ];

    const newErrors = {};

    validationFields.forEach((field) => {
      newErrors[field] = validateField(field, form[field], form);
    });

    setErrors((prev) => ({
      ...prev,
      ...newErrors,
    }));

    setTouched(
      Object.fromEntries(validationFields.map((field) => [field, true])),
    );

    // Profile photo is NOT required
    if (Object.values(newErrors).some(Boolean)) {
      return;
    }

    setSubmitting(true);

    let firebaseUser = registeredFirebaseUser;

    try {
      // STEP 1: Create Firebase account
      if (!firebaseUser) {
        const credential = await auth.createUser(
          form.email.trim(),
          form.password,
        );

        firebaseUser = credential.user;
        setRegisteredFirebaseUser(firebaseUser);
      }

      // STEP 2: Update Firebase profile
      await auth.updateUserProfile({
        displayName: form.name.trim(),
        photoURL: form.image_url || null,
      });

      // STEP 3: Get Firebase ID token
      const token = await firebaseUser.getIdToken();

      // STEP 4: Save user in MongoDB
      const response = await fetch(`${API_URL}/users`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: form.name.trim(),
          phone: form.phone.trim(),
          photoUrl: form.image_url || "",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save user in MongoDB");
      }

      // STEP 5: Registration success
      Swal.fire({
        title: "আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Registration Error:", error);

      let message = "";

      if (error.code?.startsWith("auth/")) {
        message = firebaseErrorMessage(error);

        if (
          error.code === "auth/email-already-in-use" ||
          error.code === "auth/invalid-email"
        ) {
          setErrors((prev) => ({
            ...prev,
            email: message,
          }));
        } else if (error.code === "auth/weak-password") {
          setErrors((prev) => ({
            ...prev,
            password: message,
          }));
        } else {
          setFormError(message);
        }
      } else if (firebaseUser) {
        message =
          "অ্যাকাউন্ট তৈরি হয়েছে, কিন্তু তথ্য সংরক্ষণ সম্পন্ন হয়নি। আবার চেষ্টা করুন।";

        setFormError(message);
      } else {
        message =
          error.message || "অ্যাকাউন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।";

        setFormError(message);
      }

      Swal.fire({
        title: message,
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ================= Context Error =================

  if (!auth) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        AuthProvider পাওয়া যায়নি। main.jsx-এ AuthProvider দিয়ে RouterProvider
        wrap করুন।
      </div>
    );
  }

  const busy = uploading || submitting;

  // ================= UI =================

  return (
    <div className="mx-auto w-full max-w-md px-2 py-5 sm:px-0">
      <div className="rounded-2xl border border-base-300/50 bg-white p-5 shadow-[0_10px_40px_rgba(49,0,57,0.08)] sm:p-7">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-secondary">
            <Sparkles size={12} />
            নতুন সদস্য · ACCOUNT REGISTRATION
          </div>

          <h1 className="text-2xl font-bold leading-tight text-primary sm:text-[28px]">
            নতুন অ্যাকাউন্ট তৈরি করুন
          </h1>

          <p className="mt-2 text-xs leading-5 text-muted">
            শখবিলাসের সাথে যুক্ত হয়ে আপনার প্রিয় উপহারের অভিজ্ঞতা আরও সহজ করুন।
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
          {/* Profile Photo - Optional */}
          <div className="rounded-xl border border-transparent bg-secondary/5 p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-secondary/15 bg-white">
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound size={25} className="text-secondary/60" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-primary">
                  প্রোফাইল ছবি (ঐচ্ছিক)
                </h3>

                <p className="mt-0.5 text-[10px] text-muted">
                  JPG, PNG, WebP · সর্বোচ্চ ৫ MB
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="register-image"
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-secondary/15 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-secondary transition hover:border-secondary/40 ${
                      busy ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    {uploading ? (
                      <LoaderCircle size={12} className="animate-spin" />
                    ) : (
                      <Camera size={12} />
                    )}

                    {uploading ? "আপলোড হচ্ছে..." : "ছবি নির্বাচন করুন"}
                  </label>

                  <input
                    id="register-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={busy}
                    onChange={handleImageUpload}
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
              </div>
            </div>

            {form.image_url && (
              <p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-green-700">
                <CheckCircle2 size={12} />
                ছবি আপলোড সম্পন্ন হয়েছে
              </p>
            )}

            {errors.image_url && (
              <p className="mt-2 text-xs text-amber-700">
                {errors.image_url}। ছবি ছাড়াও নিবন্ধন করা যাবে।
              </p>
            )}
          </div>

          {/* Full Name */}
          <FormInput
            label="পূর্ণ নাম (Full Name)"
            name="name"
            icon={UserRound}
            value={form.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="উদাঃ আপনার নাম"
            autoComplete="name"
            error={errors.name}
            disabled={submitting}
          />

          {/* Email */}
          <FormInput
            label="ইমেইল অ্যাড্রেস (Email)"
            name="email"
            icon={Mail}
            type="email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="example@gmail.com"
            autoComplete="email"
            error={errors.email}
            disabled={submitting || !!registeredFirebaseUser}
          />

          {/* Phone */}
          <FormInput
            label="মোবাইল নম্বর (Mobile Number)"
            name="phone"
            icon={Phone}
            type="tel"
            inputMode="numeric"
            maxLength={11}
            value={form.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="01XXXXXXXXX"
            autoComplete="tel"
            error={errors.phone}
            disabled={submitting}
          />

          {/* Password */}
          <FormInput
            label="পাসওয়ার্ড (Password)"
            name="password"
            icon={LockKeyhole}
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="কমপক্ষে ৮ অক্ষর"
            autoComplete="new-password"
            error={errors.password}
            disabled={submitting || !!registeredFirebaseUser}
            rightAction={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"
                }
                className="rounded-md p-1 text-muted hover:text-secondary"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            }
          />

          {/* Confirm Password */}
          <FormInput
            label="পাসওয়ার্ড নিশ্চিত করুন"
            name="confirmPassword"
            icon={LockKeyhole}
            type={showConfirmPassword ? "text" : "password"}
            value={form.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="পাসওয়ার্ড আবার লিখুন"
            autoComplete="new-password"
            error={errors.confirmPassword}
            disabled={submitting || !!registeredFirebaseUser}
            rightAction={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"
                }
                className="rounded-md p-1 text-muted hover:text-secondary"
              >
                {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            }
          />

          {/* Terms */}
          <div>
            <div className="flex items-start gap-2.5">
              <input
                id="register-agree"
                name="agree"
                type="checkbox"
                checked={form.agree}
                onChange={handleChange}
                disabled={submitting}
                className="checkbox checkbox-secondary checkbox-xs mt-1 rounded-sm"
              />

              <div className="text-[11px] leading-5 text-muted">
                <label htmlFor="register-agree" className="cursor-pointer">
                  আমি শখবিলাসের{" "}
                </label>

                <Link
                  to="/terms"
                  className="font-semibold text-secondary hover:underline"
                >
                  শর্তাবলি
                </Link>

                {" ও "}

                <Link
                  to="/privacy-policy"
                  className="font-semibold text-secondary hover:underline"
                >
                  গোপনীয়তা নীতি
                </Link>

                {" মেনে নিচ্ছি।"}
              </div>
            </div>

            {errors.agree && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {errors.agree}
              </p>
            )}
          </div>

          {/* Registration Error */}
          {formError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700"
            >
              {formError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={busy}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-3 text-sm font-bold text-white shadow-[0_4px_12px_rgba(118,37,138,0.18)] transition-all duration-200 hover:bg-primary hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                {uploading ? "ছবি আপলোড হচ্ছে..." : "অ্যাকাউন্ট তৈরি হচ্ছে..."}
              </>
            ) : (
              <>
                {registeredFirebaseUser
                  ? "আবার সংরক্ষণ করুন"
                  : "অ্যাকাউন্ট তৈরি করুন"}
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
              লগইন করুন (Log In)
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
