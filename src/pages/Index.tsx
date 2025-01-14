import React from "react";
import WebcamSection from "@/components/WebcamSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-100 to-white">
      <main className="container py-12 animate-fadeIn">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-medical-900 mb-4">
            Medication Identifier
          </h1>
          <h2 className="text-xl md:text-2xl text-medical-700 mb-6">
            AI-Powered Recognition for Caregiving and Accessibility
          </h2>
          <p className="text-medical-600 max-w-2xl mx-auto">
            This tool uses machine learning to recognize medications and assist
            users with accessibility needs. Just activate your webcam, and the AI
            will do the rest.
          </p>
        </div>

        <WebcamSection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;