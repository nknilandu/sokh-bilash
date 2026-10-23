import { Hand, Pencil, Eye, Truck } from "lucide-react";

const orderSteps = [
  {
    number: "০১",
    title: "পছন্দ করুন",
    description:
      "আমাদের গিফট কালেকশন থেকে পছন্দের উপহার বা গিফট বক্স বেছে নিন।",
    Icon: Hand,
  },
  {
    number: "০২",
    title: "কাস্টমাইজ করুন",
    description:
      "প্রিয়জনের জন্য নাম, ছবি বা মনের কথা যোগ করে উপহারটি নিজের মতো সাজান।",
    Icon: Pencil,
  },
  {
    number: "০৩",
    title: "প্রিভিউ দেখুন",
    description:
      "অর্ডার করার আগে আপনার তৈরি করা ডিজাইনটি দেখে নিশ্চিত হয়ে নিন।",
    Icon: Eye,
  },
  {
    number: "০৪",
    title: "দ্রুত ডেলিভারি পান",
    description: "নিরাপদে প্যাক করা উপহার আপনার ঠিকানায় পৌঁছে যাবে।",
    Icon: Truck,
  },
];

const OrderSteps = () => {
  return (
    <section className="section-bg section-padding bg-secondary/5">
      <div className="page-container">
        <div className="section-card rounded-3xl shadow-none px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
          <div className="mb-8 text-center">
            <span className="badge-soft">সহজ প্রক্রিয়া</span>

            <h2 className="mt-3 text-2xl font-bold text-primary sm:text-3xl">
              সহজে ৪ ধাপে অর্ডার করুন
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {orderSteps.map(({ number, title, description, Icon }) => (
              <div
                key={number}
                className="group flex flex-col items-center text-center transition-all duration-200 ease-out hover:-translate-y-px"
              >
                <div className="icon-box h-12 w-12 transition-all group-hover:bg-secondary/20 ">
                  <Icon size={21} strokeWidth={1.8} />
                </div>

                <span className="mt-3 text-xs font-medium text-secondary">
                  ধাপ {number}
                </span>

                <h3 className="mt-1 text-base font-bold text-primary">
                  {title}
                </h3>

                <p className="mt-2 max-w-xs text-sm leading-6 text-muted">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderSteps;
