"""
PROJECT_NAME agent service — FastAPI server with Pydantic AI streaming agents.
"""

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from example_agent import stream_response
from db import client as get_db

load_dotenv()

app = FastAPI(title="PROJECT_NAME Agents", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


class UserSyncRequest(BaseModel):
    clerk_id: str
    email: str | None = None
    name: str | None = None
    avatar_url: str | None = None


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/chat")
async def chat(req: ChatRequest):
    """Stream a response from the example agent."""

    async def generate():
        async for chunk in stream_response(req.message, req.history):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/user/sync")
async def sync_user(req: UserSyncRequest):
    """Upsert a Clerk user into Supabase."""
    db = get_db()
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    result = (
        db.table("users")
        .upsert(data, on_conflict="clerk_id")
        .execute()
    )
    return {"user": result.data[0] if result.data else None}


@app.get("/user/me")
async def get_user(x_clerk_user_id: str | None = Header(None)):
    """Get the current user by Clerk ID (passed via header)."""
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="Missing x-clerk-user-id header")
    db = get_db()
    result = (
        db.table("users")
        .select("*")
        .eq("clerk_id", x_clerk_user_id)
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": result.data}
