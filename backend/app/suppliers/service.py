from __future__ import annotations

import importlib
import uuid
from typing import Dict, List, Type

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import Supplier
from app.suppliers.adapters.base import BaseSupplierAdapter
from app.suppliers.schemas import OfferSearchQuery, SupplierOfferRead, SupplierRead


class SupplierService:
    """
    Service layer for supplier operations.
    Manages loading suppliers and delegating to their respective adapters.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self._adapter_cache: Dict[str, Type[BaseSupplierAdapter]] = {}

    def _get_adapter_class(self, supplier_kind: str) -> Type[BaseSupplierAdapter]:
        """
        Return the adapter class for a given supplier kind.
        Caches the result to avoid repeated imports.
        """
        if supplier_kind in self._adapter_cache:
            return self._adapter_cache[supplier_kind]

        # Mapping of supplier kind to adapter module and class.
        # In a real system, this might be configurable or discovered via plugins.
        # NOTE: NaviiGo books via affiliate redirect (TravelPayouts, OTAs) — no
        # Amadeus/GDS creds. Adapters live under app/suppliers/adapters/ as they
        # are implemented per supplier.
        kind_to_adapter = {
            "LIVE_API": ("app.suppliers.adapters.travelpayouts", "TravelpayoutsAdapter"),
            "MANUAL": ("app.suppliers.adapters.manual_adapters.manual", "ManualAdapter"),
            "INTERNAL": ("app.suppliers.adapters.internal", "InternalAdapter"),
            "AGGREGATOR": ("app.suppliers.adapters.aggregator", "AggregatorAdapter"),
        }

        module_class = kind_to_adapter.get(supplier_kind)
        if module_class is None:
            # No fallback: unknown supplier kind is a configuration error.
            from app.core.errors import InvalidStateTransition
            raise InvalidStateTransition(f"No adapter configured for supplier kind '{supplier_kind}'")

        module_name, class_name = module_class
        module = importlib.import_module(module_name)
        adapter_class = getattr(module, class_name)
        self._adapter_cache[supplier_kind] = adapter_class
        return adapter_class

    async def _get_supplier_adapter(self, supplier: Supplier) -> BaseSupplierAdapter:
        """
        Instantiate the appropriate adapter for a supplier.
        """
        adapter_class = self._get_adapter_class(supplier.kind.value)
        return adapter_class(supplier)

    async def search_offers(
        self, query: OfferSearchQuery, supplier_ids: List[uuid.UUID] | None = None
    ) -> List[SupplierOfferRead]:
        """
        Search for offers across suppliers (optionally filtered by supplier IDs).
        Returns a list of normalized SupplierOfferRead models.
        """
        # Build the supplier query
        stmt = select(Supplier).where(Supplier.is_active == True)
        if supplier_ids:
            stmt = stmt.where(Supplier.id.in_(supplier_ids))
        result = await self.db.execute(stmt)
        suppliers = result.scalars().all()

        # Search each supplier and aggregate results
        all_offers: List[SupplierOfferRead] = []
        for supplier in suppliers:
            adapter = await self._get_supplier_adapter(supplier)
            try:
                offers = await adapter.search_offers(query)
                # Convert to read models (including supplier info)
                for offer in offers:
                    all_offers.append(
                        SupplierOfferRead(
                            id=offer.id,
                            supplier_id=offer.supplier_id,
                            external_id=offer.external_id,
                            kind=offer.kind,
                            name=offer.name,
                            description=offer.description,
                            price=offer.price,
                            original_price=offer.original_price,
                            currency=offer.currency,
                            quantity=offer.quantity,
                            city=offer.city,
                            lat=offer.lat,
                            lng=offer.lng,
                            availability=offer.availability,
                            terms=offer.terms,
                            status=offer.status,
                            expires_at=offer.expires_at,
                            fetched_at=offer.fetched_at,
                        )
                    )
            except Exception as e:
                # In production, we'd log the error and continue
                # For now, we'll just skip this supplier
                print(f"Error searching offers from supplier {supplier.name}: {e}")
                continue

        return all_offers

    async def get_suppliers(self) -> List[SupplierRead]:
        """
        Return a list of all active suppliers.
        """
        stmt = select(Supplier).where(Supplier.is_active == True)
        result = await self.db.execute(stmt)
        suppliers = result.scalars().all()
        return [
            SupplierRead(
                id=s.id,
                name=s.name,
                display_name=s.display_name,
                kind=s.kind,
                capabilities=s.capabilities,
                is_active=s.is_active,
            )
            for s in suppliers
        ]

    async def get_offer_by_id(
        self, supplier_id: uuid.UUID, offer_id: uuid.UUID
    ) -> SupplierOfferRead | None:
        """
        Get a specific offer by its ID and supplier ID.
        Returns None if not found.
        """
        from app.db.models import SupplierOffer

        stmt = select(SupplierOffer).where(
            SupplierOffer.id == offer_id,
            SupplierOffer.supplier_id == supplier_id
        )
        result = await self.db.execute(stmt)
        offer = result.scalar_one_or_none()

        if offer is None:
            return None

        return SupplierOfferRead(
            id=offer.id,
            supplier_id=offer.supplier_id,
            external_id=offer.external_id,
            kind=offer.kind,
            name=offer.name,
            description=offer.description,
            price=offer.price,
            original_price=offer.original_price,
            currency=offer.currency,
            quantity=offer.quantity,
            city=offer.city,
            lat=offer.lat,
            lng=offer.lng,
            availability=offer.availability,
            terms=offer.terms,
            status=offer.status,
            expires_at=offer.expires_at,
            fetched_at=offer.fetched_at,
        )