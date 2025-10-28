"use client";

import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { useResponse } from "@/app/hooks/useResponse";
import { useTheme } from "@/app/hooks/useTheme";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

export default function Hero() {
  const { theme } = useTheme();
  const { auth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    generationLimit,
    myText,
    setMyText,
    aiResponse,
    setAiResponse,
    inputOuputPair,
    setInputOutputPair,
  } = useResponse();
  const [isTyping, setIsTyping] = useState(true);
  const [firstTime, setFirstTime] = useState(true);
  const [request, setRequest] = useState(false);
  const [tempMyText, setTempMyText] = useState("");
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [showPopupMessage, setShowPopupMessage] = useState(
    "Your daily limit is over. Please try again tomorrow"
  );
  const chatRef = useRef(null);
  const bottomRef = useRef(null);
  const isUpdatingRef = useRef(false);

  const selectedDate = searchParams.get("selectedDate");

  return (
    <div
      className={`w-full px-[10%] mb-[5%] flex flex-col md:flex-row items-start justify-between`}
    >
      {/* Left Side: Heading, Subheading, and Buttons */}
      <div className="w-full md:w-1/2 sm:pr-[5%] flex flex-col justify-center items-start space-y-6">
        <h1
          className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight ${
            theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
          }`}
        >
          Craft <span className={`${colors.keyColorText}`}>Professional</span>{" "}
          Recruiter Replies
        </h1>
        <p
          className={`text-md sm:text-lg lg:text-xl ${
            theme ? "text-gray-600" : "text-gray-300"
          }`}
        >
          Save time and stand out with tailored, professional email responses to
          recruiters, generated in seconds.
        </p>
        <div className="flex space-x-4">
          <Link
            href={auth ? "/chat" : "/login"}
            className={`px-6 py-2 rounded-lg text-sm md:text-lg font-semibold transition-all duration-300 flex justify-center items-center ${colors.keyColorBg} ${colors.keyColortBgHover} text-white`}
          >
            Get Started
          </Link>
          <Link
            href="/pricing"
            className={`px-6 py-2 rounded-lg text-sm md:text-lg font-semibold transition-all duration-300 border flex justify-center items-center ${
              theme
                ? "border-[#0a0a0a] text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white"
                : "border-[#ebebeb] text-[#ebebeb] hover:bg-[#ebebeb] hover:text-[#0a0a0a]"
            }`}
          >
            Pricing
          </Link>
        </div>
      </div>

      {/* Right Side: Placeholder for Video (16:9 aspect ratio) */}
      <div className="w-full md:w-1/2 mt-8 md:mt-0 flex justify-center">
        <div
          className={`w-full max-w-[600px] aspect-[16/9] rounded-lg shadow-lg ${
            theme ? "bg-gray-200" : "bg-gray-700"
          } flex items-center justify-center`}
        >
          <p className={`text-lg ${theme ? "text-gray-600" : "text-gray-300"}`}>
            Video Placeholder (16:9)
          </p>
        </div>
      </div>
    </div>
  );
}
