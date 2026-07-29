import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Header from "../components/landing/Header";
import HeroHome from "../components/landing/HeroHome";
import FeaturesPlanet from "../components/landing/FeaturesPlanet";
import LargeTestimonial from "../components/landing/LargeTestimonial";
import Footer from "../components/landing/Footer";

function Landing() {
  useEffect(() => {
    AOS.init({
      once: true,
      duration: 700,
      easing: "ease-out-cubic",
    });
  }, []);

  return (
    <div className="landing-form">
      <Header />
      <main>
        <HeroHome />
        <FeaturesPlanet />
        <LargeTestimonial />
      </main>
      <Footer border />
    </div>
  );
}

export default Landing;
