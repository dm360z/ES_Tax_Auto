import os
import time
import requests

INSTRUCTIONS_URL = os.getenv("INSTRUCTIONS_URL")

print("agent starting...", flush=True)
print(f"GITHUB_TOKEN present: {bool(os.getenv('GITHUB_TOKEN'))}", flush=True)
print(f"OPENAI_API_KEY present: {bool(os.getenv('OPENAI_API_KEY'))}", flush=True)
print(f"INSTRUCTIONS_URL present: {bool(INSTRUCTIONS_URL)}", flush=True)

def fetch_instructions():
    if not INSTRUCTIONS_URL:
        return "No INSTRUCTIONS_URL set"

    try:
        response = requests.get(INSTRUCTIONS_URL, timeout=30)
        response.raise_for_status()
        return response.text[:2000]
    except Exception as e:
        return f"Failed to fetch instructions: {e}"

while True:
    instructions = fetch_instructions()
    print("instruction fetch result:", flush=True)
    print(instructions, flush=True)
    time.sleep(300)