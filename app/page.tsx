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
          image_url: imageUrl.trim() || undefined 
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
      const response = await fetch("/api/history");
      const data = await response.json();
      
      if (data.success) {
        setHistory(data.data);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Image Generator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Generate stunning images with Fal AI Flux Pro Kontext
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="prompt"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Enter your prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                rows={4}
              />
            </div>
            <div>
              <label
                htmlFor="imageUrl"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Reference Image URL (optional)
              </label>
              <input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Provide an image URL to modify an existing image with your prompt
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
            >
              {loading ? "Generating..." : "Generate Image"}
            </button>
          </div>
        </div>

        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-300">
                Generating your image...
              </span>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            {result.success && result.data?.images ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Generated Image
                </h3>
                <div className="grid gap-4">
                  {result.data.images.map((image, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={image.url}
                        alt={`Generated image ${index + 1}`}
                        width={512}
                        height={512}
                        className="rounded-lg shadow-md w-full h-auto"
                      />
                    </div>
                  ))}
                </div>
                {result.requestId && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Request ID: {result.requestId}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-red-600 dark:text-red-400">
                  <h3 className="text-lg font-semibold mb-2">Error</h3>
                  <p>{result.error || "Failed to generate image"}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Generation History
          </h2>
          
          {historyLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-300">
                  Loading history...
                </span>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                No images generated yet. Create your first image above!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={item.image_url}
                      alt={item.prompt}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-3">
                      {item.prompt}
                    </p>
                    {item.reference_image_url && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                        📷 Used reference image
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()} at{" "}
                      {new Date(item.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
