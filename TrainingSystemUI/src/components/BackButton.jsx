// Main/src/components/BackButton.jsx
import { useNavigate } from "react-router-dom";

function BackButton({ to = "/dashboard", label = "← Back" }) {
    const navigate = useNavigate();

    return (
        <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => navigate(to)}
        >
            {label}
        </button>
    );
}

export default BackButton;