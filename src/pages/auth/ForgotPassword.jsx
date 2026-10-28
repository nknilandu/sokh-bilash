
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Mail,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [message, setMessage] = useState("");

  const validateEmail = (value) => {
    if (!value.trim()) {
      return "ইমেইল অ্যাড্রেস লিখুন";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      return "সঠিক ইমেইল অ্যাড্রেস লিখুন";
    }

    return "";
  };

  const handleChange = (e) => {
    const value = e.target.value;

    setEmail(value);
    setMessage("");

    if (touched) {
      setError(validateEmail(value));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateEmail(email));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Reset Password button clicked");

    setTouched(true);

    const newError = validateEmail(email);
    setError(newError);
    setMessage("");

    if (newError) return;

    console.log("Forgot Password submitted:", {
      email: email.trim(),
    });

    setMessage(
      "ডেমো মোড: তথ্য যাচাই হয়েছে। রিসেট ইমেইল এখনো পাঠানো হয়নি।"
    );

    // TODO: Firebase sendPasswordResetEmail()
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-base-300/50 bg-white p-5 shadow-[0_10px_40px_rgba(49,0,57,0.08)] sm:p-7">

        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-secondary">
            <Sparkles size={12} />
            অ্যাকাউন্ট রিকভারি · PASSWORD RESET
          </div>

          <h1 className="text-2xl font-bold leading-tight text-primary sm:text-[28px]">
            পাসওয়ার্ড ভুলে গেছেন?
          </h1>

          <p className="mt-2 text-xs leading-5 text-muted sm:text-sm">
            আপনার অ্যাকাউন্টের ইমেইল অ্যাড্রেস দিন।
            পাসওয়ার্ড রিসেট করার নির্দেশনা পাবেন।
          </p>
        </div>

        {/* Information box */}
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-secondary/5 p-3.5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-secondary/15 bg-secondary/10 text-secondary">
            <KeyRound size={23} strokeWidth={1.7} />
          </div>

          <div>
            <h3 className="text-xs font-bold text-primary">
              আপনার অ্যাকাউন্ট পুনরুদ্ধার করুন
            </h3>

            <p className="mt-1 text-[11px] leading-5 text-muted">
              ইমেইলে পাঠানো নির্দেশনা অনুসরণ করে
              নতুন পাসওয়ার্ড সেট করতে পারবেন।
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="forgot-email"
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
                id="forgot-email"
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="উদাঃ example@gmail.com"
                autoComplete="email"
                aria-invalid={!!error}
                aria-describedby={
                  error ? "forgot-email-error" : undefined
                }
                className={`w-full rounded-lg border bg-secondary/5 py-3 pl-10 pr-4 text-sm text-primary outline-none transition-all duration-200 placeholder:text-muted/60 ${
                  error
                    ? "border-red-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/10"
                    : "border-transparent hover:border-secondary/20 focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/10"
                }`}
              />
            </div>

            {error && (
              <p
                id="forgot-email-error"
                role="alert"
                className="mt-1 text-xs font-medium text-red-600"
              >
                {error}
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-3 text-sm font-bold text-white shadow-[0_4px_12px_rgba(118,37,138,0.18)] transition-all duration-200 hover:bg-primary hover:shadow-lg active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/20"
          >
            রিসেট লিংক পাঠান (Reset Password)
            <ArrowRight size={17} />
          </button>

          {message && (
            <p
              role="status"
              className="rounded-lg border border-secondary/15 bg-secondary/5 px-3 py-2 text-center text-xs leading-6 text-secondary"
            >
              {message}
            </p>
          )}
        </form>

        {/* Help note */}
        <div className="mt-5 flex items-start gap-2 rounded-lg bg-base-200 p-3">
          <ShieldCheck
            size={16}
            className="mt-0.5 shrink-0 text-secondary"
          />

          <p className="text-[11px] leading-5 text-muted">
            নিরাপত্তার জন্য পাসওয়ার্ড রিসেট করার সময়
            শুধু আপনার অ্যাকাউন্টের ইমেইল ব্যবহার করুন।
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-base-300/70 pt-5">
          <Link
            to="/login"
            onClick={() =>
              console.log("Back to Login clicked")
            }
            className="flex items-center justify-center gap-2 text-xs font-bold text-secondary transition hover:text-primary hover:underline"
          >
            <ArrowLeft size={16} />
            লগইন পেজে ফিরে যান (Log In)
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
