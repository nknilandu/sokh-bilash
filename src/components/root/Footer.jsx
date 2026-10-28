import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, ArrowRight, Mail } from "lucide-react";

import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa6";
import logo from "../../assets/sokhbilash-nav-logo.png";

const shoppingLinks = [
  { label: "সব পণ্য", to: "/shop" },
  { label: "নিজের গিফট তৈরি করুন", to: "/gift-box" },
  { label: "উইশলিস্ট", to: "/wishlist" },
  { label: "অর্ডার ট্র্যাক", to: "/track-order" },
];

const supportLinks = [
  { label: "সাধারণ জিজ্ঞাসা", to: "/faq" },
  { label: "ডেলিভারি তথ্য", to: "/delivery" },
  { label: "রিটার্ন ও রিফান্ড নীতি", to: "/return-policy" },
  { label: "গোপনীয়তা নীতি", to: "/privacy-policy" },
  { label: "অ্যাফিলিয়েট রিকোয়েস্ট", to: "/affiliate" },
];

const socialLinks = [
  { label: "Facebook", href: "https://facebook.com", Icon: FaFacebookF },
  { label: "Instagram", href: "https://instagram.com", Icon: FaInstagram },
  { label: "YouTube", href: "https://youtube.com", Icon: FaYoutube },
];

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();

    // Connect your newsletter API here.
    console.log("Newsletter email:", email);
    setEmail("");
  };

  return (
    <footer className="bg-primary text-primary-content">
      {/* Newsletter */}
      <div className="page-container border-b border-white/15 py-10 sm:py-12 lg:py-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div>
            <h2 className="text-2xl font-bold leading-snug sm:text-3xl">
              নতুন কালেকশন ও অফারের খবর পান
            </h2>
            <p className="mt-2 text-sm text-white/75 sm:text-base">
              প্রতি মাসে বাছাই করা উপহার আইডিয়া আপনার ইনবক্সে।
            </p>
          </div>

          <form
            onSubmit={handleSubscribe}
            className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl"
          >
            <label htmlFor="footer-email" className="sr-only">
              আপনার ইমেইল
            </label>

            <div className="relative flex-1">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50"
              />
              <input
                id="footer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="আপনার ইমেইল"
                autoComplete="email"
                required
                className="h-12 w-full rounded-full border border-white/10 bg-white/10 pl-11 pr-5 text-sm text-white outline-none transition placeholder:text-white/60 focus:border-gold-soft focus:ring-2 focus:ring-gold-soft/20"
              />
            </div>

            <button type="submit" className="btn-gold h-12 shrink-0 px-7">
              সাবস্ক্রাইব
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div className="page-container grid grid-cols-1 gap-10 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12 lg:py-12">
        {/* Brand */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-2xl font-bold transition hover:text-gold-soft"
          >
            <img
              src={logo}
              alt="sokhbilash logo"
              className="h-12 sm:h-18 object-cover"
            />
          </Link>

          <p className="mt-4 max-w-xs text-sm leading-6 text-white/75">
            ভালোবাসা, স্মৃতি ও বিশেষ মুহূর্তের সব উপহার—এক জায়গায়।
          </p>

          <div className="mt-5 flex items-center gap-2">
            {socialLinks.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-accent hover:text-primary"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {/* Shopping */}
        <div>
          <h3 className="mb-4 font-bold text-gold-soft">কেনাকাটা</h3>

          <ul className="space-y-3 text-sm text-white/80">
            {shoppingLinks.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="transition hover:text-gold-soft">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="mb-4 font-bold text-gold-soft">সহায়তা</h3>

          <ul className="space-y-3 text-sm text-white/80">
            {supportLinks.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="transition hover:text-gold-soft">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="mb-4 font-bold text-gold-soft">যোগাযোগ</h3>

          <address className="space-y-3 text-sm not-italic leading-6 text-white/80">
            <p>
              <a
                href="tel:+8801XXXXXXXXX"
                className="transition hover:text-gold-soft"
              >
                +880 1XXX-XXXXXX (প্রয়োজনমতো)
              </a>
            </p>

            <p>
              <a
                href="mailto:hello@example.com"
                className="transition hover:text-gold-soft"
              >
                hello@example.com
              </a>
            </p>

            <p>ঢাকা, বাংলাদেশ (ঠিকানা যোগ করুন)</p>
            <p>প্রতিদিন সকাল ১০টা – রাত ৮টা</p>

            <a
              href="https://wa.me/8801XXXXXXXXX"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-medium text-gold-soft transition hover:opacity-80"
            >
              <MessageCircle size={17} />
              হোয়াটসঅ্যাপে কথা বলুন
            </a>
          </address>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/15">
        <div className="page-container flex flex-col items-center justify-between gap-3 py-5 text-center text-xs text-white/65 sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} শখবিলাস (Sokhbilash). সর্বস্বত্ব
            সংরক্ষিত।
          </p>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            <Link
              to="/privacy-policy"
              className="transition hover:text-gold-soft"
            >
              গোপনীয়তা নীতি
            </Link>

            <Link to="/terms" className="transition hover:text-gold-soft">
              শর্তাবলি
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
