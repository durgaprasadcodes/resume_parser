import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { use, useEffect, useState } from "react";

export default function Analysis() {
    const [llmResponse, SetLLmResponse] = useState("")
    return <ReactMarkdown remarkPlugins={[remarkGfm]}>{llmResponse}</ReactMarkdown>;
}