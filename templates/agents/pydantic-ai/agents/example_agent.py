"""
Example Pydantic AI streaming agent. Customize the system prompt and model as needed.
"""

import os
from typing import AsyncGenerator

from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel


model = OpenAIModel("gpt-4o-mini", api_key=os.environ.get("OPENAI_API_KEY", ""))

agent = Agent(
    model=model,
    system_prompt=(
        "You are a helpful assistant. "
        "Answer concisely and clearly."
    ),
)


async def stream_response(
    message: str,
    history: list[dict] | None = None,
) -> AsyncGenerator[str, None]:
    """Yield text chunks from the agent for a given message."""
    messages = []
    for entry in (history or []):
        role = entry.get("role", "user")
        content = entry.get("content", "")
        messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": message})

    async with agent.run_stream(message, message_history=messages) as result:
        async for chunk in result.stream_text(delta=True):
            yield chunk
