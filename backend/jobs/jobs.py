import os
import time
import requests

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Query, Response
from schemas.schema import job_titles, Company, Location, Job, JobsResponse
from config import REDIS_CLIENT

load_dotenv()

APP_ID = os.getenv("APP_ID")
APP_KEY = os.getenv("APP_KEY")

BASE_URL = "https://api.adzuna.com/v1/api/jobs/in/search/1"
DETAILS_URL = "https://api.adzuna.com/v1/api/jobs/in/details"

job_router = APIRouter(tags=["Jobs API"])

CACHE_EXPIRATION_SECONDS = 3600


def _job_from_adzuna(job_data):
    company_data = job_data.get("company") or {}
    location_data = job_data.get("location") or {}

    return Job(
        id=job_data.get("id"),
        title=job_data.get("title"),
        company=Company(display_name=company_data.get("display_name")),
        location=Location(display_name=location_data.get("display_name")),
        description=job_data.get("description"),
        salary_min=job_data.get("salary_min"),
        salary_max=job_data.get("salary_max"),
        contract_type=job_data.get("contract_type"),
        contract_time=job_data.get("contract_time"),
        created=job_data.get("created"),
        redirect_url=job_data.get("redirect_url"),
    )


@job_router.get("/jobs", response_model=JobsResponse)
async def get_jobs(job_type: str = Query(default="software_engineering")):

    start_time = time.perf_counter()

    # Validate job category
    if job_type not in job_titles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid job category. Available categories: {list(job_titles.keys())}",
        )

    # Create category-specific Redis cache key
    redis_cache_key = f"adzuna_jobs:{job_type}"

    # Check Redis cache
    cached_jobs = REDIS_CLIENT.get(redis_cache_key)

    if cached_jobs:
        print(f"🚀 Serving {job_type} jobs from Redis!")
        return Response(content=cached_jobs, media_type="application/json")

    all_jobs = []

    # Fetch jobs for each title in the selected category
    for title in job_titles[job_type]:

        params = {
            "app_id": APP_ID,
            "app_key": APP_KEY,
            "results_per_page": 10,
            "what": title,
            "max_days_old": 1,
            "sort_by": "date",
        }

        try:
            response = requests.get(BASE_URL, params=params, timeout=15)

            if response.status_code != 200:
                print(f"❌ Error for {title}: {response.status_code}")
                continue

            data = response.json()

            print(f"✅ {title}: Found {data.get('count', 0)} jobs")

            for job in data.get("results", []):

                all_jobs.append(_job_from_adzuna(job))

        except requests.RequestException as e:
            print(f"❌ Request failed for {title}: {e}")

        time.sleep(1.5)

    # Remove duplicate jobs
    unique_jobs = {job.id: job for job in all_jobs if job.id is not None}

    final_jobs = list(unique_jobs.values())

    # Create response
    result = JobsResponse(total_jobs=len(final_jobs), jobs=final_jobs)

    json_data = result.model_dump_json(indent=2)

    # Store results in Redis
    REDIS_CLIENT.setex(redis_cache_key, CACHE_EXPIRATION_SECONDS, json_data)

    print(f"💾 Cached {len(final_jobs)} jobs for {job_type}")

    end_time = time.perf_counter()

    total_time = end_time - start_time

    print(f"⏱️ Total API execution time: {total_time:.4f} seconds")

    return Response(content=json_data, media_type="application/json")


@job_router.get("/jobs/{job_id}", response_model=Job)
async def get_job(job_id: str):
    redis_cache_key = f"adzuna_job:{job_id}"
    cached_job = REDIS_CLIENT.get(redis_cache_key)

    if cached_job:
        return Response(content=cached_job, media_type="application/json")

    # Reuse an existing category cache when possible; never fetch every category.
    for cached_job_type in job_titles:
        cached_jobs = REDIS_CLIENT.get(f"adzuna_jobs:{cached_job_type}")
        if not cached_jobs:
            continue

        jobs_response = JobsResponse.model_validate_json(cached_jobs)
        job = next((item for item in jobs_response.jobs if item.id == job_id), None)
        if job:
            json_data = job.model_dump_json()
            REDIS_CLIENT.setex(redis_cache_key, CACHE_EXPIRATION_SECONDS, json_data)
            return Response(content=json_data, media_type="application/json")

    if not APP_ID or not APP_KEY:
        raise HTTPException(
            status_code=503,
            detail="Job details are unavailable because the jobs API is not configured.",
        )

    try:
        response = requests.get(
            f"{DETAILS_URL}/{job_id}",
            params={"app_id": APP_ID, "app_key": APP_KEY},
            timeout=15,
        )
    except requests.RequestException as error:
        raise HTTPException(
            status_code=502, detail="Unable to contact the jobs provider."
        ) from error

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Job not found.")
    if response.status_code != 200:
        raise HTTPException(
            status_code=502, detail="The jobs provider could not return job details."
        )

    try:
        job_data = response.json()
        if not isinstance(job_data, dict):
            raise ValueError("The jobs provider returned an invalid response.")
        job = _job_from_adzuna(job_data)
    except (ValueError, TypeError, AttributeError) as error:
        raise HTTPException(
            status_code=502, detail="The jobs provider returned invalid job details."
        ) from error

    if job.id is None or str(job.id) != job_id:
        raise HTTPException(status_code=404, detail="Job not found.")

    json_data = job.model_dump_json()
    REDIS_CLIENT.setex(redis_cache_key, CACHE_EXPIRATION_SECONDS, json_data)
    return Response(content=json_data, media_type="application/json")
