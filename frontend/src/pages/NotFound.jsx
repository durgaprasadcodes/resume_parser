import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/NotFound.css";
import LoadingAnimation5 from "../anim/LoadingAnimation5";

export default function NotFound() {

    return (
        <>
            <Navbar />

            <div className="not-found-page">


                <LoadingAnimation5 />

                <h2>Page Not Found</h2>

                <p>
                    The page you're looking for doesn't exist
                    or has been moved.
                </p>

                <Link to="/" className="not-found-back-btn">
                    ← Back to Home
                </Link>

            </div>
        </>
    );
}
