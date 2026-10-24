
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Gift,
  Home,
  SearchX,
  Sparkles,
} from "lucide-react";

const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <main className="page-bg flex min-h-[85vh] items-center justify-center overflow-hidden py-12">
      <div className="page-container">
        <div className="mx-auto max-w-2xl text-center">

          {/* Illustration */}
          <div className="relative mx-auto mb-8 flex h-44 w-64 items-center justify-center sm:h-56 sm:w-80">

            <div className="absolute inset-0 rounded-full bg-secondary/10 blur-3xl" />

            <span className="relative select-none text-[110px] font-black leading-none tracking-tighter text-primary sm:text-[150px]">
              404
            </span>

            <div className="absolute right-5 top-4 flex size-14 rotate-12 items-center justify-center rounded-2xl bg-gold-soft text-primary shadow-lg sm:right-0">
              <Gift size={28} />
            </div>

            <div className="absolute bottom-4 left-3 flex size-12 -rotate-12 items-center justify-center rounded-2xl bg-secondary text-white shadow-lg">
              <SearchX size={23} />
            </div>

            <Sparkles
              size={22}
              className="absolute right-4 bottom-6 text-secondary"
            />
          </div>

          {/* Content */}
          <span className="badge-soft">
            <Sparkles size={14} />
            উফ! পথ হারিয়ে ফেলেছেন?
          </span>

          <h1 className="mt-5 text-2xl font-extrabold leading-tight text-primary sm:text-4xl">
            এই পেজটি খুঁজে পাওয়া যায়নি!
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-muted sm:text-base">
            মনে হচ্ছে আপনি যে পেজটি খুঁজছেন সেটি সরিয়ে
            ফেলা হয়েছে, অথবা লিংকটি সঠিক নয়।
            তবে চিন্তা নেই, আপনার পছন্দের উপহারগুলো
            এখনো আমাদের কাছেই আছে!
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

            <Link
              to="/"
              className="btn-brand rounded-xl px-7"
            >
              <Home size={18} />
              হোমপেজে ফিরে যান
              <ArrowRight size={16} />
            </Link>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-outline-brand rounded-xl px-7"
            >
              <ArrowLeft size={18} />
              আগের পেজে যান
            </button>
          </div>

          {/* Bottom Link */}
          <div className="mt-10 border-t border-base-300 pt-6">
            <p className="text-sm text-muted">
              নতুন কিছু খুঁজছেন?{" "}
              <Link
                to="/shop"
                className="inline-flex items-center gap-1 font-bold text-secondary hover:text-primary"
              >
                আমাদের উপহারগুলো দেখুন
                <ArrowRight size={15} />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ErrorPage;
