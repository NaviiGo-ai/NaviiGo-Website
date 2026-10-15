# Runtime pilot guidance

NaviiGo now consults the supplied corpus during real chat requests and itinerary
generation. This is retrieval and deterministic planning guidance, not a model
weight update or a claim that all test cases pass.

- Chat retrieves up to four relevant cases from 434 complete rubrics, using
  destination aliases and lexical relevance. Expected behavior, prohibited
  behavior and live checks reach Gemini; original traveler profiles are omitted.
- Research is labelled unverified. It does not establish current prices, contact
  identities, payments, access permission, opening hours or partner approval.
- Server-owned source metadata is returned with replies. The model cannot invent
  that provenance. The shared prompt asks for missing traveler constraints and
  provider-backed edits, and distinguishes estimates from verified facts.
- History and itinerary context are bounded, and client data stays outside the
  system instructions. Generation uses a lower temperature and bounded output.
- The planner filters the explicit Dehradun Kimadi/unnamed-waterfall negative
  cases before route selection. Kimadi village itself is not excluded.
- Chat enforces bounded replies for sensitive Dehradun waterfall-route requests
  and requests to award/confirm Passport achievements. It does not infer current
  access from research reports or invent stamp criteria/verified completion.
- Existing provider places with exact research-name matches receive visible
  “Before you go” cautions in their descriptions. Research rows never add venues.
- Cautions/metadata are generated server-side and persist with newly generated
  plans. Existing saved plans are not silently rewritten. Multi-city generation
  applies the same hook per city's generator call.
- The 44 incomplete Ujjain cases are excluded from chat rubrics until reviewed.
  Their place-reference cautions can still annotate an exact provider match.

## Evaluate

```powershell
python -m pytest tests/test_pilot_knowledge.py -q
python qa/run_pilot.py --region Dwarka --priority P0 --limit 5 --chat-url http://127.0.0.1:8000/api/chat/ --output dwarka_review.csv
```

Chat reply capture is ungraded. Review the supplied expected/forbidden behavior,
current source evidence and returned action before recording a pass. Retrieval
from source prompts is not a held-out model-quality score. After a confirmed
failure, review the correction and add a focused regression check; do not promote
arbitrary chat transcripts into global instructions automatically.

New workbooks must first be normalized and reviewed into the same corpus schema.
Run the corpus validator and knowledge tests before deploying. Updating static
knowledge requires a normal reviewed deployment; no self-modifying model memory
or paid fine-tuning job has been enabled.
