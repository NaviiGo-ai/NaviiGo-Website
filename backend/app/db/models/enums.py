# ─── Shared enums for the transactional domain ───────────────────────────────
# These are the single source of truth for statuses and data provenance across
# the backend. Values are stable strings stored in PostgreSQL; never reorder.
from __future__ import annotations

import enum


# ── Data provenance ──────────────────────────────────────────────────────────
# Every piece of user-facing data carries one of these. The browser shows a
# subtle "live" / "estimated" / "AI" badge based on the value.
class SourceType(str, enum.Enum):
    VERIFIED_LIVE = "VERIFIED_LIVE"      # live API response, verified at fetch time
    VERIFIED_STATIC = "VERIFIED_STATIC"  # vetted static data (curated CSV, wiki)
    USER_PROVIDED = "USER_PROVIDED"      # supplied by the user themselves
    ESTIMATED = "ESTIMATED"              # computed estimate with a disclosed formula
    AI_GENERATED = "AI_GENERATED"        # produced by an LLM; must be flagged in UI
    PLACEHOLDER = "PLACEHOLDER"          # temporary stand-in until real data exists
    UNAVAILABLE = "UNAVAILABLE"          # explicitly absent, not an error


# ── Trip lifecycle ───────────────────────────────────────────────────────────
# Server owns this. The browser can only request transitions; the service
# validates them and persists the new state in PostgreSQL.
class TripStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PLANNING = "PLANNING"            # AI is assembling the itinerary
    READY = "READY"                  # itinerary finalized, not yet booked
    PARTIALLY_BOOKED = "PARTIALLY_BOOKED"
    BOOKED = "BOOKED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    ARCHIVED = "ARCHIVED"


# ── Booking lifecycle ────────────────────────────────────────────────────────
class BookingStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SELECTED = "SELECTED"                          # user picked an offer
    PRICE_CHECK_REQUIRED = "PRICE_CHECK_REQUIRED"  # offer stale; re-quote before payment
    PRICING = "PRICING"                            # supplier price check in flight
    PRICE_CONFIRMED = "PRICE_CONFIRMED"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    PAYMENT_VERIFIED = "PAYMENT_VERIFIED"
    BOOKING_PENDING = "BOOKING_PENDING"            # supplier confirm in flight
    CONFIRMED = "CONFIRMED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"
    EXPIRED = "EXPIRED"                            # offer/price TTL passed


# ── Payment lifecycle ────────────────────────────────────────────────────────
class PaymentStatus(str, enum.Enum):
    CREATED = "CREATED"                # Razorpay order created
    ATTEMPTED = "ATTEMPTED"            # a payment attempt exists, not verified
    CAPTURED = "CAPTURED"
    VERIFIED = "VERIFIED"              # server-side signature + amount verified
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED"
    EXPIRED = "EXPIRED"


class PaymentMethod(str, enum.Enum):
    CARD = "card"
    UPI = "upi"
    NETBANKING = "netbanking"
    WALLET = "wallet"
    EMI = "emi"


# ── Bookable item kinds ──────────────────────────────────────────────────────
class ItemKind(str, enum.Enum):
    FLIGHT = "FLIGHT"
    HOTEL = "HOTEL"
    TRAIN = "TRAIN"
    CAB = "CAB"
    ACTIVITY = "ACTIVITY"
    INSURANCE = "INSURANCE"
    PACKAGE = "PACKAGE"
    OTHER = "OTHER"


# ── Supplier bookability ─────────────────────────────────────────────────────
class SupplierKind(str, enum.Enum):
    LIVE_API = "LIVE_API"              # TravelPayouts, SerpAPI-backed suppliers, etc.
    MANUAL = "MANUAL"                  # staff-confirmed (phone/email)
    INTERNAL = "INTERNAL"              # NaviiGo-arranged inventory
    AGGREGATOR = "AGGREGATOR"          # meta-search passthrough


class OfferStatus(str, enum.Enum):
    VALID = "VALID"
    EXPIRED = "EXPIRED"                # price/availability TTL passed
    USED = "USED"                      # booked via this offer
    REVOKED = "REVOKED"                # supplier withdrew it


class TransactionStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    TIMEOUT = "TIMEOUT"


class SupplierTxType(str, enum.Enum):
    SEARCH = "SEARCH"
    PRICE_CHECK = "PRICE_CHECK"
    HOLD = "HOLD"
    CONFIRM = "CONFIRM"
    CANCEL = "CANCEL"
    REFUND = "REFUND"
    STATUS = "STATUS"
    ISSUE = "ISSUE"


# ── Actor in trip events / versions ──────────────────────────────────────────
class ActorType(str, enum.Enum):
    USER = "user"
    AI = "ai"
    SYSTEM = "system"
