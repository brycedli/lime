"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { GeneratedImage } from "@/lib/supabase";
import { XMarkIcon, PlusIcon, ArrowUpIcon, PhotoIcon, ArrowDownTrayIcon } from '@heroicons/react/16/solid'
import ParticleSystem from "@/components/ParticleSystem";

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
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setShowLoader(true);
    setResult(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          image_url: imageUrl || undefined,
        }),
      });

      const data = await response.json();
      setResult(data);
      
      // Refresh history after successful generation
      if (data.success) {
        await fetchHistory();
        // Hide loader after history is refreshed
        setShowLoader(false);
      } else {
        setShowLoader(false);
      }
    } catch (error) {
      console.error("Error:", error);
      setResult({
        success: false,
        error: "Failed to generate image",
      });
      setShowLoader(false);
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle debug loading with Cmd/Ctrl + D
      if ((event.metaKey || event.ctrlKey) && event.key === 'd') {
        event.preventDefault();
        setDebugLoading(prev => !prev);
        console.log('Debug loading toggled:', !debugLoading);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [debugLoading]);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageUrl(imageUrl);
  };

  const handleDownload = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${prompt.slice(0, 50).replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const openModal = (imageUrl: string) => {
    setModalImage(imageUrl);
  };

  const closeModal = () => {
    setModalImage(null);
  };

  // Debug logging
  console.log("Component render - historyLoading:", historyLoading, "history.length:", history.length);

  return (
    <div className="w-screen h-screen relative bg-black overflow-hidden" style={{ backgroundColor: '#000000' }}>
      {/* Background Grid */}
      <div className="w-full h-full absolute inset-0 overflow-y-auto overscroll-contain" style={{ overscrollBehavior: 'contain' }}>
        {historyLoading ? (
          <div className="flex items-center justify-center h-full">
            {/* <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div> */}
            <span className="ml-3 text-white text-lg">Loading history...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-white text-lg">No images generated yet. Create your first image below!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 pb-32" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
            {/* Loading placeholder when generating */}
            {(showLoader || debugLoading) && (
              <div className="relative aspect-square bg-[#353535] flex items-center justify-center overflow-hidden">
                <ParticleSystem 
                  color1={[0.1*0.9, 0.1*0.9, 0.1]}
                  color2={[0.3*0.9, 0.3*0.9, 0.3]}
                  color3={[0.5*0.9, 0.5*0.9, 0.5]}
                  color4={[0.9*0.9, 0.9*0.9, 0.9]}
                  speed={1.0}
                />
                <div className="relative z-10 text-center">
                  <p className="text-white font-medium font-['Inter'] text-lg">Generating...</p>
                </div>
              </div>
            )}
            {history.map((item) => (
              <div 
                key={item.id} 
                className="relative aspect-square group overflow-hidden cursor-pointer"
                onClick={() => openModal(item.image_url)}
              >
                <Image
                  src={item.image_url}
                  alt={item.prompt}
                  fill
                  className="object-cover"
                />
                
                
                
                {/* Hover overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className=" p-4 absolute bottom-0 left-0 w-full inline-flex justify-between items-start overflow-hidden">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageClick(item.image_url);
                      }}
                      className="h-11 px-4 bg-black/40 rounded-xl shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,0.10)] backdrop-blur-[32px] flex justify-center items-center gap-2 overflow-hidden hover:bg-black/60 transition-colors"
                    >
                      <PhotoIcon className="w-6 h-6 text-white" />
                      <div className="text-center justify-start text-white  font-medium font-['Inter']">
                        Use as reference
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(item.image_url, item.prompt);
                      }}
                      className="w-11 h-11 bg-black/40 rounded-xl shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,0.10)] backdrop-blur-[32px] flex justify-center items-center gap-2 overflow-hidden hover:bg-black/60 transition-colors"
                    >
                      <ArrowDownTrayIcon className="w-6 h-6 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gradient Overlay */}
      <div className="w-full h-40 absolute bottom-0 left-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none"></div>

      {/* Floating Input Bar */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-[633px] px-4">
        <div className="bg-black/40 backdrop-blur-[32px] rounded-[32px] p-2 flex flex-col justify-center items-start overflow-hidden w-full  shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,0.10)]">
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
                    className="w-4 h-4 relative overflow-hidden"
                  >
                    <XMarkIcon className="w-4 h-4 text-slate-900" />
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
                placeholder="Describe your image"
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
              className="w-12 h-12 bg-white rounded-3xl flex justify-center items-center gap-1 overflow-hidden disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin w-6 h-6">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="60 40" className="text-black opacity-25"/>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="15 85" strokeDashoffset="0" className="text-black">
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        dur="1s"
                        repeatCount="indefinite"
                        values="0 12 12;360 12 12"/>
                    </circle>
                  </svg>
                </div>
              ) : (
                <ArrowUpIcon className="w-6 h-6 text-black" />
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

      {/* Image Modal */}
      {modalImage && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
          onClick={closeModal}
        >
          <div className="relative max-w-full max-h-full rounded-4xl overflow-hidden">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-colors z-10"
            >
              <XMarkIcon className="w-8 h-8 text-white" />
            </button>
            <Image
              src={modalImage}
              alt="Full size image"
              width={1024}
              height={1024}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
