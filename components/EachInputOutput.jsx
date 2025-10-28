"use client";
import { useTheme } from "@/app/hooks/useTheme";
import { motion } from "framer-motion";
import colors from "@/app/color/color";

export default function EachInputOutput({ pair, isLast, isLoading }) {
  const { theme } = useTheme();

  // Only makes **text** bold — no color here
  const renderTextWithBold = (text) => {
    const parts = [];
    const regex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      const boldText = match[1];
      if (before) parts.push({ text: before, isBold: false });
      parts.push({ text: boldText, isBold: true });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), isBold: false });
    }

    return parts.map((part, index) => (
      <span key={index} className={part.isBold ? "font-bold" : ""}>
        {part.text}
      </span>
    ));
  };

  // Typing animation
  const typingVariants = {
    animate: {
      opacity: [0, 1, 0],
      transition: {
        opacity: {
          repeat: Infinity,
          duration: 0.5,
          ease: "easeInOut",
        },
      },
    },
  };

  // Base font sizes (in pixels)
  const baseFontSize = "text-[10px] sm:text-[16px]"; // Paragraph
  const headingFontSize = "text-[12px] sm:text-[18px]"; // +1px

  return (
    <div className="w-full">
      {/* User Input */}
      <div
        className={`border-[1px] ${
          theme
            ? "bg-[#ffffff] text-black border-[#333333]"
            : "bg-[#000000] text-[#cccccc] border-[#444444]"
        } w-[78%] ml-[20%] text-justify py-2 px-3 rounded-md sm:mb-2 mr-[2%] text-[10px] sm:text-[14px] mb-3`}
      >
        {renderTextWithBold(pair[0])}
      </div>

      {/* AI Response */}
      <div
        className={`w-[78%] mr-[20%] ml-[2%] ${
          theme ? "text-[#111111]" : "text-[#dddddd]"
        } text-justify pr-3 pl-2 rounded-md mb-5 ${baseFontSize}`}
      >
        {isLast && isLoading ? (
          <motion.div
            className="flex items-center space-x-2"
            variants={typingVariants}
            animate="animate"
          >
            <motion.span className="inline-block w-2 h-2 bg-current rounded-full"></motion.span>
            <motion.span className="inline-block w-2 h-2 bg-current rounded-full"></motion.span>
            <motion.span className="inline-block w-2 h-2 bg-current rounded-full"></motion.span>
          </motion.div>
        ) : (
          pair[1].split("[/n]").map((paragraph, index) => {
            const trimmed = paragraph.trim();
            const isFullHeading = trimmed.startsWith("**") && trimmed.endsWith("**");

            return (
              <p
                key={index}
                className={`
                  ${isFullHeading ? "sm:mb-4 mb-3 mt-4 sm:mt-5" : "sm:mb-3 mb-2"}
                  ${isFullHeading ? headingFontSize : baseFontSize}
                `}
              >
                <span
                  className={isFullHeading ? `${colors.keyColorText} font-bold` : ""}
                >
                  {renderTextWithBold(paragraph)}
                </span>
              </p>
            );
          })
        )}
      </div>
    </div>
  );
}