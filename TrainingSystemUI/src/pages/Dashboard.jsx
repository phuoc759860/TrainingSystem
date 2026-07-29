import useAuth from "../hooks/useAuth";
import AdminDashboard from "./dashboards/AdminDashboard";
import TrainerDashboard from "./dashboards/TrainerDashboard";
import StudentDashboard from "./dashboards/StudentDashboard";

export default function Dashboard() {
    const { role } = useAuth();

    if (role === "Admin") return <AdminDashboard />;
    if (role === "Trainer") return <TrainerDashboard />;
    return <StudentDashboard />;
}
