from fastapi import APIRouter, Request

from app.schemas.fraud import RiskScoreRequest


router = APIRouter(prefix="/fraud", tags=["fraud"])


@router.post("/score-transaction")
async def score_transaction(request_body: RiskScoreRequest, request: Request):
    return request.app.state.fraud_service.score_transaction(request_body)


@router.post("/score-payout")
async def score_payout(request_body: RiskScoreRequest, request: Request):
    return request.app.state.fraud_service.score_payout(request_body)


@router.post("/score-account")
async def score_account(request_body: RiskScoreRequest, request: Request):
    return request.app.state.fraud_service.score_account(request_body)
