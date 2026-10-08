import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";


export default function NotFound() {

    return (
        <>
            <Navbar />

            <div className="not-found-page">

                <div className="not-found-code">404</div>

                <h2>Page Not Found</h2>

                <p>
                    The page you're looking for doesn't exist
                    or has been moved.
                </p>

                <Link to="/" className="btn btn-primary btn-lg">
                    ← Back to Home
                </Link>

            </div>
        </>
    );
}
