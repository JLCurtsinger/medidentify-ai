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
  const animationFrameRef = useRef<number>();
  const { toast } = useToast();

  let model: any = null;
  let webcam: any = null;
  let maxPredictions = 0;
  const BRIGHTNESS_ADJUSTMENT = 100; // Increased brightness adjustment

  const adjustBrightness = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Apply a more aggressive brightness adjustment
      data[i] = Math.min(255, data[i] * 1.5 + BRIGHTNESS_ADJUSTMENT);
      data[i + 1] = Math.min(255, data[i + 1] * 1.5 + BRIGHTNESS_ADJUSTMENT);
      data[i + 2] = Math.min(255, data[i + 2] * 1.5 + BRIGHTNESS_ADJUSTMENT);
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  const init = async () => {
    setIsLoading(true);
    try {
      const modelURL = "/model/model.json";
      const metadataURL = "/model/metadata.json";

      // Load the model
      console.log("Loading model...");
      model = await window.tmImage.load(modelURL, metadataURL);
      maxPredictions = model.getTotalClasses();
      console.log("Model loaded successfully");

      // Initialize webcam with specific constraints
      const flip = true;
      webcam = new window.tmImage.Webcam(400, 400, flip);
      
      // Add specific constraints for better quality
      const constraints = {
        video: {
          width: { ideal: 400 },
          height: { ideal: 400 },
          facingMode: 'environment',
          advanced: [
            { exposureMode: "manual" },
            { exposureCompensation: 2.0 }, // Increase exposure
            { brightness: { min: 100, ideal: 200 } }
          ]
        }
      };

      console.log("Setting up webcam with constraints:", constraints);
      await webcam.setup(constraints);
      console.log("Webcam setup complete");
      
      await webcam.play();
      console.log("Webcam playing");

      // Set up processing canvas
      if (!processingCanvasRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        processingCanvasRef.current = canvas;
      }

      // Append webcam canvas to container
      if (webcamContainerRef.current) {
        webcamContainerRef.current.innerHTML = ''; // Clear previous content
        webcamContainerRef.current.appendChild(webcam.canvas);
      }

      // Initialize label containers
      if (labelContainerRef.current) {
        labelContainerRef.current.innerHTML = ''; // Clear previous content
        for (let i = 0; i < maxPredictions; i++) {
          labelContainerRef.current.appendChild(document.createElement("div"));
        }
      }

      setIsActive(true);
      console.log("Starting animation loop");
      // Start the animation loop
      animationFrameRef.current = requestAnimationFrame(loop);
    } catch (error) {
      console.error("Initialization error:", error);
      toast({
        title: "Error",
        description: `Failed to initialize camera: ${error.message}. Please ensure camera permissions are granted and try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loop = async () => {
    if (!webcam || !model || !processingCanvasRef.current || !isActive) {
      console.log("Loop stopped: missing requirements");
      return;
    }

    try {
      webcam.update();
      
      const ctx = processingCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(webcam.canvas, 0, 0);
        adjustBrightness(processingCanvasRef.current);
      }

      await predict();
      
      if (isActive) {
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    } catch (error) {
      console.error("Loop error:", error);
      toast({
        title: "Processing Error",
        description: "An error occurred while processing the video feed. Trying to recover...",
        variant: "destructive",
      });
    }
  };

  const predict = async () => {
    if (!model || !labelContainerRef.current || !processingCanvasRef.current) return;

    try {
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
    } catch (error) {
      console.error("Prediction error:", error);
    }
  };

  useEffect(() => {
    return () => {
      console.log("Cleaning up component");
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
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