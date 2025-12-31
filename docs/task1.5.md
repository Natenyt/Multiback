Task 1.5: Vector Indexing Management Command (MySQL -> Qdrant)

Objective: Develop a Django Management Command that synchronizes existing Department data from MySQL into the Qdrant Vector Database. This is the critical "Sync" step that populates the AI's knowledge base.

File Path: django_backend/apps/support_tools/management/commands/index_departments.py

Technical Environment:

Source DB: MySQL (Django Model: Department).

Vector DB: Qdrant (Collection Name: departments).

AI SDK: google-generativeai (Model: models/text-embedding-004).

Credentials: GEMINI_API_KEY must be loaded from os.getenv.

Implementation Logic
1. Setup & Configuration

Initialize the QdrantClient.

Logic: Check settings.DEBUG. If True (Local), use host="localhost", port=6333. If False (Docker), use host="qdrant", port=6333.

Configure the Gemini API: genai.configure(api_key=os.getenv("GEMINI_API_KEY")).

2. Qdrant Collection Initialization

Check if the collection departments exists.

If not, create it with:

Vector Size: 768 (Optimized for text-embedding-004).

Distance: Cosine.

3. The UUID Strategy (CRITICAL)

Context: One Department row (ID: 101) has two semantic vectors (Uzbek description & Russian description). We cannot use the MySQL Primary Key directly as the Qdrant Point ID.

Requirement: Use uuid.uuid5 to generate Deterministic IDs. This ensures that re-running the script updates existing points instead of creating duplicates.

Reference Code:

Python

import uuid
# Use a static namespace for the project (do not change this once set)
NAMESPACE = uuid.UUID('d87b3c2a-9e5f-4b1d-8c6a-2f3e4d5c6b7a')

# Inside the loop:
# id_uz = str(uuid.uuid5(NAMESPACE, f"{department.id}_uz"))
# id_ru = str(uuid.uuid5(NAMESPACE, f"{department.id}_ru"))
4. The Indexing Loop (Batch Processing)

Query active departments: Department.objects.filter(is_active=True).

Iterate and prepare PointStruct objects for Qdrant:

Pass 1 (Uzbek):

Embed: department.description_uz

ID: id_uz (Generated above)

Payload:

JSON

{
    "department_id": str(department.id),
    "name": department.name_uz,
    "description": department.description_uz,
    "language": "uz" // Critical for filtering
}
Pass 2 (Russian):

Embed: department.description_ru

ID: id_ru (Generated above)

Payload:

JSON

{
    "department_id": str(department.id),
    "name": department.name_ru,
    "description": department.description_ru,
    "language": "ru"
}
5. Execution

Accumulate points in a list and use client.upload_points(...) to send them in a single batch (or batches of 100) for performance.

Definition of Done:

Running python manage.py index_departments executes without errors.

The script logs: "Successfully indexed X departments (Total Y vectors)."

Qdrant now contains searchable vectors for both Uzbek and Russian descriptions.