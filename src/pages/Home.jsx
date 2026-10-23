import GiftBuilderSteps from "../components/home/GiftBuilderSteps";
import GiftCategories from "../components/home/GiftCategories";
import Hero from "../components/home/Hero";
import OccasionGifts from "../components/home/OccasionGifts";
import OrderSteps from "../components/home/OrderSteps";
import PopularProducts from "../components/home/PopularProducts";
import Testimonials from "../components/home/Testimonials";
// import CategorySection from "../components/home/CategorySection";
// import OccasionSection from "../components/home/OccasionSection";
// import BestsellingProducts from "../components/home/BestsellingProducts";
// import GiftBoxPromotion from "../components/home/GiftBoxPromotion";
// import HowItWorks from "../components/home/HowItWorks";
// import ReviewsSection from "../components/home/ReviewsSection";
// import Newsletter from "../components/home/Newsletter";

const Home = () => {
  return (
    <>
      <Hero />
      <GiftCategories />
      <OccasionGifts />
      <PopularProducts />
      <GiftBuilderSteps />
      <OrderSteps />
      <Testimonials />

      {/* <CategorySection />
      <OccasionSection />
      <BestsellingProducts />
      <GiftBoxPromotion />
      <HowItWorks />
      <ReviewsSection />
      <Newsletter /> */}
    </>
  );
};

export default Home;