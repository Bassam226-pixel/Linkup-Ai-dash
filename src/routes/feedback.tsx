import { db } from "@/config/firebase.config";
import { Interview, UserAnswer } from "@/types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { LoaderPage } from "./loader-page";
import { CustomBreadCrumb } from "@/components/custom-bread-crumb";
import { Headings } from "@/components/headings";
import { InterviewPin } from "@/components/pin";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { CircleCheck, Star } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const Feedback = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<UserAnswer[]>([]);
  const [activeFeed, setActiveFeed] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!interviewId) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const fetchInterview = async () => {
      try {
        const interviewDoc = await getDoc(doc(db, "interviews", interviewId));
        if (interviewDoc.exists()) {
          setInterview({
            id: interviewDoc.id,
            ...interviewDoc.data(),
          } as Interview);
        } else {
          toast.error("Interview not found.");
          navigate("/dashboard", { replace: true });
        }
      } catch (error) {
        console.error("Error fetching interview:", error);
        toast.error("Failed to fetch interview.");
      }
    };

    const fetchFeedbacks = async () => {
      try {
        const feedbackQuery = query(
          collection(db, "userAnswers"),
          where("mockIdRef", "==", interviewId)
        );

        const querySnap = await getDocs(feedbackQuery);
        const feedbackList: UserAnswer[] = querySnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UserAnswer[];

        setFeedbacks(feedbackList);
      } catch (error) {
        console.error("Error fetching feedback:", error);
        toast.error("Failed to load feedback.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterview();
    fetchFeedbacks();
  }, [interviewId, navigate]);

  const overallRating = useMemo(() => {
    if (feedbacks.length === 0) return "0.0";
    const totalRatings = feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0);
    return (totalRatings / feedbacks.length).toFixed(1);
  }, [feedbacks]);

  if (isLoading) {
    return <LoaderPage className="w-full h-[70vh]" />;
  }

  return (
    <div className="flex flex-col w-full gap-8 py-5">
      <div className="flex items-center justify-between w-full gap-2">
        <CustomBreadCrumb
          breadCrumbPage={"Feedback"}
          breadCrumpItems={[
            { label: "Mock Interviews", link: "/dashboard" },
            { label: `${interview?.position}`, link: `/interview/${interview?.id}` },
          ]}
        />
      </div>

      <Headings
        title="Congratulations!"
        description="Your personalized feedback is now available. Dive in to see your strengths, areas for improvement, and tips to help you ace your next interview."
      />

      <p className="text-base text-muted-foreground">
        Your overall interview rating:{" "}
        <span className="text-emerald-500 font-semibold text-xl">{overallRating} / 10</span>
      </p>

      {interview && <InterviewPin interview={interview} onMockPage />}

      <Headings title="Interview Feedback" isSubHeading />

      {feedbacks.length > 0 ? (
        <Accordion type="single" collapsible className="space-y-6">
          {feedbacks.map((feed) => (
            <AccordionItem key={feed.id} value={feed.id} className="border rounded-lg shadow-md">
              <AccordionTrigger
                onClick={() => setActiveFeed(feed.id)}
                className={cn(
                  "px-5 py-3 flex items-center justify-between text-base rounded-t-lg transition-colors hover:no-underline",
                  activeFeed === feed.id ? "bg-gradient-to-r from-purple-50 to-blue-50" : "hover:bg-gray-50"
                )}
              >
                <span>{feed.question}</span>
              </AccordionTrigger>

              <AccordionContent className="px-5 py-6 bg-white rounded-b-lg space-y-5 shadow-inner">
                <div className="text-lg font-semibold text-gray-700">
                  <Star className="inline mr-2 text-yellow-400" />
                  Rating: {feed.rating}
                </div>

                <Card className="border-none space-y-3 p-4 bg-green-50 rounded-lg shadow-md">
                  <CardTitle className="flex items-center text-lg">
                    <CircleCheck className="mr-2 text-green-600" />
                    Expected Answer
                  </CardTitle>
                  <CardDescription className="font-medium text-gray-700">{feed.correct_ans}</CardDescription>
                </Card>

                <Card className="border-none space-y-3 p-4 bg-yellow-50 rounded-lg shadow-md">
                  <CardTitle className="flex items-center text-lg">
                    <CircleCheck className="mr-2 text-yellow-600" />
                    Your Answer
                  </CardTitle>
                  <CardDescription className="font-medium text-gray-700">{feed.user_ans}</CardDescription>
                </Card>

                <Card className="border-none space-y-3 p-4 bg-red-50 rounded-lg shadow-md">
                  <CardTitle className="flex items-center text-lg">
                    <CircleCheck className="mr-2 text-red-600" />
                    Feedback
                  </CardTitle>
                  <CardDescription className="font-medium text-gray-700">{feed.feedback}</CardDescription>
                </Card>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p className="text-center text-gray-500">No feedback available for this interview.</p>
      )}
    </div>
  );
};