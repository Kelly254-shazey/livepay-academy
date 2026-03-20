from fastapi import APIRouter, HTTPException, Query, Request


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard-summary")
async def dashboard_summary(request: Request):
    return await request.app.state.analytics_service.dashboard_summary()


@router.get("/top-categories")
async def top_categories(
    request: Request, limit: int = Query(default=10, ge=1, le=50)
):
    return await request.app.state.analytics_service.top_categories(limit)


@router.get("/top-creators")
async def top_creators(
    request: Request, limit: int = Query(default=10, ge=1, le=50)
):
    return await request.app.state.analytics_service.top_creators(limit)


@router.get("/trending-lives")
async def trending_lives(
    request: Request, limit: int = Query(default=10, ge=1, le=50)
):
    return await request.app.state.analytics_service.trending_lives(limit)


@router.get("/job-runs")
async def recent_job_runs(
    request: Request, limit: int = Query(default=20, ge=1, le=100)
):
    return await request.app.state.analytics_service.recent_job_runs(limit)


@router.get("/creator-insights/{creator_id}")
async def creator_insights(request: Request, creator_id: str):
    payload = await request.app.state.analytics_service.creator_insights(creator_id)
    if payload is None:
        raise HTTPException(status_code=404, detail="Creator not found.")
    return payload
