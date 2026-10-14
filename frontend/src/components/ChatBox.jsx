import * as React from "react";
import { useRef, useState, useEffect, useCallback } from "react";
import "../styles/ChatBox.css";

// Tiny helper to join class names (replaces the Tailwind `cn` helper)
const cx = (...classes) => classes.filter(Boolean).join(" ");

// ----------------------------------------------------------------------
// Transition Physics
// ----------------------------------------------------------------------
const SPRING_TRANSITION = "max-width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
const SMOOTH_HEIGHT_TRANSITION = "max-width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), height 0.15s ease-out";

// ----------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------
function MorphingText({ text }) {
    const [width, setWidth] = useState("auto");
    const spanRef = useRef(null);

    useEffect(() => {
        if (spanRef.current) {
            setWidth(spanRef.current.offsetWidth);
        }
    }, [text]);

    return (
        <span className="pi-morph" style={{ width }}>
            <span ref={spanRef} className="pi-morph-sizer">
                {text}
            </span>
            <span key={text} className="pi-morph-text">
                {text}
            </span>
        </span>
    );
}

function ModelIcon({ model }) {
    const icons = {
        "Composer 2.5": "https://cdn.21st.dev/assets/mirror/7d/7dc00bc09f225fcda46cbc9c6b669c69c025a231877d6c17baa6a003f04f02b2.svg",
        "Gemini 3.5 Flash": "https://cdn.21st.dev/assets/mirror/cd/cda2df6631d5fa227de3fa04ed78cf354f910ba92a9f086e7455655c10ad9d09.svg",
        "GPT 5.5": "https://cdn.21st.dev/assets/mirror/b9/b93fa7942be639a1dae60194ff12141145d7d9fd59581582d6ff23335755f19c.svg",
        "Opus 4.8": "https://cdn.21st.dev/assets/mirror/5d/5de1221c77cc91e748066fd642ad0eee1c1fa65328814f5178166f901e599709.svg",
        "GLM 5.2": "https://cdn.21st.dev/assets/mirror/b2/b2a6c0ff63efd8a555edf8a174ea6fcfeca120ac1595a2d461ca11d3ae89276c.svg",
    };

    return (
        <img
            src={icons[model] || icons["GPT 5.5"]}
            alt={model}
            className={cx("pi-model-icon", model === "GPT 5.5" && "pi-model-icon--invert")}
        />
    );
}

function ArrowUpIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 12V2M7 2L2.5 6.5M7 2L11.5 6.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function MicIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <rect x="5" y="1" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2.75 6.5V7a4.25 4.25 0 0 0 8.5 0v-.5M7 11.25V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function StopIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" fill="currentColor" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 2.5V11.5M2.5 7H11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg width="9" height="9" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2.5 2.5L11.5 11.5M11.5 2.5L2.5 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function DynamicBarsIcon({ level }) {
    const isMediumOrHigh = level === "Medium" || level === "Max Effort";
    const isHigh = level === "Max Effort";
    const fade = { transition: "opacity 0.3s" };

    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <rect x="1.5" y="8" width="2.5" height="4.5" rx="1" fill="currentColor" style={fade} opacity={1} />
            <rect x="5.75" y="5" width="2.5" height="7.5" rx="1" fill="currentColor" style={fade} opacity={isMediumOrHigh ? 1 : 0.3} />
            <rect x="10" y="2" width="2.5" height="10.5" rx="1" fill="currentColor" style={fade} opacity={isHigh ? 1 : 0.3} />
        </svg>
    );
}

