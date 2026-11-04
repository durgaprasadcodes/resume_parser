import os
import time
import requests
from google import genai
from dotenv import load_dotenv
from google.genai import types
from fastapi import APIRouter, HTTPException, Query, Response

from schemas.schema import job_titles, Company, Location, Job, JobsResponse

from config import REDIS_CLIENT

load_dotenv()

SERPAPI_KEY = os.getenv("SERPAPI_KEY")

BASE_URL = "https://serpapi.com/search.json"

job_router = APIRouter(tags=["Jobs API"])

CACHE_EXPIRATION_SECONDS = 3600

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=GEMINI_API_KEY)


# -----------------------------------------
# Convert SerpApi response into Job schema
# -----------------------------------------


def _job_from_serpapi(job_data):

    detected = job_data.get("detected_extensions") or {}
    company_name = job_data.get("company_name")
    location = job_data.get("location")

    apply_options = job_data.get("apply_options") or []

    redirect_url = apply_options[0].get("link") if apply_options else None

    return Job(
        id=job_data.get("job_id"),
        title=job_data.get("title"),
        company=Company(display_name=company_name),
        location=Location(display_name=location),
        description=job_data.get("description"),
        contract_type=detected.get("schedule_type"),
        created=detected.get("posted_at"),
        redirect_url=redirect_url,
    )


# -----------------------------------------
# GET ALL JOBS
# -----------------------------------------


@job_router.get("/jobs", response_model=JobsResponse)
async def get_jobs(job_type: str = Query(default="software_engineering")):

    start_time = time.perf_counter()

    # Validate category
    if job_type not in job_titles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid job category. Available categories: {list(job_titles.keys())}",
        )

    if not SERPAPI_KEY:
        raise HTTPException(
            status_code=503, detail="SerpApi API key is not configured."
        )

    # Redis cache
    redis_cache_key = f"serpapi_jobs:{job_type}"

    cached_jobs = REDIS_CLIENT.get(redis_cache_key)

    if cached_jobs:
        print(f"🚀 Serving {job_type} jobs from Redis!")

        return Response(content=cached_jobs, media_type="application/json")

    all_jobs = []

    # Search each title
    for title in job_titles[job_type]:

        params = {
            "engine": "google_jobs",
            "q": title,
            "location": "India",
            "gl": "in",
            "hl": "en",
            "api_key": SERPAPI_KEY,
        }

        try:

            response = requests.get(BASE_URL, params=params, timeout=20)

            if response.status_code != 200:
                print(f"❌ SerpApi error for {title}: " f"{response.status_code}")
                continue

            data = response.json()

            if data.get("error"):
                print(f"❌ SerpApi: {data['error']}")
                continue

            jobs = data.get("jobs_results", [])

            print(f"✅ {title}: Found {len(jobs)} jobs")

            for job_data in jobs:

                try:
                    job = _job_from_serpapi(job_data)

                    if job.id:
                        all_jobs.append(job)

                except (ValueError, TypeError, AttributeError) as error:
                    print(f"⚠️ Invalid job data: {error}")

        except requests.RequestException as error:

            print(f"❌ Request failed for {title}: {error}")

    # Remove duplicates
    unique_jobs = {str(job.id): job for job in all_jobs if job.id is not None}

    final_jobs = list(unique_jobs.values())

    # Create response
    result = JobsResponse(total_jobs=len(final_jobs), jobs=final_jobs)

    json_data = result.model_dump_json(indent=2)

    # Cache category results
    REDIS_CLIENT.setex(redis_cache_key, CACHE_EXPIRATION_SECONDS, json_data)

    print(f"💾 Cached {len(final_jobs)} jobs for {job_type}")

    total_time = time.perf_counter() - start_time

    print(f"⏱️ Total execution time: {total_time:.4f} seconds")

    return Response(content=json_data, media_type="application/json")


# -----------------------------------------
# GET SINGLE JOB
# -----------------------------------------


@job_router.get("/jobs/{job_id}", response_model=Job)
async def get_job(job_id: str):

    redis_cache_key = f"serpapi_job_details:{job_id}"

    # Cache only detailed responses; search results may contain a shortened description.
    cached_job = REDIS_CLIENT.get(redis_cache_key)

    if cached_job:

        print("🚀 Serving job details from Redis!")

        return Response(content=cached_job, media_type="application/json")

    if not SERPAPI_KEY:
        raise HTTPException(
            status_code=503, detail="SerpApi API key is not configured."
        )

    # Fetch the full job posting rather than searching by the job ID as a query.
    params = {
        "engine": "google_jobs_listing",
        "job_id": job_id,
        "api_key": SERPAPI_KEY,
        "hl": "en",
        "gl": "in",
    }

    try:

        response = requests.get(BASE_URL, params=params, timeout=20)

        if response.status_code != 200:
            raise HTTPException(
                status_code=502, detail="Unable to retrieve job listing from SerpApi."
            )

        data = response.json()

        if data.get("error"):
            raise HTTPException(status_code=404, detail="Job listing not found.")

    except requests.RequestException as error:

        raise HTTPException(
            status_code=502, detail="Unable to contact SerpApi."
        ) from error

    job_data = data.get("job_results")

    if not isinstance(job_data, dict):
        raise HTTPException(status_code=404, detail="Job listing not found.")

    job_data.setdefault("job_id", job_id)
    try:
        job = _job_from_serpapi(job_data)
    except (ValueError, TypeError, AttributeError) as error:
        raise HTTPException(
            status_code=502, detail="SerpApi returned invalid job details."
        ) from error

    if not job.description:
        raise HTTPException(
            status_code=404,
            detail="The full description is no longer available for this job.",
        )

    json_data = job.model_dump_json()
    REDIS_CLIENT.setex(redis_cache_key, CACHE_EXPIRATION_SECONDS, json_data)

    return Response(content=json_data, media_type="application/json")


@job_router.get("/get_ats_score")
async def get_ats_score(resume: str, job_description: str) -> str:
    """Sends the resume and a single JD to Gemini, enforcing a pure numeric response."""

    prompt = f"""
    You are an automated Applicant Tracking System (ATS) parser. 
    Analyze the following Resume against the Job Description provided.
    Calculate a match score from 0 to 100 based on keyword density, skills alignment, and experience match.
    
    CRITICAL INSTRUCTION: Return ONLY the raw number. Do not include any intro, markdown formatting, symbols like '%', explanations, or spaces. If the score is 85, your entire output must just be: 85

    RESUME:
    {resume}

    JOB DESCRIPTION:
    {job_description}
    """

    try:
        # Using gemini-2.5-flash for rapid, cost-efficient bulk processing
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.0,  # Zero temperature ensures strict adherence and less variability
            ),
        )
        return response.text.strip()
    except Exception as e:
        return f"Error: {str(e)}"
