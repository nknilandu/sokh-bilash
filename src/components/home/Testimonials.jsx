
import { Star } from "lucide-react";

const reviews = [
  {
    id: 1,
    name: "মারিয়া রহমান",
    location: "মিরপুর, ঢাকা",
    initial: "মা",
    rating: 5,
    comment:
      "আমাদের প্রথম বিবাহবার্ষিকীর জন্য একটি কাস্টমাইজড গিফট বক্স নিয়েছিলাম। প্যাকেজিং, ডিজাইন ও উপহারের যত্নে আমরা সত্যিই মুগ্ধ। আবারও অর্ডার করব।",
  },
  {
    id: 2,
    name: "তানভীর আহমেদ",
    location: "ধানমন্ডি, ঢাকা",
    initial: "তা",
    rating: 5,
    comment:
      "নিজের প্রিয় মানুষের জন্য কাস্টমাইজড উপহার বানানোর অভিজ্ঞতা দারুণ। পণ্যের কোয়ালিটি ও সুন্দর উপস্থাপনা সত্যিই ভালো লেগেছে।",
  },
  {
    id: 3,
    name: "ফারজানা চৌধুরী",
    location: "উত্তরা, ঢাকা",
    initial: "ফা",
    rating: 5,
    comment:
      "কলেজের বান্ধবীর জন্মদিনে গিফটটি অর্ডার করেছিলাম। প্যাকেজিং সুন্দর ছিল, আর উপহারটি সময়মতো পৌঁছেছে। অভিজ্ঞতা ভালো ছিল।",
  },
];

const Testimonials = () => {
  return (
    <section className="section-padding page-bg">
      <div className="page-container">
        {/* Section heading */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="badge-soft">গ্রাহকদের অনুভূতি</span>

            <h2 className="mt-3 text-2xl font-bold text-primary sm:text-3xl">
              গ্রাহকদের সন্তুষ্টি ও ভালোবাসা
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-bold text-primary">৪.৯/৫.০</span>

            <div
              className="flex items-center gap-0.5 text-amber-500"
              aria-label="৫ এর মধ্যে ৫ স্টার"
            >
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  size={14}
                  fill="currentColor"
                  strokeWidth={1}
                />
              ))}
            </div>

            <span className="text-muted">
              (ডেমো রেটিং)
            </span>
          </div>
        </div>

        {/* Review cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <article key={review.id} className="review-card flex flex-col">
              <div
                className="flex items-center gap-0.5 text-amber-500"
                aria-label={`${review.rating} out of 5 stars`}
              >
                {Array.from({ length: review.rating }, (_, index) => (
                  <Star
                    key={index}
                    size={14}
                    fill="currentColor"
                    strokeWidth={1}
                  />
                ))}
              </div>

              <p className="mt-3 flex-1 text-sm leading-6 text-base-content/80">
                “{review.comment}”
              </p>

              <div className="my-4 border-t border-base-200" />

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-sm font-bold text-secondary">
                  {review.initial}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-primary">
                    {review.name}
                  </h3>

                  <p className="mt-1 text-xs text-muted">
                    {review.location} · ডেমো রিভিউ
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
