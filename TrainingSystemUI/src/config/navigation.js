import {
  LayoutDashboard, Users, KeyRound, BookOpen, FileText, Folder,
  CheckCircle, HelpCircle, Target, ClipboardList, TrendingUp,
  TrendingDown, GraduationCap, Calendar, MessageCircle, Mail,
  User, BookMarked, PenTool, BarChart3, Book, BookCheck, Puzzle,
} from "lucide-react";

const ICONS = {
  dashboard: LayoutDashboard,
  users: Users,
  roles: KeyRound,
  courses: BookOpen,
  lessons: FileText,
  materials: Folder,
  exams: CheckCircle,
  questions: HelpCircle,
  quizzes: Target,
  enrollments: ClipboardList,
  "exam-results": TrendingUp,
  statistics: BarChart3,
  grades: GraduationCap,
  schedule: Calendar,
  forum: MessageCircle,
  inbox: Mail,
  profile: User,
  "my-learning": BookMarked,
  "my-courses": Book,
  pending: PenTool,
  questionsBank: Puzzle,
};

export const MODULE_COLORS = {
  users: "#6c5ce7",
  roles: "#3b97f6",
  courses: "#17a668",
  lessons: "#e55353",
  materials: "#6c5ce7",
  exams: "#20a5c9",
  questions: "#f9b115",
  "exam-results": "#6c5ce7",
  quizzes: "#3b97f6",
  statistics: "#17a668",
  schedule: "#e55353",
  enrollments: "#f9b115",
  forum: "#20a5c9",
  inbox: "#6c5ce7",
  grades: "#e55353",
  profile: "#3b97f6",
  "my-learning": "#6c5ce7",
};

export const MODULE_DESCRIPTIONS = {
  dashboard: "System overview",
  users: "Manage users & roles",
  roles: "Configure permissions",
  courses: "Manage all courses",
  lessons: "Browse lesson content",
  materials: "Study materials",
  exams: "Manage examinations",
  questions: "Question bank",
  "exam-results": "View results",
  quizzes: "Manage quizzes",
  statistics: "Analytics",
  schedule: "Class schedule",
  enrollments: "Track enrollments",
  forum: "Forum threads",
  inbox: "Messages",
  grades: "View all grades",
  profile: "Account settings",
  "my-learning": "Track your progress",
};

export const SIDEBAR = {
  Admin: [
    { label: "Main", items: [
      { key: "dashboard", label: "Dashboard", path: "/dashboard" },
    ]},
    { label: "Administration", items: [
      { key: "users", label: "Users", path: "/users" },
      { key: "roles", label: "Roles", path: "/roles" },
    ]},
    { label: "Content", items: [
      { key: "courses", label: "Courses", path: "/courses" },
      { key: "lessons", label: "Lessons", path: "/lessons" },
      { key: "materials", label: "Materials", path: "/materials" },
      { key: "exams", label: "Exams", path: "/exams" },
      { key: "questions", label: "Questions", path: "/questions" },
      { key: "quizzes", label: "Quizzes", path: "/quizzes" },
    ]},
    { label: "Tracking", items: [
      { key: "enrollments", label: "Enrollments", path: "/enrollment" },
      { key: "exam-results", label: "Exam Results", path: "/exam-results" },
      { key: "statistics", label: "Statistics", path: "/statistics" },
      { key: "grades", label: "Grades", path: "/grades" },
      { key: "schedule", label: "Schedule", path: "/schedule" },
    ]},
    { label: "Community", items: [
      { key: "forum", label: "Discussions", path: "/forum" },
      { key: "inbox", label: "Messages", path: "/inbox" },
    ]},
    { label: "Account", items: [
      { key: "profile", label: "Profile", path: "/profile" },
    ]},
  ],
  Trainer: [
    { label: "Main", items: [
      { key: "dashboard", label: "Dashboard", path: "/dashboard" },
    ]},
    { label: "Teaching", items: [
      { key: "courses", label: "Courses", path: "/courses" },
      { key: "lessons", label: "Lessons", path: "/lessons" },
      { key: "materials", label: "Materials", path: "/materials" },
      { key: "quizzes", label: "Quizzes", path: "/quizzes" },
    ]},
    { label: "Assessments", items: [
      { key: "exams", label: "Exams", path: "/exams" },
      { key: "questions", label: "Questions", path: "/questions" },
      { key: "exam-results", label: "Exam Results", path: "/exam-results" },
      { key: "grades", label: "Grades", path: "/grades" },
    ]},
    { label: "Students", items: [
      { key: "enrollments", label: "Enrollments", path: "/enrollment" },
      { key: "statistics", label: "Statistics", path: "/statistics" },
      { key: "schedule", label: "Schedule", path: "/schedule" },
    ]},
    { label: "Community", items: [
      { key: "forum", label: "Discussions", path: "/forum" },
      { key: "inbox", label: "Messages", path: "/inbox" },
    ]},
    { label: "Account", items: [
      { key: "profile", label: "Profile", path: "/profile" },
    ]},
  ],
  Student: [
    { label: "Main", items: [
      { key: "dashboard", label: "Dashboard", path: "/dashboard" },
    ]},
    { label: "Learning", items: [
      { key: "my-learning", label: "My Learning", path: "/my-learning" },
      { key: "courses", label: "Courses", path: "/courses" },
      { key: "lessons", label: "Lessons", path: "/lessons" },
      { key: "materials", label: "Materials", path: "/materials" },
    ]},
    { label: "Assessments", items: [
      { key: "exams", label: "Exams", path: "/exams" },
      { key: "quizzes", label: "Quizzes", path: "/quizzes" },
      { key: "grades", label: "Grades", path: "/grades" },
    ]},
    { label: "Planning", items: [
      { key: "schedule", label: "Schedule", path: "/schedule" },
    ]},
    { label: "Community", items: [
      { key: "forum", label: "Discussions", path: "/forum" },
      { key: "inbox", label: "Messages", path: "/inbox" },
    ]},
    { key: "profile", label: "Profile", path: "/profile" },
  ],
};

export function getQuickAccess(role) {
  const groups = SIDEBAR[role] || SIDEBAR.Student;
  const seen = new Set();
  const items = [];
  for (const group of groups) {
    for (const item of group.items || [group]) {
      if (item.key && !seen.has(item.key) && item.key !== "dashboard" && item.key !== "profile") {
        seen.add(item.key);
        items.push({
          ...item,
          icon: item.key,
          desc: MODULE_DESCRIPTIONS[item.key] || "",
          color: MODULE_COLORS[item.key] || "#6c5ce7",
        });
      }
    }
  }
  return items;
}

export function getSidebarIcon(name) {
  return ICONS[name] || LayoutDashboard;
}
