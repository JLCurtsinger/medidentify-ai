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
  const { toast } = useToast();

  let model: any = null;
  let webcam: any = null;
  let maxPredictions = 0;

  const init = async () => {
    setIsLoading(true);
    try {
      const URL = "https://github.com/JLCurtsinger/medicationIdentifier";
      const modelURL = URL + "model.json";
      const metadataURL = URL + "metadata.json";

      model = await window.tmImage.load(modelURL, metadataURL);
      maxPredictions = model.getTotalClasses();

      const flip = true;
      webcam = new window.tmImage.Webcam(400, 400, flip);
      await webcam.setup();
      await webcam.play();

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
    if (webcam && model) {
      webcam.update();
      await predict();
      if (isActive) {
        window.requestAnimationFrame(loop);
      }
    }
  };

  const predict = async () => {
    if (model && labelContainerRef.current) {
      const prediction = await model.predict(webcam.canvas);
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