#!/usr/bin/env python3

import requests
import json
import time

def test_backend():
    print("🧪 Testing Flask Backend...")
    
    # Test health endpoint
    try:
        response = requests.get('http://localhost:3001/', timeout=5)
        print(f"✅ Health check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False
    
    # Test LLM endpoint
    try:
        test_data = {
            "prompt": "Hello, respond with JSON {\"message\":\"test\"}",
            "response_json_schema": {
                "type": "object",
                "properties": {"message": {"type": "string"}},
                "required": ["message"]
            },
            "provider": "google"
        }
        
        response = requests.post(
            'http://localhost:3001/api/llm/invoke',
            json=test_data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ LLM test: {response.status_code} - {result}")
        else:
            print(f"❌ LLM test failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ LLM test failed: {e}")
        return False
    
    print("🎉 Backend tests completed!")
    return True

if __name__ == "__main__":
    test_backend()
