import { useRef, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import api from "../api/api";
import Navbar from "../components/Navbar";
import uploadResumeImage from "../assets/upload_resume.png";
import AtsScoreCircle from "../components/AtsScoreCircle";
import { showSuccess, showError, extractErrorMessage } from "../lib/toast";
import "../styles/Analysis.css";

export default function Analysis() {

    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [filename, SetFileName] = useState("");
    const [result, SetResult] = useState("");
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
                showError("Please upload a PDF file.");
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
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await api.post(
                "/hirelense/upload_resume",
                formData
            );

            const parsedResult = JSON.parse(response.data.result);

            SetResult(parsedResult);
            SetFileName(response.data.filename);

            showSuccess("Resume analyzed successfully!");

        } catch (err) {
            console.error("Resume analysis error:", err);

            const errorMsg =
                err.response?.data?.detail ||
                err.message ||
                "Analysis failed. Please try again.";

            showError(errorMsg);
            setError(errorMsg);

        } finally {
            setUploading(false);
        }
    };


    return (
        <>
            <Navbar />

            <div className="page-container analysis-page">

                {
                    !result ? (
                        <div className="upload-section">

                            <h1><i className="fa-solid  fa-cloud-arrow-up"></i> Upload Your Resume</h1>

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

                                <img
                                    className="upload-resume-image"
                                    src={uploadResumeImage}
                                    alt="Resume upload illustration"
                                />

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
                    ) : (
                        <div className="result">
                            <AtsScoreCircle score={result?.ats_score || 0} size={200} strokeWidth={20} />
                            <b> Name : {filename}</b>
                        </div>
                    )

                }

            </div>
        </>
    );
}