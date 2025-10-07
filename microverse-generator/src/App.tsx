import BabylonCanvas from "./components/BabylonCanvas";
import "./App.css";
import React from "react";
import ChuckSetup from "./components/ChuckSetup";

export default function App() {

  return (
    <div className="app-container">
      <BabylonCanvas />
      <ChuckSetup />
    </div>
  );
}