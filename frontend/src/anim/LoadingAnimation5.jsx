import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function LoadingAnimation5({ width = 360, height = 360, style }) {
    return (
        <div className="not-found-animation-wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', scale: 1.5 }}>
            <DotLottieReact
                src="https://lottie.host/0ebe9770-23f5-4204-8e5a-3418a0867b44/twLXYuR8QO.lottie"
                loop
                autoplay
                style={{ width, height, ...style }}
            />
        </div>
    );
}
