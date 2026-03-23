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
        response = requests.get(
            INSTRUCTIONS_URL,
            headers={
                "Cache-Control": "no-cache",
                "Pragma": "no-cache",
            },
            timeout=30,
        )
        response.raise_for_status()
        return response.text[:2000]
    except Exception as e:
        return f"Failed to fetch instructions: {e}"
    
    def fetch_github_issues():
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        return "No GITHUB_TOKEN"

    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
        }
        url = "https://api.github.com/repos/dm360z/ES_Tax_Auto/issues"
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        issues = response.json()
        if not issues:
            return "No open issues"

        titles = [f"- {issue['title']}" for issue in issues if "pull_request" not in issue]
        return "\n".join(titles[:10])

    except Exception as e:
        return f"Failed to fetch issues: {e}"

while True:
    instructions = fetch_instructions()

    now = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime())

    print("----- AGENT CYCLE START -----", flush=True)
    print(f"UTC time: {now}", flush=True)
    print("instruction fetch result:", flush=True)
    print(instructions, flush=True)
    print("action: no action taken", flush=True)
    print("----- AGENT CYCLE END -----", flush=True)

    time.sleep(300)