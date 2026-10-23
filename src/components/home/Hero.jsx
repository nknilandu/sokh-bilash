import { ArrowRight, Gift, Sparkles, Truck, Palette, Astroid } from "lucide-react";
import { Link } from "react-router-dom";
import heroBAnner from "../../assets/sokhbilash-hero-banner.jpg";

const Hero = () => {
  return (
    <section className="relative isolate overflow-hidden bg-primary text-primary-content shadow-xl">
      {/* Decorative background effects */}
      <div
        className="pointer-events-none absolute -bottom-24 left-30 -z-10 h-80 w-80 rounded-full bg-accent opacity-60 sm:opacity-100 blur-3xl"
        aria-hidden="true"
      />

      {/* Background image */}
      <div
        className="pointer-events-none absolute inset-0 -z-20"
        aria-hidden="true"
      >
        <img
          src={heroBAnner}
          alt="sokhbilash banner image"
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Image overlay */}
      <div
        className="pointer-events-none absolute inset-0 -z-10
    bg-linear-to-r
    from-primary/95
    via-primary/75
    to-primary/5"
        aria-hidden="true"
      />

      <div className="page-container">
        <div className="grid min-h-[560px] items-center gap-10 py-14 sm:py-16 lg:min-h-[650px] lg:grid-cols-12 lg:py-20">
          {/* Left content */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            {/* Brand badge */}
            <div className="inline-flex self-start items-center gap-2 rounded-full border border-accent/30 bg-white/10 px-4 py-2 text-sm font-medium text-accent shadow-sm backdrop-blur-sm">
              <Astroid size={16} />
              <span>শখের উপহার, মনের অনুভূতি</span>
            </div>

            {/* Hero heading */}
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.3] tracking-tight text-white sm:text-5xl lg:text-6xl">
              প্রিয় মুহূর্তগুলো হোক
              <span className="mt-1 block text-gold-soft">আরও স্মরণীয়</span>
            </h1>

            {/* Description */}
            <p className="max-w-xl text-base leading-8 text-white/80 sm:text-lg">
              আপনার প্রিয় মানুষের জন্য নিজের মতো করে সাজিয়ে নিন নিখুঁত ভালোবাসার
              উপহার। প্রিমিয়াম স্মৃতিচিহ্ন আর ব্যক্তিগত কাস্টমাইজেশনে প্রতিটি
              মুহূর্ত হয়ে উঠুক আরও বিশেষ।
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
              <Link
                to="/shop"
                className="btn-gold"
              >
                গিফট এক্সপ্লোর করুন
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/gift-box"
                className="btn shadow-none min-h-14 rounded-full border border-white/20 bg-white/15 px-6 text-base font-semibold text-white backdrop-blur-sm transition-all duration-200 ease-out hover:bg-white/30 hover:text-accent hover:-translate-y-px"
              >
                <Sparkles size={18} className="text-gold-soft" />
                নিজের গিফট তৈরি করুন
              </Link>
            </div>

            {/* Trust highlights */}
            <div className="mt-3 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <Truck size={23} className="shrink-0 text-accent" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    সারাদেশে ডেলিভারি
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-white/70">
                    ডেলিভারি সুবিধা
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Gift size={23} className="shrink-0 text-accent" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    যত্নে তৈরি উপহার
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-white/70">
                    প্রতিটি উপহারে বিশেষ যত্ন
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Palette size={23} className="shrink-0 text-accent" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    নিজস্ব কাস্টমাইজেশন
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-white/70">
                    আপনার পছন্দের ডিজাইন
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side spacing for the background image */}
          <div className="hidden lg:col-span-4 lg:block" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
