
import { Gift, Sparkles } from "lucide-react";

const LoadingPage = ({
  fullScreen = true,
  message = "আপনার জন্য সুন্দর কিছু প্রস্তুত হচ্ছে...",
  showBrand = true,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="লোড হচ্ছে"
      className={`relative flex w-full items-center justify-center overflow-hidden bg-base-100 px-4 ${
        fullScreen ? "min-h-screen" : "min-h-[350px]"
      }`}
    >
      {/* Background Decorations */}
      <div className="pointer-events-none absolute -left-20 top-1/4 size-64 rounded-full bg-secondary/5 blur-3xl" />

      <div className="pointer-events-none absolute -right-20 bottom-1/4 size-64 rounded-full bg-gold-soft/15 blur-3xl" />

      <div className="relative z-10 flex max-w-md flex-col items-center text-center">

        {/* Animated Gift Loader */}
        <div className="relative mb-8 flex size-36 items-center justify-center sm:size-40">

          {/* Outer Spinning Ring */}
          <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-secondary/10 border-t-secondary border-r-gold-soft [animation-duration:2.5s]" />

          {/* Inner Soft Circle */}
          <div className="absolute inset-4 rounded-full bg-secondary/5" />

          {/* Gift Icon */}
          <div className="relative flex size-20 animate-[bounce_2s_ease-in-out_infinite] items-center justify-center rounded-3xl bg-primary text-gold-soft shadow-xl shadow-secondary/15 sm:size-24">
            <Gift
              size={42}
              strokeWidth={1.7}
            />
          </div>

          {/* Floating Sparkles */}
          <Sparkles
            size={22}
            className="absolute -right-2 top-3 animate-pulse text-secondary"
          />

          <Sparkles
            size={16}
            className="absolute -left-1 bottom-5 animate-pulse text-amber-500 [animation-delay:500ms]"
          />

          <span className="absolute bottom-1 right-2 size-2 animate-ping rounded-full bg-gold-soft" />
        </div>

        {/* Brand */}
        {showBrand && (
          <div className="mb-4">
            <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
              শখবিলাস
            </h1>

            <p className="mt-1 text-xs font-semibold tracking-wide text-secondary">
              ভালোবাসার প্রতিটি মুহূর্তে
            </p>
          </div>
        )}

        {/* Loading Message */}
        <h2 className="text-sm font-semibold text-primary sm:text-base">
          {message}
        </h2>

        {/* Animated Dots */}
        <div
          className="mt-5 flex items-center justify-center gap-2"
          aria-hidden="true"
        >
          <span className="size-2.5 animate-bounce rounded-full bg-primary" />

          <span className="size-2.5 animate-bounce rounded-full bg-secondary [animation-delay:150ms]" />

          <span className="size-2.5 animate-bounce rounded-full bg-gold-soft [animation-delay:300ms]" />
        </div>

        {/* Bottom Text */}
        <p className="mt-5 text-xs text-muted">
          অনুগ্রহ করে একটু অপেক্ষা করুন
        </p>
      </div>
    </div>
  );
};

export default LoadingPage;
