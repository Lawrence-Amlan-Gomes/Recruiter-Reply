"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useResponse } from "@/app/hooks/useResponse";
import { response } from "@/app/server";
import PromptInput from "./PromptInput";
import EachInputOutput from "./EachInputOutput";
import { useTheme } from "@/app/hooks/useTheme";
import { useAuth } from "@/app/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import colors from "@/app/color/color";
import { callUpdateUser, callChangePaymentType } from "@/app/actions";
import Link from "next/link";

function ChatContent() {
  const {
    generationLimit,
    myText,
    setMyText,
    aiResponse,
    setAiResponse,
    inputOuputPair,
    setInputOutputPair,
  } = useResponse();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isTyping, setIsTyping] = useState(true);
  const { auth, setAuth } = useAuth();
  const { theme } = useTheme();
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

  // Initialize chat with date context
  useEffect(() => {
    if (!auth?.history) return;
    const today = new Date().toLocaleDateString("en-CA");
    const dateToLoad = selectedDate || today;
    const selectedEntry = auth.history.find((entry) => {
      const entryDateStr =
        entry.date instanceof Date
          ? entry.date.toISOString()
          : String(entry.date);
      const entryDate = entryDateStr.includes("T")
        ? entryDateStr.split("T")[0]
        : entryDateStr;
      return entryDate === dateToLoad;
    });
    if (selectedEntry && selectedEntry.context?.length > 0) {
      setInputOutputPair(selectedEntry.context);
    } else {
      setInputOutputPair([]);
    }
  }, [auth?.history, setInputOutputPair, selectedDate]);

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    router.refresh();
  }, [router]);

  const getResponse = async () => {
    if (!auth) {
      router.push("/login");
      return;
    }
    if (auth.paymentType === "Expired") {
      setShowPopupMessage("Your subscription has expired. Please ");
      setShowLimitPopup(true);
      return;
    }
    if (auth.expiredAt && new Date(auth.expiredAt) < new Date()) {
      setShowPopupMessage("Your subscription has expired. Please ");
      setShowLimitPopup(true);
      setAuth((prevAuth) => ({ ...prevAuth, paymentType: "Expired" }));
      await callChangePaymentType(auth.email, "Expired", auth.expiredAt);
      return;
    }
    if (myText !== "") {
      const today = new Date().toLocaleDateString("en-CA");
      const currentDate = selectedDate || today;
      const tempHistory = auth?.history ? [...auth.history] : [];
      const subscription = auth?.paymentType?.toLowerCase() || "free";
      const limit = generationLimit[subscription] || generationLimit.free;
      const todayEntryIndex = tempHistory.findIndex((entry) => {
        const entryDateStr =
          entry.date instanceof Date
            ? entry.date.toISOString()
            : String(entry.date);
        const entryDate = entryDateStr.includes("T")
          ? entryDateStr.split("T")[0]
          : entryDateStr;
        return entryDate === currentDate;
      });
      if (todayEntryIndex !== -1) {
        const matchedEntry = tempHistory[todayEntryIndex];
        if (matchedEntry.generation === 0) {
          setShowPopupMessage(
            "Your daily limit is over. Please try again tomorrow"
          );
          setShowLimitPopup(true);
          return;
        }
      }
      setIsTyping(false);
      setRequest(true);
      setTempMyText(myText);
      const tempInputOutputPair = [...inputOuputPair, [myText, "loading"]];
      setInputOutputPair(tempInputOutputPair);
      setMyText("");
      setTimeout(scrollToBottom, 0);
    }
  };

  useEffect(() => {
    setTimeout(scrollToBottom, 100);
  }, [inputOuputPair, request]);

  useEffect(() => {
    if (inputOuputPair.length > 0) setFirstTime(false);
  }, [inputOuputPair]);

  useEffect(() => {
    async function fetchData() {
      if (request && !isUpdatingRef.current) {
        isUpdatingRef.current = true;
        try {
          const res = await response(tempMyText, inputOuputPair);
          setAiResponse(res);
          const updatedPairs = [...inputOuputPair];
          updatedPairs[updatedPairs.length - 1] = [tempMyText, res];
          setInputOutputPair(updatedPairs);

          const today = new Date().toLocaleDateString("en-CA");
          const currentDate = selectedDate || today;
          const tempHistory = auth?.history ? [...auth.history] : [];
          const subscription = auth?.paymentType?.toLowerCase() || "free";
          const limit = generationLimit[subscription] || generationLimit.free;

          const todayEntryIndex = tempHistory.findIndex((entry) => {
            const entryDateStr =
              entry.date instanceof Date
                ? entry.date.toISOString()
                : String(entry.date);
            const entryDate = entryDateStr.includes("T")
              ? entryDateStr.split("T")[0]
              : entryDateStr;
            return entryDate === currentDate;
          });

          let newGeneration = limit;
          if (todayEntryIndex !== -1) {
            const currentGeneration = Number(
              tempHistory[todayEntryIndex].generation
            );
            newGeneration = isNaN(currentGeneration)
              ? limit
              : currentGeneration - 1;
            tempHistory[todayEntryIndex] = {
              ...tempHistory[todayEntryIndex],
              context: updatedPairs,
              generation: newGeneration,
            };
          } else {
            tempHistory.push({
              date: currentDate,
              context: updatedPairs,
              generation: newGeneration,
            });
          }

          setAuth((prev) => ({ ...prev, history: tempHistory }));
          await callUpdateUser(
            auth.email,
            auth.name,
            auth.firstTimeLogin,
            tempHistory
          );
        } catch {
          setAiResponse("Could not fetch AI response, Try again later.");
        } finally {
          setRequest(false);
          isUpdatingRef.current = false;
        }
      }
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, tempMyText, inputOuputPair]);

  return (
    <>
      {firstTime ? (
        <div
          className={`w-full h-screen flex justify-center items-center ${
            theme ? "bg-white text-black" : "bg-black text-white"
          }`}
        >
          <div className="text-center">
            <h2 className="text-5xl font-extrabold mb-6">
              Craft Perfect{" "}
              <span className={`${colors.keyColorText}`}>Replies </span> to
              Recruiters
            </h2>
            <p className="text-lg mb-8">
              Save time and impress recruiters with professional, tailored email
              responses generated in seconds.
            </p>
            <PromptInput
              myText={myText}
              setMyText={setMyText}
              getResponse={getResponse}
              setIsTyping={setIsTyping}
              aiResponse={aiResponse}
            />
          </div>
        </div>
      ) : (
        <div
          className={`h-screen w-full relative ${
            theme ? "bg-white text-black" : "bg-black text-white"
          }`}
        >
          <div
            ref={chatRef}
            className={`w-full h-screen pt-[2%] overflow-y-auto scrollbar ${
              theme
                ? "scrollbar-thumb-black scrollbar-track-[#eee]"
                : "scrollbar-thumb-white scrollbar-track-[#222]"
            }`}
          >
            <div className="h-[95%] sm:px-[20%] pt-[10%] w-full">
              {inputOuputPair.map((item, index) => (
                <EachInputOutput
                  key={index}
                  pair={item}
                  isLast={index === inputOuputPair.length - 1}
                  isLoading={request && index === inputOuputPair.length - 1}
                />
              ))}
              <div className="h-[40%]" ref={bottomRef}></div>
            </div>
          </div>
          <div
            className={`absolute bottom-0 left-0 w-full flex justify-center ${
              theme ? "bg-white" : "bg-black"
            }`}
          >
            <div className="w-[90%] sm:w-[60%]">
              <PromptInput
                myText={myText}
                setMyText={setMyText}
                getResponse={getResponse}
                setIsTyping={setIsTyping}
                aiResponse={aiResponse}
              />
            </div>
          </div>
        </div>
      )}
      {showLimitPopup && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 ${
            theme ? "bg-black/50" : "bg-black/70"
          }`}
        >
          <div
            className={`p-6 rounded-lg shadow-lg max-w-sm text-center ${
              theme ? "bg-white text-black" : "bg-black text-white"
            }`}
          >
            <h3 className="text-xl font-semibold mb-4">Daily Limit Exceeded</h3>
            <p className="mb-4">
              {showPopupMessage}
              {auth.paymentType === "Expired" && (
                <>
                  <Link
                    href="/payment"
                    className="underline text-blue-600 hover:text-blue-700"
                  >
                    Upgrade
                  </Link>{" "}
                  to continue crafting perfect replies.
                </>
              )}
            </p>
            <button
              onClick={() => setShowLimitPopup(false)}
              className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function Chat() {
  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <ChatContent />
    </Suspense>
  );
}
