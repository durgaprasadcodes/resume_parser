from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_postgres import PGVector
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from schemas.schema import Resume
import os
import json

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PGVECTOR_DATABASE_API_KEY = os.getenv("PGVECTOR_DATABASE_API_KEY")


SYSTEM_PROMPT = """You are an expert ATS/HR analyst. Compare the resume to the Job Description (JD) and fill the required structured output. Use only evidence in the resume and requirements in the JD. Never invent experience, skills, projects, certifications or achievements.

ATS SCORE (integer 0-100): strict, evidence-based, deterministic. Same resume + same JD must always give the same score; no subjective impressions.
Rubric: required skills/technologies 30 (required > preferred; no points for unsupported skills); responsibility alignment 20; project relevance 20 (depth, deployment, scale, outcomes; no extra points for many projects on the same tech); experience alignment 15 (education is NOT experience; none relevant = 0 points); education/certifications 10 (only JD-relevant); keyword alignment 5 (needs evidence of real use; no keyword-stuffing credit).
Bands: 90-100 exceptional; 80-89 strong; 70-79 moderate; 60-69 limited; 40-59 poor; 0-39 very poor.
Do not inflate for a generally impressive resume. Do not penalize absence of things the JD does not require or prefer.

SKILLS: matched = JD skills the resume clearly shows; unmatched = important JD skills not explicitly shown or implied.

NEGATIVES (critical but fair; each item states WHAT is wrong, WHY it matters for this role, WHAT to change; no generic advice; every point grounded in resume/JD evidence; distinguish a real deficiency from something merely unmentioned). Check: JD requirement/responsibility gaps; skills listed but never demonstrated; summary misaligned, vague or missing JD strengths; low-relevance projects and why; repetitive projects (e.g. several regression ML projects) and missing categories (classification, NLP, CV, RAG/LLM, backend, cloud, real-time, data engineering) only if the repetition is actually present; suspicious or unvalidated metrics (very high R2/accuracy without methodology) as a potential concern for overfitting/leakage, never asserted as fact; shallow/tutorial-like projects and missing engineering details (deployment, testing, auth, scalability, DB/API design, CI/CD, cloud); no or unrelated or poorly described professional experience (never count education as experience); generic/outdated certifications (do not penalize one only for not being in the JD); vague wording, weak verbs, missing measurable outcomes; missing JD terms that could truthfully be added, keyword stuffing.

POSITIVES (specific, resume-based, explain WHY each strengthens the application; do not just list keywords): JD-aligned skills shown in projects/experience; summary alignment; relevant projects (complexity, deployment, APIs, databases, ML/AI, cloud) and credible metrics; useful project diversity; relevant experience; relevant certifications; credibility evidence (deployed apps, measurable outcomes, production-like architecture); ATS/recruiter value.

LENGTH LIMITS (keep the response compact and always complete): at most 6 negatives and 5 positives, each at most 2 sentences; project_value at most 2 sentences; empty list when there is no work experience. Respond only with the structured output."""


demo_job_description = """
    As a Machine Learning intern at NayePankh Foundation, you will have the opportunity to apply your expertise in Machine Learning, Python, Data Analytics, R Programming, Data Science, Natural Language Processing (NLP), Deep Learning, and Artificial Intelligence to drive innovative solutions in the field of education. Your responsibilities will include:

1. Developing and implementing machine learning models to enhance educational tools and resources.
2. Conducting data analysis to gain insights into student learning patterns and behavior.
3. Collaborating with cross-functional teams to integrate machine learning capabilities into existing systems.
4. Utilizing NLP techniques to improve communication and interaction with students and teachers.
5. Exploring deep learning algorithms to optimize educational content delivery and personalization.
6. Contributing to the research and development of AI-driven solutions for educational challenges.
7. Assisting in the design and execution of experiments to evaluate the effectiveness of machine learning solutions in educational settings.

Join us at NayePankh Foundation and make a meaningful impact on the future of education through advanced machine learning technologies.
Skill(s) required
Artificial intelligence
Data Analytics
Data Science
Deep Learning
Machine Learning
Natural Language Processing (NLP)
Python
R Programming

"""


def docs_to_text(docs) -> str:

    if isinstance(docs, str):
        return docs
    return "\n".join(d.page_content for d in docs)


def split_documents(file_path):

    loader = PyMuPDFLoader(file_path)
    document = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=75)
    chunks = splitter.split_documents(document)

    return chunks


def analyze_resume_vs_jd_groq(structured_llm, resume_text, jd_text: str) -> Resume:

    system_prompt = SYSTEM_PROMPT
    system_prompt += (
        "\n\nReturn ONLY a JSON object matching this JSON schema:\n"
        + json.dumps(Resume.model_json_schema())
    )

    messages = [
        ("system", system_prompt),
        (
            "human",
            f"JOB DESCRIPTION:\n{jd_text}\n\nRESUME TEXT:\n{docs_to_text(resume_text)}",
        ),
    ]
    result = structured_llm.invoke(messages)
    return json.dumps(result.model_dump(), indent=2)


# --------------------------- usage in bot.py ---------------------------


LLM = ChatGroq(
    model="qwen/qwen3.8-27b",
    temperature=0.3,
    max_retries=5,
    api_key=GROQ_API_KEY,
)

embedding_model = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-2", api_key=GEMINI_API_KEY
)

resume_text = split_documents(
    r"C:\Users\rolex\OneDrive\Desktop\Placements\Durga_Prasad_Kota_Resume.pdf"
)

result = analyze_resume_vs_jd_groq(
    LLM.with_structured_output(Resume), resume_text, demo_job_description
)

print(result)
