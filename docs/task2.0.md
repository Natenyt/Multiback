Task 2: AI Microservice Implementation (FastAPI) & Django Integration Contract

Objective: Build the "Brain" of the platform using FastAPI. This service accepts text, processes it through a multi-step AI pipeline (Injection Check -> Embedding -> Vector Search -> LLM Reasoning), and returns the detailed result to the Django Backend via webhooks.

Tech Stack: FastAPI, Uvicorn, Qdrant Client (Port 6333), Google GenAI SDK (Gemini).

1. API Endpoint: Message Processor
Route: POST /api/v1/analyze Input Payload:

JSON

{   
    "session_uuid": "UUID-String",
    "message_uuid": "UUID-String",
    "text": "Salom, mening ko'chamda suv quvuri yorilib ketdi.",
    "settings": {
        "model": "gemini-2.0-flash",
        "temperature": 0.2,
        "max_tokens": 500
    }
}
The Pipeline Logic (Sequential Steps):

Step 0: Start Timer

Initialize a timer to track processing_time_ms.

Step 1: Language Detection (Rule-Based)

Scan the text.

Logic:

If text contains primarily Cyrillic characters -> language = "ru"

Else -> language = "uz" (Default to Latin/Uzbek).

Step 2: Injection Detection (Security Layer)

Action: Implement a lightweight injection detector (or simple LLM check).

Output: {"is_injection": boolean, "risk_score": float, "reason": string}.

Branching Logic:

CRITICAL: If is_injection is True:

STOP processing.

Send result to Django Endpoint A (injection_handler).

Return HTTP 200.

Step 3: Vector Embedding

Condition: Proceed only if is_injection is False.

Action: Generate embedding using models/text-embedding-004.

Metric: Track embedding_tokens used.

Step 4: Semantic Search (Qdrant)

Action: Query Qdrant collection departments.

Filter: Apply filter: must=[{key="language", match=detected_lang}].

Limit: Top 3 results.

Output: List of candidates [{id, name, description, score}, ...].

Step 5: LLM Reranking & Decision

Action: Construct a prompt for settings.model.

Prompt Context: User Message + Top 3 Candidates.

Instruction: "Analyze the message. 1) Classify the Intent (Complaint, Inquiry, Suggestion). 2) Select the best Department. 3) Provide a Confidence Score and Reason."

Output: JSON { "department_id": UUID, "intent": string, "confidence": int, "reason": string }.

Metric: Track prompt_tokens and completion_tokens.

Step 6: Completion (Success)

Action: Send the final result to Django Endpoint B (routing_result).

"Use FastAPI BackgroundTasks to handle the processing asynchronously. Return a 200 OK response to Django immediately after validation, and execute the AI pipeline in the background. Once finished, trigger the Webhook (Endpoint B)."

2. API Endpoint: Feedback Loop (Training)
Route: POST /api/v1/train-correction Objective: Learn from human corrections. Input Payload:

JSON

{
    "text": "The original user message...",
    "correct_department_id": "UUID-String",
    "language": "uz"
}
Logic:

Generate Embedding for text.

Upsert to Qdrant:

Point ID: Generate a deterministic UUID (e.g., hash of text) to avoid duplicates.

Payload: { "department_id": correct_department_id, "language": "uz", ... }

Return Success.


3. External Integration: Django Callbacks
The FastAPI service must make HTTP POST requests to the following Django endpoints. You must create these endpoints on the Django Backend.

Endpoint A: Injection Handler (Django)

Target: POST http://django_backend:8000/api/internal/injection-alert/

Payload to send:

JSON

{
    "message_uuid": "UUID-String",
    "risk_score": 0.95,
    "reason": "User attempted to ignore system instructions.",
    "tokens_used": 120,
    "processing_time_ms": 120
}

this endpoint needs to save the data to InjectionLog model.
and send notification to superuser dashboard, but since we don't have dashboards built, you can just print the data to console.

Endpoint B: Routing Handler (Django)

Target: POST http://django_backend:8000/api/internal/routing-result/

Payload to send:

JSON

{   
    "session_uuid": "UUID-String",
    "message_uuid": "UUID-String",
    "intent_label": "Complaint",
    "suggested_department_id": "id",
    "suggested_department_name": "Water Supply",
    "confidence_score": 85,
    "reason": "The user explicitly mentioned a broken pipe, which falls under Water Supply.",
    "vector_search_results": [
        {
            "id": "id",
            "name": "Water Supply",
            "description": "Water Supply",
            "score": 0.95
        }
    ],
    "language_detected": "uz",
    "embedding_tokens": 120,
    "prompt_tokens": 120,
    "total_tokens": 240,
    "processing_time_ms": 1450
}
this endpoint needs to save the data to AIAnalysis model and then call routing function and provide this payload:

JSON

{
    "department_id": "id",
    "session_uuid": "UUID-String",
    "message_uuid": "UUID-String",
}
the routing function will check the payload to the database weather these session and messages and department exist, if does then it will send it to the department's dashboard based on the department_id and session_uuid. since we don't have dashboards built, you can just print the data to console.

Definition of Done
FastAPI server runs successfully on port 8001 (or similar).

/analyze endpoint correctly handles the flow: Detect -> Check Injection -> Embed -> Search -> Rerank.

Language detection works accurately for Cyrillic vs Latin.

Mock requests to Django callback URLs are fired correctly (use httpx or requests).

Qdrant searching respects the language filter.
there is a dedicated api app folder for making the apis, please make sure to create the apis urls and views in that folder.

injection_alert function can reside in folder ai_endpoints 
routing_result function can reside in folder ai_endpoints but routing_result will save the payload and then call the routing function which resides in message_app folder.
