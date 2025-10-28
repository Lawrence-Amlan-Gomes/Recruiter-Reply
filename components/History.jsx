"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { useResponse } from "@/app/hooks/useResponse";
import { useTheme } from "@/app/hooks/useTheme";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { callUpdateUser } from "@/app/actions";

export default function History() {
  const { auth, setAuth } = useAuth();
  const { generationLimit, setInputOutputPair } = useResponse();
  const { theme } = useTheme();
  const router = useRouter();

  // Compute sorted and deduplicated history using useMemo
  const sortedHistory = useMemo(() => {
    console.log(
      "History - Raw auth.history:",
      auth?.history?.map((entry) => ({
        date: entry.date,
        generation: entry.generation,
        contextLength: entry.context?.length || 0,
      })) || []
    );

    if (!auth?.history) return [];

    const seenDates = new Set();
    const sorted = [...auth.history]
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA; // Descending order
      })
      .filter((entry) => {
        const dateStr = entry.date.includes("T")
          ? entry.date.split("T")[0]
          : entry.date;
        if (seenDates.has(dateStr)) {
          console.log(`History - Removed duplicate date: ${dateStr}`);
          return false;
        }
        seenDates.add(dateStr);
        return true;
      });

    return sorted;
  }, [auth?.history]);

  // Log sorted and deduplicated history for debugging
  useEffect(() => {
    console.log(
      "History - Sorted and deduplicated history:",
      sortedHistory.map((entry) => ({
        date: entry.date,
        generation: entry.generation,
        contextLength: entry.context?.length || 0,
      }))
    );
  }, [sortedHistory]);

  // Handle click on a history entry
  const handleHistoryClick = async (entry) => {
    const today = new Date().toLocaleDateString("en-CA");
    const entryDate = entry.date.includes("T") ? entry.date.split("T")[0] : entry.date;

    console.log(`History - Clicked entry with date: ${entryDate}`);

    if (entryDate === today) {
      // For today, just load the context
      console.log(`History - Loading today's context:`, entry.context);
      setInputOutputPair(entry.context || []);
      router.push("/chat");
      return;
    }

    // For non-today, merge with today's context without duplicates and set selected day's generation to 0
    const tempHistory = auth?.history ? [...auth.history] : [];
    const todayEntryIndex = tempHistory.findIndex((hist) => {
      const histDateStr =
        hist.date instanceof Date ? hist.date.toISOString() : String(hist.date);
      const histDate = histDateStr.includes("T") ? histDateStr.split("T")[0] : histDateStr;
      return histDate === today;
    });

    const selectedEntryIndex = tempHistory.findIndex((hist) => {
      const histDateStr =
        hist.date instanceof Date ? hist.date.toISOString() : String(hist.date);
      const histDate = histDateStr.includes("T") ? histDateStr.split("T")[0] : histDateStr;
      return histDate === entryDate;
    });

    let mergedContext = [];
    let todayGeneration = 0;

    // Initialize with today's context
    if (todayEntryIndex !== -1) {
      mergedContext = [...tempHistory[todayEntryIndex].context];
      todayGeneration = tempHistory[todayEntryIndex].generation;
      console.log(`History - Today's context:`, mergedContext, `Generation: ${todayGeneration}`);
    }

    // Add selected day's context, removing duplicates
    if (selectedEntryIndex !== -1 && entry.context?.length > 0) {
      // Create a Set of stringified pairs for deduplication
      const existingPairs = new Set(mergedContext.map(pair => JSON.stringify(pair)));
      const uniqueSelectedPairs = entry.context.filter(
        pair => !existingPairs.has(JSON.stringify(pair))
      );
      mergedContext = [...mergedContext, ...uniqueSelectedPairs];
      console.log(`History - Merged context with ${entryDate} (after deduplication):`, mergedContext);

      // Set selected day's generation to 0, keep context
      tempHistory[selectedEntryIndex] = {
        ...tempHistory[selectedEntryIndex],
        generation: 0,
      };
      console.log(`History - Set generation to 0 for ${entryDate}`);
    }

    // Update today's entry with merged context
    const subscription = auth?.paymentType?.toLowerCase() || "free";
    const limit = generationLimit[subscription] || generationLimit.free;

    if (todayEntryIndex !== -1) {
      tempHistory[todayEntryIndex] = {
        ...tempHistory[todayEntryIndex],
        context: mergedContext,
        generation: todayGeneration, // Retain today's generation
      };
    } else {
      tempHistory.push({
        date: today,
        context: mergedContext,
        generation: limit,
      });
      console.log(`History - Created new entry for today with generation: ${limit}`);
    }

    // Update state and database
    console.log(`History - Updated tempHistory:`, tempHistory);
    setAuth((prevAuth) => ({ ...prevAuth, history: tempHistory }));
    setInputOutputPair(mergedContext);
    await callUpdateUser(auth.email, auth.name, auth.firstTimeLogin, tempHistory);
    console.log(`History - Database updated with merged context for today`);

    // Navigate to Chat with today's date
    router.push("/chat");
  };

  // Handle delete history entry with confirmation
  const handleDeleteHistory = async (entryDate) => {
    const today = new Date().toLocaleDateString("en-CA");
    const parsedEntryDate = entryDate.includes("T") ? entryDate.split("T")[0] : entryDate;

    // Show confirmation alert
    const formattedDate = formatDate(parsedEntryDate);
    const confirmed = window.confirm(`Are you sure you want to delete the history for ${formattedDate}?`);
    if (!confirmed) {
      console.log(`History - Deletion cancelled for ${parsedEntryDate}`);
      return;
    }

    console.log(`History - Deleting entry with date: ${parsedEntryDate}`);

    const tempHistory = auth?.history ? [...auth.history] : [];
    const selectedEntryIndex = tempHistory.findIndex((hist) => {
      const histDateStr =
        hist.date instanceof Date ? hist.date.toISOString() : String(hist.date);
      const histDate = histDateStr.includes("T") ? histDateStr.split("T")[0] : histDateStr;
      return histDate === parsedEntryDate;
    });

    if (selectedEntryIndex === -1) {
      console.log(`History - No entry found for ${parsedEntryDate}`);
      return;
    }

    // Remove the entry
    tempHistory.splice(selectedEntryIndex, 1);
    console.log(`History - Removed entry for ${parsedEntryDate}`);

    // If the deleted entry was the selected date, reset inputOuputPair
    const searchParams = new URLSearchParams(window.location.search);
    const selectedDate = searchParams.get("selectedDate");
    if (selectedDate === parsedEntryDate) {
      const todayEntry = tempHistory.find((hist) => {
        const histDateStr =
          hist.date instanceof Date ? hist.date.toISOString() : String(hist.date);
        const histDate = histDateStr.includes("T") ? histDateStr.split("T")[0] : histDateStr;
        return histDate === today;
      });
      setInputOutputPair(todayEntry?.context || []);
      console.log(`History - Reset inputOuputPair to ${todayEntry ? "today's context" : "empty array"}`);
    }

    // Update state and database
    console.log(`History - Updated tempHistory after deletion:`, tempHistory);
    setAuth((prevAuth) => ({ ...prevAuth, history: tempHistory }));
    await callUpdateUser(auth.email, auth.name, auth.firstTimeLogin, tempHistory);
    console.log(`History - Database updated after deletion`);
  };

  // Format date as "DD Month YYYY" (e.g., "28 September 2025")
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date)) throw new Error("Invalid date");
      return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    } catch (error) {
      console.error(`History - Error formatting date: ${dateStr}`, error);
      return dateStr; // Fallback to raw date string
    }
  };

  // Get the last prompt with truncation
  const getLastPrompt = (context) => {
    const maxLength = 50; // Max characters for prompt
    if (!Array.isArray(context) || context.length === 0 || !Array.isArray(context[context.length - 1])) {
      return "No prompt available";
    }
    const lastPrompt = context[context.length - 1][0] || "No prompt available";
    return lastPrompt.length > maxLength
      ? lastPrompt.slice(0, maxLength) + "..."
      : lastPrompt;
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center overflow-hidden relative ${
        theme ? "bg-[#ffffff] text-[#0a0a0a]" : "bg-[#000000] text-[#ebebeb]"
      }`}
    >
      <h2 className="sm:text-3xl text-lg font-bold mb-6 mt-6">
        Our Conversation History
      </h2>
      {sortedHistory.length === 0 ? (
        <p className="text-lg">No conversation history available.</p>
      ) : (
        <div className="w-full max-w-2xl px-4">
          {sortedHistory.map((entry) => (
            <div
              key={entry.date}
              className={`p-4 mb-2 rounded-lg flex justify-between items-center ${
                theme
                  ? "bg-[#dddddd] hover:bg-[#cccccc]"
                  : "bg-[#181818] hover:bg-[#282828]"
              }`}
            >
              <div
                className="cursor-pointer flex-grow"
                onClick={() => handleHistoryClick(entry)}
              >
                <p className="sm:text-[16px] text-[12px]">
                  {formatDate(entry.date)}: {getLastPrompt(entry.context)}
                </p>
              </div>
              <div
                className="bg-red-700 text-white sm:text-[16px] text-[12px] px-2 py-1 rounded cursor-pointer hover:bg-red-800"
                onClick={() => handleDeleteHistory(entry.date)}
              >
                Delete
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}