import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { prompt, image_url } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Choose model based on whether reference image is provided
    const model = image_url ? "fal-ai/flux-pro/kontext" : "fal-ai/flux/schnell";
    
    const input: any = { prompt };
    if (image_url) {
      input.image_url = image_url;
    }

    const result = await fal.subscribe(model, {
      input,
      logs: true,
      onQueueUpdate: (update: any) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log: any) => log.message).forEach(console.log);
        }
      },
    });

    console.log("Generation result:", result.data);
    console.log("Request ID:", result.requestId);

    // Save to Supabase database
    if (result.data?.images && result.data.images.length > 0) {
      const imageUrl = result.data.images[0].url;
      
      const { error: dbError } = await supabase
        .from('generated_images')
        .insert({
          prompt: prompt,
          image_url: imageUrl,
          request_id: result.requestId,
        });

      if (dbError) {
        console.error("Error saving to database:", dbError);
        // Don't fail the request if DB save fails, just log it
      }
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      requestId: result.requestId,
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
