from __future__ import annotations

import uuid
from typing import Annotated, Literal

from pydantic import BaseModel, Field

from app.db.models.enums import TripStatus


class AIMutationBase(BaseModel):
    pass


class AIAddItem(AIMutationBase):
    action: Literal["add_item"] = "add_item"
    day_id: uuid.UUID = Field(
        description="The ID of the day to add the item to."
    )
    name: str = Field(
        description="The name of the place, activity, or restaurant."
    )
    item_type: Literal["attraction", "activity", "restaurant", "hotel", "transport"]
    estimated_price_inr: float | None = Field(
        None, description="Estimated price in INR (if known/guessable by AI)."
    )
    position_after_item: uuid.UUID | None = Field(
        None, description="ID of the item this should follow. Null for end of day."
    )


class AIRemoveItem(AIMutationBase):
    action: Literal["remove_item"] = "remove_item"
    item_id: uuid.UUID = Field(
        description="The ID of the item to remove."
    )


class AIUpdateItem(AIMutationBase):
    action: Literal["update_item"] = "update_item"
    item_id: uuid.UUID = Field(
        description="The ID of the item to update."
    )
    name: str | None = None
    estimated_price_inr: float | None = None
    # Add more as needed


class AIAddDay(AIMutationBase):
    action: Literal["add_day"] = "add_day"
    title: str = Field(
        description="Title for the new day, e.g., 'Day Trip to Taj Mahal'."
    )


class AIChangeFormat(AIMutationBase):
    action: Literal["change_status"] = "change_status"
    status: TripStatus = Field(
        description="The new status to transition the trip to."
    )


class AIUndo(AIMutationBase):
    action: Literal["undo"] = "undo"
    reason: str | None = Field(
        None, description="Why the AI chose to rollback the trip."
    )


AIMutation = Annotated[
    AIAddItem | AIRemoveItem | AIUpdateItem | AIAddDay | AIChangeFormat | AIUndo,
    Field(discriminator="action")
]


class AICopilotResponse(BaseModel):
    thoughts: str = Field(
        description="Private scratchpad for the AI to reason about the user's request."
    )
    reply: str = Field(
        description="The conversational text returned to the user explaining what was done."
    )
    mutations: list[AIMutation] = Field(
        default_factory=list,
        description="The actual changes applied to the trip itinerary."
    )
