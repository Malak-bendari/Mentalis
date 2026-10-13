from typing import Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps
from app.services.ai_service import ai_service

router = APIRouter()

@router.post("/breakdown", response_model=List[schemas.SubtaskCreate])
async def generate_breakdown(
    *,
    assignment_in: schemas.AssignmentCreate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Generate subtasks for an assignment using AI.
    """
    plan = await ai_service.generate_assignment_plan(
        assignment_title=assignment_in.title,
        assignment_description=assignment_in.description,
    )
    return [
        schemas.SubtaskCreate(
            title=step["title"],
            estimated_minutes=step["estimated_minutes"],
            order_index=step["order"],
        )
        for step in plan
    ]

@router.post("/replan-week", response_model=List[schemas.ScheduleBlockCreate])
async def replan_week(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Replan the user's week based on pending assignments and mood.
    """
    # Fetch pending assignments
    assignments = crud.assignment.get_multi_by_owner(
        db=db, owner_id=current_user.id, status="NOT_STARTED", limit=20
    )
    # Recent mood logs
    recent_moods = crud.mood_checkin.get_multi_by_owner(db=db, owner_id=current_user.id, limit=5)
    # Convert ORM to dict
    mood_dicts = [
        {
            "mood_valence": m.mood_valence.value if hasattr(m.mood_valence, "value") else str(m.mood_valence),
            "energy_level": m.energy_level,
            "stress_level": m.stress_level,
            "additional_metrics": m.additional_metrics,
            "created_at": m.created_at,
        }
        for m in recent_moods
    ]

    suggested_blocks = await ai_service.replan_week(
        user_id=current_user.id,
        assignments=assignments,
        mood_logs=mood_dicts,
    )
    
    # In a real app, we might save these as "suggested" blocks or return them for user approval.
    # For now, let's just return them.
    # We need to convert dicts to Pydantic models or just return as is if schema matches.
    return suggested_blocks

class ExtractRequest(BaseModel):
    text: str

class ExtractResponse(BaseModel):
    clean_text: str
    suggested_title: Optional[str] = None

@router.post("/extract-assignment-text", response_model=ExtractResponse)
async def extract_assignment_text(
    *,
    req: ExtractRequest,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    result = await ai_service.extract_assignment_text(req.text)
    return result

@router.post("/analyze-mood", response_model=schemas.MoodInsight)
async def analyze_mood(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Analyze recent mood logs and provide an insight.
    """
    # Fetch recent mood logs
    mood_history = crud.mood_checkin.get_multi_by_owner(
        db=db, owner_id=current_user.id, limit=7
    )
    history_dicts = [
        {
            "mood_valence": mood.mood_valence,
            "energy_level": mood.energy_level,
            "stress_level": mood.stress_level,
            "created_at": mood.created_at,
        }
        for mood in mood_history
    ]

    analysis = await ai_service.analyze_mood(history_dicts)
    return schemas.MoodInsight(**analysis)
