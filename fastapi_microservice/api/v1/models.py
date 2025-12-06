from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class GeminiSettings(BaseModel):
    model: str = "gemini-2.0-flash"
    temperature: float = 0.2
    max_tokens: int = 500

class AnalyzeRequest(BaseModel):
    session_uuid: str
    message_uuid: str
    text: str
    settings: Optional[GeminiSettings] = None

class TrainCorrectionRequest(BaseModel):
    text: str
    correct_department_id: str
    language: str

class Candidate(BaseModel):
    id: str
    name: str = ""
    description: str = ""
    score: float = 0.0

class RoutingResult(BaseModel):
    department_id: str
    intent: str
    confidence: int
    reason: str
