import { Headings } from "@/components/headings";
import { InterviewPin } from "@/components/pin";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/config/firebase.config";
import { Interview } from "@/types";
import { collection, onSnapshot } from "firebase/firestore";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export const Dashboard = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interviewQuery = collection(db, "interviews");

    const unsubscribe = onSnapshot(
      interviewQuery,
      (snapshot) => {
        const interviewList: Interview[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Interview[];
        setInterviews(interviewList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching interviews:", error);
        toast.error("Something went wrong. Try again later.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <>
      <div className="flex w-full items-center justify-between">
        {/* Headings */}
        <Headings
          title="Dashboard"
          description="Create and start your AI Mock interview"
        />
        <Link to="/generate/create">
          <Button size="sm">
            <Plus /> Add New
          </Button>
        </Link>
      </div>

      <Separator className="my-8" />

      {/* Content Section */}
      <div className="md:grid md:grid-cols-3 gap-3 py-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-24 md:h-32 rounded-md" />
          ))
        ) : interviews.length > 0 ? (
          interviews.map((interview) => (
            <InterviewPin key={interview.id} interview={interview} />
          ))
        ) : (
          <div className="md:col-span-3 w-full flex flex-grow items-center justify-center h-96 flex-col">
            <h2 className="text-lg font-semibold text-muted-foreground">
              No Data Found
            </h2>

            <p className="w-full md:w-96 text-center text-sm text-neutral-400 mt-4">
              There are no available interviews. Please add a new mock
              interview.
            </p>

            <Link to="/generate/create" className="mt-4">
              <Button size="sm">
                <Plus className="min-w-5 min-h-5 mr-1" />
                Add New
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
};