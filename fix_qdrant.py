from qdrant_client import QdrantClient, models
import sys

# Connect to Qdrant
try:
    client = QdrantClient(host="localhost", port=6333)
    collections = client.get_collections()
    print("✅ Connected to Qdrant.")
except Exception as e:
    print(f"❌ Could not connect to Qdrant: {e}")
    print("Make sure Docker is running!")
    sys.exit(1)

COLLECTION_NAME = "departments"

# 1. Delete the existing (corrupted/wrong) collection
print(f"🗑️  Deleting collection '{COLLECTION_NAME}'...")
try:
    client.delete_collection(COLLECTION_NAME)
    print("   Deleted.")
except Exception as e:
    print(f"   (Collection didn't exist or error: {e})")

# 2. Re-create it with the CORRECT vector size (768)
print(f"🆕 Creating collection '{COLLECTION_NAME}' with size=768...")
client.create_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=models.VectorParams(
        size=768,  # CRITICAL: Must match Gemini text-embedding-004
        distance=models.Distance.COSINE
    )
)

print("\n✅ SUCCESS: Qdrant is fixed and ready.")
print("👉 NOW RUN YOUR DJANGO INDEXING COMMAND to populate it with data!")