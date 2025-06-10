import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/layouts/main-layout";
import { Generate } from "./components/generate";
import { Dashboard } from "./routes/dashboard";
import { CreateEditPage } from "./routes/create-edit-page";
import { MockLoadPage } from "./routes/mock-load-page";
import { MockInterviewPage } from "./routes/mock-interview-page";
import { Feedback } from "./routes/feedback";

const App = () => {
  return (
    <Router basename="/Linkup-Ai-dash"> {/* أضف basename هنا وغيّر "Linkup-Ai-dash" ليطابق اسم الـ repository */}
      <Routes>
        {/* توجيه المستخدم إلى صفحة /generate افتراضيًا */}
        <Route path="/" element={<Navigate to="/generate" replace />} />

        {/* تضمين MainLayout بحيث يشمل جميع الصفحات */}
        <Route path="/" element={<MainLayout />}>
          {/* قسم إنشاء المقابلات وإدارتها */}
          <Route path="generate" element={<Generate />}>
            <Route index element={<Dashboard />} />
            <Route path="create" element={<CreateEditPage />} />
            <Route path="interview/:interviewId" element={<MockLoadPage />} />
            <Route path="interview/:interviewId/start" element={<MockInterviewPage />} />
            <Route path="feedback/:interviewId" element={<Feedback />} />
          </Route>

          {/* صفحة 404 لأي مسار مش موجود */}
          <Route path="*" element={<div><h2>404 - Page Not Found</h2></div>} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
