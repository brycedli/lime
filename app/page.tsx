"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { GeneratedImage } from "@/lib/supabase";

interface GenerationResult {
  success: boolean;
  data?: {
    images: Array<{ url: string }>;
  };
  requestId?: string;
  error?: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt,
          image_url: selectedImage || imageUrl.trim() || undefined 
        }),
      });

      const data = await response.json();
      setResult(data);
      
      // Refresh history after successful generation
      if (data.success) {
        fetchHistory();
      }
    } catch (error) {
      console.error("Error:", error);
      setResult({
        success: false,
        error: "Failed to generate image",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      console.log("Fetching history...");
      const response = await fetch("/api/history");
      const data = await response.json();
      
      console.log("History response:", data);
      
      if (data.success) {
        console.log("Setting history data:", data.data);
        setHistory(data.data);
      } else {
        console.error("History fetch failed:", data.error);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageUrl(imageUrl);
  };

  // Debug logging
  console.log("Component render - historyLoading:", historyLoading, "history.length:", history.length);

  return (
    <div className="w-screen h-screen relative bg-black overflow-hidden">
      {/* Background Grid */}
      <div className="w-full h-full absolute inset-0 overflow-y-auto">
        {historyLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-3 text-white text-lg">Loading history...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-white text-lg">No images generated yet. Create your first image below!</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1">
            {history.map((item) => (
              <div 
                key={item.id} 
                className="relative aspect-square cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handleImageClick(item.image_url)}
              >
                <Image
                  src={item.image_url}
                  alt={item.prompt}
                  fill
                  className="object-cover"
                />
                {selectedImage === item.image_url && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-black rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gradient Overlay */}
      <div className="w-full h-40 absolute bottom-0 left-0 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none"></div>

      {/* Floating Input Bar */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-[633px] px-4">
        <div className="bg-black/40 backdrop-blur-[32px] rounded-[32px] p-2 inline-flex flex-col justify-center items-start overflow-hidden">
          {/* Selected Image Preview */}
          {selectedImage && (
            <div className="self-stretch pl-3 pt-3 inline-flex justify-start items-center gap-1">
              <div className="w-14 h-14 relative rounded-xl overflow-hidden">
                <Image
                  src={selectedImage}
                  alt="Selected reference"
                  fill
                  className="object-cover"
                />
                <div className="w-5 h-5 absolute top-1 right-1 bg-white rounded-full inline-flex justify-center items-center gap-1 overflow-hidden">
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setImageUrl("");
                    }}
                    className="w-3 h-3 relative overflow-hidden"
                  >
                    <div className="w-1.5 h-1.5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900"></div>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Input Row */}
          <div className="self-stretch pl-3 inline-flex justify-between items-center">
            <div className="flex-1 py-2 flex justify-start items-center gap-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What would you like to make?"
                className="w-full bg-transparent text-white text-lg font-medium font-['Inter'] placeholder-white/60 outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading && prompt.trim()) {
                    handleGenerate();
                  }
                }}
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-12 h-12 bg-white rounded-3xl flex justify-center items-center gap-1 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed mr-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
              ) : (
                <div className="w-6 h-6 relative">
                  <div className="w-6 h-6 absolute overflow-hidden">
                    <svg
                      className="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-180 text-black"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 0a.5.5 0 0 1 .5.5v7h7a.5.5 0 0 1 0 1h-7v7a.5.5 0 0 1-1 0v-7h-7a.5.5 0 0 1 0-1h7v-7A.5.5 0 0 1 8 0z" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {result && !result.success && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-lg p-4">
          <p className="text-red-200 text-center">
            {result.error || "Failed to generate image"}
          </p>
        </div>
      )}
    </div>
  );
}
