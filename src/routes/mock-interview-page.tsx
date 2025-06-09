import { Interview } from "@/types";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LoaderPage } from "./loader-page";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { CustomBreadCrumb } from "@/components/custom-bread-crumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb } from "lucide-react";
import { QuestionSection } from "@/components/question-section";

const getInterviewLink = (interviewId: string) => `/generate/interview/${interviewId}`;

// Define an interface for the question object
interface QuestionItem {
  question: string;
  answer: string;
  topic?: string;
  difficulty?: string;
}

export const MockInterviewPage = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Enhanced function to extract questions from different formats
  const extractQuestions = (text: string): QuestionItem[] => {
    if (typeof text !== 'string') {
      console.error("Questions text is not a string:", text);
      return [];
    }
    
    console.log("Raw questions data:", text);
    
    // Check if the text contains JSON
    if (text.includes('json')) {
      try {
        // Extract JSON content within backticks
        const jsonMatch = text.match(/json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          const jsonData = JSON.parse(jsonMatch[1]);
          
          // If it's an array, map it to the expected format
          if (Array.isArray(jsonData)) {
            const formattedQuestions = jsonData.map(item => ({
              question: item.question,
              answer: item.answer || "",
              // Optionally keep other properties if needed
              topic: item.topic,
              difficulty: item.difficulty,
            }));
            
            console.log("Parsed JSON questions:", formattedQuestions);
            return formattedQuestions;
          }
        }
      } catch (e) {
        console.error("Error parsing JSON questions:", e);
        // Fall back to regex approach if JSON parsing fails
      }
    }
    
    // Fallback: Try the regex approach for non-JSON formatted questions
    const regex = /\\*Question:\\* \"(.*?)\"|\\*Question:\\* (.*?)(?:\r?\n|$)|Question: "(.*?)"|Question: (.*?)(?:\r?\n|$)/g;
    const extractedQuestions: QuestionItem[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      // Find the first non-undefined captured group
      const question = match[1] || match[2] || match[3] || match[4];
      if (question) {
        extractedQuestions.push({ question: question.trim(), answer: "" });
      }
    }

    console.log("Regex extracted questions:", extractedQuestions);
    return extractedQuestions;
  };

  useEffect(() => {
    if (!interviewId) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const fetchInterview = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const interviewDoc = await getDoc(doc(db, "interviews", interviewId));
        
        if (interviewDoc.exists()) {
          const interviewData = interviewDoc.data() as Interview;
          console.log("Interview data from Firestore:", interviewData);

          // Process questions with better handling for different formats
          let questions: QuestionItem[] = [];
          
          if (!interviewData.questions) {
            console.error("Questions data is undefined");
            questions = [];
          } else if (typeof interviewData.questions === "string") {
            questions = extractQuestions(interviewData.questions);
          } else if (Array.isArray(interviewData.questions)) {
            questions = interviewData.questions as QuestionItem[];
          } else {
            console.error("Questions data is not in expected format:", interviewData.questions);
            questions = [];
          }

          // Check if we have valid questions
          if (questions.length === 0) {
            setError("No questions found for this interview.");
          }

          setInterview({
            ...interviewData,
            id: interviewDoc.id,
            questions,
          });
        } else {
          setError("Interview not found");
          setTimeout(() => navigate("/dashboard", { replace: true }), 3000);
        }
      } catch (error) {
        console.error("Error fetching interview:", error);
        setError("Failed to load interview data");
        setTimeout(() => navigate("/dashboard", { replace: true }), 3000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterview();
  }, [interviewId, navigate]);

  if (isLoading) {
    return <LoaderPage className="w-full h-[70vh]" />;
  }

  if (error) {
    return (
      <div className="w-full flex justify-center items-center h-[70vh]">
        <p className="text-red-500 text-lg font-semibold">
          {error} Redirecting...
        </p>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="w-full flex justify-center items-center h-[70vh]">
        <p className="text-red-500 text-lg font-semibold">
          Failed to load the interview. Redirecting...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-8 py-5">
      <CustomBreadCrumb
        breadCrumbPage="Start"
        breadCrumpItems={[
          { label: "Mock Interviews", link: "/dashboard" },
          {
            label: interview?.position || "Interview",
            link: interviewId ? getInterviewLink(interviewId) : "/dashboard",
          },
        ]}
      />

      <div className="w-full">
        <Alert className="bg-sky-100 border border-sky-200 p-4 rounded-lg flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-sky-600" />
          <div>
            <AlertTitle className="text-sky-800 font-semibold">
              Important Note
            </AlertTitle>
            <AlertDescription className="text-sm text-sky-700 mt-1 leading-relaxed">
              Press "Record Answer" to begin answering the question. Once you
              finish the interview, you'll receive feedback comparing your
              responses with the ideal answers.
              <br />
              <br />
              <strong>Note:</strong>{" "}
              <span className="font-medium">Your video is never recorded.</span>{" "}
              You can disable the webcam anytime if preferred.
            </AlertDescription>
          </div>
        </Alert>
      </div>

      {interview?.questions && interview.questions.length > 0 ? (
        <div className="mt-4 w-full flex flex-col items-start gap-4">
          <QuestionSection questions={interview.questions} />
        </div>
      ) : (
        <p className="text-center text-gray-500 py-8">
          No questions available for this interview. Please try refreshing the page or select another interview.
        </p>
      )}
    </div>
  );
};