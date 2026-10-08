import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import api from "../api/api";
import Navbar from "../components/Navbar";


export default function Analysis() {

    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [llmResponse, setLlmResponse] = useState("");
    const [error, setError] = useState("");

    const fileInputRef = useRef(null);


    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };


    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const droppedFile = e.dataTransfer.files?.[0];

        if (droppedFile && droppedFile.type === "application/pdf") {
            setFile(droppedFile);
            setError("");
        } else {
            setError("Please upload a PDF file.");
        }
    };


    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];

        if (selectedFile) {
            if (selectedFile.type === "application/pdf") {
                setFile(selectedFile);
                setError("");
            } else {
                setError("Please upload a PDF file.");
            }
        }
    };


    const removeFile = () => {
        setFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };


    const handleAnalyze = async () => {

        if (!file) {
            setError("Please select a resume file first.");
            return;
        }

        setError("");
        setLlmResponse("");
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await api.post("/resume/analyze", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (response.data?.analysis) {
                setLlmResponse(response.data.analysis);
            } else if (typeof response.data === "string") {
                setLlmResponse(response.data);
            } else {
                setLlmResponse(
                    JSON.stringify(response.data, null, 2)
                );
            }

        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Analysis failed. Please try again."
            );
        } finally {
            setUploading(false);
        }
    };


    return (
        <>
            <Navbar />

            <div className="page-container analysis-page">

                {/* Upload Section */}
                <div className="upload-section">

                    <h1>📄 Resume Analysis</h1>

                    <p>
                        Upload your resume and let our AI provide
                        a comprehensive breakdown and improvement tips.
                    </p>


                    {/* Dropzone */}
                    <div
                        className={
                            `upload-dropzone${dragActive ? " active" : ""}`
                        }
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >

                        <div className="upload-icon">📁</div>

                        <h3>
                            {dragActive
                                ? "Drop your resume here"
                                : "Drag & drop your resume here"
                            }
                        </h3>

                        <p>or click to browse — PDF only, max 10MB</p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                        />

                    </div>


                    {/* Selected file info */}
                    {file && (
                        <div className="file-info">
                            <span>
                                📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </span>

                            <button onClick={removeFile}>
                                ✕ Remove
                            </button>
                        </div>
                    )}


                    {/* Error */}
                    {error && (
                        <div
                            className="error-message"
                            style={{ marginTop: 16 }}
                        >
                            {error}
                        </div>
                    )}


                    {/* Action buttons */}
                    <div className="upload-actions">

                        <button
                            className="btn btn-primary"
                            onClick={handleAnalyze}
                            disabled={!file || uploading}
                        >
                            {uploading ? (
                                <>
                                    <span className="spinner" />
                                    Analyzing...
                                </>
                            ) : (
                                "🔍 Analyze Resume"
                            )}
                        </button>

                    </div>

                </div>


                {/* Analysis Result */}
                {llmResponse && (
                    <div className="analysis-result">

                        <h2>
                            ✨ Analysis Results
                        </h2>

                        <div className="markdown-body">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                            >
                                {llmResponse}
                            </ReactMarkdown>
                        </div>

                    </div>
                )}

            </div>
        </>
    );
}