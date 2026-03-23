import os
import time
import requests

INSTRUCTIONS_URL = os.getenv("INSTRUCTIONS_URL")

print("agent starting...", flush=True)
print(f"GITHUB_TOKEN present: {bool(os.getenv('GITHUB_TOKEN'))}", flush=True)
print(f"OPENAI_API_KEY present: {bool(os.getenv('OPENAI_API_KEY'))}", flush=True)
print(f"INSTRUCTIONS_URL present: {bool(INSTRUCTIONS_URL)}