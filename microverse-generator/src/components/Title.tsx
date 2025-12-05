import React from "react";
import '../../app/globals.css';
import { useVisStore } from '../store/useVisStore';


export default function Title({ text }: { text: string }) {
    const introActive = useVisStore(s => s.intro.active);
    const skipIntro = useVisStore(s => s.skipIntro);
    
    const handleClick = () => {
        if (introActive) {
            skipIntro();
        }
    };
    
    return (
        <h1 
            onClick={handleClick}
            style={{
                color: "var(--color-dominant-text, rgba(255,255,255,0.9))",
                fontSize: "clamp(16px, 4vw, 24px)",
                cursor: introActive ? 'pointer' : 'default',
                transition: 'opacity 0.3s ease',
            }} 
            className="title-wrapper"
            role="banner"
            aria-label={text}
            title={introActive ? "Click to reveal controls" : undefined}
        >
            {text}
        </h1>
    );
}