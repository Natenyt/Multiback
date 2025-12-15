import os
import uuid
import time
from django.core.management.base import BaseCommand
from django.conf import settings
from departments.models import Department
import google.generativeai as genai
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

class Command(BaseCommand):
    help = 'Indexes departments into Qdrant vector database.'

    def handle(self, *args, **options):
        self.stdout.write("Starting indexing process...")

        # 1. Setup & Configuration
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            self.stdout.write(self.style.ERROR("GEMINI_API_KEY not found in environment."))
            return

        genai.configure(api_key=gemini_api_key)

        # Determine Qdrant host - try environment variable first, then fallback logic
        qdrant_host = os.getenv("QDRANT_HOST", None)
        if not qdrant_host:
            # Smart fallback: try localhost first (for local dev), then qdrant (for Docker)
            qdrant_host = "localhost" if settings.DEBUG else "qdrant"
        qdrant_port = int(os.getenv("QDRANT_PORT", "6333"))
        
        self.stdout.write(f"Connecting to Qdrant at {qdrant_host}:{qdrant_port}...")
        
        # Try connecting with smart fallback
        client = None
        try:
            client = QdrantClient(host=qdrant_host, port=qdrant_port)
            # Test connection by getting collections
            client.get_collections()
            self.stdout.write(self.style.SUCCESS(f"✅ Connected to Qdrant at {qdrant_host}:{qdrant_port}"))
        except Exception as e:
            # If failed and we're not already on localhost, try localhost fallback
            if qdrant_host != "localhost" and qdrant_host != "127.0.0.1":
                self.stdout.write(self.style.WARNING(f"⚠️  Failed to connect to {qdrant_host}: {e}"))
                self.stdout.write("🔄 Attempting fallback to 'localhost'...")
                try:
                    client = QdrantClient(host="localhost", port=qdrant_port)
                    client.get_collections()
                    self.stdout.write(self.style.SUCCESS(f"✅ Connected to Qdrant at localhost:{qdrant_port}"))
                except Exception as e2:
                    self.stdout.write(self.style.ERROR(f"❌ CRITICAL: Qdrant connection failed on both {qdrant_host} and localhost: {e2}"))
                    self.stdout.write(self.style.ERROR("Make sure Qdrant is running (via Docker or locally)!"))
                    return
            else:
                self.stdout.write(self.style.ERROR(f"❌ CRITICAL: Qdrant connection failed: {e}"))
                self.stdout.write(self.style.ERROR("Make sure Qdrant is running (via Docker or locally)!"))
                return

        collection_name = "departments"
        vector_size = 768 # text-embedding-004 size

        # 2. Qdrant Collection Initialization
        if not client.collection_exists(collection_name):
            self.stdout.write(f"Collection '{collection_name}' not found. Creating...")
            client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
            )
            self.stdout.write(self.style.SUCCESS(f"Collection '{collection_name}' created."))
        else:
            self.stdout.write(f"Collection '{collection_name}' already exists.")

        # 3. The UUID Strategy
        NAMESPACE = uuid.UUID('d87b3c2a-9e5f-4b1d-8c6a-2f3e4d5c6b7a')

        # 4. The Indexing Loop
        departments = Department.objects.filter(is_active=True)
        points = []
        total_vectors = 0

        self.stdout.write(f"Found {departments.count()} active departments.")

        for dept in departments:
            # Pass 1: Uzbek
            if dept.description_uz:
                try:
                    embedding_uz = genai.embed_content(
                        model="models/text-embedding-004",
                        content=dept.description_uz,
                        task_type="retrieval_document"
                    )['embedding']
                    
                    id_uz = str(uuid.uuid5(NAMESPACE, f"{dept.id}_uz"))
                    
                    points.append(PointStruct(
                        id=id_uz,
                        vector=embedding_uz,
                        payload={
                            "department_id": str(dept.id),
                            "name": dept.name_uz,
                            "description": dept.description_uz,
                            "language": "uz"
                        }
                    ))
                    total_vectors += 1
                except Exception as e:
                     self.stdout.write(self.style.ERROR(f"Error embedding UZ for Dept {dept.id}: {e}"))

            # Pass 2: Russian
            if dept.description_ru:
                try:
                    embedding_ru = genai.embed_content(
                        model="models/text-embedding-004",
                        content=dept.description_ru,
                        task_type="retrieval_document"
                    )['embedding']
                    
                    id_ru = str(uuid.uuid5(NAMESPACE, f"{dept.id}_ru"))
                    
                    points.append(PointStruct(
                        id=id_ru,
                        vector=embedding_ru,
                        payload={
                            "department_id": str(dept.id),
                            "name": dept.name_ru,
                            "description": dept.description_ru,
                            "language": "ru"
                        }
                    ))
                    total_vectors += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error embedding RU for Dept {dept.id}: {e}"))

        # 5. Execution (Batch Upload)
        if points:
            self.stdout.write(f"Uploading {len(points)} vectors to Qdrant...")
            client.upload_points(
                collection_name=collection_name,
                points=points,
                wait=True
            )
            self.stdout.write(self.style.SUCCESS(f"Successfully indexed {departments.count()} departments (Total {total_vectors} vectors)."))
        else:
            self.stdout.write("No points to upload.")
