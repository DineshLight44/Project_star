from fastapi import FastAPI
from pydantic import BaseModel
import ollama

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    text: str

@app.post("/chat")
def chat(msg: Message):
    response = ollama.chat(
        model="llama3",
        messages=[
            {"role": "system", "content": "You are a supportive emotional AI companion."},
            {"role": "user", "content": msg.text}
        ]
    )

    return {"reply": response["message"]["content"]}