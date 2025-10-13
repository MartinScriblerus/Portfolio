import React from "react";
import '../../app/globals.css';


export default function Title({ text }: { text: string }) {
    return (
        <h1 style={{color: "rgba(255,255,255,0.9)"}} className="title-wrapper">
            {text}
        </h1>
    );
}