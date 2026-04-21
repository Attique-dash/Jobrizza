#!/usr/bin/env python3
"""Test Google Gemma-4-31B model"""

import os
from openai import OpenAI
from dotenv import load_dotenv

# Load .env from backend directory
env_path = '/Users/apple/Desktop/Vettor/backend/.env'
load_dotenv(env_path)

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
if not OPENROUTER_API_KEY:
    print("❌ OPENROUTER_API_KEY not found")
    exit(1)

print(f"✅ API Key loaded: {OPENROUTER_API_KEY[:20]}...")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

print("\n🧪 Testing model: google/gemma-4-31b-it:free")
print("=" * 60)

# First API call with reasoning
print("\n📨 Question: How many r's are in the word 'strawberry'?")
print("⏳ Waiting for AI response with reasoning...")

try:
    response = client.chat.completions.create(
        model="google/gemma-4-31b-it:free",
        messages=[
            {
                "role": "user",
                "content": "How many r's are in the word 'strawberry'?"
            }
        ],
        extra_body={"reasoning": {"enabled": True}},
        max_tokens=500
    )

    # Extract the assistant message
    message = response.choices[0].message
    
    print("\n" + "=" * 60)
    print("✅ AI RESPONSE 1:")
    print("=" * 60)
    print(f"\nContent: {message.content}")
    
    if hasattr(message, 'reasoning_details') and message.reasoning_details:
        print(f"\nReasoning: {message.reasoning_details}")
    
    print(f"\nModel: {response.model}")
    print(f"Usage: {response.usage}")
    
    # Second API call - follow-up question
    print("\n" + "=" * 60)
    print("📨 Follow-up: Are you sure? Think carefully.")
    print("=" * 60)
    
    messages = [
        {"role": "user", "content": "How many r's are in the word 'strawberry'?"},
        {
            "role": "assistant",
            "content": message.content,
        },
        {"role": "user", "content": "Are you sure? Think carefully."}
    ]
    
    # Preserve reasoning_details if present
    if hasattr(message, 'reasoning_details') and message.reasoning_details:
        messages[1]["reasoning_details"] = message.reasoning_details
    
    response2 = client.chat.completions.create(
        model="google/gemma-4-31b-it:free",
        messages=messages,
        extra_body={"reasoning": {"enabled": True}},
        max_tokens=500
    )
    
    message2 = response2.choices[0].message
    print(f"\n✅ AI RESPONSE 2:")
    print(f"Follow-up Response: {message2.content}")
    
    if hasattr(message2, 'reasoning_details') and message2.reasoning_details:
        print(f"\nReasoning: {message2.reasoning_details}")
    
    print("\n" + "=" * 60)
    print("✅ TEST COMPLETE - Model is working!")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    print(f"Error type: {type(e).__name__}")
