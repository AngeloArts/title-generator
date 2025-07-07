// File: src/App.jsx

import { useState } from "react";
import "./App.css";

function IndividualTitle({ title, onTitleCopy }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(title);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onTitleCopy(title);
  };

  return (
    <div className="individual-title">
      <span>{title}</span>
      <button onClick={handleCopy} className="copy-btn-small">
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

function ResultSection({ title, data, isTag = false }) {
  const [copied, setCopied] = useState(false);
  const displayData = isTag ? data.join(", ") : data;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="result-section">
      <div className="result-header">
        <h3>{title}</h3>
        <button onClick={handleCopy} className="copy-btn">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="result-content">{displayData}</pre>
    </div>
  );
}

function App() {
  const [videoContext, setVideoContext] = useState("");
  const [streamerName, setStreamerName] = useState("IShowSpeed");
  const [platform, setPlatform] = useState("youtube");
  const [generatedContent, setGeneratedContent] = useState(null);
  const [activeTitle, setActiveTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!videoContext.trim()) {
      setError("Please enter a video topic/context.");
      return;
    }
    setIsLoading(true);
    setError("");
    setGeneratedContent(null);
    setActiveTitle("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoContext,
          platform,
          streamerName: streamerName.trim() ? streamerName.trim() : undefined,
        }),
      });

      if (!response.ok) {
        try {
          const errData = await response.json();
          throw new Error(
            errData.error || `HTTP error! status: ${response.status}`
          );
        } catch (jsonError) {
          throw new Error(
            `HTTP error! status: ${response.status} - ${response.statusText}`
          );
        }
      }

      const data = await response.json();
      setGeneratedContent(data);
      setActiveTitle(videoContext);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  let fullDescription = "";
  if (generatedContent) {
    const hashtagsString = generatedContent.hashtags.join(" ");
    fullDescription = `${activeTitle}\n\n${generatedContent.callToAction}\n\n${hashtagsString}`;
  }

  return (
    <div className="app-container">
      <h1>Viral Content Generator 🚀</h1>
      <p>Generate titles, descriptions, and tags for your video content.</p>

      <div className="input-area">
        <input
          type="text"
          className="title-input"
          placeholder="Video Topic (e.g., Speed gets a new haircut)"
          value={videoContext}
          onChange={(e) => setVideoContext(e.target.value)}
        />
        <input
          type="text"
          className="title-input"
          placeholder="Streamer Name (optional, for fan channels)"
          value={streamerName}
          onChange={(e) => setStreamerName(e.target.value)}
        />
        <div className="platform-selector">
          <button
            onClick={() => setPlatform("youtube")}
            className={platform === "youtube" ? "active" : ""}
          >
            YouTube
          </button>
          <button
            onClick={() => setPlatform("tiktok")}
            className={platform === "tiktok" ? "active" : ""}
          >
            TikTok
          </button>
          <button
            onClick={() => setPlatform("general")}
            className={platform === "general" ? "active" : ""}
          >
            General
          </button>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="generate-btn"
        >
          {isLoading ? "Generating..." : "✨ Generate"}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {generatedContent && (
        <div className="results-container">
          <div className="result-section">
            <h3>Generated Titles (10)</h3>
            <div className="titles-list">
              {generatedContent.titles.map((title, index) => (
                <IndividualTitle
                  key={index}
                  title={title}
                  onTitleCopy={setActiveTitle}
                />
              ))}
            </div>
          </div>
          <ResultSection title="Generated Description" data={fullDescription} />
          {generatedContent.tags && generatedContent.tags.length > 0 && (
            <ResultSection
              title="Generated Tags"
              data={generatedContent.tags}
              isTag={true}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
