"use client";
import { useTheme } from "@/app/hooks/useTheme";
import Footer from "./Footer";
import Hero from "./Hero";

export default function LandingPage() {
  const {theme} = useTheme();
  return (
    <div
      className={`w-[99%] sm:pt-[13%] pt-[20%] ${
        theme ? "bg-[#ffffff] text-[#aaaaaaa]" : "bg-[#000000] text-[#eeeeee]"
      }`}
    >
      <Hero/>
      <Footer />
    </div>
  );
}
