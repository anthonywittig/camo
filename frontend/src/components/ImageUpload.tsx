import { useState } from "react";
import * as Tesseract from "tesseract.js";

interface ImageUploadProps {
  onWordsExtracted: (words: string[]) => void;
}

export function ImageUpload({ onWordsExtracted }: ImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const result = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const text = result.data.text;

      // Split text into words and filter out empty strings and non-word characters
      const words = text
        .split(/[\s,\n]+/)
        .map((word) => word.trim().toLowerCase())
        // .filter((word) => word.length > 0 && /^[a-z]+$/.test(word));
        .filter((word) => word.length > 0);

      onWordsExtracted(words);
    } catch (error) {
      console.error("OCR Error:", error);
      alert("Error processing image. Please try again.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  return (
    <div style={{ margin: "20px 0" }}>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isProcessing}
        style={{ display: "none" }}
        id="image-upload"
      />
      <label
        htmlFor="image-upload"
        style={{
          padding: "10px 20px",
          backgroundColor: isProcessing ? "#ccc" : "#646cff",
          color: "white",
          borderRadius: "8px",
          cursor: isProcessing ? "not-allowed" : "pointer",
          display: "inline-block",
        }}
      >
        {isProcessing ? "Processing..." : "Upload Image"}
      </label>

      {isProcessing && (
        <div style={{ marginTop: "10px" }}>
          <progress value={progress} max="100" />
          <div>{progress}%</div>
        </div>
      )}
    </div>
  );
}
