"use client";

import { useResponse } from "@/app/hooks/useResponse";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import Link from "next/link";
import { useState, useEffect } from "react";
import { callChangePaymentType, callUpdateUser } from "@/app/actions";
import colors from "@/app/color/color";
import { useRouter } from "next/navigation";

export default function Billing() {
  const { generationLimit, wantToPaymentType, wantToPaymentDuration } = useResponse();
  const { auth, setAuth } = useAuth();
  const { theme } = useTheme();
  const [cardNumber, setCardNumber] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!auth) {
      router.push("/login");
    }
  }, [auth, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!auth?.email) {
      setError("You must be logged in to proceed.");
      return;
    }
    if (!cardNumber || !pin) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/^\d{16}$/.test(cardNumber)) {
      setError("Card number must be 16 digits.");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be 4 digits.");
      return;
    }

    // Calculate expiredAt
    const today = new Date();
    let expiredAtDate;
    if (wantToPaymentDuration === "monthly") {
      expiredAtDate = new Date(today);
      expiredAtDate.setDate(today.getDate() + 30);
    } else if (wantToPaymentDuration === "annually") {
      expiredAtDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    } else {
      expiredAtDate = new Date(today); // Fallback
    }
    const year = expiredAtDate.getFullYear();
    const month = String(expiredAtDate.getMonth() + 1).padStart(2, "0");
    const day = String(expiredAtDate.getDate()).padStart(2, "0");
    const expiredAt = `${year}-${month}-${day}`;

    console.log("Billing - today:", today);
    console.log("Billing - wantToPaymentType:", wantToPaymentType);
    console.log("Billing - wantToPaymentDuration:", wantToPaymentDuration);
    console.log("Billing - expiredAtDate:", expiredAtDate);
    console.log("Billing - expiredAt:", expiredAt);

    try {
      // Update auth.history for today's generation limit
      const todayStr = today.toLocaleDateString("en-CA"); // "YYYY-MM-DD"
      const tempHistory = auth?.history ? [...auth.history] : [];
      const subscription = wantToPaymentType.toLowerCase();
      const limit = generationLimit[subscription] || generationLimit.free;

      const todayEntryIndex = tempHistory.findIndex((entry) => {
        const entryDateStr =
          entry.date instanceof Date
            ? entry.date.toISOString()
            : String(entry.date);
        const entryDate = entryDateStr.includes("T")
          ? entryDateStr.split("T")[0]
          : entryDateStr;
        return entryDate === todayStr;
      });

      console.log("Billing - todayStr:", todayStr);
      console.log("Billing - tempHistory before update:", tempHistory);
      console.log("Billing - todayEntryIndex:", todayEntryIndex);
      console.log("Billing - generationLimit:", limit);

      if (todayEntryIndex !== -1) {
        // Update existing entry
        tempHistory[todayEntryIndex] = {
          ...tempHistory[todayEntryIndex],
          generation: limit,
        };
      } else {
        // Create new entry
        tempHistory.push({
          date: todayStr,
          context: [],
          generation: limit,
        });
      }

      console.log("Billing - tempHistory after update:", tempHistory);

      // Update auth state
      setAuth({
        ...auth,
        paymentType: wantToPaymentType,
        expiredAt: expiredAt,
        history: tempHistory,
      });

      // Update database
      await callChangePaymentType(auth.email, wantToPaymentType, expiredAt);
      await callUpdateUser(auth.email, auth.name, auth.firstTimeLogin, tempHistory);

      setSuccess("Payment updated successfully!");
      setCardNumber("");
      setPin("");
    } catch (err) {
      console.error("Billing - error:", err);
      setError("Failed to update payment. Please try again.");
    }
  };

  return (
    <div
      className={`h-full sm:pt-[10%] w-full flex flex-col items-center justify-center p-4 sm:p-6 ${
        theme ? "bg-[#ffffff] text-[#0a0a0a]" : "bg-[#000000] text-[#ebebeb]"
      }`}
    >
      <div className="max-w-md w-full">
        <h1
          className={`text-2xl sm:text-3xl font-bold mb-4 text-center ${
            theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
          }`}
        >
          Billing for {wantToPaymentType} ({wantToPaymentDuration})
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="cardNumber"
              className={`block text-sm sm:text-base font-medium mb-1 ${
                theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
              }`}
            >
              Card Number
            </label>
            <input
              id="cardNumber"
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="Enter 16-digit card number"
              className={`w-full p-2 sm:p-3 rounded-lg bg-transparent border-[2px] border-blue-700 focus:border-green-700 focus:outline-none text-sm sm:text-base ${
                theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
              }`}
            />
          </div>
          <div>
            <label
              htmlFor="pin"
              className={`block text-sm sm:text-base font-medium mb-1 ${
                theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
              }`}
            >
              PIN
            </label>
            <input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter 4-digit PIN"
              className={`w-full p-2 sm:p-3 rounded-lg bg-transparent border-[2px] border-blue-700 focus:border-green-700 focus:outline-none text-sm sm:text-base ${
                theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
              }`}
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm sm:text-base text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="text-green-600 text-sm sm:text-base text-center">
              {success}
            </div>
          )}
          <button
            type="submit"
            className={`w-full p-2 sm:p-3 rounded-lg text-sm sm:text-base font-medium ${colors.keyColorBg} text-white hover:bg-blue-800`}
          >
            Submit
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            className={`p-2 sm:p-3 rounded-lg text-sm sm:text-base font-medium ${
              theme
                ? "bg-gray-200 text-[#0a0a0a] hover:bg-gray-300"
                : "bg-[#222222] text-[#ebebeb] hover:bg-[#2a2a2a]"
            }`}
          >
            <Link href="/payment">Go Back to Payment</Link>
          </button>
        </div>
      </div>
    </div>
  );
}