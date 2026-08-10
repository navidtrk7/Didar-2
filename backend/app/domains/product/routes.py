"""Product HTTP routes."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, File, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import get_db
from app.domains import product as product_domain
from app.domains.permissions import require_permission
from app.models import User
from app.schemas import CompleteQcIn, QcOut, SkuOut
from app.services.uploads import save_product_image

router = APIRouter(prefix="/product", tags=["product"])


class CreateSkuIn(BaseModel):
    name: str
    category: str
    sku_code: str
    karat: int = 18
    catalog_weight: float = Field(gt=0)
    collection: str = ""
    image_url: str = ""
    status: str = "draft"
    producer_org: Optional[str] = None


def _sku_out(s) -> SkuOut:
    from app.services.uploads import normalize_image_url

    return SkuOut(
        id=s.id,
        name=s.name,
        category=s.category,
        sku_code=s.sku_code,
        karat=s.karat,
        catalog_weight=s.catalog_weight,
        status=s.status,
        collection=s.collection,
        image_url=normalize_image_url(s.image_url),
        created_at=s.created_label,
        producer_org=getattr(s, "producer_org", None),
    )


def _qc_out(q) -> QcOut:
    return QcOut(
        id=q.id,
        sku_id=q.sku_id,
        physical_code=q.physical_code,
        measured_weight=q.measured_weight,
        result=q.result,
        notes=q.notes,
        inspected_at=q.inspected_label,
        inspector=q.inspector_name,
    )


@router.get("/skus", response_model=list[SkuOut])
def get_skus(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("product.view")),
):
    return [_sku_out(s) for s in product_domain.list_skus(db)]


@router.post("/images")
async def post_product_image(
    file: UploadFile = File(...),
    _user: User = Depends(require_permission("product.sku_create")),
):
    url = await save_product_image(file)
    return {"url": url}


@router.post("/skus", response_model=SkuOut)
def post_sku(
    body: CreateSkuIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("product.sku_create")),
):
    producer_org = body.producer_org
    if not producer_org and user.role == "producer" and user.organization:
        producer_org = user.organization.name
    sku = product_domain.create_sku(
        db,
        name=body.name,
        category=body.category,
        sku_code=body.sku_code,
        karat=body.karat,
        catalog_weight=body.catalog_weight,
        collection=body.collection,
        image_url=body.image_url,
        actor=user.name,
        actor_role=user.role,
        status=body.status,
        producer_org=producer_org,
    )
    return _sku_out(sku)


@router.post("/skus/{sku_id}/send-to-qc", response_model=QcOut)
def post_send_qc(
    sku_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("product.sku_create")),
):
    return _qc_out(product_domain.send_to_qc(db, sku_id=sku_id, actor=user.name))


@router.get("/qc", response_model=list[QcOut])
def get_qc(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("product.view")),
):
    return [_qc_out(q) for q in product_domain.list_qc_queue(db)]


@router.post("/qc/{inspection_id}/complete", response_model=QcOut)
def post_complete_qc(
    inspection_id: str,
    body: CompleteQcIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("product.qc_approve")),
):
    row = product_domain.complete_qc(
        db,
        inspection_id=inspection_id,
        measured_weight=body.measured_weight,
        result=body.result,
        inspector=body.inspector or user.name,
        notes=body.notes,
    )
    return _qc_out(row)


class CollectionOut(BaseModel):
    id: str
    name: str
    slug: str
    status: str
    description: str


class CollectionIn(BaseModel):
    name: str
    description: str = ""


@router.get("/collections", response_model=list[CollectionOut])
def get_collections(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("product.view")),
):
    rows = product_domain.ensure_collections_from_skus(db)
    return [
        CollectionOut(
            id=c.id,
            name=c.name,
            slug=c.slug,
            status=c.status,
            description=c.description,
        )
        for c in rows
    ]


@router.post("/collections", response_model=CollectionOut)
def post_collection(
    body: CollectionIn,
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("product.sku_create")),
):
    c = product_domain.create_collection(
        db, name=body.name, description=body.description
    )
    return CollectionOut(
        id=c.id,
        name=c.name,
        slug=c.slug,
        status=c.status,
        description=c.description,
    )
