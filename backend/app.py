import os
import warnings
import traceback
import torch
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

from fastapi.middleware.cors import CORSMiddleware

# Import extraction schemas and function from key_information_extractor.py
from key_information_extractor import extract_key_information, KeyInformationOutput

warnings.filterwarnings("ignore", message=".*Direct use of automatic function calling.*")

load_dotenv()

app = FastAPI(
    title="Conversation Intelligence API",
    description="Phase 3 Integration: Fine-tuned T5 Summarization + Gemini Key Insights Extraction"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# 1. Load Fine-tuned T5 Model
# ==========================================

MODEL_PATH = os.getenv(
    "MODEL_NAME",
    "KaifAIML/summarAI-t5"
)


device = "cuda" if torch.cuda.is_available() else "cpu"

try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)

    t5_model = AutoModelForSeq2SeqLM.from_pretrained(
        MODEL_PATH
    ).to(device)

    t5_model.eval()

    print(
        f"[INFO] Loaded fine-tuned T5 model "
        f"from '{MODEL_PATH}' on {device.upper()}."
    )

except Exception as e:
    print(f"[ERROR] Could not load model from '{MODEL_PATH}': {e}")
    raise RuntimeError(
        f"Failed to load T5 model from '{MODEL_PATH}'"
    ) from e



def generate_t5_summary(conversation_text: str) -> str:
    """Preprocesses input and generates summary via your trained T5 checkpoint."""
    if not t5_model or not tokenizer:
        raise RuntimeError("T5 model checkpoint is not loaded properly.")

    input_text = f"summarize: {conversation_text.strip()}"
    inputs = tokenizer(
        input_text,
        return_tensors="pt",
        max_length=512,
        truncation=True
    ).to(device)

    with torch.no_grad():
        summary_tokens = t5_model.generate(
            inputs.input_ids,
            max_length=150,
            min_length=30,
            num_beams=4,
            length_penalty=2.0,
            early_stopping=True
        )

    return tokenizer.decode(summary_tokens[0], skip_special_tokens=True)


# ==========================================
# 2. Phase 3 Integrated Schemas & API Route
# ==========================================
class ConversationRequest(BaseModel):
    conversation: str


class IntegratedReportResponse(BaseModel):
    summary: str
    insights: KeyInformationOutput


@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "Conversation Intelligence API",
        "t5_model_loaded": t5_model is not None,
        "docs_url": "/docs"
    }


@app.post("/analyze-conversation", response_model=IntegratedReportResponse)
async def analyze_conversation(payload: ConversationRequest):
    if not payload.conversation.strip():
        raise HTTPException(status_code=400, detail="Conversation cannot be empty.")

    try:
        # 1. Generate Abstractive Summary (T5)
        summary_result = generate_t5_summary(payload.conversation)

        # 2. Extract Structured Key Information (Gemini)
        insights_result = extract_key_information(payload.conversation)

        # 3. Return Combined Unified JSON
        return IntegratedReportResponse(
            summary=summary_result,
            insights=insights_result
        )

    except Exception as e:
        print("\n========== ANALYSIS ERROR ==========")
        print(f"Error: {e}")
        traceback.print_exc()
        print("====================================\n")

        raise HTTPException(status_code=500, detail=str(e))