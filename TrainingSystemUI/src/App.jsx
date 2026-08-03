import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import Role from "./pages/Role";
import User from "./pages/User";
import Course from "./pages/Courses";
import Lesson from "./pages/Lesson";
import Material from "./pages/Material";
import Enrollment from "./pages/Enrollment";
import Question from "./pages/Question";
import Exam from "./pages/Exams";
import ExamResult from "./pages/ExamResult";
import TakeExam from "./pages/TakeExam";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import "./styles/theme.css";
import "./styles/landing-theme.css";
import "./index.css";
import GradeAttempt from "./pages/GradeAttempt";
import Statistics from "./pages/Statistics";
import Schedule from "./pages/Schedule";
import MyLearning from "./pages/MyLearning";
import LessonViewer from "./pages/LessonViewer";
import QuizManagement from "./pages/QuizManagement";
import TakeQuiz from "./pages/TakeQuiz";
import QuizAttempts from "./pages/QuizAttempts";
import Grades from "./pages/Grades";
import Forum from "./pages/Forum";
import Inbox from "./pages/Inbox";
import Profile from "./pages/Profile";

function ProtectedPage({ children, roles }) {
    return (
        <div className="dashboard-scope">
            <ProtectedRoute roles={roles}>
                <DashboardLayout>
                    {children}
                </DashboardLayout>
            </ProtectedRoute>
        </div>
    );
}

function App() {

    return (

        <BrowserRouter basename={import.meta.env.PROD ? "/Education_System" : ""}>

            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />

                <Route path="/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
                <Route path="/roles" element={<ProtectedPage roles={["Admin"]}><Role /></ProtectedPage>} />
                <Route path="/users" element={<ProtectedPage roles={["Admin"]}><User /></ProtectedPage>} />
                <Route path="/courses" element={<ProtectedPage roles={["Admin", "Trainer", "Student"]}><Course /></ProtectedPage>} />
                <Route path="/lessons" element={<ProtectedPage roles={["Admin", "Trainer", "Student"]}><Lesson /></ProtectedPage>} />
                <Route path="/materials" element={<ProtectedPage roles={["Admin", "Trainer", "Student"]}><Material /></ProtectedPage>} />
                <Route path="/enrollment" element={<ProtectedPage roles={["Admin", "Trainer"]}><Enrollment /></ProtectedPage>} />
                <Route path="/exams" element={<ProtectedPage roles={["Admin", "Trainer", "Student"]}><Exam /></ProtectedPage>} />
                <Route path="/exams/:examId/take" element={<ProtectedPage roles={["Admin", "Trainer", "Student"]}><TakeExam /></ProtectedPage>} />
                <Route path="/questions" element={<ProtectedPage roles={["Admin", "Trainer"]}><Question /></ProtectedPage>} />
                <Route path="/exam-results" element={<ProtectedPage roles={["Admin", "Trainer"]}><ExamResult /></ProtectedPage>} />
                <Route path="/exam-results/:id/grade" element={<ProtectedPage roles={["Admin", "Trainer"]}><GradeAttempt /></ProtectedPage>} />
                <Route path="/statistics" element={<ProtectedPage roles={["Admin", "Trainer"]}><Statistics /></ProtectedPage>} />
                <Route path="/schedule" element={<ProtectedPage roles={["Admin", "Trainer", "Student"]}><Schedule /></ProtectedPage>} />
                <Route path="/my-learning" element={<ProtectedPage roles={["Student"]}><MyLearning /></ProtectedPage>} />
                <Route path="/learn/:lessonId" element={<ProtectedPage roles={["Admin", "Trainer", "Student"]}><LessonViewer /></ProtectedPage>} />
                <Route path="/quizzes" element={<ProtectedPage roles={["Admin", "Trainer", "Student"]}><QuizManagement /></ProtectedPage>} />
                <Route path="/quizzes/:quizId/take" element={<ProtectedPage roles={["Admin", "Trainer", "Student"]}><TakeQuiz /></ProtectedPage>} />
                <Route path="/quizzes/:quizId/attempts" element={<ProtectedPage roles={["Admin", "Trainer", "Student"]}><QuizAttempts /></ProtectedPage>} />
                <Route path="/grades" element={<ProtectedPage roles={["Admin", "Trainer", "Student"]}><Grades /></ProtectedPage>} />
                <Route path="/forum" element={<ProtectedPage roles={["Admin", "Trainer", "Student"]}><Forum /></ProtectedPage>} />
                <Route path="/forum/:courseId" element={<ProtectedPage roles={["Admin", "Trainer", "Student"]}><Forum /></ProtectedPage>} />
                <Route path="/inbox" element={<ProtectedPage roles={["Admin", "Trainer", "Student"]}><Inbox /></ProtectedPage>} />
                <Route path="/profile" element={<ProtectedPage roles={["Admin", "Trainer", "Student"]}><Profile /></ProtectedPage>} />
            </Routes>

        </BrowserRouter>

    );

}

export default App;
