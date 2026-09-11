# ─── Budget engine ───────────────────────────────────────────────────────────
# Derives the trip budget from actual TripItems (never fabricated). Each item's
# pricing JSON carries a `source` (provenance) and the item's own source_type;
# the engine aggregates by category and reports both planned and booked totals.
# A booked item is one with a supplier_offer_id or booking_id — real money.
from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal

from app.db.models import Trip, TripItem
from app.db.models.enums import SourceType

# Category → which item_types roll up into it.
_CATEGORY_ITEM_TYPES: dict[str, tuple[str, ...]] = {
    "transport": ("flight", "train", "transit", "cab"),
    "stay": ("hotel", "stay"),
    "food": ("restaurant",),
    "activities": ("attraction", "activity"),
    "local_travel": ("auto", "taxi", "metro", "ferry"),
}

_CATEGORY_LABELS: dict[str, str] = {
    "transport": "Transport",
    "stay": "Stay",
    "food": "Food & drinks",
    "activities": "Activities",
    "local_travel": "Local travel",
    "fees": "Fees & misc",
}

CONTINGENCY_RATE = Decimal("0.05")

# Worst provenance of anything in a category wins (so one AI price marks the
# whole bucket as not-live). Order: UNAVAILABLE < AI_GENERATED < ESTIMATED <
# USER_PROVIDED < VERIFIED_STATIC < VERIFIED_LIVE. The bucket starts at the
# best rank (VERIFIED_LIVE) so the first real item's source becomes the floor.
_SOURCE_RANK = {
    SourceType.VERIFIED_LIVE: 5,
    SourceType.VERIFIED_STATIC: 4,
    SourceType.USER_PROVIDED: 3,
    SourceType.ESTIMATED: 2,
    SourceType.AI_GENERATED: 1,
    SourceType.PLACEHOLDER: 1,
    SourceType.UNAVAILABLE: 0,
}


@dataclass
class BudgetCategoryResult:
    category: str
    label: str
    planned: Decimal = Decimal("0")
    booked: Decimal = Decimal("0")
    item_count: int = 0
    source: SourceType = SourceType.UNAVAILABLE


@dataclass
class BudgetResult:
    currency: str = "INR"
    total_planned: Decimal = Decimal("0")
    total_booked: Decimal = Decimal("0")
    budget_total: Decimal | None = None
    remaining: Decimal | None = None
    contingency: Decimal = Decimal("0")
    categories: list[BudgetCategoryResult] = field(default_factory=list)
    source: SourceType = SourceType.ESTIMATED


def _item_amount(item: TripItem) -> Decimal:
    """Extract the money value from an item's pricing JSON, if present.

    Accepted shapes:
      {"price": 500}          — plain number or string
      {"entryFee": 500}
      {"amount": 500}
    Returns Decimal("0") when there is no price (activity without an entry fee
    is genuinely ₹0, not a fabricated estimate).
    """
    pricing = item.pricing or {}
    for key in ("price", "amount", "entryFee", "total"):
        raw = pricing.get(key)
        if raw is None:
            continue
        try:
            return Decimal(str(raw)).quantize(Decimal("0.01"))
        except (ValueError, TypeError, ArithmeticError):
            continue
    return Decimal("0")


def _category_of(item: TripItem) -> str | None:
    it = (item.item_type or "").lower()
    for category, types in _CATEGORY_ITEM_TYPES.items():
        if it in types:
            return category
    return None


def _worst_source(a: SourceType, b: SourceType) -> SourceType:
    if _SOURCE_RANK.get(a, 0) <= _SOURCE_RANK.get(b, 0):
        return a
    return b


def compute_budget(items: list[TripItem], *, currency: str = "INR",
                   budget_total: Decimal | None = None) -> BudgetResult:
    """Aggregate item prices into a budget breakdown with honest provenance.

    Pure function of the trip's items — never reads random numbers, never
    invents prices. Categories with zero items are omitted.
    """
    cats: dict[str, BudgetCategoryResult] = {}

    for item in items:
        category = _category_of(item)
        if category is None:
            continue
        amount = _item_amount(item)
        bucket = cats.setdefault(
            category,
            BudgetCategoryResult(
                category=category,
                label=_CATEGORY_LABELS.get(category, category),
                # Best-rank sentinel: worst-wins folds below it.
                source=SourceType.VERIFIED_LIVE,
            ),
        )
        bucket.item_count += 1
        bucket.planned += amount
        if item.supplier_offer_id or item.booking_id:
            bucket.booked += amount
        bucket.source = _worst_source(bucket.source, item.source_type)

    result = BudgetResult(
        currency=currency,
        budget_total=budget_total,
        categories=[cats[k] for k in sorted(cats)],
    )
    for bucket in result.categories:
        result.total_planned += bucket.planned
        result.total_booked += bucket.booked
        result.source = _worst_source(result.source, bucket.source)

    # A fully-booked trip with live/static sources is more than an estimate.
    if result.total_planned > 0 and result.total_booked == result.total_planned:
        if result.source in (SourceType.AI_GENERATED, SourceType.ESTIMATED):
            result.source = SourceType.ESTIMATED

    result.contingency = (result.total_planned * CONTINGENCY_RATE).quantize(Decimal("0.01"))
    if result.budget_total is not None:
        result.remaining = result.budget_total - result.total_planned
    return result
