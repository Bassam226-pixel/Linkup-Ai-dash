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
}

interface AIResponse {
  ratings: number;
  feedback: string;
}

export const RecordAnswer = ({
  question,
  isWebCam,
  setIsWebCam,
}: RecordAnswerProps) => {
  const {
    interimResult,
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

  // اختبار chatSession للتأكد إنه شغال
  useEffect(() => {
    const testChatSession = async () => {
      try {
        const testResult = await chatSession.sendMessage("Hello, can you respond?");
        console.log("Test ChatSession Response:", testResult);
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

    // تحسين تنظيف النص: إزالة أي حاجة قبل وبعد الـ JSON
    const jsonStart = cleanText.indexOf("{");
    const jsonEnd = cleanText.lastIndexOf("}") + 1;
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanText = cleanText.substring(jsonStart, jsonEnd);
    }

    // إزالة أي علامات زي ``` أو كلمة json
    cleanText = cleanText.replace(/(json|```|`)/g, "").trim();

    console.log("Cleaned Response Text Before Parsing:", cleanText); // نتأكد من النص بعد التنظيف

    try {
      const parsedJson = JSON.parse(cleanText);
      return {
        ratings: typeof parsedJson.ratings === 'number' ? parsedJson.ratings : 0,
        feedback: parsedJson.feedback || ""
      };
    } catch (error) {
      console.error("Invalid JSON format:", error);
      return {
        ratings: 0,
        feedback: "Unable to parse feedback. Please try again."
      };
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
        throw new Error("Invalid AI response");
      }
      return cleanJsonResponse(aiResult.response.text());
    } catch (error) {
      console.error("Error in generateResult:", error);
      toast.error("An error occurred while generating feedback.");
      return { ratings: 0, feedback: "Unable to generate feedback." };
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

    if (!aiResult) {
      toast.error("No AI feedback available. Please record your answer first.");
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
        feedback: aiResult.feedback || "",
        rating: aiResult.ratings || 0,
        createdAt: serverTimestamp(),
      });

      toast.success("Your answer has been saved.");
    } catch (error) {
      toast.error("An error occurred while saving your answer.");
      console.log(error);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  useEffect(() => {
    const combinedTranscripts = results
      .filter((result): result is ResultType => typeof result !== "string")
      .map((result) => result.transcript)
      .join(" ");

    setUserAnswer(combinedTranscripts);
  }, [results]);

  return (
    <div className="w-full flex flex-col items-center gap-8 mt-4">
      {/* Save modal */}
      <SaveModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={saveUserAnswer}
        loading={loading}
      />

      {/* Webcam Section */}
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

      {/* Control Buttons */}
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

      {/* Answer Display */}
      <div className="w-full mt-4 p-4 border rounded-md bg-gray-50">
        <h2 className="text-lg font-semibold">Your Answer:</h2>
        <p className="text-sm mt-2 text-gray-700 whitespace-normal">
          {userAnswer || "Start recording to see your answer here."}
        </p>
      </div>

      {/* AI Feedback Display */}
      {aiResult && (
        <div className="w-full mt-4 p-4 border rounded-md bg-gray-50">
          <h2 className="text-lg font-semibold text-blue-600">AI Feedback:</h2>
          <p className="text-sm mt-2 text-gray-700 whitespace-normal">
            <span className="font-semibold">Rating:</span> {aiResult.ratings}/10
          </p>
          <p className="text-sm mt-2 text-gray-700 whitespace-normal">
            <span className="font-semibold">Feedback:</span> {aiResult.feedback}
          </p>
        </div>
      )}
    </div>
  );
};