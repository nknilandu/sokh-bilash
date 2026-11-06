import { useCallback, useEffect, useRef, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Cake,
  Camera,
  Flower2,
  Gift,
  Heart,
  MessageCircle,
  PartyPopper,
  Quote,
  Smile,
  Sparkles,
  Users,
} from "lucide-react";

// ========================================
// GIFT MOMENTS
// ========================================

const moments = [
  {
    id: 1,
    category: "জন্মদিন",
    title: "হাসিটাই আসল উপহার",
    description:
      "জন্মদিনে একটি ছোট্ট সারপ্রাইজও প্রিয় মানুষের মুখে বড় হাসি এনে দিতে পারে। সুন্দর মুহূর্তগুলোই হয়ে ওঠে সবচেয়ে দামী স্মৃতি।",
    icon: Cake,
  },
  {
    id: 2,
    category: "ভালোবাসা",
    title: "ভালোবাসা প্রকাশের সুন্দর উপায়",
    description:
      "সব অনুভূতি মুখে বলা যায় না। কখনো একটি যত্ন করে বেছে নেওয়া উপহারই বলে দেয় মনের না বলা হাজারো কথা।",
    icon: Heart,
  },
  {
    id: 3,
    category: "স্মৃতির উপহার",
    title: "স্মৃতিগুলো থাকুক যত্নে",
    description:
      "একসঙ্গে কাটানো প্রিয় মুহূর্তগুলো যখন সুন্দর একটি ফ্রেমে জায়গা পায়, তখন সাধারণ একটি ছবিও হয়ে ওঠে অসাধারণ।",
    icon: Camera,
  },
  {
    id: 4,
    category: "বিবাহবার্ষিকী",
    title: "একসঙ্গে পথচলার উদযাপন",
    description:
      "একটি বিশেষ দিন মনে করিয়ে দেয় একসঙ্গে কাটানো অসংখ্য সুন্দর মুহূর্ত। ভালোবাসার ছোট্ট আয়োজন সেই দিনটাকে করে আরও স্মরণীয়।",
    icon: Flower2,
  },
  {
    id: 5,
    category: "বন্ধুত্ব",
    title: "বন্ধুত্বের ছোট্ট সারপ্রাইজ",
    description:
      "প্রিয় বন্ধুর জন্য অনেক বড় আয়োজনের প্রয়োজন হয় না। তার পছন্দের একটি উপহারই বলে দিতে পারে, সে কতটা বিশেষ।",
    icon: Users,
  },
  {
    id: 6,
    category: "কৃতজ্ঞতা",
    title: "ধন্যবাদ বলার অন্যরকম ভাষা",
    description:
      "জীবনের কিছু মানুষ সবসময় পাশে থাকেন। তাঁদের প্রতি কৃতজ্ঞতা প্রকাশের জন্য একটি আন্তরিক উপহার হতে পারে সুন্দর স্মারক।",
    icon: Gift,
  },
  {
    id: 7,
    category: "সারপ্রাইজ",
    title: "অপ্রত্যাশিত আনন্দ",
    description:
      "কোনো বিশেষ দিন ছাড়াও প্রিয়জনকে চমকে দেওয়া যায়। হঠাৎ পাওয়া উপহারের আনন্দ অনেক সময় সবচেয়ে বেশি মনে থাকে।",
    icon: PartyPopper,
  },
  {
    id: 8,
    category: "ব্যক্তিগত বার্তা",
    title: "কথাগুলো থাকুক উপহারের সঙ্গে",
    description:
      "একটি সুন্দর শুভেচ্ছা বার্তা সাধারণ উপহারকেও ব্যক্তিগত করে তোলে। ছোট ছোট শব্দেই লুকিয়ে থাকে গভীর অনুভূতি।",
    icon: MessageCircle,
  },
  {
    id: 9,
    category: "পরিবার",
    title: "প্রিয় মানুষের মুখের হাসি",
    description:
      "মা-বাবা কিংবা পরিবারের আপনজনদের জন্য ভালোবাসা প্রকাশের সুযোগ প্রতিদিন আসে না। ছোট্ট উপহারও হয়ে উঠতে পারে বিশেষ।",
    icon: Smile,
  },
  {
    id: 10,
    category: "বিশেষ মুহূর্ত",
    title: "উপহার হোক মনে রাখার মতো",
    description:
      "দাম নয়, উপহার বেছে নেওয়ার পেছনের ভালোবাসা আর যত্নটাই সবচেয়ে গুরুত্বপূর্ণ। সেই অনুভূতিই একটি মুহূর্তকে অনন্য করে।",
    icon: Sparkles,
  },
];

const AUTO_DELAY = 3000;

// ========================================
// SINGLE MOMENT CARD
// ========================================

