"use client";

import React from "react";

const IntroDetails = () => {
    
    const [showDetails, setShowDetails] = React.useState(false);

    const showIntroDetails = () => {
        setShowDetails(!showDetails);
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
            }}
        >
            <button 
                disabled={false}
                aria-label={showDetails ? 'Hide site information' : 'Show site information'}
                aria-expanded={showDetails}
                style={{
                    position: 'absolute',
                    top: '30px',
                    right: '20px',
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: 'rgba(255,255,255,0.25)',
                    color: '#e9f1ff',
                    cursor: 'pointer',
                    // fontFamily: 'monospace'
                }}
                id="micStartRecordButton" 
                onClick={showIntroDetails}
            >
                What is this site?
            </button>
            {showDetails}
            <>{showDetails && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '70px',
                            right: '20px',
                            width: '300px',
                            padding: '12px 14px',
                            background: 'rgba(0,0,0,0.45)',
                            color: '#e9f1ff',
                            // fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 8,
                            zIndex: 1000,
                            fontSize: "10px",
                            fontFamily: "monospace !important",
                        }}
                    >
                        {/* <h2>About This Site</h2> */}
                        <p>This is a small demo app that extracts tools and techniques from a larger project in progress.</p>
                        <p>It combines WebChucK, Hydra, Babylon, and a Supabase vector store (no LLM yet) to create a cross-modular feedback loop.</p>
                        <p>
                            To test the larger project, visit the{' '}
                            <a 
                                href="https://github.com/MartinScriblerus/SoundSink" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                aria-label="SoundSink project repository on GitHub (opens in new tab)"
                                style={{ color: 'var(--color-subdominant-primary, #00D9FF)' }}
                            >
                                SoundSink repository on GitHub
                            </a>
                            .
                        </p>
                        <p>Last updated: Oct 21, 2025</p>
                    </div>
                )
            }</>
            </div>
    )   
};
export default IntroDetails;