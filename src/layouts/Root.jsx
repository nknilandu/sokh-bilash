import { Outlet } from "react-router";
import Navbar from "../components/root/Navbar";
import Footer from "../components/root/Footer";
import ScrollToTop from "../components/system/ScrollToTop";


const Root = () => {
  return (
    <div className="bg-base-200 min-h-screen">
      <Navbar></Navbar>
      <Outlet></Outlet>
      <Footer></Footer>
      <ScrollToTop></ScrollToTop>
    </div>
  );
};

export default Root;
