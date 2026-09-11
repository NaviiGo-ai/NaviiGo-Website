from __future__ import annotations

import json
import uuid

from google import genai
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.schemas import AICopilotResponse, AIMutation
from app.db.models.enums import SourceType
from app.trips.schemas import TripDayIn, TripItemIn, TripItemUpdate, TripStatusUpdate
from app.trips.service import TripService
from services.gemini_client import GEMINI_MODEL, get_client


class AIEngine:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.service = TripService(db)
        self.client = get_client()

    async def converse(
        self, trip_id: uuid.UUID, user_id: uuid.UUID, user_message: str
    ) -> tuple[AICopilotResponse, dict]:
        """
        Takes a user message, passes the current trip state to Gemini, gets mutations,
        applies them, and returns the response and the newly read trip state.
        """
        # 1. Fetch current trip
        trip = await self.service.get(trip_id)

        # We need to enforce authorization, but that is ideally done in the route.
        # We assume `trip` belongs to `user_id` by this point (the router checks `_owned_trip`).

        # 2. Serialize compact state for the prompt
        trip_read = self.service.to_read(trip, include_budget=True)
        dump = trip_read.model_dump(exclude_unset=True, mode="json")

        # Minimize token usage by stripping heavy metadata
        for day in dump.get("days", []):
            for i, d_item in enumerate(day.get("items", [])):
                # keep id, name, type, but strip metadata
                d_item.pop("metadata", None)
                d_item.pop("lat", None)
                d_item.pop("lng", None)
                day["items"][i] = d_item

        state_json = json.dumps(dump, indent=2)

        prompt = f"""You are NaviiGo's expert AI travel planner. The user wants to modify their itinerary.

CURRENT TRIP STATE:
{state_json}

USER MESSAGE:
{user_message}

INSTRUCTIONS:
1. Reason about the requested change in 'thoughts'.
2. Generate the precise series of 'mutations' needed to implement the changes. Use exact UUIDs from the state above!
3. Provide a friendly 'reply' to the user confirming the changes. Keep it short and conversational.

WARNING:
- Only generate mutations if the user is asking to change the trip.
- If they are just asking a question, mutations should be empty.
"""

        # 3. Call Gemini
        response = await self.client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AICopilotResponse,
                temperature=0.2,
            ),
        )

        raw_json = response.text
        ai_resp = AICopilotResponse.model_validate_json(raw_json)

        # 4. Apply mutations sequentially
        for mutation in ai_resp.mutations:
            await self._apply_mutation(trip_id, user_id, mutation)

        # 5. Return updated trip
        updated_trip = await self.service.get(trip_id)
        updated_read = self.service.to_read(updated_trip, include_budget=True)

        return ai_resp, updated_read.model_dump(exclude_unset=True, mode="json")

    async def _apply_mutation(
        self, trip_id: uuid.UUID, user_id: uuid.UUID, mut: AIMutation
    ) -> None:
        # Re-fetch trip for each mutation in case of concurrent issues,
        # though this assumes sequential application in one UoW.
        trip = await self.service.get(trip_id)

        if mut.action == "add_day":
            await self.service.add_day(
                trip, user_id, TripDayIn(title=mut.title)
            )

        elif mut.action == "add_item":
            # Just put it at the end of the day for simplicity since positioning logic
            # requires fetching current day's items and sorting, or we can use the position max
            day = next((d for d in trip.days if d.id == mut.day_id), None)
            if not day:
                return  # Skip invalid AI refs

            pos = len(day.items) + 1
            if mut.position_after_item:
                target_idx = next(
                    (i for i, x in enumerate(day.items) if x.id == mut.position_after_item), -1
                )
                if target_idx >= 0:
                    pos = day.items[target_idx].position + 1
                    # Shift others (handled optionally, but basic append is safer pending full impl)

            pricing = {}
            if mut.estimated_price_inr:
                pricing = {"amount": str(mut.estimated_price_inr), "source": "ESTIMATED"}

            await self.service.add_item(
                trip,
                user_id,
                mut.day_id,
                TripItemIn(
                    position=pos,
                    item_type=mut.item_type,
                    name=mut.name,
                    lat=0, lng=0,  # AI doesn't know exact coordinates usually
                    source_type=SourceType.AI_GENERATED,
                    pricing=pricing,
                    metadata={"CopilotNote": "Generated by AI"},
                )
            )

        elif mut.action == "remove_item":
            await self.service.remove_item(trip, user_id, mut.item_id)

        elif mut.action == "update_item":
            ui = TripItemUpdate()
            if mut.name is not None:
                ui.name = mut.name
            if mut.estimated_price_inr is not None:
                ui.pricing = {"amount": str(mut.estimated_price_inr), "source": "ESTIMATED"}
            if ui.model_dump(exclude_unset=True):
                await self.service.update_item(trip, user_id, mut.item_id, ui)

        elif mut.action == "change_status":
            await self.service.transition(
                trip, user_id, TripStatusUpdate(status=mut.status)
            )

        elif mut.action == "undo":
            await self.service.undo(trip, user_id)
