import React, { useEffect, useRef } from "react";
import { SceneManager } from "../engine/SceneManager";

export default function BabylonCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const sceneManagerRef = useRef<SceneManager | null>(null);

    useEffect(() => {
        if (canvasRef.current && !sceneManagerRef.current) {
            sceneManagerRef.current = new SceneManager();
            sceneManagerRef.current.init(canvasRef.current);
        }

        return () => {
            if (sceneManagerRef.current) {
                sceneManagerRef.current.dispose();
                sceneManagerRef.current = null;
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            id="babylon-canvas"
            style={{ width: "100%", height: "100%" }}
        />
    );
}