// ----------------------------------------------------------------------
// Attachment Thumbnail
// ----------------------------------------------------------------------
function AttachmentThumb({ attachment, index, onRemove, onOpen, registerRef }) {
    const [isHovered, setIsHovered] = useState(false);
    const btnRef = useRef(null);

    return (
        <button
            ref={(el) => {
                btnRef.current = el;
                registerRef(attachment.id, el);
            }}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => {
                e.stopPropagation();
                if (btnRef.current) {
                    onOpen(attachment, btnRef.current.getBoundingClientRect());
                }
            }}
            style={{ animationDelay: `${index * 35}ms`, animationFillMode: "backwards" }}
            className="pi-thumb"
            aria-label={`Open preview of ${attachment.name}`}
        >
            <img src={attachment.url} alt={attachment.name} className="pi-thumb-img" draggable={false} />
            <span className={cx("pi-thumb-overlay", isHovered && "is-hovered")}>
                <span
                    role="button"
                    tabIndex={-1}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onClick={(e) => { e.stopPropagation(); onRemove(attachment.id); }}
                    className={cx("pi-thumb-remove", isHovered && "is-visible")}
                    aria-label={`Remove ${attachment.name}`}
                >
                    <CloseIcon />
                </span>
            </span>
        </button>
    );
}

// ----------------------------------------------------------------------
// Shared-Element Gallery Modal
// ----------------------------------------------------------------------
function AttachmentGalleryModal({ attachment, originRect, onClose }) {
    const [phase, setPhase] = useState("opening"); // "opening" | "open" | "closing"
    const [targetRect, setTargetRect] = useState(null);
    const imgRef = useRef(null);

    useEffect(() => {
        const maxW = Math.min(window.innerWidth * 0.86, 560);
        const maxH = Math.min(window.innerHeight * 0.78, 720);

        const naturalW = attachment.width || 800;
        const naturalH = attachment.height || 600;
        const scale = Math.min(maxW / naturalW, maxH / naturalH, 1.6);

        const width = naturalW * scale;
        const height = naturalH * scale;

        setTargetRect({
            top: (window.innerHeight - height) / 2,
            left: (window.innerWidth - width) / 2,
            width,
            height,
            radius: 20,
        });

        const raf = requestAnimationFrame(() => setPhase("open"));
        return () => cancelAnimationFrame(raf);
    }, [attachment]);

    const handleClose = useCallback(() => setPhase("closing"), []);

    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") handleClose(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [handleClose]);

    const isOpen = phase === "open";
    const isClosing = phase === "closing";

    const geometry = isOpen && targetRect
        ? targetRect
        : { top: originRect.top, left: originRect.left, width: originRect.width, height: originRect.height, radius: 12 };

    const animEasing = isClosing ? "ease-out" : "cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    const animDur = isClosing ? "0.3s" : "0.45s";
    const flipTransition = `top ${animDur} ${animEasing}, left ${animDur} ${animEasing}, width ${animDur} ${animEasing}, height ${animDur} ${animEasing}, border-radius ${animDur} ${animEasing}`;

    return (
        <div className="pi-modal" onClick={handleClose} role="dialog" aria-modal="true">
            <div className="pi-modal-backdrop" style={{ opacity: isOpen ? 1 : 0 }} />
            <div
                style={{
                    position: "fixed",
                    top: geometry.top,
                    left: geometry.left,
                    width: geometry.width,
                    height: geometry.height,
                    borderRadius: geometry.radius,
                    transition: flipTransition,
                    overflow: "hidden",
                    boxShadow: isOpen ? "0 24px 60px -12px rgb(0 0 0 / 0.35)" : "0 0px 0px 0px rgb(0 0 0 / 0)",
                }}
                className="pi-modal-frame"
                onTransitionEnd={() => { if (phase === "closing") onClose(); }}
                onClick={(e) => e.stopPropagation()}
            >
                <img ref={imgRef} src={attachment.url} alt={attachment.name} className="pi-modal-img" draggable={false} />
            </div>

            <button
                type="button"
                onClick={handleClose}
                style={{ opacity: isOpen ? 1 : 0, transform: isOpen ? "scale(1)" : "scale(0.7)" }}
                className={cx("pi-modal-close", !isOpen && "is-hidden")}
                aria-label="Close preview"
            >
                <span className="pi-modal-close-icon"><CloseIcon /></span>
            </button>
        </div>
    );
}

