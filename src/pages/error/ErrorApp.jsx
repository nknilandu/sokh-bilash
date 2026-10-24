
import {
  isRouteErrorResponse,
  Link,
  useNavigate,
  useRouteError,
} from "react-router-dom";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Home,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

const ErrorApp = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  const isRouteError = isRouteErrorResponse(error);

  const status = isRouteError ? error.status : 500;

  const isNotFound = status === 404;

  const title = isNotFound
    ? "পেজটি খুঁজে পাওয়া যায়নি!"
    : "দুঃখিত, কিছু একটা সমস্যা হয়েছে!";

  const description = isNotFound
    ? "আপনি যে পেজটি খুঁজছেন সেটি পাওয়া যায়নি। অনুগ্রহ করে সঠিক লিংক ব্যবহার করুন।"
    : "আমাদের ওয়েবসাইটে সাময়িক একটি সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন। সমস্যাটি চলতে থাকলে আমাদের সঙ্গে যোগাযোগ করুন।";

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <main className="page-bg flex min-h-screen items-center justify-center overflow-hidden py-12">
      <div className="page-container">

        <div className="mx-auto max-w-xl text-center">

          {/* Error Icon */}
          <div className="relative mx-auto mb-8 flex size-32 items-center justify-center sm:size-40">

            <div className="absolute inset-0 rounded-full bg-secondary/10 blur-2xl" />

            <div className="relative flex size-24 items-center justify-center rounded-3xl border border-secondary/10 bg-base-200 text-secondary shadow-sm sm:size-28">
              {isNotFound ? (
                <ShieldAlert size={48} strokeWidth={1.5} />
              ) : (
                <AlertTriangle size={48} strokeWidth={1.5} />
              )}
            </div>

            <div className="absolute -right-1 top-2 flex size-11 items-center justify-center rounded-xl bg-gold-soft text-primary shadow-md">
              <Sparkles size={21} />
            </div>
          </div>

          {/* Status */}
          <span className="badge-soft">
            <AlertTriangle size={14} />
            Error {status}
          </span>

          {/* Heading */}
          <h1 className="mt-5 text-2xl font-extrabold leading-tight text-primary sm:text-4xl">
            {title}
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted sm:text-base">
            {description}
          </p>

          {/* Error Information */}
          <div className="mt-7 rounded-2xl border border-base-300 bg-base-200/70 p-4 text-left sm:p-5">

            <div className="flex items-start gap-3">

              <div className="icon-box">
                <ShieldAlert size={20} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-primary">
                  কী করতে পারেন?
                </h3>

                <p className="mt-2 text-xs leading-6 text-muted sm:text-sm">
                  পেজটি রিফ্রেশ করে আবার চেষ্টা করুন।
                  সমস্যাটি সমাধান না হলে কিছুক্ষণ অপেক্ষা
                  করুন অথবা হোমপেজে ফিরে যান।
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">

            <button
              type="button"
              onClick={handleRetry}
              className="btn-brand rounded-xl px-7"
            >
              <RefreshCcw size={17} />
              আবার চেষ্টা করুন
            </button>

            <Link
              to="/"
              className="btn-outline-brand rounded-xl px-7"
            >
              <Home size={17} />
              হোমপেজে যান
              <ArrowRight size={16} />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-secondary transition hover:text-primary"
          >
            <ArrowLeft size={16} />
            আগের পেজে ফিরে যান
          </button>

          {/* Footer */}
          <div className="mt-10 border-t border-base-300 pt-6">
            <p className="text-xs leading-6 text-muted">
              আপনার উপহার কেনাকাটার অভিজ্ঞতা সুন্দর
              রাখতে আমরা সবসময় চেষ্টা করছি।
              <br />
              ধন্যবাদ SokhBilash-এর সঙ্গে থাকার জন্য।
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ErrorApp;
