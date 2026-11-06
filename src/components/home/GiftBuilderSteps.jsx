import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Gift,
  Heart,
  PackageCheck,
  ShoppingBag,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { Link } from "react-router-dom";

// ========================================
// SHOPPING STEPS
// ========================================

const steps = [
  {
    number: "০১",
    title: "পছন্দের উপহার খুঁজুন",
    description:
      "ক্যাটাগরি, উপলক্ষ কিংবা সার্চ ব্যবহার করে পছন্দের উপহার বেছে নিন।",
    icon: ShoppingBag,
  },
  {
    number: "০২",
    title: "নিজের মতো কাস্টমাইজ",
    description: "সুবিধা থাকলে পছন্দের সাইজ, ডিজাইন, নাম বা ছবি যোগ করুন।",
    icon: WandSparkles,
  },
  {
    number: "০৩",
    title: "কার্টে যোগ করুন",
    description:
      "পছন্দের উপহার কার্টে রাখুন এবং পরিমাণ ও বিস্তারিত যাচাই করুন।",
    icon: Heart,
  },
  {
    number: "০৪",
    title: "গিফটের বিশেষ আয়োজন",
    description:
      "চাইলে গিফট র‍্যাপিং, সারপ্রাইজ অপশন ও শুভেচ্ছা বার্তা যোগ করুন।",
    icon: Gift,
  },
  {
    number: "০৫",
    title: "অর্ডার নিশ্চিত করুন",
    description:
      "ডেলিভারি ও পেমেন্ট তথ্য দিয়ে অর্ডার সম্পন্ন করুন এবং ট্র্যাক করুন।",
    icon: CheckCircle2,
  },
];

// ========================================
// COMPONENT
// ========================================

const GiftBuilderSteps = () => {
  return (
    <section className="section-bg section-padding pb-12 sm:pb-16">
      <div className="page-container">
        {/* MAIN SECTION */}
        <div className="relative isolate overflow-hidden rounded-3xl bg-primary p-5 text-primary-content shadow-xl sm:p-8 lg:p-10">
          {/* DECORATIVE BACKGROUND */}
          <div className="pointer-events-none absolute -right-20 -top-24 -z-10 size-72 rounded-full bg-secondary opacity-30 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 -left-16 -z-10 size-64 rounded-full bg-purple-500 opacity-20 blur-3xl" />

          {/* ================================= */}
          {/* HEADER */}
          {/* ================================= */}

          <div className="flex flex-col gap-6 border-b border-white/10 pb-7 md:flex-row md:items-center md:justify-between">
            {/* LEFT CONTENT */}
            <div className="max-w-2xl">
              {/* BADGE */}
              <span className="badge-gold inline-flex items-center gap-1.5">
                <Sparkles size={13} />
                সহজ ও সুন্দর কেনাকাটা
              </span>

              {/* HEADING */}
              <h2 className="mt-4 text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                প্রিয়জনের জন্য{" "}
                <span className="text-gold-soft">সেরা উপহার বেছে নিন</span>
              </h2>

              {/* DESCRIPTION */}
              <p className="mt-3 max-w-xl text-xs leading-7 text-white/75 sm:text-sm">
                প্রতিটি বিশেষ মুহূর্তকে আরও স্মরণীয় করে তুলুন। পছন্দের উপহার
                নির্বাচন থেকে কাস্টমাইজেশন, সুন্দর গিফট র‍্যাপিং এবং অর্ডার
                পর্যন্ত — সবকিছু এখন আরও সহজ।
              </p>
            </div>

            {/* CTA BUTTON */}
            <Link
              to="/shop"
              className="btn-gold inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-bold transition hover:-translate-y-0.5 sm:w-auto sm:text-sm"
            >
              <ShoppingBag size={17} />

              <span>এখনই উপহার দেখুন</span>

              <ArrowRight size={17} />
            </Link>
          </div>

          {/* ================================= */}
          {/* FIVE SHOPPING STEPS */}
          {/* ================================= */}

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.08] p-4 transition duration-300 hover:-translate-y-1 hover:border-gold-soft/30 hover:bg-white/[0.12] hover:shadow-lg"
                >
                  {/* STEP NUMBER + ICON */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-lg font-bold text-gold-soft">
                      {step.number}
                    </span>

                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold-soft/10 text-gold-soft transition duration-300 group-hover:bg-gold-soft group-hover:text-primary">
                      <Icon
                        size={20}
                        strokeWidth={1.8}
                        className="transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                  </div>

                  {/* STEP TITLE */}
                  <h3 className="mt-5 text-sm font-bold leading-6 text-white">
                    {step.title}
                  </h3>

                  {/* STEP DESCRIPTION */}
                  <p className="mt-2 text-xs leading-6 text-white/65">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* ================================= */}
          {/* BOTTOM INFORMATION BAR */}
          {/* ================================= */}

          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            {/* INFORMATION */}
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft/10 text-gold-soft">
                <PackageCheck size={20} />
              </div>

              <div>
                <h4 className="text-xs font-bold text-white sm:text-sm">
                  আপনার উপহার, আমাদের যত্নে
                </h4>

                <p className="mt-1 text-xs leading-5 text-white/65">
                  পছন্দের উপহার অর্ডার করুন এবং অর্ডারের সর্বশেষ অবস্থা অনলাইনেই
                  দেখুন।
                </p>
              </div>
            </div>

            {/* QUICK LINKS */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/categories"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-soft transition hover:text-white"
              >
                <Gift size={15} />
                ক্যাটাগরি দেখুন
                <ArrowRight size={13} />
              </Link>

              <span className="hidden h-4 w-px bg-white/20 sm:block" />

              <Link
                to="/track-order"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 transition hover:text-gold-soft"
              >
                <CreditCard size={15} />
                অর্ডার ট্র্যাক করুন
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GiftBuilderSteps;
