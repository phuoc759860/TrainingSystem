import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import { getPoints, getBadges, getLeaderboard } from "../services/GamificationService";
import useToast from "../hooks/useToast";
import { Flame } from "lucide-react";

function Profile() {
    const [points, setPoints] = useState(null);
    const [badges, setBadges] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const { name, role } = useAuth();
    const { showToast, toastEl } = useToast();

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [p, b, l] = await Promise.all([
                getPoints(),
                getBadges(),
                getLeaderboard()
            ]);
            setPoints(p.data);
            setBadges(b.data);
            setLeaderboard(l.data);
        } catch (err) {
            console.error(err);
            showToast("Could not load profile data.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="page"><div className="loading-row"><span className="spinner" /> Loading profile...</div></div>;
    }
    const progressPercent = points ? Math.min(100, Math.round((points.points % 100) / 100 * 100)) : 0;

    return (
        <div className="page">
            <div className="welcome-banner">
                <h2>{name}'s Profile</h2>
                <p>{role} &middot; Level {points?.level || 1}</p>
            </div>

            <div className="stat-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card stat-card-purple">
                    <div className="num" style={{ color: "#fff" }}>{points?.points || 0}</div>
                    <div className="label" style={{ color: "rgba(255,255,255,.9)" }}>Points</div>
                </div>
                <div className="stat-card stat-card-blue">
                    <div className="num" style={{ color: "#fff" }}>{points?.level || 1}</div>
                    <div className="label" style={{ color: "rgba(255,255,255,.9)" }}>Level</div>
                </div>
                <div className="stat-card stat-card-green">
                    <div className="num" style={{ color: "#fff" }}>
                        {points?.streakDays || 0}
                        {points?.streakDays && points.streakDays >= 7 ? <Flame size={14} strokeWidth={2} style={{ color: "#f59e0b", verticalAlign: -2 }} /> : ""}
                    </div>
                    <div className="label" style={{ color: "rgba(255,255,255,.9)" }}>Day Streak</div>
                </div>
                <div className="stat-card stat-card-yellow">
                    <div className="num" style={{ color: "#fff", fontSize: 24 }}>{badges.filter(b => b.isEarned).length}/{badges.length}</div>
                    <div className="label" style={{ color: "rgba(255,255,255,.9)" }}>Badges Earned</div>
                </div>
            </div>

            {/* Level progress */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Level {points?.level || 1}</span>
                    <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                        {points ? 100 - points.pointsToNextLevel : 0}/100 XP to Level {(points?.level || 1) + 1}
                    </span>
                </div>
                <div className="learning-progress-track" style={{ height: 10 }}>
                    <div className="learning-progress-fill" style={{ width: `${progressPercent}%`, borderRadius: 8 }} />
                </div>
            </div>

            {/* Badges */}
            <h3 style={{ marginBottom: 14 }}>Badges</h3>
            <div className="module-grid" style={{ marginBottom: 24, gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
                {badges.map(badge => (
                    <div
                        key={badge.badgeID}
                        className="card"
                        style={{
                            textAlign: "center", padding: 20,
                            opacity: badge.isEarned ? 1 : 0.4,
                            border: badge.isEarned ? "2px solid var(--brand)" : "1px solid var(--border)"
                        }}
                    >
                        <div style={{ fontSize: 36, marginBottom: 8 }}>{badge.iconUrl}</div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{badge.name}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>{badge.description}</div>
                        {badge.isEarned && badge.earnedAt && (
                            <div style={{ fontSize: 10, color: "var(--success)", marginTop: 6 }}>
                                Earned {new Date(badge.earnedAt).toLocaleDateString()}
                            </div>
                        )}
                        {!badge.isEarned && (
                            <div style={{ fontSize: 10, color: "var(--ink-soft)", marginTop: 6 }}>
                                {badge.requiredPoints} pts needed
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Leaderboard */}
            <h3 style={{ marginBottom: 14 }}>Leaderboard</h3>
            <div className="card">
                {leaderboard.length === 0 ? (
                    <p style={{ color: "var(--ink-soft)" }}>No participants yet.</p>
                ) : (
                    <div className="table-scroll">
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>User</th>
                                <th>Level</th>
                                <th>Points</th>
                                <th>Streak</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((entry, i) => (
                                <tr key={entry.userID}>
                                    <td style={{ fontWeight: 700 }}>#{i + 1}</td>
                                    <td>
                                        <span style={{ fontWeight: 600 }}>{entry.userName}</span>
                                    </td>
                                    <td>{entry.level}</td>
                                    <td>{entry.points}</td>
                                    <td>{entry.streakDays}{entry.streakDays >= 7 ? <Flame size={14} strokeWidth={2} style={{ color: "#f59e0b", verticalAlign: -2, marginLeft: 4 }} /> : ""}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>

            {toastEl}
        </div>
    );
}

export default Profile;
