import { ResponseContext } from "../contexts";
import { useContext } from "react";

export const useResponse = () => {
    const {generationLimit, myText,setMyText,aiResponse,setAiResponse,inputOuputPair, setInputOutputPair, today, setToday, wantToPaymentType, setWantToPaymentType, wantToPaymentDuration, setWantToPaymentDuration} = useContext(ResponseContext);
    return {generationLimit, myText,setMyText,aiResponse,setAiResponse,inputOuputPair, setInputOutputPair, today, setToday, wantToPaymentType, setWantToPaymentType, wantToPaymentDuration, setWantToPaymentDuration};
}