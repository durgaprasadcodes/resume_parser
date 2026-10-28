import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function LoadingAnimation1() {
    return (
        <div className="page-loading-overlay" role="status" aria-label="Loading page">
            <DotLottieReact
                src="https://lottie.host/f4b8ec81-96b5-4848-8a12-27d5ee4d14b2/hm6VrwHUf1.lottie"
                loop
                autoplay
                style={{ width: 150, height: 150 }}
            />
        </div>
    );
}
