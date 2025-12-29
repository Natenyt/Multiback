# Custom Domain-Specific Semantic Search Architecture

## 🎯 Goal
Build a **completely custom semantic search model** trained specifically on your departments and user messages, with LLM validation for robustness.

## 📊 Current Problem
- Generic embeddings (Gemini text-embedding-004) don't understand your domain
- Word similarity ≠ semantic understanding
- LLM reranking can't fix bad vector search results
- Need domain-specific knowledge baked into the model

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TRAINING PHASE                            │
│  (Runs periodically: daily/weekly)                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Training Data Collection                                │
│     - User messages + correct departments (from AIAnalysis)│
│     - Staff corrections (positive examples)                │
│     - Wrong routings (negative examples)                  │
│     - LLM-generated synthetic examples                     │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Fine-Tune Sentence Transformer Model                    │
│     Base: multilingual-e5-base or paraphrase-multilingual   │
│     Method: Contrastive Learning (positive/negative pairs)  │
│     Output: Domain-specific embedding model                 │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Deploy Fine-Tuned Model                                 │
│     - Save model to disk/registry                           │
│     - Re-embed all departments with new model               │
│     - Update Qdrant with new vectors                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  INFERENCE PHASE                            │
│  (Real-time routing)                                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Embed User Message                                      │
│     Using: Fine-tuned domain-specific model                 │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Semantic Search (Qdrant)                                │
│     - Search with fine-tuned embeddings                     │
│     - Get top 5-10 candidates                               │
│     - Much more accurate than generic embeddings            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  3. LLM Validation & Reranking                              │
│     - LLM validates top candidates                          │
│     - Checks semantic appropriateness                       │
│     - Final confidence scoring                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Route to Department                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 Phase 1: Training Data Collection

### Data Sources

#### 1. **Real Corrections (Gold Standard)**
```python
# From AIAnalysis model
- User message text
- Correct department (from corrected_department_id)
- Wrong department (from suggested_department_id)
- Language (uz/ru)
```

#### 2. **Confirmed Correct Routings**
```python
# From AIAnalysis where is_corrected=False AND confidence > 0.8
- User message text
- Correct department (from suggested_department_id)
- Language
```

#### 3. **LLM-Generated Synthetic Examples**
```python
# Use LLM to generate variations of real messages
# This expands training data without manual work
For each department:
  - Generate 20-50 example queries that should route there
  - Generate variations of existing messages
  - Generate edge cases and ambiguous scenarios
```

#### 4. **Negative Examples (Hard Negatives)**
```python
# Messages that were routed to wrong department
# These teach the model what NOT to match
- User message
- Wrong department (negative)
- Correct department (positive)
```

### Training Data Format

```python
TrainingExample = {
    "query": "my water tap is broken",  # User message
    "positive": {
        "text": "Utilities and Infrastructure Department - Handles water supply, plumbing issues, infrastructure maintenance",
        "department_id": 5
    },
    "negatives": [
        {
            "text": "Health Department - Medical services and public health",
            "department_id": 3
        },
        {
            "text": "Education Department - Schools and educational services",
            "department_id": 7
        }
    ],
    "language": "uz"
}
```

---

## 🔬 Phase 2: Model Fine-Tuning

### Base Model Selection

**Option A: multilingual-e5-base** (Recommended)
- Multilingual support (Uzbek, Russian)
- Good base for fine-tuning
- 768 dimensions
- Hugging Face: `intfloat/multilingual-e5-base`

**Option B: paraphrase-multilingual-mpnet-base-v2**
- Strong multilingual performance
- 768 dimensions
- Good for semantic similarity

### Training Method: Contrastive Learning

```python
# Pseudo-code for training
for each training example:
    query_embedding = model.encode(example["query"])
    positive_embedding = model.encode(example["positive"]["text"])
    negative_embeddings = [model.encode(neg["text"]) for neg in example["negatives"]]
    
    # Contrastive loss: maximize similarity with positive, minimize with negatives
    positive_sim = cosine_similarity(query_embedding, positive_embedding)
    negative_sims = [cosine_similarity(query_embedding, neg) for neg in negative_embeddings]
    
    loss = contrastive_loss(positive_sim, negative_sims)
    # Model learns: "queries like this should match departments like that"
```

### Training Configuration

```python
TrainingConfig = {
    "base_model": "intfloat/multilingual-e5-base",
    "batch_size": 16,
    "learning_rate": 2e-5,
    "epochs": 3-5,
    "warmup_steps": 100,
    "evaluation_strategy": "steps",
    "save_strategy": "epoch",
    "output_dir": "./models/domain_semantic_search_v1"
}
```

### Training Pipeline

1. **Data Preparation**
   - Collect all corrections from database
   - Generate synthetic examples with LLM
   - Create positive/negative pairs
   - Split: 80% train, 10% validation, 10% test

2. **Fine-Tuning**
   - Use sentence-transformers library
   - Train with MultipleNegativesRankingLoss
   - Validate on held-out test set
   - Save best model checkpoint

3. **Evaluation**
   - Test accuracy on real routing scenarios
   - Compare with baseline (generic embeddings)
   - Measure improvement in top-1, top-3 accuracy

---

## 🚀 Phase 3: Inference Pipeline

### Step 1: Embed with Fine-Tuned Model

```python
# Load fine-tuned model
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('./models/domain_semantic_search_v1')

# Embed user message
user_message = "my water tap is broken"
query_embedding = model.encode(user_message, normalize_embeddings=True)
```

