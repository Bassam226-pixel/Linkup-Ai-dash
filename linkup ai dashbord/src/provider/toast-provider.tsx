import { Toaster } from "@/components/ui/sonner";

export const ToasterProvider = () => {
  return (
    <Toaster
      theme="light"
      richColors
      position="top-right"
      duration={4000} // ✅ الإشعار يختفي تلقائيًا بعد 4 ثوانٍ
      closeButton // ✅ إضافة زر لإغلاق الإشعار يدويًا
      className="bg-white shadow-md border border-gray-200 rounded-lg"
    />
  );
};