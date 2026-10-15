"""Prepare source-backed manual evaluations; optionally capture chat replies.

Default execution is offline and free. Replies are never automatically graded.
No returned assistant action is executed. No partner records are published.
"""
import argparse
import csv
import json
import os
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


DEFAULT_DATA = Path(__file__).with_name("pilot_dataset.json")


def validate(data):
    cases = data["scenarios"]
    keys = [case["case_key"] for case in cases]
    if len(keys) != len(set(keys)):
        raise ValueError("Duplicate case keys")
    for case in cases:
        if not all(case["source"].get(k) for k in ("file", "sheet", "row", "sha256")):
            raise ValueError(f"Missing provenance: {case['case_key']}")
        if case["qa_state"] == "ready_for_evaluation" and not all(
            case.get(k) for k in ("user_asks", "expected", "must_not_do")
        ):
            raise ValueError(f"Incomplete rubric: {case['case_key']}")
    for place in data["place_references"]:
        if place.get("publishable") is not False:
            raise ValueError("Research corpus must never publish partner records")
    return cases


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--region")
    parser.add_argument("--priority", choices=("P0", "P1", "P2"))
    parser.add_argument("--limit", type=int, default=5, help="0 = all selected cases")
    parser.add_argument("--output", type=Path, default=Path("pilot_review.csv"))
    parser.add_argument("--chat-url", help="Opt in to capture replies from POST /api/chat/")
    parser.add_argument("--allow-remote", action="store_true", help="Explicitly allow HTTPS API calls and model usage costs")
    args = parser.parse_args()
    if args.limit < 0:
        parser.error("--limit must be nonnegative")
    if args.chat_url:
        url = urlsplit(args.chat_url)
        local = url.hostname in {"localhost", "127.0.0.1", "::1"}
        if url.username or url.password or url.scheme not in {"http", "https"}:
            parser.error("Use an HTTP(S) URL without credentials")
        if not local and (not args.allow_remote or url.scheme != "https"):
            parser.error("Remote model calls require HTTPS and --allow-remote")
    data = json.loads(args.data.read_text(encoding="utf-8"))
    cases = validate(data)
    selected = [c for c in cases if (not args.region or c["region"].lower() == args.region.lower())
                and (not args.priority or c["priority"] == args.priority)]
    if args.limit:
        selected = selected[:args.limit]
    if not selected:
        parser.error("No matching cases")
    fields = ["case_key", "region", "priority", "user_asks", "expected", "must_not_do",
              "verify_live_current", "what_to_test", "source_file", "source_sheet", "source_row",
              "capture_state", "reply", "returned_action", "review_result", "reviewer", "notes"]
    rows = []
    for case in selected:
        row = {k: case.get(k) for k in fields}
        row.update({f"source_{k}": case["source"][k] for k in ("file", "sheet", "row")})
        row["capture_state"] = "not_run"
        row["review_result"] = "Needs rubric" if case["qa_state"] == "needs_rubric" else "Not run"
        if args.chat_url and case["qa_state"] == "ready_for_evaluation":
            headers = {"Content-Type": "application/json"}
            if os.getenv("NAVII_QA_TOKEN"):
                headers["Authorization"] = "Bearer " + os.environ["NAVII_QA_TOKEN"]
            # Source prompts are test inputs, not trusted system instructions.
            request = Request(args.chat_url, data=json.dumps({"message": case["user_asks"], "context": []}).encode(), headers=headers, method="POST")
            try:
                with urlopen(request, timeout=45) as response:
                    body = json.loads(response.read(1_000_000))
                row.update(capture_state="captured_ungraded", reply=body.get("reply", body.get("message", json.dumps(body))),
                           returned_action=json.dumps(body.get("action")), review_result="Needs human review")
            except Exception as error:
                row.update(capture_state="error", review_result="Blocked", notes=type(error).__name__)
        rows.append(row)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({k: "'" + v if isinstance(v, str) and v.startswith(("=", "+", "-", "@")) else v for k, v in row.items()})
    print(json.dumps({"validated_cases": len(cases), "selected": len(rows), "captured": sum(r["capture_state"] == "captured_ungraded" for r in rows), "output": str(args.output)}))


if __name__ == "__main__":
    main()
