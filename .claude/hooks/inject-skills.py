#!/usr/bin/env python3
"""
PreToolUse hook: auto-inject compact skill rules before editing code files.
Reads .atl/skill-registry.md and injects relevant compact rules as additionalContext.
"""
import sys
import json
import re
import os

data = json.load(sys.stdin)
fp = data.get("tool_input", {}).get("file_path", "").replace("\\", "/")

# Map file patterns to relevant skills
if any(fp.endswith(ext) for ext in (".ts", ".tsx")) and "frontend" in fp:
    skills = ["foodstore-frontend", "clean-architecture"]
elif fp.endswith(".py") and ("backend" in fp or "app" in fp):
    skills = ["foodstore-backend", "clean-architecture"]
else:
    sys.exit(0)

registry_path = ".atl/skill-registry.md"
if not os.path.exists(registry_path):
    sys.exit(0)

with open(registry_path, encoding="utf-8") as f:
    content = f.read()

sections = []
for skill in skills:
    m = re.search(rf"### {re.escape(skill)}\n((?:- .+\n?)*)", content)
    if m:
        sections.append(f"### {skill}\n{m.group(1).rstrip()}")

if not sections:
    sys.exit(0)

context = "## Skills activas — aplicar estas reglas ahora:\n\n" + "\n\n".join(sections)

print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "additionalContext": context
    }
}))
