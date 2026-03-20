from fastapi import APIRouter, Query, Request

from app.schemas.recommendations import RecommendationRequest


router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.post("/users/{user_id}")
async def recommend_for_user(
    user_id: str, request_body: RecommendationRequest, request: Request
):
    return await request.app.state.recommendation_service.recommend_for_user(
        user_id, request_body.include, request_body.limit
    )


@router.get("/creators")
async def recommend_creators(
    request: Request, limit: int = Query(default=10, ge=1, le=50)
):
    payload = await request.app.state.recommendation_service.recommend_for_user(
        "global-creators", ["creators"], limit
    )
    return payload.results["creators"]


@router.get("/lives")
async def recommend_lives(
    request: Request, limit: int = Query(default=10, ge=1, le=50)
):
    payload = await request.app.state.recommendation_service.recommend_for_user(
        "global-lives", ["lives"], limit
    )
    return payload.results["lives"]


@router.get("/content")
async def recommend_content(
    request: Request, limit: int = Query(default=10, ge=1, le=50)
):
    payload = await request.app.state.recommendation_service.recommend_for_user(
        "global-content", ["content"], limit
    )
    return payload.results["content"]


@router.get("/classes")
async def recommend_classes(
    request: Request, limit: int = Query(default=10, ge=1, le=50)
):
    payload = await request.app.state.recommendation_service.recommend_for_user(
        "global-classes", ["classes"], limit
    )
    return payload.results["classes"]

