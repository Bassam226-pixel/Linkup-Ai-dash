import { FormMockInterview } from "@/components/form-mock-interview";
import { db } from "@/config/firebase.config";
import { Interview } from "@/types";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export const CreateEditPage = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInterview = async () => {
      if (interviewId) {
        try {
          const interviewDoc = await getDoc(doc(db, "interviews", interviewId));
          if (interviewDoc.exists()) {
            setInterview({
              id: interviewDoc.id,
              ...interviewDoc.data(),
            } as Interview);
          }
        } catch (error) {
          console.error("Error fetching interview:", error);
        }
      }
    };

    fetchInterview();
  }, [interviewId]);

  return (
    <div className="my-4 flex-col w-full">
      <FormMockInterview
        initialData={interview}
        onSuccess={() => {
          setTimeout(() => {
            navigate("/generate", { replace: true });
          }, 500); // ✅ انتظار قبل الانتقال لضمان تحديث البيانات
        }}
      />
    </div>
  );
};