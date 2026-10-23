import {
  Gift,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  {
    name: "ফটোফ্রেম",
    subtitle: "কাস্টমাইজড স্মৃতির ফ্রেম",
    icon: "https://img.icons8.com/color/96/home-decorations.png",
    slug: "photo-frames",
  },
  {
    name: "নিকাহ ও স্মারক",
    subtitle: "বিয়ে ও বিশেষ স্মৃতিচিহ্ন",
    icon: "https://img.icons8.com/color/96/poem.png",
    slug: "nikah-gifts",
  },
  {
    name: "গিফট হ্যাম্পার",
    subtitle: "প্রিয়জনের জন্য সারপ্রাইজ",
    icon: "https://img.icons8.com/color/96/wedding-gift.png",
    slug: "gift-hampers",
  },
  {
    name: "জুয়েলারি",
    subtitle: "মায়া মাখানো উপহার",
    icon:"https://img.icons8.com/color/96/engagement-ring--v1.png",
    slug: "jewelry",
  },
  {
    name: "চকলেট ও ফুল",
    subtitle: "মিষ্টি ও সুন্দর অনুভূতি",
    icon: "https://img.icons8.com/color/96/bridal-bouquet.png",
    slug: "chocolate-flowers",
  },
  {
    name: "মগ ও কুশন",
    subtitle: "দৈনন্দিন ভালোবাসা",
    icon: "https://img.icons8.com/color/96/tea-cup.png",
    slug: "mugs-cushions",
  },
];

const GiftCategories = () => {
  return (
    <section className="section-bg section-padding bg-secondary/5">
      <div className="page-container">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <span className="badge-soft bg-secondary/10">
              <Gift size={13} />
              উপহার সম্ভার
            </span>

            <h2 className="mt-3 text-2xl font-bold text-primary sm:text-3xl">
              ক্যাটাগরি অনুযায়ী উপহার
            </h2>

            <p className="mt-2 text-sm text-muted">
              প্রতিটি বিশেষ মুহূর্তের জন্য পছন্দের উপহার খুঁজে নিন।
            </p>
          </div>

          <Link
            to="/shop"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-secondary transition hover:text-primary sm:inline-flex"
          >
            সব ক্যাটাগরি দেখুন
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => {
            return (
              <Link
                key={category.slug}
                to={`/shop?category=${category.slug}`}
                className="group rounded-2xl border border-base-300 bg-base-100 p-4 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-secondary/40 hover:shadow-md"
              >
                <div className="mx-auto mb-3 flex size-16 items-center justify-center transition duration-300 group-hover:scale-110">
                  <img src={category.icon} />
                </div>

                <h3 className="text-sm font-bold text-primary">
                  {category.name}
                </h3>

                <p className="mt-1 text-xs leading-5 text-muted">
                  {category.subtitle}
                </p>
              </Link>
            );
          })}
        </div>

        <Link to="/shop" className="btn-outline-brand mt-5 w-full sm:hidden">
          সব ক্যাটাগরি দেখুন
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
};

export default GiftCategories;
