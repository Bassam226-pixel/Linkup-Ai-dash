import {
  CircleStop,
  Loader,
  Mic,
  RefreshCw,
  Save,
  Video,
  VideoOff,
  WebcamIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import useSpeechToText, { ResultType } from "react-hook-speech-to-text";
import { useParams } from "react-router-dom";
import WebCam from "react-webcam";
import { TooltipButton } from "./tooltip-button";
import { toast } from "sonner";
import { chatSession } from "@/scripts";
import { SaveModal } from "./save-modal";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/config/firebase.config";

interface RecordAnswerProps {
  question: { question: string; answer: string };
  isWebCam: boolean;
  setIsWebCam: (value: boolean) => void;
  onSave?: () => void; // دالة اختيارية للتوجيه بعد الحفظ
}

interface AIResponse {
  ratings: number;
  feedback: string;
}

export const RecordAnswer = ({
  question,
  isWebCam,
  setIsWebCam,
  onSave,
}: RecordAnswerProps) => {
  const {
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  const [userAnswer, setUserAnswer] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<AIResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { interviewId } = useParams();

  useEffect(() => {
    const testChatSession = async () => {
      try {
        const testResult = await chatSession.sendMessage("Hello, can you respond?");
        console.log("Test ChatSession Response:", testResult);
        if (!testResult || !testResult.response) {
          console.warn("ChatSession test failed to return a valid response.");
        }
      } catch (error) {
        console.error("ChatSession Test Error:", error);
      }
    };
    testChatSession();
  }, []);

  const recordUserAnswer = async () => {
    if (isRecording) {
      stopSpeechToText();
      console.log("User Answer:", userAnswer);
      if (userAnswer.length < 30) {
        toast.error("Error", {
          description: "Your answer should be more than 30 characters.",
        });
        return;
      }
      console.log("Generating AI Result...");
      const result = await generateResult(
        question.question,
        question.answer,
        userAnswer
      );
      console.log("AI Result:", result);
      setAiResult(result);
    } else {
      startSpeechToText();
    }
  };

  const cleanJsonResponse = (responseText: string) => {
    let cleanText = responseText.trim();
    const jsonStart = cleanText.indexOf("{");
    const jsonEnd = cleanText.lastIndexOf("}") + 1;
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanText = cleanText.substring(jsonStart, jsonEnd);
    } else {
      console.error("No valid JSON found in response:", responseText);
      return { ratings: 0, feedback: "No valid feedback generated." };
    }
    cleanText = cleanText.replace(/(json|```|`)/g, "").trim();
    console.log("Cleaned Response Text:", cleanText);
    try {
      const parsedJson = JSON.parse(cleanText);
      return {
        ratings: typeof parsedJson.ratings === "number" ? parsedJson.ratings : 0,
        feedback: typeof parsedJson.feedback === "string" ? parsedJson.feedback : "Invalid feedback format.",
      };
    } catch (error) {
      console.error("JSON Parse Error:", error, "Text:", cleanText);
      return { ratings: 0, feedback: "Unable to parse AI response." };
    }
  };

  const generateResult = async (
    qst: string,
    qstAns: string,
    userAns: string
  ): Promise<AIResponse> => {
    setIsAiGenerating(true);
    const prompt = `
      Question: "${qst}"
      User Answer: "${userAns}"
      Correct Answer: "${qstAns}"
      Please compare the user's answer to the correct answer, provide a rating (1-10), and give feedback.
      Return the result as JSON with "ratings" (number) and "feedback" (string).
    `;
    console.log("Prompt:", prompt);
    try {
      const aiResult = await chatSession.sendMessage(prompt);
      console.log("Raw AI Response:", aiResult);
      if (!aiResult || !aiResult.response) {
        throw new Error("No response from AI");
      }
      const responseText = aiResult.response.text();
      if (!responseText || !responseText.includes("{") || !responseText.includes("}")) {
        throw new Error("Invalid response format from AI");
      }
      return cleanJsonResponse(responseText);
    } catch (error) {
      const typedError = error as Error;
      console.error("Error in generateResult:", typedError);
      if (typedError.message.includes("429")) {
        toast.error("Quota exceeded. Please wait 30 seconds or check your API plan at https://ai.google.dev/gemini-api/docs/rate-limits.");
      } else {
        toast.error(`Error generating feedback: ${typedError.message}`);
      }
      return { ratings: 0, feedback: `Error: ${typedError.message}` };
    } finally {
      setIsAiGenerating(false);
    }
  };

  const recordNewAnswer = () => {
    setUserAnswer("");
    stopSpeechToText();
    startSpeechToText();
  };

  const saveUserAnswer = async () => {
    setLoading(true);
    console.log("Saving User Answer, aiResult:", aiResult);
    if (!aiResult || !aiResult.feedback || typeof aiResult.ratings !== "number") {
      toast.error("Invalid feedback data. Please record your answer again.");
      setLoading(false);
      return;
    }
    try {
      const userAnswerQuery = query(
        collection(db, "userAnswers"),
        where("question", "==", question.question)
      );
      const querySnap = await getDocs(userAnswerQuery);
      if (!querySnap.empty) {
        toast.info("Already Answered", {
          description: "You have already answered this question.",
        });
        setLoading(false);
        return;
      }
      await addDoc(collection(db, "userAnswers"), {
        mockIdRef: interviewId,
        question: question.question,
        correct_ans: question.answer,
        user_ans: userAnswer,
        feedback: aiResult.feedback,
        rating: aiResult.ratings,
        createdAt: serverTimestamp(),
      });
      toast.success("Your answer has been saved.");
      if (onSave) onSave(); // استدعاء الدالة الاختيارية للتوجيه
    } catch (error) {
      const typedError = error as Error;
      console.error("Save Error:", typedError);
      toast.error("An error occurred while saving your answer.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  useEffect(() => {
    console.log("Results:", results);
    const combinedTranscripts = results
      .filter((result): result is ResultType => typeof result !== "string")
      .map((result) => result.transcript)
      .join(" ");
    setUserAnswer(combinedTranscripts);
  }, [results]);

  return (
    <div className="w-full flex flex-col items-center gap-8 mt-4">
      <SaveModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={saveUserAnswer}
        loading={loading}
      />
      <div className="w-full h-[400px] md:w-96 flex flex-col items-center justify-center border p-4 bg-gray-50 rounded-md">
        {isWebCam ? (
          <WebCam
            onUserMedia={() => setIsWebCam(true)}
            onUserMediaError={() => setIsWebCam(false)}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <WebcamIcon className="w-24 h-24 text-muted-foreground" />
        )}
      </div>
      <div className="flex items-center justify-center gap-3">
        <TooltipButton
          content={isWebCam ? "Turn Off" : "Turn On"}
          icon={isWebCam ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          onClick={() => setIsWebCam(!isWebCam)}
        />
        <TooltipButton
          content={isRecording ? "Stop Recording" : "Start Recording"}
          icon={isRecording ? <CircleStop className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          onClick={recordUserAnswer}
        />
        <TooltipButton
          content="Record Again"
          icon={<RefreshCw className="w-5 h-5" />}
          onClick={recordNewAnswer}
        />
        <TooltipButton
          content="Save Result"
          icon={isAiGenerating ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          onClick={() => setOpen(true)}
          disabled={!aiResult}
        />
      </div>
      <div className="w-full mt-4 p-4 border rounded-md bg-gray-50">
        <h2 className="text-lg font-semibold">Your Answer:</h2>
        <p className="text-sm mt-2 text-gray-700 whitespace-normal">
          {userAnswer || "Start recording to see your answer here."}
        </p>
      </div>
      {/* إزالة عرض الـ AI Feedback نهائيًا من هنا */}
    </div>
  );
};