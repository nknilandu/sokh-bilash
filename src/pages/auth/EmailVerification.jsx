
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MailCheck,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  getAuth,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
} from "firebase/auth";

const EmailVerification = () => {
  const navigate = useNavigate();
  const auth = getAuth();

  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Listen for Firebase user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, [auth]);

  // Resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setTimeout(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  // Firebase error messages
  const getErrorMessage = (err) => {
    switch (err.code) {
      case "auth/too-many-requests":
        return "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।";

      case "auth/network-request-failed":
        return "ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।";

      case "auth/user-token-expired":
        return "আপনার সেশন শেষ হয়েছে। আবার লগইন করুন।";

      default:
        return "একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।";
    }
  };

  // Resend verification email
  const handleResend = async () => {
    console.log("Resend verification button clicked");

    if (!user || loading || cooldown > 0) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await reload(user);

      if (user.emailVerified) {
        setMessage("আপনার ইমেইল ইতোমধ্যে ভেরিফাই করা হয়েছে।");
        return;
      }

      await sendEmailVerification(user);

      setMessage(
        "আপনার ইমেইলে নতুন ভেরিফিকেশন লিংক পাঠানো হয়েছে।"
      );

      setCooldown(60);

      console.log("Verification email resent");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Check email verification status
  const handleCheckVerification = async () => {
    console.log("Check email verification button clicked");

    if (!user || checking) return;

    setChecking(true);
    setError("");
    setMessage("");

    try {
      await reload(user);

      if (user.emailVerified) {
        console.log("Email verification successful");

        setMessage("আপনার ইমেইল সফলভাবে ভেরিফাই হয়েছে।");
      } else {
        setError(
          "ইমেইল এখনো ভেরিফাই হয়নি। ইনবক্সে পাঠানো লিংকে ক্লিক করুন।"
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setChecking(false);
    }
  };

  const isVerified = user?.emailVerified === true;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-base-300/50 bg-white p-5 shadow-[0_10px_40px_rgba(49,0,57,0.08)] sm:p-7">
        {/* Header */}
        <div className="mb-5">
          <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-secondary">
            <ShieldCheck size={12} />
            অ্যাকাউন্ট নিরাপত্তা · EMAIL VERIFICATION
          </div>

          <h1 className="text-2xl font-bold leading-tight text-primary sm:text-[28px]">
            {isVerified
              ? "ইমেইল ভেরিফাই সম্পন্ন!"
              : "আপনার ইমেইল ভেরিফাই করুন"}
          </h1>

          <p className="mt-2 text-xs leading-5 text-muted sm:text-sm">
            {isVerified
              ? "আপনার ইমেইল সফলভাবে যাচাই করা হয়েছে।"
              : "আপনার অ্যাকাউন্ট নিরাপদ রাখতে ইমেইল অ্যাড্রেসটি যাচাই করুন।"}
          </p>
        </div>

        {/* Main verification box */}
        <div className="rounded-xl bg-secondary/5 p-5 text-center">
          <div
            className={`mx-auto flex size-16 items-center justify-center rounded-full border ${
              isVerified
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-secondary/15 bg-secondary/10 text-secondary"
            }`}
          >
            {user === undefined ? (
              <LoaderCircle size={29} className="animate-spin" />
            ) : isVerified ? (
              <CheckCircle2 size={30} strokeWidth={1.7} />
            ) : (
              <MailCheck size={30} strokeWidth={1.7} />
            )}
          </div>

          <h2 className="mt-4 text-sm font-bold text-primary">
            {isVerified
              ? "অভিনন্দন! আপনার ইমেইল যাচাই হয়েছে"
              : "আপনার ইমেইল ইনবক্স চেক করুন"}
          </h2>

          <p className="mt-2 text-xs leading-5 text-muted">
            {user === undefined
              ? "অ্যাকাউন্টের তথ্য লোড হচ্ছে..."
              : user?.email
                ? "এই ইমেইল অ্যাড্রেসে ভেরিফিকেশন লিংক পাঠানো হবে:"
                : "অ্যাকাউন্টে লগইন করে ভেরিফিকেশন সম্পন্ন করুন।"}
          </p>

          {user?.email && (
            <div className="mt-3 break-all rounded-lg border border-secondary/10 bg-white px-3 py-2 text-sm font-semibold text-secondary">
              {user.email}
            </div>
          )}

          {!isVerified && user && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
              <Clock3 size={14} className="text-secondary" />
              লিংকটি পেতে কিছু সময় লাগতে পারে
            </div>
          )}
        </div>

        {/* Instructions */}
        {!isVerified && user && (
          <div className="mt-5">
            <p className="mb-3 text-xs font-bold text-primary">
              কীভাবে ভেরিফাই করবেন?
            </p>

            <div className="space-y-3">
              {[
                "আপনার ইমেইল ইনবক্স খুলুন।",
                "Firebase-এর ভেরিফিকেশন ইমেইলটি খুঁজুন।",
                "ইমেইলের ভেরিফিকেশন লিংকে ক্লিক করুন।",
                "এখানে ফিরে এসে যাচাই বাটনে ক্লিক করুন।",
              ].map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-[11px] font-bold text-secondary">
                    {index + 1}
                  </span>

                  <p className="pt-0.5 text-xs leading-5 text-muted">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-600"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="mt-5 rounded-lg border border-secondary/15 bg-secondary/5 px-3 py-2.5 text-xs leading-5 text-secondary"
          >
            {message}
          </p>
        )}

        {/* Actions */}
        <div className="mt-6 space-y-3">
          {user === undefined ? (
            <button
              disabled
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-sm font-bold text-white opacity-60"
            >
              <LoaderCircle size={17} className="animate-spin" />
              লোড হচ্ছে...
            </button>
          ) : !user ? (
            <Link
              to="/login"
              className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-secondary px-5 text-sm font-bold text-white transition hover:bg-primary"
            >
              লগইন করুন
              <ArrowRight size={17} />
            </Link>
          ) : isVerified ? (
            <button
              type="button"
              onClick={() => {
                console.log("Continue after verification clicked");
                navigate("/", { replace: true });
              }}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary px-5 text-sm font-bold text-white transition hover:bg-primary"
            >
              হোমপেজে যান
              <ArrowRight size={17} />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCheckVerification}
                disabled={checking || loading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary px-5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(118,37,138,0.18)] transition-all hover:bg-primary active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checking ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={17} />
                )}

                {checking
                  ? "যাচাই হচ্ছে..."
                  : "আমি ভেরিফাই করেছি"}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={loading || checking || cooldown > 0}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-secondary/20 bg-secondary/5 px-5 text-sm font-semibold text-secondary transition hover:border-secondary/40 hover:bg-secondary/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <RefreshCw size={17} />
                )}

                {cooldown > 0
                  ? `আবার পাঠাতে পারবেন ${cooldown} সেকেন্ড পর`
                  : "আবার ইমেইল পাঠান"}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-base-300/70 pt-5">
          <p className="text-center text-xs leading-6 text-muted">
            ইমেইল পাননি? Spam বা Junk ফোল্ডার দেখুন।
          </p>

          <div className="mt-3 flex items-center justify-center gap-2">
            <Link
              to="/login"
              className="text-xs font-bold text-secondary transition hover:text-primary hover:underline"
            >
              লগইন পেজে ফিরে যান
            </Link>

            <span className="text-base-300">|</span>

            <Link
              to="/"
              className="text-xs font-bold text-secondary transition hover:text-primary hover:underline"
            >
              হোমপেজ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
