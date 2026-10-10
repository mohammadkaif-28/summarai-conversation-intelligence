import os
import warnings
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

warnings.filterwarnings("ignore", message=".*Direct use of automatic function calling.*")

load_dotenv()
client = genai.Client()

# --- Output Schemas ---
class ActionItem(BaseModel):
    assignee: str = Field(description="Name or role of the individual assigned")
    task: str = Field(description="Specific actionable task to be completed")

class KeyInformationOutput(BaseModel):
    key_points: list[str] = Field(
        description="List of primary requirements, observations, or technical details"
    )
    action_items: list[ActionItem] = Field(
        description="Structured list of action items with assignees"
    )
    decisions: list[str] = Field(
        description="Final conclusions, project agreements, or deadlines determined"
    )
    topics: list[str] = Field(
        description="List of 3-6 overarching high-level discussion themes or subject areas"
    )

# --- Extractor Function ---
def extract_key_information(conversation_text: str) -> KeyInformationOutput:
    system_instruction = (
        "You are an expert conversation analyzer. "
        "Extract ONLY the key points, action items (consolidate tasks per person), "
        "final decisions/milestones, and overarching topic labels. "
        "Do NOT provide a conversational summary, introduction, or text outside the schema."
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"Conversation:\n{conversation_text}",
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=KeyInformationOutput,
            temperature=0.1,
        ),
    )

    return response.parsed

# Quick standalone test for Phase 2
if __name__ == "__main__":
    test_chat = """
    Person A: We need to complete the project documentation by Friday.
    Person B: I will prepare the technical documentation.
    Person C: I will test the final system before the review.
    Person A: Let's review the complete project on Thursday.
    """
    result = extract_key_information(test_chat)
    print(result.model_dump_json(indent=2))