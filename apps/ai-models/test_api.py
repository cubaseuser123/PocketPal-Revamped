import requests
import json

# Your Modal Endpoint
API_URL = "https://harshkapse-dev--pally-ai-model-api.modal.run"

def chat_with_pally(message):
    print(f"\n👤 User: {message}")
    
    payload = {
        "messages": [
            {"role": "user", "content": message}
        ]
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print(f"🤖 Pally: {result.get('content', 'No content')}")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"❌ Connection Failed: {str(e)}")

# Test Scenarios
print("🚀 Testing Pally AI on Modal...")

# Test 1: Simple greeting
chat_with_pally("Hey Pally! Who are you?")

# Test 2: Spending question (Tool trigger check - model won't call tool but should respond in character)
chat_with_pally("I spent way too much on pizza this week. Roast me.")

# Test 3: Financial advice boundary check
chat_with_pally("Which crypto should I buy today?")
