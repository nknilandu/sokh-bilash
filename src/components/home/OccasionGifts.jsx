import { Heart } from "lucide-react";
import { GoHeartFill } from "react-icons/go";
import { HiUsers } from "react-icons/hi";
import { MdFamilyRestroom, MdMosque } from "react-icons/md";
import { RiCake2Fill, RiHandHeartFill } from "react-icons/ri";
import { Link } from "react-router-dom";

const occasions = [
  {
    name: "জন্মদিন",
    subtitle: "Birthday Special",
    icon: RiCake2Fill,
    gradient: "from-amber-100 to-yellow-100",
    iconColor: "text-amber-600",
    slug: "birthday",
  },
  {
    name: "বিবাহবার্ষিকী",
    subtitle: "Anniversary Gift",
    icon: GoHeartFill,
    gradient: "from-pink-100 to-rose-100",
    iconColor: "text-rose-600",
    slug: "anniversary",
  },
  {
    name: "বিয়ে ও নিকাহ",
    subtitle: "Wedding Keepsakes",
    icon: RiHandHeartFill,
    gradient: "from-purple-100 to-fuchsia-100",
    iconColor: "text-purple-700",
    slug: "wedding",
  },
  {
    name: "কাপল গিফট",
    subtitle: "Couple Matching",
    icon: HiUsers,
    gradient: "from-sky-100 to-indigo-100",
    iconColor: "text-indigo-600",
    slug: "couple-gifts",
  },
  {
    name: "ইসলামিক উপহার",
    subtitle: "Barakah & Dua",
    icon: MdMosque,
    slug: "islamic",
  },
  {
    name: "বাবা ও মা",
    subtitle: "Parents Tribute",
    icon: MdFamilyRestroom,
    gradient: "from-emerald-100 to-teal-100",
    iconColor: "text-teal-700",
    slug: "parent",
  },
];

const OccasionGifts = () => {
  return (
    <section className="section-bg section-padding sm:pb-16">
      <div className="page-container">
        <div className="rounded-3xl border border-base-300/70 bg-gradient-to-br from-secondary/15 to-secondary/10 p-5 sm:p-8 lg:p-10">
          <div className="mb-7 text-center">
            <span className="badge-soft">
              <Heart size={13} />
              উপহার দেওয়ার বিশেষ দিন
            </span>

            <h2 className="mt-3 text-2xl font-bold text-primary sm:text-3xl">
              উপলক্ষ অনুযায়ী উপহার বেছে নিন
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">
              ছোট্ট একটি উপহারও হয়ে উঠুক প্রিয় মানুষের জীবনের সুন্দর একটি
              স্মৃতি।
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {occasions.map((occasion) => {
              const Icon = occasion.icon;

              return (
                <Link
                  key={occasion.slug}
                  to={`/shop?occasion=${occasion.slug}`}
                  className="group rounded-2xl border-none bg-base-100 px-4 py-6 text-center transition duration-300 hover:bg-secondary"
                >
                  <div className="flex justify-center items-center mb-2">
                    <Icon
                      size={27}
                      className="text-primary group-hover:text-base-100"
                    />
                  </div>

                  <h3 className="text-sm font-bold text-primary group-hover:text-base-100">
                    {occasion.name}
                  </h3>

                  <p className="mt-1 text-xs text-muted  group-hover:text-base-200">
                    {occasion.subtitle}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OccasionGifts;
