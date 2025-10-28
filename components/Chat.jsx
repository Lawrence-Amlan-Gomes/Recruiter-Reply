"use client";

import { useEffect, useState, useRef } from "react";
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

export default function Chat() {
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

  // Initialize inputOuputPair with selected date's context or today's context
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
      console.log(
        `Chat - Initializing inputOuputPair with ${dateToLoad} context:`,
        selectedEntry.context
      );
      setInputOutputPair(selectedEntry.context);
    } else {
      console.log(
        `Chat - No context found for ${dateToLoad}, resetting inputOuputPair`
      );
      setInputOutputPair([]);
    }
  }, [auth?.history, setInputOutputPair, selectedDate]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (bottomRef.current) {
      console.log("Scrolling to bottom, ref exists:", !!bottomRef.current);
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    } else {
      console.log("bottomRef.current is null");
    }
  };

  useEffect(() => {
    router.refresh();
    console.log("Router refreshed on mount to sync auth.history");
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

      // Determine subscription tier and limit
      const subscription = auth?.paymentType?.toLowerCase() || "free";
      const limit = generationLimit[subscription] || generationLimit.free;
      console.log(
        `getResponse - PaymentType: ${auth?.paymentType}, Subscription: ${subscription}, Generation Limit: ${limit}`
      );

      // Log all history entries for debugging
      console.log("getResponse - CurrentDate:", currentDate);
      console.log(
        "getResponse - Full auth.history:",
        tempHistory.map((entry) => ({
          date: entry.date,
          parsedDate:
            entry.date instanceof Date
              ? entry.date.toISOString()
              : String(entry.date),
          generation: entry.generation,
        }))
      );

      const todayEntryIndex = tempHistory.findIndex((entry) => {
        const entryDateStr =
          entry.date instanceof Date
            ? entry.date.toISOString()
            : String(entry.date);
        const entryDate = entryDateStr.includes("T")
          ? entryDateStr.split("T")[0]
          : entryDateStr;
        console.log(
          `Comparing entryDate: ${entryDate} with currentDate: ${currentDate}`
        );
        return entryDate === currentDate;
      });

      console.log(
        `getResponse - CurrentDate: ${currentDate}, History length: ${tempHistory.length}, TodayEntryIndex: ${todayEntryIndex}`
      );
      if (todayEntryIndex !== -1) {
        const matchedEntry = tempHistory[todayEntryIndex];
        console.log(`Matched entry for ${currentDate}:`, matchedEntry);
        if (matchedEntry.generation === 0) {
          console.log("Generation is 0 - showing popup");
          setShowPopupMessage(
            "Your daily limit is over. Please try again tomorrow"
          );
          setShowLimitPopup(true);
          return;
        }
      } else {
        console.log(
          "No matching entry for currentDate - proceeding with request"
        );
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
    if (inputOuputPair.length === 0) {
      console.log(inputOuputPair.length);
    } else {
      setFirstTime(false);
    }
  }, [inputOuputPair]);

  useEffect(() => {
    async function fetchData() {
      if (request && !isUpdatingRef.current) {
        isUpdatingRef.current = true;
        try {
          const res = await response(tempMyText, inputOuputPair);
          setAiResponse(res);
          const tempInputOutputPair = [...inputOuputPair];
          tempInputOutputPair[tempInputOutputPair.length - 1] = [
            tempMyText,
            res,
          ];
          setInputOutputPair(tempInputOutputPair);

          const today = new Date().toLocaleDateString("en-CA");
          const currentDate = selectedDate || today;
          console.log("Chat - Using currentDate for update:", currentDate);

          const tempHistory = auth?.history ? [...auth.history] : [];

          // Determine subscription tier and limit
          const subscription = auth?.paymentType?.toLowerCase() || "free";
          const limit = generationLimit[subscription] || generationLimit.free;
          console.log(
            `useEffect - PaymentType: ${auth?.paymentType}, Subscription: ${subscription}, Generation Limit: ${limit}`
          );

          const todayEntryIndex = tempHistory.findIndex((entry) => {
            const entryDateStr =
              entry.date instanceof Date
                ? entry.date.toISOString()
                : String(entry.date);
            const entryDate = entryDateStr.includes("T")
              ? entryDateStr.split("T")[0]
              : entryDateStr;
            console.log(
              `useEffect - Comparing entryDate: ${entryDate} with currentDate: ${currentDate}`
            );
            return entryDate === currentDate;
          });

          console.log(
            `useEffect update - CurrentDate: ${currentDate}, History length: ${tempHistory.length}`
          );
          if (todayEntryIndex !== -1) {
            const matchedEntry = tempHistory[todayEntryIndex];
            console.log(
              `Matched entry for update at index ${todayEntryIndex}:`,
              matchedEntry
            );
          } else {
            console.log("No matching entry - creating new for currentDate");
          }

          let newGeneration = limit;
          if (todayEntryIndex !== -1) {
            const currentGeneration = Number(
              tempHistory[todayEntryIndex].generation
            );
            newGeneration = isNaN(currentGeneration)
              ? limit
              : currentGeneration - 1;
            console.log(
              `Updating generation: current=${currentGeneration}, new=${newGeneration}`
            );
            tempHistory[todayEntryIndex] = {
              ...tempHistory[todayEntryIndex],
              context: tempInputOutputPair,
              generation: newGeneration,
            };
          } else {
            console.log(
              `Creating new history entry with date=${currentDate}, generation=${newGeneration}`
            );
            tempHistory.push({
              date: currentDate,
              context: tempInputOutputPair,
              generation: newGeneration,
            });
          }

          console.log("Temp history before update:", tempHistory);
          setAuth((prevAuth) => ({ ...prevAuth, history: tempHistory }));
          await callUpdateUser(
            auth.email,
            auth.name,
            auth.firstTimeLogin,
            tempHistory
          );
          console.log("Database updated with history:", tempHistory);
        } catch (error) {
          console.error("Error fetching AI response:", error);
          setAiResponse("Could not fetch AI response, Try again later.");
          const tempInputOutputPair = [...inputOuputPair];
          tempInputOutputPair[tempInputOutputPair.length - 1] = [
            tempMyText,
            "Error: Could not fetch response",
          ];
          setInputOutputPair(tempInputOutputPair);

          const today = new Date().toLocaleDateString("en-CA");
          const currentDate = selectedDate || today;
          console.log("Chat - Using currentDate for error case:", currentDate);

          const tempHistory = auth?.history ? [...auth.history] : [];

          // Determine subscription tier and limit
          const subscription = auth?.paymentType?.toLowerCase() || "free";
          const limit = generationLimit[subscription] || generationLimit.free;
          console.log(
            `useEffect error - PaymentType: ${auth?.paymentType}, Subscription: ${subscription}, Generation Limit: ${limit}`
          );

          const todayEntryIndex = tempHistory.findIndex((entry) => {
            const entryDateStr =
              entry.date instanceof Date
                ? entry.date.toISOString()
                : String(entry.date);
            const entryDate = entryDateStr.includes("T")
              ? entryDateStr.split("T")[0]
              : entryDateStr;
            console.log(
              `Error case - Comparing entryDate: ${entryDate} with currentDate: ${currentDate}`
            );
            return entryDate === currentDate;
          });

          console.log(
            `Error case - CurrentDate: ${currentDate}, History length: ${tempHistory.length}`
          );
          if (todayEntryIndex !== -1) {
            const matchedEntry = tempHistory[todayEntryIndex];
            console.log(
              `Error case - Matched entry at index ${todayEntryIndex}:`,
              matchedEntry
            );
          } else {
            console.log(
              "Error case - No matching entry - creating new for currentDate"
            );
          }

          let newGeneration = limit;
          if (todayEntryIndex !== -1) {
            const currentGeneration = Number(
              tempHistory[todayEntryIndex].generation
            );
            newGeneration = isNaN(currentGeneration)
              ? limit
              : currentGeneration - 1;
            console.log(
              `Error case: Updating generation: current=${currentGeneration}, new=${newGeneration}`
            );
            tempHistory[todayEntryIndex] = {
              ...tempHistory[todayEntryIndex],
              context: tempInputOutputPair,
              generation: newGeneration,
            };
          } else {
            console.log(
              `Error case: Creating new history entry with date=${currentDate}, generation=${newGeneration}`
            );
            tempHistory.push({
              date: currentDate,
              context: tempInputOutputPair,
              generation: newGeneration,
            });
          }

          console.log("Error case: Temp history before update:", tempHistory);
          setAuth((prevAuth) => ({ ...prevAuth, history: tempHistory }));
          await callUpdateUser(
            auth.email,
            auth.name,
            auth.firstTimeLogin,
            tempHistory
          );
          console.log(
            "Error case: Database updated with history:",
            tempHistory
          );
        } finally {
          setRequest(false);
          isUpdatingRef.current = false;
        }
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    request,
    tempMyText,
    inputOuputPair,
    setAiResponse,
    setInputOutputPair,
    auth,
    router,
    setAuth,
    generationLimit,
  ]);

  return (
    <>
      {firstTime ? (
        <div
          className={`w-full h-screen flex justify-center items-center overflow-hidden relative ${
            theme
              ? "bg-[#ffffff] text-[#0a0a0a]"
              : "bg-[#000000] text-[#ebebeb]"
          }`}
        >
          <div className={`w-full`}>
            <div className={`w-full`}>
              <div className="w-full sm:px-0 float-left text-center text-[22px] sm:text-[30px] 2xl:text-[45px] mb-[10px]">
                <h2 className="text-5xl font-extrabold mb-6">
                  Craft Perfect{" "}
                  <span className={`${colors.keyColorText}`}>Replies </span> to
                  Recruiters
                </h2>
                <p className="text-lg mb-8">
                  Save time and impress recruiters with professional, tailored
                  email responses generated in seconds.
                </p>
              </div>
            </div>
            <div className={`w-full`}>
              <div
                className={`w-[96%] ml-[2%] sm:w-[60%] sm:ml-[20%] flex justify-center relative overflow-hidden items-center h-full ${
                  theme
                    ? "bg-[#ffffff] text-[#0a0a0a]"
                    : "bg-[#000000] text-[#ebebeb]"
                }`}
              >
                <div className="w-full overflow-hidden relative">
                  <div className="w-full flex justify-center overflow-hidden relative items-center float-left h-[110px] sm:h-[140px]">
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
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`h-screen w-full relative overflow-hidden ${
            theme
              ? "bg-[#ffffff] text-[#0a0a0a]"
              : "bg-[#000000] text-[#ebebeb]"
          }`}
        >
          <div
            ref={chatRef}
            className={`w-full h-screen pt-[2%] relative overflow-x-hidden overflow-y-auto scrollbar ${
              theme
                ? "scrollbar-thumb-black scrollbar-track-[#eeeeee]"
                : "scrollbar-thumb-white scrollbar-track-[#222222]"
            }`}
          >
            <div className="h-[95%] sm:px-[20%] pt-[20%] sm:pt-[10%] relative w-full">
              {inputOuputPair.map((item, index) => (
                <EachInputOutput
                  key={index}
                  pair={item}
                  isLast={index === inputOuputPair.length - 1}
                  isLoading={request && index === inputOuputPair.length - 1}
                />
              ))}
              <div className="w-full h-[25%] sm:h-[40%]" ref={bottomRef}></div>
            </div>
          </div>
          <div
            className={`flex justify-center overflow-hidden items-center absolute bottom-0 left-0 w-[98%] sm:h-[25%] h-[120px] pb-0 sm:pt-[2%] sm:pb-[2%] ${
              theme ? "bg-white" : "bg-black"
            }`}
          >
            <div className="sm:h-full h-[100px] sm:mt-0 w-full sm:w-[60%] relative ml-[2%] sm:pl-0">
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
            className={`p-6 rounded-lg shadow-lg max-w-sm w-full text-center ${
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
              className={`px-4 py-2 rounded ${
                theme
                  ? "bg-red-700 text-white hover:bg-red-800"
                  : "bg-red-700 text-white hover:bg-red-800"
              }`}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
