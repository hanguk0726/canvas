import { useState, useRef, useEffect } from "react";
import Timeline from "../components/timeline/Timeline";

const Home = () => {
  return (
    <div
      className="min-h-screen flex items-start justify-center p-4 gap-8"
      style={{ height: "500px", width: "100%" }}
    >
      <Timeline />
    </div>
  );
};

export default Home;
