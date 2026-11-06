import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";

import { FaFacebookF, FaGithub, FaLinkedinIn } from "react-icons/fa6";
import logo from "../../assets/sokhbilash-nav-logo.png";

import { CONTACT, CONTACT_URLS } from "../../utils/siteConfig";

const shoppingLinks = [
  { label: "সব পণ্য", to: "/shop" },
  { label: "ক্যাটাগরি", to: "/categories" },
  { label: "আমার অর্ডারগুলি", to: "/my-orders" },
  { label: "অর্ডার ট্র্যাক", to: "/track-order" },
  { label: "উইশলিস্ট", to: "/wishlist" },
];

const supportLinks = [
  {
    label: "সাধারণ জিজ্ঞাসা",
    to: "/help#faq",
  },
  {
    label: "ডেলিভারি তথ্য",
    to: "/help#delivery",
  },
  {
    label: "রিটার্ন ও রিফান্ড নীতি",
    to: "/help#return-policy",
  },
  {
    label: "গোপনীয়তা নীতি",
    to: "/help#privacy-policy",
  },
  {
    label: "শর্তাবলি",
    to: "/help#terms",
  },
];

const socialLinks = [
  {
    label: "Linkedin ",
    href: "https://www.linkedin.com/in/nilandu/",
    Icon: FaLinkedinIn,
  },
  { label: "Github", href: "https://github.com/nknilandu", Icon: FaGithub },
  {
    label: "Facebook",
    href: "https://www.facebook.com/nknilandu",
    Icon: FaFacebookF,
  },
];

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-content pt-8">
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

        {/* CONTACT */}

        <div>
          <h3 className="mb-4 font-bold text-gold-soft">যোগাযোগ</h3>

          <address className="space-y-3 text-sm not-italic leading-6 text-white/80">
            {/* PHONE */}
            {CONTACT.phone && (
              <p>
                <a
                  href={CONTACT_URLS.phone}
                  className="transition hover:text-gold-soft"
                >
                  {CONTACT.phone}
                </a>
              </p>
            )}

            {/* EMAIL */}
            {CONTACT.email && (
              <p>
                <a
                  href={CONTACT_URLS.email}
                  className="transition hover:text-gold-soft"
                >
                  {CONTACT.email}
                </a>
              </p>
            )}

            {/* BUSINESS ADDRESS */}
            <p>নরসিংদী, বাংলাদেশ</p>

            {/* WHATSAPP */}
            {CONTACT.whatsapp && (
              <a
                href={CONTACT_URLS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-medium text-gold-soft transition hover:opacity-80"
              >
                <MessageCircle size={17} />
                হোয়াটসঅ্যাপে কথা বলুন
              </a>
            )}
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

          <Link
            to="/help#developer"
            className="text-xs text-white/70 transition hover:text-gold-soft"
          >
            Designed & Developed by
            <span className="ml-1 font-semibold">Nilandu Kumar Das Vapon</span>
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
