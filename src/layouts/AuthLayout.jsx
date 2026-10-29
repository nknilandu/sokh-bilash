import { Outlet, Link } from "react-router-dom";
import logo from "../assets/sokhbilash-nav-logo.png";
import ScrollToTop from "../components/system/ScrollToTop";

const AuthLayout = () => {
  return (
    <>
      <div className="min-h-screen bg-base-200">
        <header className="border-b border-base-300 bg-base-100">
          <div className="page-container flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="sokhbilash logo" className="h-15" />
            </Link>

            <Link
              to="/"
              className="text-sm font-medium text-secondary hover:text-primary"
            >
              হোমপেজে ফিরুন
            </Link>
          </div>
        </header>

        <main className="page-container flex min-h-[calc(100vh-64px)] items-center justify-center py-10">
          <Outlet />
        </main>
      </div>
      <ScrollToTop></ScrollToTop>
    </>
  );
};

export default AuthLayout;
