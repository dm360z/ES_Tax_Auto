import os
import time

print("agent starting...", flush=True)
print(f"GITHUB_TOKEN present: {bool(os.getenv('GITHUB_TOKEN'))}", flush=True)
print(f"OPENAI_API_KEY present: {bool(os.getenv('OPENAI_API_KEY'))}", flush=True)
print(f"INSTRUCTIONS_URL present: {bool(os.getenv('INSTRUCTIONS_URL'))}", flush=True)

while True:
    print("agent heartbeat", flush=True)
    time.sleep(60)