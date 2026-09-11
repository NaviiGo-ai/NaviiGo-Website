# ─── Typed application errors with machine-readable codes ──────────────────────
# Errors are never swallowed into fake successes. Every failure surfaces a
# stable code the frontend can branch on, plus a safe user-facing message.
from __future__ import annotations

from typing import Any, Optional


class AppError(Exception):
    """Base application error carrying a machine-readable code."""

    code: str = "INTERNAL_ERROR"
    status_code: int = 500
    user_message: str = "Something went wrong. Please try again."

    def __init__(
        self,
        user_message: Optional[str] = None,
        *,
        code: Optional[str] = None,
        status_code: Optional[int] = None,
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        if user_message:
            self.user_message = user_message
        if code:
            self.code = code
        if status_code:
            self.status_code = status_code
        self.details = details or {}
        super().__init__(f"[{self.code}] {self.user_message}")


class AuthRequiredError(AppError):
    code = "AUTH_REQUIRED"
    status_code = 401
    user_message = "Please sign in to continue."


class ForbiddenError(AppError):
    code = "FORBIDDEN"
    status_code = 403
    user_message = "You do not have access to this resource."


class ValidationAppError(AppError):
    code = "VALIDATION_ERROR"
    status_code = 422
    user_message = "The request is missing required information."


class TripNotFoundError(AppError):
    code = "TRIP_NOT_FOUND"
    status_code = 404
    user_message = "We couldn't find that trip."


class BookingNotFoundError(AppError):
    code = "BOOKING_NOT_FOUND"
    status_code = 404
    user_message = "We couldn't find that booking."


class SupplierUnavailableError(AppError):
    code = "SUPPLIER_UNAVAILABLE"
    status_code = 503
    user_message = "Live inventory is temporarily unavailable. Please try again in a moment."


class OfferExpiredError(AppError):
    code = "OFFER_EXPIRED"
    status_code = 409
    user_message = "This option's price has expired. Please re-check availability."


class PriceChangedError(AppError):
    code = "PRICE_CHANGED"
    status_code = 409
    user_message = "The price for this option has changed. Please review the new price before paying."


class PaymentFailedError(AppError):
    code = "PAYMENT_FAILED"
    status_code = 402
    user_message = "The payment could not be completed."


class PaymentError(AppError):
    code = "PAYMENT_ERROR"
    status_code = 402
    user_message = "The payment could not be completed."


class BookingFailedError(AppError):
    code = "BOOKING_FAILED"
    status_code = 502
    user_message = "The booking could not be completed. Our team has been notified — you will not be charged twice."


class AIUnavailableError(AppError):
    code = "AI_UNAVAILABLE"
    status_code = 503
    user_message = "The AI copilot is temporarily unavailable. Please try again shortly."


class RateLimitedAppError(AppError):
    code = "RATE_LIMITED"
    status_code = 429
    user_message = "Too many requests. Please slow down and try again shortly."


class UnsafeUrlError(AppError):
    code = "UNSAFE_URL"
    status_code = 400
    user_message = "This link cannot be opened for safety reasons."


class InvalidStateTransition(AppError):
    code = "INVALID_STATE"
    status_code = 409
    user_message = "This action isn't available for the current state of this item."


# ─── FastAPI exception handler ────────────────────────────────────────────────
# Maps any AppError subclass to a stable JSON error body so callers never see a
# bare 500. Register via `register_app_error_handler(app)` in the app factory.
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


def _app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.user_message,
                "details": exc.details,
            }
        },
    )


def register_app_error_handler(app: FastAPI) -> None:
    app.add_exception_handler(AppError, _app_error_handler)
