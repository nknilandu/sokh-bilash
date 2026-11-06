import GiftBuilderSteps from "../components/home/GiftBuilderSteps";
import GiftCategories from "../components/home/GiftCategories";
import Hero from "../components/home/Hero";
import OccasionGifts from "../components/home/OccasionGifts";
import OrderSteps from "../components/home/OrderSteps";
import PopularProducts from "../components/home/PopularProducts";
import Testimonials from "../components/home/Testimonials";

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
    </>
  );
};

export default Home;
