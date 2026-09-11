from __future__ import annotations
import uuid
import abc
from datetime import datetime

from app.db.models import Supplier, SupplierOffer
from app.suppliers.schemas import OfferSearchQuery

class BaseSupplierAdapter(abc.ABC):
    """
    Interface for all supplier integrations.
    Each adapter handles translation between the common NaviiGo schema
    and the specific external supplier's schema.
    """

    def __init__(self, supplier: Supplier):
        self.supplier = supplier

    @abc.abstractmethod
    async def search_offers(self, query: OfferSearchQuery) -> list[SupplierOffer]:
        """
        Search the external API for offers matching the query,
        normalizing the responses into SupplierOffer models (unsaved).
        """
        pass

    @abc.abstractmethod
    async def fetch_offer_details(self, external_id: str, kind: str) -> SupplierOffer | None:
        """
        Fetch details for a specific offer from the external API to refresh pricing
        and availability.
        """
        pass