### Step 2: Semantic Search

```python
# Search in Qdrant with fine-tuned embeddings
results = qdrant_client.query_points(
    collection_name="departments_finetuned",  # New collection with fine-tuned vectors
    query=query_embedding,
    limit=10,  # Get more candidates for LLM validation
    with_payload=True
)
```

### Step 3: LLM Validation

```python
# LLM validates top candidates from fine-tuned search
prompt = f"""
You are validating department routing decisions made by a fine-tuned semantic search model.

User Message: "{user_message}"
Language: {language}

Candidates from Semantic Search (ranked by similarity):
{candidates_str}

Your task:
1. Verify if the top candidate is semantically appropriate
2. Check if any lower-ranked candidate is actually better
3. Provide final confidence score (0-100)
4. Explain your reasoning

The semantic search model has been trained on domain-specific data, but you provide final validation.
"""
```

---

## 📈 Phase 4: Continuous Learning

### Automatic Retraining Pipeline

```python
# Run daily/weekly
1. Collect new corrections since last training
2. If corrections > threshold (e.g., 50 new corrections):
   a. Retrain model with new data
   b. Evaluate on test set
   c. If accuracy improved → deploy new model
   d. If accuracy degraded → keep old model, investigate
3. Update Qdrant with new embeddings
```

### Model Versioning

```python
models/
  ├── domain_semantic_search_v1/  # Initial model
  ├── domain_semantic_search_v2/  # After first retrain
  ├── domain_semantic_search_v3/  # After second retrain
  └── current -> v3/              # Symlink to active model
```

---

## 🛠️ Implementation Components

### 1. Training Data Collector

**File**: `django_backend/ai_endpoints/management/commands/collect_training_data.py`

```python
# Collects:
# - Corrections from AIAnalysis
# - Confirmed correct routings
# - Generates synthetic examples via LLM
# - Exports to training format (JSON/CSV)
```

### 2. Model Trainer

**File**: `fastapi_microservice/services/model_trainer.py`

```python
# Handles:
# - Loading training data
# - Fine-tuning sentence transformer
# - Evaluation and metrics
# - Model saving and versioning
```

### 3. Fine-Tuned Embedding Service

**File**: `fastapi_microservice/services/finetuned_embedding.py`

```python
# Provides:
# - Load fine-tuned model
# - Encode queries and documents
# - Replace generic Gemini embeddings
```

### 4. Updated Routing Pipeline

**File**: `fastapi_microservice/services/ai_pipeline.py` (modified)

```python
# Changes:
# - Use fine-tuned model instead of Gemini embeddings
# - Search in new Qdrant collection
# - LLM validation on top candidates
```

---

## 📊 Expected Improvements

### Accuracy Metrics

| Metric | Generic Embeddings | Fine-Tuned Model | Improvement |
|--------|-------------------|------------------|-------------|
| Top-1 Accuracy | ~60-70% | ~85-95% | +25-35% |
| Top-3 Accuracy | ~80-85% | ~95-98% | +15-18% |
| False Positive Rate | ~15-20% | ~3-5% | -12-15% |

### Performance

- **Training Time**: 2-4 hours (one-time, then incremental)
- **Inference Time**: ~50-100ms (similar to generic embeddings)
- **Model Size**: ~400-500MB (manageable)

---

## 🎯 Advantages of This Approach

1. **Domain-Specific**: Model understands YOUR departments, not generic text
2. **Continuous Learning**: Improves from every correction
3. **Scalable**: Can handle 100+ departments
4. **Robust**: LLM validation catches edge cases
5. **Efficient**: Fast inference, no need for LLM on every query
6. **Customizable**: Can fine-tune for specific languages, regions, etc.

---

## 🚦 Implementation Roadmap

### Week 1: Data Collection & Preparation
- [ ] Build training data collector
- [ ] Collect existing corrections
- [ ] Generate synthetic examples with LLM
- [ ] Create training dataset (1000+ examples)

### Week 2: Model Training
- [ ] Set up training environment
- [ ] Fine-tune base model
- [ ] Evaluate on test set
- [ ] Compare with baseline

### Week 3: Integration
- [ ] Integrate fine-tuned model into pipeline
- [ ] Re-embed all departments
- [ ] Update Qdrant collection
- [ ] A/B test with production traffic

### Week 4: Monitoring & Optimization
- [ ] Set up continuous learning pipeline
- [ ] Monitor accuracy metrics
- [ ] Collect feedback
- [ ] Plan next retraining cycle

---

## 💡 Key Insights

1. **Quality > Quantity**: 1000 well-curated examples > 10000 random examples
2. **Hard Negatives Matter**: Include examples of wrong routings
3. **Synthetic Data Helps**: LLM can generate good training examples
4. **Continuous Learning**: Model improves with every correction
5. **LLM as Validator**: Fine-tuned model does heavy lifting, LLM provides safety net

---

## 🔄 Migration Strategy

1. **Phase 1**: Run both systems in parallel
   - Generic embeddings (current)
   - Fine-tuned model (new)
   - Compare results, log differences

2. **Phase 2**: Gradual rollout
   - Route 10% of traffic to fine-tuned model
   - Monitor accuracy, collect feedback
   - Gradually increase to 100%

3. **Phase 3**: Full migration
   - Switch all traffic to fine-tuned model
   - Keep generic as fallback
   - Monitor and optimize

---

This architecture gives you a **completely custom, domain-specific semantic search** that understands your departments deeply and improves continuously from real-world corrections.


