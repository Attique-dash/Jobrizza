#!/usr/bin/env python3
"""Test script to verify AI model response from OpenRouter"""

import os
import requests
import json

# Load environment variables from backend directory
from dotenv import load_dotenv
import os

# Try loading from multiple possible locations
env_paths = [
    os.path.join(os.path.dirname(__file__), 'backend', '.env'),
    os.path.join(os.path.dirname(__file__), '.env'),
    '/Users/apple/Desktop/Vettor/backend/.env',
]

loaded = False
for env_path in env_paths:
    if os.path.exists(env_path):
        load_dotenv(env_path)
        print(f"✅ Loaded .env from: {env_path}")
        loaded = True
        break

if not loaded:
    load_dotenv()  # Try default
    print("⚠️ Trying default .env location")

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
if not OPENROUTER_API_KEY:
    print("❌ ERROR: OPENROUTER_API_KEY not found in environment variables")
    exit(1)

BASE_URL = "https://openrouter.ai/api/v1"
MODEL = "google/gemma-4-26b-a4b-it:free"

def test_ai_response():
    """Test the AI model with a simple question"""
    
    print("=" * 60)
    print("🧪 TESTING AI MODEL RESPONSE")
    print("=" * 60)
    print(f"Model: {MODEL}")
    print(f"API Key: {OPENROUTER_API_KEY[:10]}...")
    print("-" * 60)
    
    # Test 1: Simple greeting
    print("\n📨 Test 1: Simple Greeting")
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Say 'Hello from Pakistan!' and tell me one interesting fact about Karachi."}
    ]
    
    try:
        response = requests.post(
            f"{BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://vettor.app",
                "X-Title": "Vettor AI Test"
            },
            json={
                "model": MODEL,
                "messages": messages,
                "max_tokens": 200,
                "temperature": 0.7
            },
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if 'choices' in data and len(data['choices']) > 0:
                ai_response = data['choices'][0]['message']['content']
                print(f"✅ SUCCESS! AI Response:")
                print("-" * 40)
                print(ai_response)
                print("-" * 40)
            else:
                print(f"⚠️ Unexpected response structure: {json.dumps(data, indent=2)[:500]}")
        else:
            print(f"❌ ERROR: {response.status_code}")
            print(response.text[:500])
            
    except Exception as e:
        print(f"❌ EXCEPTION: {e}")
    
    # Test 2: CV-related question
    print("\n" + "=" * 60)
    print("📨 Test 2: CV Analysis Question")
    print("-" * 60)
    
    cv_data = {
        "skills": ["Python", "React", "Node.js", "MongoDB"],
        "experience": ["2 years at Tech Solutions", "Freelance Web Developer"],
        "education": ["BS Computer Science"]
    }
    
    prompt = f"""Given this CV data: {json.dumps(cv_data)}
    
Suggest 3 suitable job titles for this candidate in Pakistan IT market.
Return as a simple numbered list."""
    
    messages = [
        {"role": "system", "content": "You are a career advisor specializing in Pakistan IT job market."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        response = requests.post(
            f"{BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://vettor.app",
                "X-Title": "Vettor AI Test"
            },
            json={
                "model": MODEL,
                "messages": messages,
                "max_tokens": 300,
                "temperature": 0.7
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if 'choices' in data and len(data['choices']) > 0:
                ai_response = data['choices'][0]['message']['content']
                print(f"✅ SUCCESS! AI Job Suggestions:")
                print("-" * 40)
                print(ai_response)
                print("-" * 40)
            else:
                print(f"⚠️ Unexpected response: {data}")
        else:
            print(f"❌ ERROR: {response.status_code}")
            print(response.text[:500])
            
    except Exception as e:
        print(f"❌ EXCEPTION: {e}")
    
    print("\n" + "=" * 60)
    print("✅ AI Response Test Complete")
    print("=" * 60)

if __name__ == "__main__":
    test_ai_response()
