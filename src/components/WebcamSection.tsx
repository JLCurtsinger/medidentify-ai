import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "./ui/use-toast";

declare global {
  interface Window {
    tmImage: any;
  }
}

const WebcamSection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const webcamContainerRef = useRef<HTMLDivElement>(null);
  const labelContainerRef = useRef<HTMLDivElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  let model: any = null;
  let webcam: any = null;
  let maxPredictions = 0;
  const BRIGHTNESS_ADJUSTMENT = 50; // Brightness adjustment value

  const adjustBrightness = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Adjust brightness for each pixel
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] + BRIGHTNESS_ADJUSTMENT);     // Red
      data[i + 1] = Math.min(255, data[i + 1] + BRIGHTNESS_ADJUSTMENT); // Green
      data[i + 2] = Math.min(255, data[i + 2] + BRIGHTNESS_ADJUSTMENT); // Blue
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  const init = async () => {
    setIsLoading(true);
    try {
      // Updated to use local model files from the public directory
      const modelURL = "/model/model.json";
      const metadataURL = "/model/metadata.json";

      model = await window.tmImage.load(modelURL, metadataURL);
      maxPredictions = model.getTotalClasses();

      const flip = true;
      webcam = new window.tmImage.Webcam(400, 400, flip);
      await webcam.setup();
      await webcam.play();

      // Create and set up processing canvas
      if (!processingCanvasRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        processingCanvasRef.current = canvas;
      }

      if (webcamContainerRef.current) {
        webcamContainerRef.current.appendChild(webcam.canvas);
      }

      if (labelContainerRef.current) {
        for (let i = 0; i < maxPredictions; i++) {
          labelContainerRef.current.appendChild(document.createElement("div"));
        }
      }

      setIsActive(true);
      window.requestAnimationFrame(loop);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize webcam or model. Please try again.",
        variant: "destructive",
      });
      console.error("Error initializing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loop = async () => {
    if (webcam && model && processingCanvasRef.current) {
      webcam.update();
      
      // Copy webcam frame to processing canvas and adjust brightness
      const ctx = processingCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(webcam.canvas, 0, 0);
        adjustBrightness(processingCanvasRef.current);
      }

      await predict();
      if (isActive) {
        window.requestAnimationFrame(loop);
      }
    }
  };

  const predict = async () => {
    if (model && labelContainerRef.current && processingCanvasRef.current) {
      // Use the brightness-adjusted canvas for prediction
      const prediction = await model.predict(processingCanvasRef.current);
      for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
          prediction[i].className +
          ": " +
          (prediction[i].probability * 100).toFixed(2) +
          "%";
        if (labelContainerRef.current.childNodes[i]) {
          (labelContainerRef.current.childNodes[i] as HTMLElement).innerHTML =
            classPrediction;
        }
      }
    }
  };

  useEffect(() => {
    return () => {
      setIsActive(false);
      if (webcam) {
        webcam.stop();
      }
    };
  }, []);

  return (
    <div className="grid md:grid-cols-2 gap-8 w-full max-w-6xl mx-auto p-4">
      <Card className="p-4 relative min-h-[450px] flex items-center justify-center bg-medical-50">
        {!isActive && !isLoading && (
          <div className="text-center">
            <p className="text-gray-500 mb-4">
              Camera feed will appear here once activated
            </p>
            <Button onClick={init} className="bg-medical-600 hover:bg-medical-700">
              Start Webcam
            </Button>
          </div>
        )}
        {isLoading && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Initializing...</span>
          </div>
        )}
        <div
          ref={webcamContainerRef}
          className="webcam-container rounded-lg overflow-hidden"
        />
      </Card>

      <Card className="p-4 bg-medical-50">
        <h3 className="text-xl font-semibold mb-4 text-medical-900">
          Prediction Results
        </h3>
        <div
          ref={labelContainerRef}
          className="space-y-2 text-medical-800"
        ></div>
      </Card>
    </div>
  );
};

export default WebcamSection;