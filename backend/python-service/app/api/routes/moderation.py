from fastapi import APIRouter, Request

from app.schemas.moderation import ContentAnalysisRequest


router = APIRouter(prefix="/moderation", tags=["moderation"])


@router.post("/analyze-content")
async def analyze_content(request_body: ContentAnalysisRequest, request: Request):
    return request.app.state.moderation_service.analyze_content(request_body)

