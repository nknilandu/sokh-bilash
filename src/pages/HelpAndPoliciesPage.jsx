import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpenText,
  ChevronRight,
  CircleHelp,
  Code2,
  CreditCard,
  ExternalLink,
  Gift,
  Globe2,
  Heart,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  RotateCcw,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRound,
} from "lucide-react";
import { FaGithub, FaLinkedinIn } from "react-icons/fa6";
import { CONTACT, CONTACT_URLS, getWhatsAppUrl } from "../utils/siteConfig";

// Confirm these profile links before publishing.
const DEVELOPER = {
  name: "Nilandu Kumar Das Vapon",
  role: "Full-Stack Web Developer",
  description:
    "React, Node.js, Express ও MongoDB ব্যবহার করে আধুনিক, responsive ও ব্যবহারবান্ধব ওয়েব অ্যাপ্লিকেশন তৈরি করি। SokhBilash-এর ওয়েব অভিজ্ঞতা ও প্রযুক্তিগত বাস্তবায়নে কাজ করেছি।",
  // Google Drive photo must have General access: Anyone with the link.
  photo:
    "https://drive.google.com/thumbnail?id=18HtSYYh1dcPK0UyaWQOXLoPY8LacXl_e&sz=w800",
  photoPage:
    "https://drive.google.com/file/d/18HtSYYh1dcPK0UyaWQOXLoPY8LacXl_e/view?usp=sharing",
  github: "https://github.com/nknilandu",
  linkedin: "https://www.linkedin.com/in/nilandu/",
  portfolio: "https://nilandu.netlify.app/",
};

const MENU = [
  { id: "faq", label: "সাধারণ জিজ্ঞাসা", short: "FAQ", icon: CircleHelp },
  { id: "delivery", label: "ডেলিভারি তথ্য", short: "Delivery", icon: Truck },
  {
    id: "return-policy",
    label: "রিটার্ন ও রিফান্ড",
    short: "Returns",
    icon: RotateCcw,
  },
  {
    id: "privacy-policy",
    label: "গোপনীয়তা নীতি",
    short: "Privacy",
    icon: ShieldCheck,
  },
  { id: "terms", label: "শর্তাবলি", short: "Terms", icon: ScrollText },
  {
    id: "developer",
    label: "ডেভেলপার প্রোফাইল",
    short: "Developer",
    icon: Code2,
  },
];

const FAQS = [
  {
    q: "অ্যাকাউন্ট ছাড়াই কি অর্ডার করা যাবে?",
    a: "হ্যাঁ। Guest Checkout ব্যবহার করে অর্ডার করা যাবে। অর্ডার শনাক্তকরণ ও ট্র্যাকিংয়ের তথ্য সংরক্ষণ করে রাখুন।",
  },
  {
    q: "পেমেন্টের কোন কোন মাধ্যম আছে?",
    a: "bKash, Nagad ও Rocket-এ Send Money করে তথ্য জমা দেওয়া যায়। Cash on Delivery (COD) থাকলে অর্ডার ফোনে নিশ্চিত করা হতে পারে।",
  },
  {
    q: "Send Money করলেই কি পেমেন্ট Verified হয়ে যাবে?",
    a: "না। পাঠানো নম্বর, TrxID ও Amount যাচাই করার পর Admin পেমেন্টের অবস্থা আপডেট করেন।",
  },
  {
    q: "ডেলিভারি চার্জ কত?",
    a: "বর্তমান নির্ধারিত চার্জ অনুযায়ী নরসিংদীর মধ্যে ৳৮০ এবং নরসিংদীর বাইরে ৳১৩০। Checkout-এ চূড়ান্ত চার্জ দেখানো হবে।",
  },
  {
    q: "আমার অর্ডার কোথায় আছে জানতে পারব?",
    a: "অর্ডার ট্র্যাকিং পেজে অর্ডারের তথ্য দেখে বর্তমান অবস্থা জানতে পারবেন। Courier Tracking ID যুক্ত হলে সেটিও ব্যবহার করা যাবে।",
  },
  {
    q: "কাস্টমাইজড উপহার অর্ডার করা যাবে?",
    a: "যে পণ্যে customization সুবিধা আছে সেখানে প্রয়োজনীয় ছবি, নাম বা নির্দেশনা দিতে পারবেন। সাবমিট করার আগে বানান ও ছবি যাচাই করুন।",
  },
  {
    q: "অর্ডার দেওয়ার পর পরিবর্তন করা যাবে?",
    a: "প্রসেসিং বা কাস্টমাইজেশন শুরু হয়ে গেলে পরিবর্তন সম্ভব নাও হতে পারে। পরিবর্তনের অনুরোধ যত দ্রুত সম্ভব অফিসিয়াল সাপোর্টে জানান।",
  },
];

