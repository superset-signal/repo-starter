"""
Example Agno streaming agent. Customize the system prompt and model as needed.
"""

import os
from typing import AsyncGenerator

from agno.agent import Agent
from agno.models.openai import OpenAIChat


def _build_agent() -> Agent:
    return Agent(
        model=OpenAIChat(id="gpt-4o-mini"),
        system_prompt=(
            "You are a helpful assistant. "
            "Answer concisely and clearly."
        ),
        markdown=True,
    )


async def stream_response(
    message: str,
    history: list[dict] | None = None,
) -> AsyncGenerator[str, None]:
    """Yield text chunks from the agent for a given message."""
    agent = _build_agent()

    # Prepend history messages if provided
    messages = []
    for entry in (history or []):
        role = entry.get("role", "user")
        content = entry.get("content", "")
        messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": message})

    async for chunk in await agent.arun(messages, stream=True):
        if chunk.content:
            yield chunk.content
