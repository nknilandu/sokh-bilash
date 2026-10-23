
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Gift,
  Heart,
  ListPlus,
  Package,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    number: "০১",
    title: "উপলক্ষ্য নির্বাচন",
    description: "জন্মদিন, বিয়ে কিংবা বিবাহবার্ষিকী বেছে নিন।",
    icon: CalendarDays,
  },
  {
    number: "০২",
    title: "পছন্দের আইটেম",
    description: "মগ, ফ্রেম, কুশন বা পছন্দের উপহার বাছুন।",
    icon: ListPlus,
  },
  {
    number: "০৩",
    title: "বক্স ও প্যাকেজিং",
    description: "প্যাকেজিং ও সাজানোর ধরন নির্বাচন করুন।",
    icon: Package,
  },
  {
    number: "০৪",
    title: "ব্যক্তিগত বার্তা",
    description: "নাম, ছবি কিংবা নিজের মনের কথা যোগ করুন।",
    icon: Heart,
  },
  {
    number: "০৫",
    title: "রিভিউ ও অর্ডার",
    description: "সবকিছু দেখে অর্ডার সম্পন্ন করুন।",
    icon: CheckCircle2,
  },
];

const GiftBuilderSteps = () => {
  return (
    <section className="section-bg section-padding pb-12 sm:pb-16">
      <div className="page-container">
        <div className="relative isolate overflow-hidden rounded-3xl bg-primary p-5 text-primary-content shadow-xl sm:p-8 lg:p-10">
          {/* Decorative gradients */}
          <div className="pointer-events-none absolute -right-20 -top-24 -z-10 size-72 rounded-full bg-secondary opacity-30 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 -left-16 -z-10 size-64 rounded-full bg-purple-500 opacity-20 blur-3xl" />

          {/* Heading and CTA */}
          <div className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <span className="badge-gold">
                <Sparkles size={13} />
      <p>নিজস্ব গিফট বিল্ডার</p>
                  
        
              </span>

              <h2 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl">
                নিজের মতো করে গিফট বক্স সাজান
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
                পছন্দের উপহার ও ব্যক্তিগত স্পর্শে তৈরি করুন
                এমন একটি উপহার, যা প্রিয় মানুষ সহজে ভুলবে না।
              </p>
            </div>

            <Link
              to="/gift-box"
              className="btn-gold w-full shrink-0 sm:w-auto"
            >
              <Gift size={17} />
              <span>এখনই বক্স তৈরি শুরু করুন</span>
              <ArrowRight size={17} />
            </Link>
          </div>

          {/* Five steps */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="group rounded-2xl border border-white/10 bg-white/[0.08] p-4 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.12]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gold-soft">
                      {step.number}
                    </span>

                    <div className="p-3 bg-gold-soft/10 rounded-xl">
                         <Icon
                      size={20}
                      strokeWidth={1.8}
                      className="text-gold-soft transition-transform group-hover:scale-110"
                    />
                    </div>

                   
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-white">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-white/65">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GiftBuilderSteps;
