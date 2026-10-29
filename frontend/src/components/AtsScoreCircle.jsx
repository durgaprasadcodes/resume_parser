import React, { useEffect, useState } from 'react';

const AtsScoreCircle = ({ score = 0, size = 180, strokeWidth = 14 }) => {
    // Ensure score stays between 0 and 100
    const cleanScore = Math.min(Math.max(score, 0), 100);

    // State for the animated counter text
    const [displayScore, setDisplayScore] = useState(0);

    // SVG Geometry calculations
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (cleanScore / 100) * circumference;

    // Determine color and label based on ATS score thresholds
    let scoreColor = '#ef4444'; // Red (0-50)
    let scoreStatus = 'Critical';
    let statusColor = '#ef4444';

    if (cleanScore >= 80) {
        scoreColor = '#22c55e'; // Green (75-100)
        scoreStatus = 'Excellent';
        statusColor = '#22c55e';
    } else if (cleanScore >= 70) {
        scoreColor = '#eab308'; // Yellow/Gold (50-74)
        scoreStatus = 'Good Match';
        statusColor = '#ca8a04';
    } else if (cleanScore >= 60) {
        scoreColor = '#eab308'; // Yellow/Gold (50-74)
        scoreStatus = 'Average';
        statusColor = '#ca8a04';
    }

    // Count-up animation for the text score
    useEffect(() => {
        let start = 0;
        if (cleanScore === 0) return;

        const duration = 1000; // 1 second animation
        const increment = cleanScore / (duration / 16); // ~60fps

        const timer = setInterval(() => {
            start += increment;
            if (start >= cleanScore) {
                clearInterval(timer);
                setDisplayScore(cleanScore);
            } else {
                setDisplayScore(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [cleanScore]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontFamily: 'system-ui, sans-serif',
            padding: '20px',
            // background: '#ffffff',
            borderRadius: '16px',
            // boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            width: 'fit-content',
            // scale: 1.5
        }}>
            <div style={{ position: 'relative', width: size, height: size }}>
                <svg height={size} width={size}>
                    {/* Track (Background Circle) */}
                    <circle
                        stroke="#f3f4f6"
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                    {/* Animated Progress Path */}
                    <circle
                        stroke={scoreColor}
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${circumference} ${circumference}`}
                        style={{
                            strokeDashoffset,
                            transition: 'stroke-dashoffset 1s ease-out-in',
                        }}
                        strokeLinecap="round"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    />
                </svg>

                {/* Center Content */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    <span style={{ fontSize: `${size * 0.22}px`, fontWeight: '800', color: '#1f2937', lineHeight: 1 }}>
                        {displayScore}
                    </span>
                    <span style={{ fontSize: `${size * 0.08}px`, fontWeight: '500', color: '#9ca3af', marginTop: '4px' }}>
                        out of 100
                    </span>
                </div>
            </div>

            {/* Dynamic Status Badge */}
            <div style={{
                marginTop: '16px',
                padding: '6px 12px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: `${statusColor}15`, // 15% opacity background
                color: statusColor
            }}>
                {scoreStatus}
            </div>
        </div>
    );
};

export default AtsScoreCircle;