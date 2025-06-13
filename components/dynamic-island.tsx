"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Music, Phone, Timer, Wifi, Battery } from "lucide-react";
import { cn } from "@/lib/utils";

interface IslandContent {
  id: string;
  type: "compact" | "expanded" | "large";
  component: React.ReactNode;
  duration?: number;
}

const sampleContents: IslandContent[] = [
  {
    id: "music",
    type: "expanded",
    component: (
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <Music className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">Now Playing</p>
          <p className="text-xs text-white/70 truncate">Midnight City - M83</p>
        </div>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      </div>
    ),
  },
];

export function DynamicIsland() {
  const [currentContent, setCurrentContent] = useState<IslandContent | null>(
    null
  );
  const [isVisible, setIsVisible] = useState(false);
  const [contentIndex, setContentIndex] = useState(0);

  useEffect(() => {
    const showContent = () => {
      const content = sampleContents[contentIndex];
      setCurrentContent(content);
      setIsVisible(true);

      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setCurrentContent(null);
          setContentIndex((prev) => (prev + 1) % sampleContents.length);
        }, 300);
      }, content.duration || 3000);
    };

    const interval = setInterval(showContent, 6000);
    showContent(); // Show first content immediately

    return () => clearInterval(interval);
  }, [contentIndex]);

  const getIslandSize = () => {
    if (!currentContent) return "w-32 h-8";

    switch (currentContent.type) {
      case "compact":
        return "w-40 h-10";
      case "expanded":
        return "w-80 h-14";
      case "large":
        return "w-96 h-32";
      default:
        return "w-32 h-8";
    }
  };

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
      <div
        className={cn(
          "bg-black rounded-full transition-all duration-500 ease-out overflow-hidden",
          getIslandSize(),
          isVisible ? "opacity-100 scale-100" : "opacity-70 scale-95"
        )}
      >
        {currentContent ? (
          <div className="w-full h-full flex items-center justify-center">
            {currentContent.component}
          </div>
        ) : (
          <div className="w-full h-full bg-black rounded-full" />
        )}
      </div>
    </div>
  );
}
