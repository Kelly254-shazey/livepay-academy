from fastapi import APIRouter, Query, Request


router = APIRouter(prefix="/rankings", tags=["rankings"])


@router.get("/trending-creators")
async def trending_creators(
    request: Request, limit: int = Query(default=10, ge=1, le=50)
):
    return await request.app.state.ranking_service.trending_creators(limit)


@router.get("/trending-categories")
async def trending_categories(
    request: Request, limit: int = Query(default=10, ge=1, le=50)
):
    return await request.app.state.ranking_service.trending_categories(limit)


@router.get("/trending-lives")
async def trending_lives(
    request: Request, limit: int = Query(default=10, ge=1, le=50)
):
    return await request.app.state.ranking_service.trending_lives(limit)

