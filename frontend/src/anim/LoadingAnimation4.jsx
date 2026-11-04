import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function LoadingAnimation4({ width = 320, height = 320, style }) {
    return (
        <div className="loading-animation-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <DotLottieReact
                src="https://lottie.host/7466e69f-eadf-4004-9719-6f9d45a2b3a5/mGJOQXcTN5.lottie"
                autoplay
                style={{ width, height, ...style }}
            />
        </div>
    );
}
