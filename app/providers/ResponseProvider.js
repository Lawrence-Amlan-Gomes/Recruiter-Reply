"use client";
import { useState } from "react";

import { ResponseContext } from "../contexts";

export default function ResponseProvider({ children }) {
  const [myText, setMyText] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [inputOuputPair, setInputOutputPair] = useState([]);
  const [today, setToday] = useState("");
  const [wantToPaymentType, setWantToPaymentType] = useState("");
  const [wantToPaymentDuration, setWantToPaymentDuration] = useState("");
  const generationLimit = { free: 2, standard: 9, premium: 19 };

  return (
    <ResponseContext.Provider
      value={{
        generationLimit,
        myText,
        setMyText,
        aiResponse,
        setAiResponse,
        inputOuputPair,
        setInputOutputPair,
        today,
        setToday,
        wantToPaymentType,
        setWantToPaymentType,
        wantToPaymentDuration,
        setWantToPaymentDuration,
      }}
    >
      {children}
    </ResponseContext.Provider>
  );
}