function MomentCard({ item, index }) {
  const Icon = item.icon;

  return (
    <article
      aria-label={`${index + 1} of ${moments.length}`}
      className=" group flex min-h-[290px] shrink-0 basis-full snap-start flex-col overflow-hidden rounded-2xl border border-base-300/80 bg-accent/2 p-5 shadow-sm transition-colors duration-300 hover:border-secondary/30 hover:shadow-md sm:basis-[calc((100%-1rem)/2)] sm:p-6 lg:basis-[calc((100%-2rem)/3)]"
    >
      {/* TOP */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary transition-colors duration-300 group-hover:bg-secondary group-hover:text-white">
          <Icon size={22} strokeWidth={1.8} />
        </div>

        <Quote size={29} strokeWidth={1.5} className="text-secondary/15" />
      </div>

      {/* CATEGORY */}
      <p className="mt-5 text-[11px] font-bold tracking-wide text-secondary">
        {item.category}
      </p>

      {/* TITLE */}
      <h3 className="mt-2 text-base font-bold leading-7 text-primary sm:text-lg">
        {item.title}
      </h3>

      {/* MESSAGE */}
      <p className="mt-3 flex-1 text-xs leading-7 text-muted sm:text-sm">
        {item.description}
      </p>

      {/* BOTTOM */}
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-base-300/70 pt-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-secondary">
          <Heart size={13} />
          ভালোবাসার অনুভূতি
        </span>

        <span className="text-xs font-bold text-primary/40">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
    </article>
  );
}

// ========================================
// MAIN COMPONENT
// ========================================

const Testimonials = () => {
  const sliderRef = useRef(null);
  const currentIndexRef = useRef(0);

  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const maxIndex = Math.max(0, moments.length - visibleCount);

  // ========================================
  // RESPONSIVE VISIBLE CARDS
  // ========================================

  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;

      if (width >= 1024) {
        setVisibleCount(3);
      } else if (width >= 640) {
        setVisibleCount(2);
      } else {
        setVisibleCount(1);
      }
    };

    updateVisibleCount();

    window.addEventListener("resize", updateVisibleCount);

    return () => {
      window.removeEventListener("resize", updateVisibleCount);
    };
  }, []);

  // ========================================
  // ACCESSIBILITY: REDUCED MOTION
  // ========================================

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateMotion = () => {
      setReducedMotion(media.matches);
    };

    updateMotion();

    media.addEventListener?.("change", updateMotion);

    return () => {
      media.removeEventListener?.("change", updateMotion);
    };
  }, []);

  // ========================================
  // OBSERVE SECTION VISIBILITY
  // ========================================

  useEffect(() => {
    const slider = sliderRef.current;

    if (!slider) return;

    if (!("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.25,
      },
    );

    observer.observe(slider);

    return () => observer.disconnect();
  }, []);

  // ========================================
  // SCROLL TO SELECTED CARD
  // ========================================

  const scrollToCard = useCallback(
    (targetIndex) => {
      const slider = sliderRef.current;

      if (!slider) return;

      const limitedIndex = Math.max(
        0,
        Math.min(targetIndex, moments.length - visibleCount),
      );

      const targetCard = slider.children[limitedIndex];

      if (!targetCard) return;

      currentIndexRef.current = limitedIndex;
      setActiveIndex(limitedIndex);

      slider.scrollTo({
        left: targetCard.offsetLeft,
        behavior: reducedMotion ? "instant" : "smooth",
      });
    },
    [visibleCount, reducedMotion],
  );

  // ========================================
  // HANDLE RESPONSIVE RESIZING
  // ========================================

  useEffect(() => {
    if (currentIndexRef.current > maxIndex) {
      scrollToCard(maxIndex);
    }
  }, [maxIndex, scrollToCard]);

  // ========================================
  // MANUAL NAVIGATION
  // ========================================

  const nextSlide = () => {
    const next =
      currentIndexRef.current >= maxIndex ? 0 : currentIndexRef.current + 1;

    scrollToCard(next);
  };

  const previousSlide = () => {
    const previous =
      currentIndexRef.current <= 0 ? maxIndex : currentIndexRef.current - 1;

    scrollToCard(previous);
  };

  // ========================================
  // KEEP ACTIVE INDEX IN SYNC WITH SWIPE
  // ========================================

  const handleScroll = () => {
    const slider = sliderRef.current;

    if (!slider || slider.children.length < 2) {
      return;
    }

    const firstCard = slider.children[0];
    const secondCard = slider.children[1];

    const step = secondCard.offsetLeft - firstCard.offsetLeft;

    if (step <= 0) return;

    const calculatedIndex = Math.round(slider.scrollLeft / step);

    const newIndex = Math.max(0, Math.min(calculatedIndex, maxIndex));

    if (currentIndexRef.current !== newIndex) {
      currentIndexRef.current = newIndex;
      setActiveIndex(newIndex);
    }
  };

  // ========================================
  // AUTO SLIDE EVERY 3 SECONDS
  // ========================================

  useEffect(() => {
    if (isHovered || !isVisible || reducedMotion || maxIndex === 0) {
      return;
    }

    const interval = window.setInterval(() => {
      const next =
        currentIndexRef.current >= maxIndex ? 0 : currentIndexRef.current + 1;

      scrollToCard(next);
    }, AUTO_DELAY);

    return () => {
      window.clearInterval(interval);
    };
  }, [isHovered, isVisible, reducedMotion, maxIndex, scrollToCard]);

  // ========================================
  // COMPONENT JSX
  // ========================================

  return (
    <section className="section-padding page-bg overflow-hidden">
      <div className="page-container">
        {/* ================================= */}
        {/* SECTION HEADER */}
        {/* ================================= */}

        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1.5 text-[11px] font-bold text-secondary">
              <Sparkles size={13} />
              ভালোবাসার ছোট ছোট গল্প
            </span>

            <h2 className="mt-4 text-2xl font-bold leading-tight text-primary sm:text-3xl">
              ছোট্ট উপহার,{" "}
              <span className="text-secondary">অনেক বড় অনুভূতি</span>
            </h2>

            <p className="mt-3 max-w-xl text-xs leading-7 text-muted sm:text-sm">
              প্রতিটি সম্পর্কের গল্প আলাদা। ভালোবাসা, কৃতজ্ঞতা আর আনন্দের কিছু
              চেনা মুহূর্ত, যা একটি উপহারকে আরও বিশেষ করে তোলে।
            </p>
          </div>

          {/* DESKTOP ARROWS */}
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={previousSlide}
              aria-label="আগের অনুভূতি দেখুন"
              className="flex size-11 items-center justify-center rounded-xl border border-base-300 bg-white text-primary shadow-sm transition hover:border-secondary hover:bg-secondary hover:text-white"
            >
              <ArrowLeft size={18} />
            </button>

            <button
              type="button"
              onClick={nextSlide}
              aria-label="পরের অনুভূতি দেখুন"
              className="flex size-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition hover:bg-secondary"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* ================================= */}
        {/* CAROUSEL */}
        {/* ================================= */}

        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="উপহারের সুন্দর অনুভূতি"
        >
          <div
            ref={sliderRef}
            onScroll={handleScroll}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 ml-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{
              WebkitOverflowScrolling: "touch",
            }}
          >
            {moments.map((item, index) => (
              <MomentCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </div>

        {/* ================================= */}
        {/* CAROUSEL CONTROLS */}
        {/* ================================= */}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          {/* CURRENT POSITION */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-primary">
              {String(activeIndex + 1).padStart(2, "0")}
              <span className="mx-1.5 text-muted">/</span>
              {String(moments.length).padStart(2, "0")}
            </span>

            <div className="h-1 w-14 overflow-hidden rounded-full bg-base-300 sm:w-20">
              <div
                className="h-full rounded-full bg-secondary transition-all duration-500"
                style={{
                  width: `${((activeIndex + 1) / (maxIndex + 1)) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* NAVIGATION DOTS */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: maxIndex + 1 }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => scrollToCard(index)}
                aria-label={`স্লাইড ${index + 1} দেখুন`}
                aria-current={activeIndex === index ? "true" : undefined}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeIndex === index
                    ? "w-7 bg-secondary"
                    : "w-2 bg-base-300 hover:bg-secondary/40"
                }`}
              />
            ))}
          </div>

          {/* MOBILE ARROWS */}
          <div className="flex gap-2 sm:hidden">
            <button
              type="button"
              onClick={previousSlide}
              aria-label="আগের অনুভূতি"
              className="flex size-10 items-center justify-center rounded-xl border border-base-300 bg-white text-primary"
            >
              <ArrowLeft size={17} />
            </button>

            <button
              type="button"
              onClick={nextSlide}
              aria-label="পরের অনুভূতি"
              className="flex size-10 items-center justify-center rounded-xl bg-primary text-white"
            >
              <ArrowRight size={17} />
            </button>
          </div>
        </div>

        {/* ================================= */}
        {/* BOTTOM MESSAGE */}
        {/* ================================= */}

        <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-secondary/10 bg-secondary/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-secondary">
              <Heart size={19} />
            </div>

            <div>
              <h3 className="text-xs font-bold text-primary sm:text-sm">
                আপনার গল্পটাও হোক বিশেষ
              </h3>

              <p className="mt-1 text-[11px] leading-5 text-muted">
                প্রিয়জনের জন্য যত্ন করে বেছে নিন মনের মতো একটি উপহার।
              </p>
            </div>
          </div>

          <a
            href="/shop"
            className="inline-flex shrink-0 items-center justify-center gap-2 text-xs font-bold text-secondary transition hover:text-primary"
          >
            <Gift size={15} />
            উপহার দেখুন
            <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
