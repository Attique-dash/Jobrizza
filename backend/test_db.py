#!/usr/bin/env python3
"""Quick test to verify MongoDB connection and backend health."""

import os
import sys

import requests
from dotenv import load_dotenv


def main() -> int:
    # Load .env from backend directory
    load_dotenv()

    print("=" * 50)
    print("BACKEND HEALTH CHECK")
    print("=" * 50)

    # Check environment variables
    mongodb_uri = os.environ.get("MONGODB_URI")
    jwt_secret = os.environ.get("JWT_SECRET")

    print("\n1. Environment Variables:")
    print(f"   MONGODB_URI: {'✓ Set' if mongodb_uri else '✗ MISSING'}")
    print(f"   JWT_SECRET:  {'✓ Set' if jwt_secret else '✗ MISSING'}")

    if not mongodb_uri:
        print("\n❌ ERROR: MONGODB_URI is not set!")
        print("   Create a .env file in /backend with:")
        print('   MONGODB_URI="your-mongodb-uri"')
        return 1

    # Test MongoDB connection
    print("\n2. Testing MongoDB connection...")
    try:
        from pymongo import MongoClient

        client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)

        # Ping the server
        client.admin.command("ping")
        print("   ✓ MongoDB connection: SUCCESS")

        # Get database info
        db = client.get_default_database()
        print(f"   ✓ Database name: {db.name}")

        # List collections
        collections = db.list_collection_names()
        print(f"   ✓ Collections: {collections if collections else '(none yet)'}")

        # Count users
        user_count = db.users.count_documents({})
        print(f"   ✓ Users in database: {user_count}")

        client.close()
        print("\n✅ MongoDB is connected and working!")

    except Exception as e:
        print("\n❌ MongoDB connection FAILED:")
        print(f"   Error: {e}")
        return 1

    # Test register endpoint
    print("\n3. Testing /api/auth/register endpoint...")
    try:
        response = requests.post(
            "http://localhost:5000/api/auth/register",
            json={
                "name": "Test User",
                "email": "test@example.com",
                "password": "testpassword123",
            },
            timeout=5,
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")

        if response.status_code in [200, 201]:
            print("   ✓ Register endpoint working!")
        elif response.status_code == 409:
            print("   ✓ Register endpoint working (user already exists)")
        else:
            print(f"   ⚠ Unexpected status: {response.status_code}")

    except requests.exceptions.ConnectionError:
        print("   ❌ Cannot connect to localhost:5000")
        print("      Is the Flask server running?")
    except Exception as e:
        print(f"   ❌ Error testing endpoint: {e}")

    print("\n" + "=" * 50)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
