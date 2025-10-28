"use client";

import { useTheme } from "@/app/hooks/useTheme";
import { useResponse } from "@/app/hooks/useResponse";
import { useAuth } from "@/app/hooks/useAuth";
import { useState, useEffect } from "react";
import colors from "@/app/color/color";
import Link from "next/link";
import Footer from "./Footer";

export default function PaymentComponent() {
  const { setWantToPaymentType, setWantToPaymentDuration } = useResponse();
  const { auth } = useAuth();
  const { theme } = useTheme();

  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState("standard");
  const [isFreeTierExpired, setIsFreeTierExpired] = useState(false);

  // Check if auth.paymentType is "Expired" and update Free tier UI state
  useEffect(() => {
    if (auth && auth.paymentType === "Expired") {
      setIsFreeTierExpired(true);
    } else {
      setIsFreeTierExpired(false);
    }
  }, [auth]);

  const plans = [
    {
      id: "free",
      title: "Free",
      description: "Perfect for beginners",
      priceMonthly: 0,
      priceAnnual: 0,
      features: [
        { name: "products", value: "5 products" },
        { name: "subscribers", value: "Up to 1,000 subscribers" },
        { name: "analytics", value: "Basic analytics" },
        { name: "support", value: "Email support" },
      ],
      isMostPopular: false,
    },
    {
      id: "standard",
      title: "Standard",
      description: "Ideal for growing businesses",
      priceMonthly: 25,
      priceAnnual: 250,
      features: [
        { name: "products", value: "25 products" },
        { name: "subscribers", value: "Up to 10,000 subscribers" },
        { name: "analytics", value: "Advanced analytics" },
        { name: "support", value: "24-hour support" },
      ],
      isMostPopular: true,
    },
    {
      id: "premium",
      title: "Premium",
      description: "Best for large enterprises",
      priceMonthly: 50,
      priceAnnual: 500,
      features: [
        { name: "products", value: "Unlimited products" },
        { name: "subscribers", value: "Unlimited subscribers" },
        { name: "analytics", value: "Advanced analytics" },
        { name: "support", value: "1-hour dedicated support" },
      ],
      isMostPopular: false,
    },
  ];

  const getPrice = (planId) => {
    const plan = plans.find((p) => p.id === planId);
    return billingPeriod === "annual" ? plan.priceAnnual : plan.priceMonthly;
  };

  const getPriceLabel = (planId) => {
    const price = getPrice(planId);
    return `$${price}/${billingPeriod === "annual" ? "year" : "month"}`;
  };

  return (
    <div
      className={`h-full py-8 sm:pt-[8%] pt-[15%] px-4 sm:px-6 overflow-auto scrollbar relative ${
        theme
          ? "bg-[#ffffff] scrollbar-thumb-black scrollbar-track-[#eeeeee]"
          : "bg-[#000000] scrollbar-thumb-white scrollbar-track-[#222222]"
      }`}
    >
      <div className="max-w-4xl mb-[5%] sm:max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1
            className={`text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 ${
              theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
            }`}
          >
            Choose Your Plan
          </h1>
          <p
            className={`text-base sm:text-xl ${
              theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
            }`}
          >
            Select a plan to get started.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div
            className={`flex bg-[#eeeeee] rounded-full p-1 sm:p-2 ${
              theme ? "bg-[#eeeeee]" : "bg-[#222222]"
            }`}
          >
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 sm:px-5 py-1 sm:py-2 rounded-full text-sm sm:text-base font-medium transition-all ${
                billingPeriod === "monthly"
                  ? theme
                    ? "bg-[#ffffff] text-[#0a0a0a] shadow-sm"
                    : "bg-[#000000] text-[#ebebeb] shadow-sm"
                  : theme
                  ? "text-[#0a0a0a]"
                  : "text-[#cccccc]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")} // ← Fixed: was "annually"
              className={`px-4 sm:px-5 py-1 sm:py-2 rounded-full text-sm sm:text-base font-medium transition-all ${
                billingPeriod === "annual"
                  ? theme
                    ? "bg-[#ffffff] text-[#0a0a0a] shadow-sm"
                    : "bg-[#000000] text-[#ebebeb] shadow-sm"
                  : theme
                  ? "text-[#0a0a0a]"
                  : "text-[#cccccc]"
              }`}
            >
              Annually
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {plans.map((plan) => {
            const price = getPrice(plan.id);
            const priceLabel = getPriceLabel(plan.id);
            const isSelected = selectedPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`p-4 sm:p-6 rounded-lg ${
                  theme
                    ? plan.isMostPopular
                      ? `bg-[#ffffff] border-2 ${colors.keyColorBorder} hover:cursor-pointer`
                      : "bg-[#ffffff] border border-[#cccccc] hover:border-[#999999] hover:cursor-pointer"
                    : plan.isMostPopular
                    ? `bg-[#000000] border-2 ${colors.keyColorBorder} hover:cursor-pointer`
                    : `bg-[#000000] border border-[#444444] hover:border-[#666666] hover:cursor-pointer`
                } ${isSelected && !plan.isMostPopular ? "" : ""}`}
                onMouseEnter={() => setSelectedPlan(plan.id)}
                onMouseLeave={() => setSelectedPlan(null)}
              >
                {/* Most Popular Badge and Title */}
                <div className="flex justify-center items-center mb-2 sm:mb-3">
                  <div>
                    <h3
                      className={`text-xl sm:text-2xl font-bold ${
                        theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
                      }`}
                    >
                      {plan.title}
                    </h3>
                  </div>
                  {plan.isMostPopular && (
                    <div className="ml-3 sm:ml-4">
                      <span
                        className={`inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-xs sm:text-sm font-semibold ${
                          theme
                            ? `${colors.keyColorBg} text-[#ffffff]`
                            : `${colors.keyColorBg} text-[#ffffff]`
                        }`}
                      >
                        Most Popular
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-center mb-4 sm:mb-5">
                  <p
                    className={`text-sm sm:text-base ${
                      theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
                    }`}
                  >
                    {plan.description}
                  </p>
                  <div className="mt-2 sm:mt-3">
                    <div
                      className={`text-2xl sm:text-3xl font-bold ${
                        theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
                      }`}
                    >
                      {priceLabel}
                    </div>
                    {plan.id === "free" ? (
                      isFreeTierExpired ? (
                        <div className="w-full mt-3 sm:mt-5 py-1.5 sm:py-2 rounded-md text-sm sm:text-base font-medium bg-red-700 text-white">
                          Your Free Limit is Expired
                        </div>
                      ) : (
                        <button
                          className={`w-full py-1.5 sm:py-2 rounded-md mt-5 text-sm sm:text-base font-medium ${
                            theme
                              ? "bg-gray-200 text-[#0a0a0a] hover:bg-gray-300"
                              : "bg-[#222222] text-[#ebebeb] hover:bg-[#2a2a2a]"
                          }`}
                        >
                          <Link href={auth ? "/" : "/login"}>Use Now</Link>
                        </button>
                      )
                    ) : (
                      <Link href="/billing">
                        <button
                          onClick={() => {
                            setWantToPaymentType(plan.title);
                            setWantToPaymentDuration(billingPeriod);
                          }}
                          className={`w-full mt-3 sm:mt-5 py-1.5 sm:py-2 rounded-md text-sm sm:text-base font-medium ${
                            plan.isMostPopular
                              ? `${colors.keyColorBg} text-white hover:bg-blue-800`
                              : theme
                              ? "bg-gray-200 text-[#0a0a0a] hover:bg-gray-300"
                              : "bg-[#222222] text-[#ebebeb] hover:bg-[#2a2a2a]"
                          }`}
                        >
                          {plan.isMostPopular ? "Get Started" : "Buy Plan"}
                        </button>
                      </Link>
                    )}
                  </div>
                </div>

                <ul className="space-y-1 sm:space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <div
                        className={`w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full mr-1.5 sm:mr-2 ${
                          theme ? "bg-green-600" : "bg-green-600"
                        }`}
                      />
                      <span
                        className={`text-sm sm:text-base ${
                          theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
                        }`}
                      >
                        {feature.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