function SectionCard({
  id,
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-28 overflow-hidden rounded-2xl border border-base-300/80 bg-white shadow-sm"
    >
      <div className="border-b border-base-300/70 bg-gradient-to-r from-[#f9f4fb] via-white to-white px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <Icon size={21} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-secondary">
              {eyebrow}
            </p>
            <h2
              id={`${id}-title`}
              className="mt-1 text-lg font-bold text-primary sm:text-xl"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1.5 text-xs leading-6 text-muted sm:text-sm">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-5 px-5 py-6 text-sm leading-7 text-primary/80 sm:px-7">
        {children}
      </div>
    </section>
  );
}

function InfoItem({ title, children, icon: Icon }) {
  return (
    <div className="rounded-xl border border-base-300 bg-base-100 p-4">
      <div className="flex items-center gap-2 font-bold text-primary">
        {Icon && <Icon size={17} className="text-secondary" />}
        <h3>{title}</h3>
      </div>
      <div className="mt-2 text-xs leading-6 text-muted sm:text-sm">
        {children}
      </div>
    </div>
  );
}

function ExternalProfileLink({ href, icon: Icon, children, primary = false }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition sm:text-sm ${
        primary
          ? "bg-primary text-white hover:bg-secondary"
          : "border border-base-300 bg-white text-primary hover:border-secondary/40 hover:bg-secondary/5"
      }`}
    >
      <Icon size={16} /> {children} <ArrowUpRight size={14} />
    </a>
  );
}

export default function HelpAndPoliciesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [photoError, setPhotoError] = useState(false);
  const hashId = decodeURIComponent(location.hash.replace(/^#/, ""));
  const activeId = MENU.some((item) => item.id === hashId) ? hashId : "faq";

  useEffect(() => {
    if (!hashId) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(hashId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hashId]);

  const jumpTo = (id) => {
    if (location.pathname === "/help" && location.hash === `#${id}`) {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    navigate({ pathname: "/help", hash: `#${id}` });
  };

  return (
    <main className="min-h-screen bg-[#f8f5fa] pb-16">
      {/* HERO */}
      <div className="relative overflow-hidden bg-primary text-white">
        <div className="pointer-events-none absolute -right-20 -top-32 size-80 rounded-full border-[45px] border-white/5" />
        <div className="pointer-events-none absolute bottom-[-120px] left-1/4 size-64 rounded-full bg-secondary/30 blur-3xl" />
        <div className="page-container relative py-12 sm:py-16 lg:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ffe16d]/30 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-[#ffe16d]">
            <Sparkles size={13} /> SOKHBILASH SUPPORT CENTER
          </div>
          <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            প্রয়োজনীয় সব তথ্য,{" "}
            <span className="text-[#ffe16d]">এক জায়গায়।</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
            অর্ডার, ডেলিভারি, রিটার্ন, গোপনীয়তা, শর্তাবলি ও সহযোগিতা সম্পর্কে
            বিস্তারিত জানুন। যেকোনো বিষয় বেছে নিলেই সেই অংশে পৌঁছে যাবেন।
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => jumpTo("faq")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#ffe16d] px-5 py-3 text-xs font-bold text-primary transition hover:bg-[#ffd700]"
            >
              সাধারণ জিজ্ঞাসা <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => jumpTo("developer")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-xs font-bold text-white transition hover:bg-white/10"
            >
              Developer Profile <Code2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="page-container pt-7 sm:pt-10">
        {/* MOBILE SECTION TABS */}
        <nav
          aria-label="Help page sections"
          className="mb-5 flex gap-2 overflow-x-auto pb-2 lg:hidden"
        >
          {MENU.map(({ id, short }) => (
            <button
              key={id}
              type="button"
              onClick={() => jumpTo(id)}
              aria-current={activeId === id ? "location" : undefined}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
                activeId === id
                  ? "border-primary bg-primary text-white"
                  : "border-base-300 bg-white text-primary hover:border-secondary"
              }`}
            >
              {short}
            </button>
          ))}
        </nav>

        <div className="grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8">
          {/* STICKY DESKTOP NAV */}
          <aside className="sticky top-24 hidden rounded-2xl border border-base-300/80 bg-white p-3 shadow-sm lg:block">
            <p className="px-3 pb-3 pt-2 text-xs font-bold text-primary">
              এই পেজে যা আছে
            </p>
            <nav aria-label="Help topics" className="space-y-1">
              {MENU.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => jumpTo(id)}
                  aria-current={activeId === id ? "location" : undefined}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-3 text-left text-xs font-semibold transition ${
                    activeId === id
                      ? "bg-primary text-white"
                      : "text-primary/75 hover:bg-secondary/10 hover:text-secondary"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Icon size={16} className="shrink-0" />
                    {label}
                  </span>
                  <ChevronRight size={14} className="shrink-0 opacity-70" />
                </button>
              ))}
            </nav>
            <div className="mt-3 rounded-xl bg-[#f8f5fa] p-3 text-xs text-muted">
              <p className="font-bold text-primary">অর্ডার ট্র্যাক করতে চান?</p>
              <Link
                to="/track-order"
                className="mt-2 inline-flex items-center gap-1 font-bold text-secondary hover:underline"
              >
                ট্র্যাকিং পেজ <ArrowUpRight size={13} />
              </Link>
            </div>
          </aside>

          {/* ALL CONTENT */}
          <div className="min-w-0 space-y-6">
            {/* FAQ */}
            <SectionCard
              id="faq"
              icon={CircleHelp}
              eyebrow="01 / FREQUENTLY ASKED QUESTIONS"
              title="সাধারণ জিজ্ঞাসা"
              description="অর্ডার করার আগে সবচেয়ে বেশি জানতে চাওয়া প্রশ্নগুলোর উত্তর।"
            >
              <div className="space-y-3">
                {FAQS.map(({ q, a }, index) => (
                  <details
                    key={q}
                    className="group overflow-hidden rounded-xl border border-base-300 bg-white open:border-secondary/30 open:bg-[#fcf9fd]"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-primary [&::-webkit-details-marker]:hidden">
                      <span className="flex gap-3">
                        <span className="text-secondary/70">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {q}
                      </span>
                      <ChevronRight
                        size={17}
                        className="shrink-0 text-secondary transition-transform group-open:rotate-90"
                      />
                    </summary>
                    <p className="border-t border-base-300/60 px-4 py-3 text-xs leading-7 text-muted sm:text-sm">
                      {a}
                    </p>
                  </details>
                ))}
              </div>
              <Link
                to="/track-order"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:underline"
              >
                অর্ডার ট্র্যাক করুন <ArrowRight size={15} />
              </Link>
            </SectionCard>

            {/* DELIVERY */}
            <SectionCard
              id="delivery"
              icon={Truck}
              eyebrow="02 / SHIPPING & DELIVERY"
              title="ডেলিভারি তথ্য"
              description="চার্জ, কুরিয়ার এবং ডেলিভারি আপডেট সম্পর্কে জানুন।"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-secondary/15 bg-[#faf5fc] p-5">
                  <p className="flex items-center gap-2 text-xs font-bold text-secondary">
                    <MapPin size={16} /> নরসিংদীর মধ্যে
                  </p>
                  <p className="mt-2 text-2xl font-bold text-primary">৳৮০</p>
                  <p className="mt-1 text-xs text-muted">
                    বর্তমান নির্ধারিত ডেলিভারি চার্জ
                  </p>
                </div>
                <div className="rounded-xl border border-[#ffe16d]/70 bg-[#fffcf0] p-5">
                  <p className="flex items-center gap-2 text-xs font-bold text-primary">
                    <Truck size={16} /> নরসিংদীর বাইরে
                  </p>
                  <p className="mt-2 text-2xl font-bold text-primary">৳১৩০</p>
                  <p className="mt-1 text-xs text-muted">
                    বর্তমান নির্ধারিত ডেলিভারি চার্জ
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoItem title="কবে ডেলিভারি হবে?" icon={PackageCheck}>
                  ডেলিভারির সময় পণ্য, কাস্টমাইজেশন ও গন্তব্য অনুযায়ী ভিন্ন হতে
                  পারে। অর্ডারে Expected Delivery Date দেওয়া থাকলে সেটি আনুমানিক
                  সময়, নিশ্চিত ডেলিভারির প্রতিশ্রুতি নয়।
                </InfoItem>
                <InfoItem title="কুরিয়ার ট্র্যাকিং" icon={Truck}>
                  কুরিয়ারে পাঠানোর পর Tracking ID দেওয়া হতে পারে। অর্ডার
                  ট্র্যাকিং পেজে Status দেখুন, আর Courier Tracking Link থাকলে
                  সেটি ব্যবহার করুন।
                </InfoItem>
                <InfoItem title="COD অর্ডার" icon={CreditCard}>
                  Cash on Delivery অর্ডারে ফোনে Confirmation প্রয়োজন হতে পারে।
                  COD সেবার প্রাপ্যতা Checkout বা সাপোর্টে নিশ্চিত করুন।
                </InfoItem>
                <InfoItem title="ডেলিভারি ঠিকানা" icon={MapPin}>
                  সঠিক নাম, ফোন, বিভাগ, জেলা ও পূর্ণ ঠিকানা দিন। অসম্পূর্ণ বা
                  ভুল ঠিকানায় ডেলিভারি বিলম্বিত হতে পারে।
                </InfoItem>
              </div>
            </SectionCard>

            {/* RETURNS */}
            <SectionCard
              id="return-policy"
              icon={RotateCcw}
              eyebrow="03 / RETURNS & REFUNDS"
              title="রিটার্ন ও রিফান্ড নীতি"
              description="সমস্যা হলে কীভাবে সহায়তা চাইবেন এবং কোন বিষয়ে যাচাই প্রয়োজন।"
            >
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
                <span className="font-bold">গুরুত্বপূর্ণ:</span> নিচের তথ্য
                সাধারণ নির্দেশনা। নির্দিষ্ট রিটার্ন সময়সীমা, রিফান্ড পদ্ধতি ও
                যোগ্যতা ব্যবসা কর্তৃপক্ষ অনুমোদন করার পর চূড়ান্ত হবে।
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoItem title="ভুল বা ক্ষতিগ্রস্ত পণ্য" icon={PackageCheck}>
                  পণ্য ভুল, ভাঙা বা ক্ষতিগ্রস্ত অবস্থায় পেলে অর্ডার নম্বর এবং
                  পরিষ্কার ছবি/ভিডিওসহ অফিসিয়াল সাপোর্টে জানান।
                </InfoItem>
                <InfoItem title="কাস্টমাইজড পণ্য" icon={Gift}>
                  গ্রাহকের নাম, ছবি বা নির্দেশনা অনুযায়ী তৈরি পণ্যে শুধু পছন্দ
                  পরিবর্তনের কারণে রিটার্ন সম্ভব নাও হতে পারে। উৎপাদনজনিত সমস্যা
                  থাকলে তা যাচাই করা হবে।
                </InfoItem>
                <InfoItem title="অনুরোধের পর কী হবে?" icon={CircleHelp}>
                  সাপোর্ট টিম অর্ডার ও প্রমাণ যাচাই করে প্রযোজ্য সমাধান জানাবে।
                  রিটার্ন, রিপ্লেসমেন্ট বা রিফান্ডের সিদ্ধান্ত যাচাইয়ের ওপর
                  নির্ভর করবে।
                </InfoItem>
                <InfoItem title="অর্থ ফেরত" icon={CreditCard}>
                  অনুমোদিত রিফান্ডের পরিমাণ ও মাধ্যম পেমেন্ট রেকর্ড অনুযায়ী
                  নিশ্চিত করতে হবে। যাচাই ছাড়া কোনো স্বয়ংক্রিয় Refund হয় না।
                </InfoItem>
              </div>
            </SectionCard>

            {/* PRIVACY */}
            <SectionCard
              id="privacy-policy"
              icon={ShieldCheck}
              eyebrow="04 / PRIVACY & INFORMATION"
              title="গোপনীয়তা নীতি"
              description="সাইট ব্যবহার ও অর্ডার সম্পন্ন করতে কোন তথ্য প্রয়োজন হতে পারে।"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoItem title="যে তথ্য সংগ্রহ হয়" icon={UserRound}>
                  নাম, ফোন নম্বর, ইমেইল, ডেলিভারি ঠিকানা, অর্ডার তথ্য এবং কাস্টম
                  গিফট তৈরির জন্য জমা দেওয়া ছবি/নির্দেশনা।
                </InfoItem>
                <InfoItem title="পেমেন্ট সংক্রান্ত তথ্য" icon={CreditCard}>
                  Manual payment verification-এর জন্য মাধ্যম, প্রেরকের নম্বর,
                  Transaction ID এবং দাবিকৃত Amount জমা দেওয়া হতে পারে।
                </InfoItem>
                <InfoItem title="তথ্যের ব্যবহার" icon={BadgeCheck}>
                  অর্ডার প্রক্রিয়াকরণ, গ্রাহকের সঙ্গে যোগাযোগ, পেমেন্ট যাচাই,
                  ডেলিভারি, সাপোর্ট ও সাইট পরিচালনার জন্য প্রাসঙ্গিক তথ্য
                  ব্যবহার করা হয়।
                </InfoItem>
                <InfoItem title="তৃতীয় পক্ষের সেবা" icon={LockKeyhole}>
                  Authentication, Database, Image Hosting বা Delivery-এর কাজে
                  পৃথক সেবা প্রদানকারী ব্যবহৃত হতে পারে। তাদের প্রযোজ্য নীতিও
                  বিবেচ্য।
                </InfoItem>
              </div>
              <p className="rounded-xl bg-base-200/80 p-4 text-xs leading-6 text-muted">
                তথ্য সংশোধন বা প্রাইভেসি সংক্রান্ত অনুরোধের জন্য অফিসিয়াল
                সাপোর্টে যোগাযোগ করুন। তথ্য সংরক্ষণের সময়সীমা, ডেটা মুছার পদ্ধতি
                ও বিস্তারিত তৃতীয়-পক্ষ তালিকা প্রকাশের আগে ব্যবসা কর্তৃপক্ষকে
                চূড়ান্ত করতে হবে।
              </p>
            </SectionCard>

            {/* TERMS */}
            <SectionCard
              id="terms"
              icon={ScrollText}
              eyebrow="05 / TERMS & CONDITIONS"
              title="শর্তাবলি"
              description="SokhBilash থেকে অর্ডার করার সাধারণ নিয়ম ও দায়িত্ব।"
            >
              <div className="space-y-3">
                {[
                  [
                    "সঠিক তথ্য",
                    "অর্ডার দেওয়ার সময় সঠিক নাম, ফোন নম্বর, ঠিকানা ও কাস্টমাইজেশন নির্দেশনা প্রদান করতে হবে।",
                  ],
                  [
                    "অর্ডার কনফার্মেশন",
                    "অর্ডার সাবমিট হওয়ার পরও পেমেন্ট ও প্রয়োজনে COD ফোন কনফার্মেশন যাচাই হতে পারে।",
                  ],
                  [
                    "ম্যানুয়াল পেমেন্ট",
                    "bKash/Nagad/Rocket Send Money-এর TrxID জমা দিলেই পেমেন্ট স্বয়ংক্রিয়ভাবে Verified হবে না। Admin-এর যাচাই প্রয়োজন।",
                  ],
                  [
                    "পণ্যের মূল্য ও প্রাপ্যতা",
                    "পণ্য, ভ্যারিয়েন্ট ও প্রাপ্যতা পরিবর্তিত হতে পারে। অর্ডার করার সময় দেখানো সারাংশ ও চূড়ান্ত Checkout Total যাচাই করুন।",
                  ],
                  [
                    "কাস্টমাইজেশন",
                    "নিজের দেওয়া ছবি, লেখা এবং বানানের যথার্থতার দায়িত্ব গ্রাহকের। আপত্তিকর বা অধিকার লঙ্ঘনকারী কনটেন্ট দেওয়া যাবে না।",
                  ],
                  [
                    "সমস্যা ও সহায়তা",
                    "কোনো সমস্যা হলে অর্ডার নম্বরসহ অফিসিয়াল সাপোর্টে যোগাযোগ করুন। প্রযোজ্য নীতি ও আইন অনুযায়ী অভিযোগ মূল্যায়ন করা হবে।",
                  ],
                ].map(([title, body], index) => (
                  <div
                    key={title}
                    className="flex items-start gap-3 rounded-xl border border-base-300 p-4"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-xs font-bold text-secondary">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-primary">
                        {title}
                      </h3>
                      <p className="mt-1 text-xs leading-6 text-muted sm:text-sm">
                        {body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* DEVELOPER */}
            <SectionCard
              id="developer"
              icon={Code2}
              eyebrow="07 / BUILT WITH CARE"
              title="ডেভেলপার পরিচিতি"
              description="SokhBilash-এর ওয়েবসাইটের প্রযুক্তিগত বাস্তবায়ন সম্পর্কে।"
            >
              <div className="relative overflow-hidden rounded-2xl border border-secondary/15 bg-gradient-to-br from-[#faf5fc] via-white to-[#fffcef] p-5 sm:p-7">
                <div className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full border-[25px] border-secondary/5" />
                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                  <div className="relative size-32 shrink-0 self-center rounded-3xl bg-gradient-to-br from-secondary to-primary p-1 shadow-md sm:size-36">
                    <div className="flex size-full items-center justify-center overflow-hidden rounded-[20px] bg-[#ece0ef] text-secondary">
                      {!photoError ? (
                        <img
                          src={DEVELOPER.photo}
                          alt={`Developer ${DEVELOPER.name}`}
                          className="size-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={() => setPhotoError(true)}
                        />
                      ) : (
                        <UserRound size={48} />
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 flex size-9 items-center justify-center rounded-xl border-4 border-white bg-[#ffe16d] text-primary">
                      <Code2 size={17} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <p className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-bold text-secondary">
                      <Heart size={12} /> Website Developer
                    </p>
                    <h3 className="mt-3 text-xl font-bold text-primary sm:text-2xl">
                      {DEVELOPER.name}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-secondary">
                      {DEVELOPER.role}
                    </p>
                    <p className="mt-3 max-w-2xl text-xs leading-7 text-muted sm:text-sm">
                      {DEVELOPER.description}
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
                      <ExternalProfileLink
                        href={DEVELOPER.github}
                        icon={FaGithub}
                        primary
                      >
                        GitHub
                      </ExternalProfileLink>
                      <ExternalProfileLink
                        href={DEVELOPER.linkedin}
                        icon={FaLinkedinIn}
                      >
                        LinkedIn
                      </ExternalProfileLink>
                      <ExternalProfileLink
                        href={DEVELOPER.portfolio}
                        icon={Globe2}
                      >
                        Portfolio
                      </ExternalProfileLink>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-base-300 p-4">
                <div>
                  <p className="text-xs font-bold text-primary">
                    Designed & Developed for {CONTACT.businessName}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    React • Node.js • Express • MongoDB • Firebase
                  </p>
                </div>
                <a
                  href={DEVELOPER.photoPage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
                >
                  Profile photo <ExternalLink size={13} />
                </a>
              </div>
            </SectionCard>

            {/* ======================================= */}
            {/* BUSINESS CONTACT */}
            {/* ======================================= */}

            <section
              id="contact"
              className="relative overflow-hidden rounded-2xl border border-base-300 bg-white p-5 shadow-sm sm:p-8"
            >
              {/* Decorative background */}
              <div className="pointer-events-none absolute -right-14 -top-16 size-40 rounded-full bg-secondary/5 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-12 size-44 rounded-full bg-gold-soft/15 blur-2xl" />

              <div className="relative z-10 mx-auto max-w-2xl text-center">
                {/* Icon */}
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-secondary/10 bg-secondary/10 text-secondary">
                  <BookOpenText size={22} />
                </div>

                {/* Heading */}
                <h2 className="mt-4 text-lg font-bold text-primary sm:text-xl">
                  আর কোনো প্রশ্ন আছে?
                </h2>

                <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-muted sm:text-sm">
                  অর্ডার, ডেলিভারি কিংবা পেমেন্ট সংক্রান্ত যেকোনো সমস্যায় অর্ডার
                  নম্বরসহ{" "}
                  <span className="font-semibold text-secondary">
                    {CONTACT.businessName}
                  </span>
                  -এর অফিসিয়াল সাপোর্টে যোগাযোগ করুন।
                </p>

                {/* CONTACT ACTIONS */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                  {/* WhatsApp */}
                  {CONTACT.whatsapp && (
                    <a
                      href={getWhatsAppUrl(
                        "হ্যালো শখবিলাস, আমি একটি বিষয়ে জানতে চাই।",
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white transition hover:bg-secondary"
                    >
                      <MessageCircle size={16} />
                      WhatsApp Support
                      <ArrowUpRight size={14} />
                    </a>
                  )}

                  {/* Call */}
                  {CONTACT.phone && (
                    <a
                      href={CONTACT_URLS.phone}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-base-300 bg-white px-5 py-2.5 text-xs font-bold text-primary transition hover:border-secondary/30 hover:bg-secondary/5"
                    >
                      <Phone size={16} className="text-secondary" />
                      Call Support
                    </a>
                  )}

                  {/* Email */}
                  {CONTACT.email && (
                    <a
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT.email)}&su=${encodeURIComponent("SokhBilash Support Request")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-base-300 bg-white px-5 py-2.5 text-xs font-bold text-primary transition hover:bg-secondary/5"
                    >
                      <Mail size={16} className="text-secondary" />
                      Email Support
                    </a>
                  )}

                  {/* Track Order */}
                  <Link
                    to="/track-order"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-base-300 bg-white px-5 py-2.5 text-xs font-bold text-primary transition hover:border-secondary/30 hover:bg-secondary/5"
                  >
                    <Truck size={16} className="text-secondary" />
                    Track Order
                  </Link>
                </div>

                {/* Contact Details */}
                {(CONTACT.phone || CONTACT.email) && (
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-base-300/70 pt-5 text-[11px] text-muted sm:text-xs">
                    {CONTACT.phone && (
                      <a
                        href={CONTACT_URLS.phone}
                        className="transition hover:text-secondary"
                      >
                        {CONTACT.phone}
                      </a>
                    )}

                    {CONTACT.phone && CONTACT.email && (
                      <span className="hidden size-1 rounded-full bg-base-300 sm:block" />
                    )}

                    {CONTACT.email && (
                      <a
                        href={CONTACT_URLS.email}
                        className="break-all transition hover:text-secondary"
                      >
                        {CONTACT.email}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
