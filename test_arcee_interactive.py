#!/usr/bin/env python3
"""Interactive test for Arcee Trinity model"""

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

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

MODEL = "arcee-ai/trinity-large-preview:free"

def ask_ai(question, conversation_history=None):
    """Send a question to the AI and return the response"""
    messages = conversation_history or []
    messages.append({"role": "user", "content": question})
    
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            extra_body={"reasoning": {"enabled": True}},
            max_tokens=1000
        )
        
        message = response.choices[0].message
        messages.append({
            "role": "assistant",
            "content": message.content
        })
        
        return message.content, messages, response.usage
    except Exception as e:
        return f"❌ ERROR: {e}", messages, None

print("=" * 70)
print("🤖 Arcee Trinity Model - Interactive Test")
print("=" * 70)
print(f"Model: {MODEL}")
print("Type your questions below (or 'quit' to exit, 'test' for preset tests)\n")

conversation = []

# Preset tests
preset_tests = [
    "What are the top 5 in-demand IT skills in Pakistan in 2025?",
    "Write a professional summary for a CV with skills: Python, React, Node.js, 3 years experience",
    "Suggest 3 Pakistani IT companies that hire React developers",
    "What salary should a senior software engineer expect in Lahore? Give range in PKR",
]

while True:
    try:
        user_input = input("\n💬 You: ").strip()
        
        if user_input.lower() == 'quit':
            print("\n👋 Goodbye!")
            break
        
        if user_input.lower() == 'test':
            print("\n🧪 Running preset tests...")
            for i, test in enumerate(preset_tests, 1):
                print(f"\n{'='*70}")
                print(f"Test {i}: {test}")
                print('='*70)
                answer, _, usage = ask_ai(test)
                print(f"\n🤖 AI: {answer}")
                if usage:
                    print(f"\n📊 Tokens: {usage.total_tokens} (prompt: {usage.prompt_tokens}, completion: {usage.completion_tokens})")
            continue
        
        if not user_input:
            continue
        
        print("⏳ Thinking...")
        answer, conversation, usage = ask_ai(user_input, conversation)
        
        print(f"\n🤖 AI: {answer}")
        
        if usage:
            print(f"\n📊 Tokens used: {usage.total_tokens}")
        
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
        break
    except Exception as e:
        print(f"\n❌ Error: {e}")
