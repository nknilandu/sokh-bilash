import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";

import { AuthContext } from "../../../providers/AuthProvider";
import { app } from "../../../firebase/firebase.config";
import Swal from "sweetalert2";

const firebaseAuth = getAuth(app);

// ================= Firebase Errors =================

const getFirebaseError = (error) => {
  switch (error.code) {
    case "auth/invalid-email":
      return "সঠিক ইমেইল অ্যাড্রেস লিখুন।";

    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।";

    case "auth/user-disabled":
      return "এই অ্যাকাউন্টটি বন্ধ করা হয়েছে।";

    case "auth/too-many-requests":
      return "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে চেষ্টা করুন।";

    case "auth/network-request-failed":
      return "ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।";

    case "auth/operation-not-allowed":
      return "Email/Password Login চালু নেই।";

    default:
      return "লগইন করা যায়নি। আবার চেষ্টা করুন।";
  }
};

// ================= Login Page =================

const Login = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ================= Validation =================

  const validateField = (name, value) => {
    if (name === "email") {
      if (!value.trim()) {
        return "ইমেইল অ্যাড্রেস লিখুন";
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        return "সঠিক ইমেইল অ্যাড্রেস লিখুন";
      }
    }

    if (name === "password") {
      if (!value) {
        return "পাসওয়ার্ড লিখুন";
      }
    }

    return "";
  };

  // ================= Input Change =================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const newValue = type === "checkbox" ? checked : value;

    setForm((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    setFormError("");

    if (name !== "rememberMe") {
      setErrors((prev) => ({
        ...prev,
        [name]:
          touched[name] || prev[name] ? validateField(name, newValue) : "",
      }));
    }
  };

  // ================= Input Blur =================

  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  // ================= Login Handler =================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting || !authContext?.loginUser) return;

    setFormError("");

    // Step 1: Validate fields
    const newErrors = {
      email: validateField("email", form.email),
      password: validateField("password", form.password),
    };

    setErrors(newErrors);

    setTouched({
      email: true,
      password: true,
    });

    if (Object.values(newErrors).some(Boolean)) {
      return;
    }

    setSubmitting(true);

    try {
      // Step 2: Set login persistence
      await setPersistence(
        firebaseAuth,
        form.rememberMe ? browserLocalPersistence : browserSessionPersistence,
      );

      // Step 3: Firebase login
      await authContext.loginUser(form.email.trim(), form.password);

      // Step 4: Show success message
      Swal.fire({
        title: "সফলভাবে লগইন হয়েছে!",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

      // Step 5: Redirect to homepage
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Login Error:", error.code || error.message);

      const message = getFirebaseError(error);

      if (error.code === "auth/invalid-email") {
        setErrors((prev) => ({
          ...prev,
          email: message,
        }));
      } else {
        setFormError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ================= Input Style =================

  const inputClass = (field) => `
    w-full rounded-lg border px-4 py-3
    bg-secondary/5 text-sm text-primary
    outline-none transition-all duration-200
    placeholder:text-muted/60
    ${
      errors[field]
        ? "border-red-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/10"
        : "border-transparent hover:border-secondary/20 focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/10"
    }
    disabled:cursor-not-allowed disabled:opacity-60
  `;

  // ================= Auth Context Check =================

  if (!authContext?.loginUser) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        AuthProvider পাওয়া যায়নি। main.jsx-এ AuthProvider দিয়ে RouterProvider
        wrap করুন।
      </div>
    );
  }

  // ================= UI =================

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-base-300/50 bg-white p-5 shadow-[0_10px_40px_rgba(49,0,57,0.08)] sm:p-7">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-secondary">
            <Sparkles size={12} />
            স্বাগতম · ACCOUNT LOGIN
          </div>

          <h1 className="text-2xl font-bold leading-tight text-primary sm:text-[28px]">
            আপনার অ্যাকাউন্টে লগইন করুন
          </h1>

          <p className="mt-1.5 text-xs leading-5 text-muted sm:text-sm">
            শখবিলাসের সাথে যুক্ত হয়ে আপনার প্রিয় উপহারের অভিজ্ঞতা আরও সহজ করুন।
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
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
                id="login-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="উদাঃ example@gmail.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={
                  errors.email ? "login-email-error" : undefined
                }
                disabled={submitting}
                className={`${inputClass("email")} pl-10`}
              />
            </div>

            {errors.email && (
              <p
                id="login-email-error"
                role="alert"
                className="mt-1 text-xs text-red-600"
              >
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label
                htmlFor="login-password"
                className="text-xs font-semibold text-primary"
              >
                পাসওয়ার্ড (Password)
                <span className="ml-1 text-red-500">*</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-[11px] font-semibold text-secondary transition hover:text-primary hover:underline"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>

            <div className="relative">
              <LockKeyhole
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/60"
              />

              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "login-password-error" : undefined
                }
                disabled={submitting}
                className={`${inputClass("password")} pl-10 pr-11`}
              />

              <button
                type="button"
                aria-label={
                  showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"
                }
                aria-pressed={showPassword}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted transition hover:text-secondary focus-visible:outline-2 focus-visible:outline-secondary"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {errors.password && (
              <p
                id="login-password-error"
                role="alert"
                className="mt-1 text-xs text-red-600"
              >
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="login-remember"
              type="checkbox"
              name="rememberMe"
              checked={form.rememberMe}
              onChange={handleChange}
              disabled={submitting}
              className="checkbox checkbox-secondary checkbox-xs rounded-sm"
            />

            <label
              htmlFor="login-remember"
              className="cursor-pointer text-xs text-muted"
            >
              আমাকে মনে রাখুন (Remember Me)
            </label>
          </div>

          {/* General Login Error */}
          {formError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700"
            >
              {formError}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={submitting}
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-3 text-sm font-bold text-white shadow-[0_4px_12px_rgba(118,37,138,0.18)] transition-all duration-200 hover:bg-primary hover:shadow-lg active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                লগইন হচ্ছে...
              </>
            ) : (
              <>
                লগইন করুন (Log In)
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 border-t border-base-300/70" />

        {/* Register Link */}
        <p className="text-center text-xs text-muted">
          নতুন অ্যাকাউন্ট তৈরি করতে চান?{" "}
          <Link
            to="/register"
            className="font-bold text-secondary transition hover:text-primary hover:underline"
          >
            সাইন আপ করুন (Sign Up)
            <span className="ml-1">→</span>
          </Link>
        </p>

        {/* Guest Shopping */}
        <p className="mt-4 text-center text-[11px] text-muted">
          অ্যাকাউন্ট ছাড়াও কেনাকাটা করতে পারবেন।{" "}
          <Link
            to="/shop"
            className="font-semibold text-secondary hover:underline"
          >
            উপহার দেখুন
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