// ----------------------------------------------------------------------
// Main Component
//
// Props:
//   onSubmit(value, { model, effort, attachments })
//   placeholder, className
//   models: string[]      efforts: string[]
//   defaultValue, value, onChange   (controlled / uncontrolled)
//   maxAttachments: number
// ----------------------------------------------------------------------
export const PromptInput = React.forwardRef(
    (
        {
            onSubmit,
            placeholder = "Ask anything",
            className,
            models = ["GPT 5.5", "Opus 4.8", "Gemini 3.5 Flash", "Composer 2.5", "GLM 5.2"],
            efforts = ["Low", "Medium", "Max Effort"],
            defaultValue = "",
            value: controlledValue,
            onChange,
            maxAttachments = 6,
        },
        ref
    ) => {
        const [expanded, setExpanded] = useState(false);
        const [isSmoothResize, setIsSmoothResize] = useState(false);
        const [localValue, setLocalValue] = useState(defaultValue);
        const [selectedModel, setSelectedModel] = useState(models[0]);
        const [effortIndex, setEffortIndex] = useState(1);
        const [isModelSelectOpen, setIsModelSelectOpen] = useState(false);

        const [attachments, setAttachments] = useState([]);
        const [activeAttachment, setActiveAttachment] = useState(null);

        // Audio/Voice recording states
        const [isRecording, setIsRecording] = useState(false);
        const [audioData, setAudioData] = useState(new Array(5).fill(0));
        const valueRef = useRef(controlledValue !== undefined ? controlledValue : localValue);

        // Refs for Web Audio & Speech Recognition cleanup
        const streamRef = useRef(null);
        const audioContextRef = useRef(null);
        const rafRef = useRef(null);
        const recognitionRef = useRef(null);
        const demoIntervalRef = useRef(null);
        const demoTextIntervalRef = useRef(null);

        const [hoverStyle, setHoverStyle] = useState({ opacity: 0, transform: "translateY(0px) scale(0.95)", transition: "none" });
        const [containerHeight, setContainerHeight] = useState(116);
        const [textareaHeight, setTextareaHeight] = useState(68);
        const [isScrolling, setIsScrolling] = useState(false);

        const isControlled = controlledValue !== undefined;
        const value = isControlled ? controlledValue : localValue;
        const hasValue = value.trim() !== "" || attachments.length > 0;
        const hasAttachments = attachments.length > 0;

        const textareaRef = useRef(null);
        const internalContainerRef = useRef(null);
        const topFadeRef = useRef(null);
        const bottomFadeRef = useRef(null);
        const fileInputRef = useRef(null);
        const thumbRefs = useRef(new Map());

        // Sync value ref for audio callback closure
        useEffect(() => {
            valueRef.current = value;
        }, [value]);

        const updateFades = () => {
            const el = textareaRef.current;
            if (!el) return;
            const { scrollTop, scrollHeight, clientHeight } = el;
            if (topFadeRef.current) {
                topFadeRef.current.style.opacity = Math.min(scrollTop / 20, 1).toString();
            }
            if (bottomFadeRef.current) {
                const bottomScroll = scrollHeight - clientHeight - scrollTop;
                bottomFadeRef.current.style.opacity = Math.min(Math.max(bottomScroll - 16, 0) / 10, 1).toString();
            }
        };

        const handleValueChange = useCallback(
            (val) => {
                setIsSmoothResize(true);
                if (!isControlled) setLocalValue(val);
                onChange?.(val);
            },
            [isControlled, onChange]
        );

        const expand = () => {
            setIsSmoothResize(false);
            setExpanded(true);
        };

        // --- Voice Recording Logic ---
        const stopRecording = useCallback(() => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            if (demoIntervalRef.current) {
                window.clearInterval(demoIntervalRef.current);
                demoIntervalRef.current = null;
            }
            if (demoTextIntervalRef.current) {
                window.clearInterval(demoTextIntervalRef.current);
                demoTextIntervalRef.current = null;
            }
            setIsRecording(false);
            setAudioData(new Array(5).fill(0));
        }, []);

        const startRecording = useCallback(async () => {
            setIsSmoothResize(false);
            setExpanded(true);

            let stream = null;
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                }
            } catch (err) {
                console.warn("Microphone access denied or unavailable. Falling back to simulated voice mode for demo.");
            }

            setIsRecording(true);

            // Simulation function for tight sandbox environments
            function simulateText() {
                const fakeText = "Can you build a high fidelity Framer Motion layout animation for a dark mode dashboard?";
                const words = fakeText.split(" ");
                let i = 0;
                let currentBase = valueRef.current;
                demoTextIntervalRef.current = window.setInterval(() => {
                    if (i < words.length) {
                        currentBase = (currentBase ? currentBase + " " : "") + words[i];
                        handleValueChange(currentBase);
                        i++;
                    } else {
                        stopRecording();
                    }
                }, 300);
            }

            if (stream) {
                streamRef.current = stream;

                // Setup Web Audio API for visualizer
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                const audioCtx = new AudioCtx();
                audioContextRef.current = audioCtx;

                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 64;
                const source = audioCtx.createMediaStreamSource(stream);
                source.connect(analyser);

                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                const updateVisualizer = () => {
                    analyser.getByteFrequencyData(dataArray);
                    const bands = new Array(5).fill(0);
                    const step = Math.floor(dataArray.length / 5);
                    for (let i = 0; i < 5; i++) {
                        let sum = 0;
                        for (let j = 0; j < step; j++) {
                            sum += dataArray[i * step + j];
                        }
                        bands[i] = sum / step / 255; // normalize to 0-1
                    }
                    setAudioData(bands);
                    rafRef.current = requestAnimationFrame(updateVisualizer);
                };
                updateVisualizer();

                // Setup Speech Recognition
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (SpeechRecognition) {
                    const recognition = new SpeechRecognition();
                    recognition.continuous = true;
                    recognition.interimResults = true;

                    let baseline = valueRef.current;

                    recognition.onresult = (event) => {
                        let interimTranscript = "";
                        let finalTranscript = "";

                        for (let i = event.resultIndex; i < event.results.length; ++i) {
                            if (event.results[i].isFinal) {
                                finalTranscript += event.results[i][0].transcript;
                            } else {
                                interimTranscript += event.results[i][0].transcript;
                            }
                        }

                        if (finalTranscript) {
                            baseline += (baseline ? " " : "") + finalTranscript;
                        }

                        handleValueChange((baseline + (interimTranscript ? " " + interimTranscript : "")).trim());
                    };

                    recognition.onerror = (e) => {
                        console.error("Speech recognition error", e);
                        stopRecording();
                    };

                    recognition.onend = () => {
                        stopRecording();
                    };

                    recognitionRef.current = recognition;
                    recognition.start();
                } else {
                    console.warn("Speech Recognition API not supported in this browser. Using simulated text.");
                    simulateText();
                }
            } else {
                // Fallback simulated visualizer
                demoIntervalRef.current = window.setInterval(() => {
                    setAudioData(Array.from({ length: 5 }, () => Math.random() * 0.8 + 0.1));
                }, 100);
                simulateText();
            }
        }, [handleValueChange, stopRecording]);

        // Keep textarea auto-scrolled to bottom while recording
        useEffect(() => {
            if (isRecording && textareaRef.current) {
                textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
            }
        }, [value, isRecording]);

        // Ensure cleanup of mic/streams on unmount
        useEffect(() => {
            return () => {
                stopRecording();
                attachments.forEach((a) => URL.revokeObjectURL(a.url));
            };
        }, [stopRecording, attachments]);

        useEffect(() => {
            if ((value.trim() !== "" || hasAttachments) && !expanded) {
                setIsSmoothResize(false);
                setExpanded(true);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [value, expanded, hasAttachments]);

        useEffect(() => {
            if (expanded && !isRecording) {
                const timer = setTimeout(() => {
                    if (textareaRef.current) {
                        textareaRef.current.focus();
                        const length = textareaRef.current.value.length;
                        textareaRef.current.setSelectionRange(length, length);
                    }
                }, 50);
                return () => clearTimeout(timer);
            }
        }, [expanded, isRecording]);

        // ONLY updates height on value/text change. Adding attachments leaves this completely isolated.
        useEffect(() => {
            if (!textareaRef.current) return;
            const el = textareaRef.current;

            const currentHeight = el.style.height;
            el.style.transition = "none";
            el.style.height = "0px";
            const scrollHeight = el.scrollHeight;
            el.style.height = currentHeight;
            void el.offsetHeight;
            el.style.transition = "";

            const newHeight = Math.max(68, Math.min(scrollHeight, 160));
            el.style.height = `${newHeight}px`;

            setTextareaHeight(newHeight);
            setIsScrolling(scrollHeight > 160);

            setTimeout(updateFades, 0);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [value, expanded]);

        useEffect(() => {
            setContainerHeight(Math.max(116, textareaHeight + 48));
            setTimeout(updateFades, 0);
        }, [textareaHeight]);

        useEffect(() => {
            if (!isModelSelectOpen) return;
            const handleOutsideClick = (e) => {
                if (internalContainerRef.current && !internalContainerRef.current.contains(e.target)) {
                    setIsModelSelectOpen(false);
                }
            };
            document.addEventListener("mousedown", handleOutsideClick);
            return () => document.removeEventListener("mousedown", handleOutsideClick);
        }, [isModelSelectOpen]);

        const handleBlur = (e) => {
            if (internalContainerRef.current && internalContainerRef.current.contains(e.relatedTarget)) return;
            if (value.trim() === "" && !hasAttachments && !isRecording) {
                setIsSmoothResize(false);
                setExpanded(false);
                setIsModelSelectOpen(false);
            }
        };

        const handleSubmit = () => {
            if (value.trim() === "" && !hasAttachments) return;
            setIsSmoothResize(false);
            onSubmit?.(value, {
                model: selectedModel,
                effort: efforts[effortIndex],
                attachments: attachments.map((a) => a.file),
            });
            handleValueChange("");
            attachments.forEach((a) => URL.revokeObjectURL(a.url));
            setAttachments([]);
            setExpanded(false);
            setIsModelSelectOpen(false);
        };

        const cycleEffort = (e) => {
            e.stopPropagation();
            setEffortIndex((prev) => (prev + 1) % efforts.length);
        };

        const openFileChooser = (e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
        };

        const addAttachment = (file, url, width, height) => {
            const id = `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`;
            setAttachments((prev) => [...prev, { id, file, url, name: file.name, width, height }]);
        };

        const handleFilesChosen = async (e) => {
            const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
            e.target.value = "";

            if (files.length === 0) return;
            const room = Math.max(0, maxAttachments - attachments.length);
            const accepted = files.slice(0, room);

            if (!expanded) {
                setIsSmoothResize(false);
                setExpanded(true);
            } else {
                setIsSmoothResize(true);
            }

            for (const file of accepted) {
                const url = URL.createObjectURL(file);
                const img = new Image();
                img.onload = () => addAttachment(file, url, img.naturalWidth, img.naturalHeight);
                img.onerror = () => addAttachment(file, url, 800, 600);
                img.src = url;
            }
        };

        const removeAttachment = (id) => {
            setIsSmoothResize(true);
            setAttachments((prev) => {
                const target = prev.find((a) => a.id === id);
                if (target) URL.revokeObjectURL(target.url);
                return prev.filter((a) => a.id !== id);
            });
            thumbRefs.current.delete(id);
        };

        // Calculate action button states
        const showArrow = hasValue && !isRecording;
        const showStop = isRecording;
        const showMic = !hasValue && !isRecording;

        const onActionButtonClick = (e) => {
            e.preventDefault();
            if (isRecording) {
                stopRecording();
            } else if (hasValue) {
                handleSubmit();
            } else {
                startRecording();
            }
        };

        return (
            <>
                {/* Outer Wrapper for positioning and max-width scaling */}
                <div
                    ref={(node) => {
                        if (typeof ref === "function") ref(node);
                        else if (ref) ref.current = node;
                        internalContainerRef.current = node;
                    }}
                    onBlur={handleBlur}
                    className={cx("pi-wrap", className)}
                    style={{
                        maxWidth: expanded ? 480 : 320,
                        transition: isSmoothResize
                            ? "max-width 0.15s ease-out"
                            : "max-width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFilesChosen}
                        className="pi-file-input"
                        tabIndex={-1}
                        aria-hidden="true"
                    />

                    {/* Independent Attachment Tab (Slides up from behind the prompt input) */}
                    <div
                        aria-hidden={!hasAttachments}
                        style={{
                            height: hasAttachments && expanded ? 68 : 0,
                            transition: isSmoothResize
                                ? "height 0.15s ease-out"
                                : "height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                        }}
                        className="pi-tab-clip"
                    >
                        <div
                            style={{
                                transform: hasAttachments && expanded ? "translateY(0)" : "translateY(100%)",
                                opacity: hasAttachments && expanded ? 1 : 0,
                                transition: isSmoothResize
                                    ? "transform 0.15s ease-out, opacity 0.15s ease-out"
                                    : "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease-out",
                            }}
                            className="pi-tab pi-scrollbar"
                        >
                            {attachments.map((attachment, index) => (
                                <AttachmentThumb
                                    key={attachment.id}
                                    attachment={attachment}
                                    index={index}
                                    onRemove={removeAttachment}
                                    onOpen={(a, rect) => setActiveAttachment({ attachment: a, rect })}
                                    registerRef={(id, el) => thumbRefs.current.set(id, el)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Main Input Card */}
                    <div
                        onMouseDown={(e) => {
                            const isTextarea = e.target === textareaRef.current;
                            if (expanded && !isTextarea && !isRecording) {
                                e.preventDefault();
                                textareaRef.current?.focus();
                            }
                        }}
                        style={{
                            height: expanded ? containerHeight : 48,
                            transition: isSmoothResize ? SMOOTH_HEIGHT_TRANSITION : SPRING_TRANSITION,
                            overflow: expanded ? "visible" : "hidden",
                        }}
                        className={cx("pi-card", expanded && "is-expanded")}
                    >
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => handleValueChange(e.target.value)}
                            onScroll={updateFades}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                                if (e.key === "Escape" && value.trim() === "" && !hasAttachments) {
                                    setIsSmoothResize(false);
                                    setExpanded(false);
                                    setIsModelSelectOpen(false);
                                }
                            }}
                            placeholder={placeholder}
                            aria-label="Prompt"
                            disabled={isRecording}
                            style={{
                                transition: isSmoothResize
                                    ? "height 0.15s ease-out"
                                    : "opacity 0.3s ease-out, transform 0.3s ease-out, height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                            }}
                            className={cx(
                                "pi-textarea pi-scrollbar",
                                !expanded && "is-collapsed",
                                isScrolling && "is-scrolling",
                                isRecording && "is-recording"
                            )}
                        />

                        <div ref={topFadeRef} className="pi-fade pi-fade--top" style={{ opacity: 0 }} />
                        <div
                            ref={bottomFadeRef}
                            className="pi-fade pi-fade--bottom"
                            style={{
                                opacity: 0,
                                top: `${textareaHeight - 32}px`,
                                transition: isSmoothResize ? "top 0.15s ease-out" : "top 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                            }}
                        />

                        <button
                            type="button"
                            onClick={expand}
                            style={{ transition: isSmoothResize ? "none" : "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}
                            className={cx("pi-placeholder", expanded && "is-hidden")}
                            aria-label="Open prompt input"
                        >
                            {placeholder}
                        </button>

                        {/* Bottom Actions - hidden while recording to make room for the visualizer */}
                        <div className={cx("pi-actions", !(expanded && !isRecording) && "is-hidden")}>
                            <div className="pi-model-wrap">
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsModelSelectOpen((prev) => !prev);
                                    }}
                                    className={cx("pi-pill", isModelSelectOpen && "is-open")}
                                    aria-label={`Select model. Current: ${selectedModel}`}
                                >
                                    <ModelIcon model={selectedModel} />
                                    <span className="pi-pill-label">
                                        <MorphingText text={selectedModel} />
                                    </span>
                                </button>

                                <div
                                    style={{ transformOrigin: "bottom left" }}
                                    onMouseLeave={() => {
                                        setHoverStyle((prev) => ({
                                            ...prev,
                                            opacity: 0,
                                            transform: prev.transform.replace("scale(1)", "scale(0.95)"),
                                            transition: "opacity 0.2s ease-in, transform 0.2s ease-out",
                                        }));
                                    }}
                                    className={cx("pi-menu", isModelSelectOpen && "is-open")}
                                >
                                    <div className="pi-menu-list">
                                        <div style={hoverStyle} className="pi-menu-hover" />
                                        {models.map((model, idx) => (
                                            <button
                                                key={model}
                                                type="button"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onMouseEnter={() => {
                                                    setHoverStyle((prev) => ({
                                                        opacity: 1,
                                                        transform: `translateY(${idx * 34}px) scale(1)`,
                                                        transition:
                                                            prev.opacity === 0
                                                                ? "opacity 0.15s ease-out"
                                                                : "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.15s ease",
                                                    }));
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedModel(model);
                                                    setIsModelSelectOpen(false);
                                                }}
                                                className="pi-menu-item"
                                            >
                                                <span className="pi-menu-item-inner">
                                                    <ModelIcon model={model} />
                                                    {model}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={cycleEffort}
                                className="pi-pill"
                            >
                                <DynamicBarsIcon level={efforts[effortIndex]} />
                                <span className="pi-pill-label">
                                    <MorphingText text={efforts[effortIndex]} />
                                </span>
                            </button>

                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={openFileChooser}
                                disabled={attachments.length >= maxAttachments}
                                aria-label="Attach images"
                                className="pi-plus"
                            >
                                <PlusIcon />
                            </button>
                        </div>

                        {/* Audio wave visualizer, sits to the left of the mic button */}
                        <div className={cx("pi-wave", isRecording && "is-active")}>
                            {audioData.map((val, i) => (
                                <div key={i} className="pi-wave-bar" style={{ height: `${Math.max(4, val * 24)}px` }} />
                            ))}
                        </div>

                        <button
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onClick={onActionButtonClick}
                            aria-label={showArrow ? "Send prompt" : showStop ? "Stop recording" : "Use voice input"}
                            className="pi-action"
                        >
                            <span className="pi-action-inner">
                                <span className={cx("pi-action-icon", showArrow && "is-active")}>
                                    <ArrowUpIcon />
                                </span>
                                <span className={cx("pi-action-icon pi-action-icon--mic", showMic && "is-active")}>
                                    <MicIcon />
                                </span>
                                <span className={cx("pi-action-icon", showStop && "is-active")}>
                                    <StopIcon />
                                </span>
                            </span>
                        </button>
                    </div>
                </div>

                {activeAttachment && (
                    <AttachmentGalleryModal
                        attachment={activeAttachment.attachment}
                        originRect={activeAttachment.rect}
                        onClose={() => setActiveAttachment(null)}
                    />
                )}
            </>
        );
    }
);

PromptInput.displayName = "PromptInput";