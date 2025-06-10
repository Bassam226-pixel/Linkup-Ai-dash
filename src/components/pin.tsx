import { Interview } from "@/types";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { TooltipButton } from "./tooltip-button";
import { Eye, Newspaper, Sparkles, Trash } from "lucide-react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { toast } from "sonner";

interface InterviewPinProps {
  interview: Interview;
  onMockPage?: boolean;
}

export const InterviewPin = ({
  interview,
  onMockPage = false,
}: InterviewPinProps) => {
  const navigate = useNavigate();
  const { id, position, description, techStack, createdAt } = interview || {};

  // ✅ تأكيد وجود `id` لمنع الأخطاء
  const handleNavigate = (path: string) => {
    if (id) navigate(path, { replace: true });
  };

  // دالة لحذف الـ interview من Firestore
  const handleDelete = async () => {
    if (!id) {
      toast.error("Interview ID not found.");
      return;
    }

    try {
      await deleteDoc(doc(db, "interviews", id));
      toast.success("Interview deleted successfully.");
    } catch (error) {
      console.error("Error deleting interview:", error);
      toast.error("Failed to delete interview.");
    }
  };

  return (
    <Card className="p-4 rounded-md shadow-none hover:shadow-md shadow-gray-100 cursor-pointer transition-all space-y-4">
      <CardTitle className="text-lg">{position}</CardTitle>
      <CardDescription>{description}</CardDescription>

      {/* ✅ التحقق من `techStack` قبل استخدام `split(",")` */}
      {techStack && (
        <div className="w-full flex items-center gap-2 flex-wrap">
          {techStack.split(",").map((word, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-xs text-muted-foreground hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-900"
            >
              {word}
            </Badge>
          ))}
        </div>
      )}

      <CardFooter
        className={cn(
          "w-full flex items-center p-0",
          onMockPage ? "justify-end" : "justify-between"
        )}
      >
        {/* ✅ منع الأخطاء لو `createdAt` غير موجود */}
        <p className="text-[12px] text-muted-foreground truncate whitespace-nowrap">
          {createdAt
            ? `${new Date(createdAt.toDate()).toLocaleDateString("en-US", {
                dateStyle: "long",
              })} - ${new Date(createdAt.toDate()).toLocaleTimeString("en-US", {
                timeStyle: "short",
              })}`
            : "Unknown Date"}
        </p>

        {!onMockPage && id && (
          <div className="flex items-center justify-center">
            <TooltipButton
              content="View"
              buttonVariant="ghost"
              onClick={() => handleNavigate(`/generate/interview/${id}`)}
              disabled={false}
              buttonClassName="hover:text-sky-500"
              icon={<Eye />}
              loading={false}
            />

            <TooltipButton
              content="Feedback"
              buttonVariant="ghost"
              onClick={() => handleNavigate(`/generate/feedback/${id}`)}
              disabled={false}
              buttonClassName="hover:text-yellow-500"
              icon={<Newspaper />}
              loading={false}
            />

            <TooltipButton
              content="Start"
              buttonVariant="ghost"
              onClick={() => handleNavigate(`/generate/interview/${id}/start`)}
              disabled={false}
              buttonClassName="hover:text-sky-500"
              icon={<Sparkles />}
              loading={false}
            />

            <TooltipButton
              content="Delete"
              buttonVariant="ghost"
              onClick={handleDelete}
              disabled={false}
              buttonClassName="hover:text-red-500"
              icon={<Trash />}
              loading={false}
            />
          </div>
        )}
      </CardFooter>
    </Card>
  );
};