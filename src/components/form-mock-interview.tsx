import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader, Trash2 } from "lucide-react";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { Interview } from "@/types";
import { CustomBreadCrumb } from "./custom-bread-crumb";
import { Headings } from "./headings";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { chatSession } from "@/scripts";

interface FormMockInterviewProps {
  initialData?: Interview | null;
  onSuccess?: () => void;
}

const formSchema = z.object({
  position: z.string().min(1, "Position is required").max(100),
  description: z.string().min(10, "Description is required"),
  experience: z.coerce.number().min(0, "Experience cannot be negative"),
  techStack: z.string().min(1, "Tech stack must be at least a character"),
});

type FormData = z.infer<typeof formSchema>;

export const FormMockInterview = ({ initialData, onSuccess }: FormMockInterviewProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      position: initialData?.position || "",
      description: initialData?.description || "",
      experience: initialData?.experience ?? 0,
      techStack: initialData?.techStack || "",
    },
  });

  const { isValid, isSubmitting } = form.formState;
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const parseAiResponse = (responseText: string) => {
    try {
      // بننظف النص لو فيه أي markdown أو كلام زيادة
      let cleanText = responseText.trim().replace(/(json|```|`)/g, "");
      const parsed = JSON.parse(cleanText);

      // نتأكد إن النتيجة array من الأسئلة
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          question: item.question || "No question provided",
          answer: item.answer || "No answer provided",
        }));
      } else {
        throw new Error("AI response is not an array");
      }
    } catch (error) {
      console.error("Error parsing AI response:", error);
      return [
        {
          question: "Default question",
          answer: "Default answer",
        },
      ];
    }
  };

  const generateAiResponse = async (data: FormData) => {
    const prompt = `
      Generate 5 technical interview questions for ${data.position} based on the following:
      - Job Description: ${data.description}
      - Experience: ${data.experience} years
      - Tech Stack: ${data.techStack}
      Return the result as a JSON array where each item has "question" and "answer" fields.
      Example: [{"question": "What is React?", "answer": "React is a JavaScript library for building user interfaces."}, ...]
    `;
    
    try {
      const aiResult = await chatSession.sendMessage(prompt);
      const questions = parseAiResponse(aiResult.response.text());
      console.log("Generated Questions:", questions); // Log عشان نتأكد
      return questions;
    } catch (error) {
      console.error("Error generating AI questions:", error);
      toast.error("Failed to generate questions from AI.");
      return [
        {
          question: "Default question",
          answer: "Default answer",
        },
      ];
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      const aiResult = await generateAiResponse(data);

      if (initialData) {
        await updateDoc(doc(db, "interviews", initialData.id), {
          questions: aiResult,
          ...data,
          updatedAt: serverTimestamp(),
        });
      } else {
        const docRef = await addDoc(collection(db, "interviews"), {
          ...data,
          questions: aiResult,
          createdAt: serverTimestamp(),
        });
        console.log("New Interview ID:", docRef.id); // Log عشان نشوف الـ ID
      }

      toast.success("Success!", { description: "Mock interview saved." });

      if (onSuccess) {
        setTimeout(onSuccess, 500);
      } else {
        setTimeout(() => navigate("/dashboard", { replace: true }), 500);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error", { description: "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      form.reset({
        position: initialData.position || "",
        description: initialData.description || "",
        experience: initialData.experience ?? 0,
        techStack: initialData.techStack || "",
      });
    }
  }, [initialData, form]);

  return (
    <div className="w-full flex-col space-y-4">
      <CustomBreadCrumb
        breadCrumbPage={initialData ? initialData.position : "Create"}
        breadCrumpItems={[{ label: "Mock Interviews", link: "/generate" }]}
      />
      <div className="mt-4 flex items-center justify-between w-full">
        <Headings title={initialData ? initialData.position : "Create a new mock interview"} isSubHeading />
        {initialData && (
          <Button size="icon" variant="ghost">
            <Trash2 className="text-red-500" />
          </Button>
        )}
      </div>
      <Separator className="my-4" />
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full p-8 rounded-lg flex-col flex items-start gap-6 shadow-md">
          <FormField control={form.control} name="position" render={({ field }) => (
            <FormItem className="w-full space-y-4">
              <FormLabel>Job Role</FormLabel>
              <FormControl>
                <Input disabled={loading} placeholder="Full Stack Developer" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem className="w-full space-y-4">
              <FormLabel>Job Description</FormLabel>
              <FormControl>
                <Textarea disabled={loading} placeholder="Describe the job role" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="experience" render={({ field }) => (
            <FormItem className="w-full space-y-4">
              <FormLabel>Years of Experience</FormLabel>
              <FormControl>
                <Input type="number" disabled={loading} placeholder="5" {...field} value={field.value ?? 0} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="techStack" render={({ field }) => (
            <FormItem className="w-full space-y-4">
              <FormLabel>Tech Stacks</FormLabel>
              <FormControl>
                <Textarea disabled={loading} placeholder="React, Typescript..." {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="w-full flex items-center justify-end gap-6">
            <Button type="reset" variant="outline" disabled={isSubmitting || loading}>Reset</Button>
            <Button type="submit" disabled={isSubmitting || !isValid || loading}>
              {loading ? <Loader className="animate-spin" /> : (initialData ? "Save Changes" : "Create")}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};
