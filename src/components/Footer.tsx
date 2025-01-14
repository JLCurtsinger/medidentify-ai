import React from "react";

const Footer = () => {
  return (
    <footer className="bg-medical-50 py-6 mt-12">
      <div className="container text-center text-medical-800">
        <p className="mb-2">
          <a
            href="https://justincurtsinger.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-medical-600 transition-colors"
          >
            Justin Curtsinger
          </a>{" "}
          |{" "}
          <a
            href="https://github.com/JLCurtsinger/medicationIdentifier"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-medical-600 transition-colors"
          >
            GitHub Pages
          </a>{" "}
          |{" "}
          <a
            href="https://teachablemachine.withgoogle.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-medical-600 transition-colors"
          >
            Teachable Machine
          </a>{" "}
          2025
        </p>
      </div>
    </footer>
  );
};

export default Footer;