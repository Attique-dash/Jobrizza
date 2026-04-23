#!/usr/bin/env python3
"""Test script to verify AI connection is working"""
import os
import sys
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# List of free models to test
MODELS = [
    "meta-llama/llama-3.2-3b-instruct:free",
    "google/gemma-3-1b-it:free", 
    "mistralai/mistral-7b-instruct:free",
]

def test_model(model):
    """Test a single model"""
    if not OPENROUTER_API_KEY:
        print("❌ OPENROUTER_API_KEY not set!")
        print("   Please add your API key to .env file:")
        print("   OPENROUTER_API_KEY=your_key_here")
        return False
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Jobrizza-Test",
    }
    
    payload = {
        "model": model,
        "max_tokens": 100,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say 'Jobrizza AI is working!' in 5 words or less."},
        ],
    }
    
    try:
        print(f"\n🔄 Testing {model}...")
        resp = requests.post(
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=30,
        )
        
        if resp.status_code == 429:
            print(f"⚠️  {model}: Rate limited (HTTP 429)")
            return False
        elif resp.status_code == 401:
            print(f"❌ {model}: Invalid API key (HTTP 401)")
            return False
        elif not resp.ok:
            print(f"❌ {model}: HTTP {resp.status_code} - {resp.text[:200]}")
            return False
        
        result = resp.json()
        content = result["choices"][0]["message"]["content"]
        print(f"✅ {model}: WORKING")
        print(f"   Response: {content}")
        return True
        
    except requests.exceptions.Timeout:
        print(f"⏱️  {model}: Timeout")
        return False
    except Exception as e:
        print(f"❌ {model}: Error - {e}")
        return False

def main():
    print("=" * 60)
    print("Jobrizza AI Connection Test")
    print("=" * 60)
    
    if not OPENROUTER_API_KEY:
        print("\n❌ OPENROUTER_API_KEY not found!")
        print("\nTo fix this:")
        print("1. Get a free API key from https://openrouter.ai/keys")
        print("2. Add to backend/.env: OPENROUTER_API_KEY=your_key")
        print("3. Restart the backend server")
        sys.exit(1)
    
    print(f"\nAPI Key found: {OPENROUTER_API_KEY[:10]}...")
    
    working_models = []
    for model in MODELS:
        if test_model(model):
            working_models.append(model)
    
    print("\n" + "=" * 60)
    print("Test Results:")
    print("=" * 60)
    
    if working_models:
        print(f"\n✅ {len(working_models)} model(s) working")
        print("\nYour AI features should work now!")
        print("\nIf chat still shows errors, try:")
        print("1. Restart the backend: Ctrl+C, then python app.py")
        print("2. Restart the frontend: npm run dev")
        print("3. Wait a few minutes if all models are rate-limited")
    else:
        print("\n❌ No working models found")
        print("\nPossible fixes:")
        print("1. All free models are rate-limited - try again in 5-10 minutes")
        print("2. Check your internet connection")
        print("3. Verify your OpenRouter API key is valid")
        print("4. Add a credit card to OpenRouter for higher rate limits")
    
    return len(working_models) > 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
