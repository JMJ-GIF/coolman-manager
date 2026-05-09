from sqlalchemy.sql import text
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException

from db import get_db
from product.accounting.router import router
from product.accounting.schema import MemberTypeUpsert, RecordUpdate


@router.put("/member_type")
def upsert_member_type(data: MemberTypeUpsert, db: Session = Depends(get_db)):
    m1 = (data.quarter - 1) * 3 + 1
    months = [m1, m1 + 1, m1 + 2]
    for month in months:
        db.execute(text(
            f"INSERT INTO member_types (user_idx, year, month, member_type) "
            f"VALUES ({data.user_idx}, {data.year}, {month}, '{data.member_type}') "
            f"ON CONFLICT (user_idx, year, month) DO UPDATE SET member_type = '{data.member_type}'"
        ))
    db.commit()
    return {"ok": True}


@router.put("/member_type/month")
def upsert_member_type_month(
    user_idx: int,
    year: int,
    month: int,
    member_type: str,
    db: Session = Depends(get_db)
):
    db.execute(text(
        f"INSERT INTO member_types (user_idx, year, month, member_type) "
        f"VALUES ({user_idx}, {year}, {month}, '{member_type}') "
        f"ON CONFLICT (user_idx, year, month) DO UPDATE SET member_type = '{member_type}'"
    ))
    db.commit()
    return {"ok": True}


@router.put("/records/{record_idx}")
def update_accounting_record(
    record_idx: int,
    data: RecordUpdate,
    db: Session = Depends(get_db)
):
    existing = db.execute(text(
        f"SELECT record_idx FROM accounting_records WHERE record_idx = {record_idx}"
    )).scalar()
    if not existing:
        raise HTTPException(status_code=404, detail="Record not found")

    fields = []
    if data.dt is not None:
        fields.append(f"dt = '{data.dt}'")
    if data.fee_type is not None:
        fields.append(f"fee_type = '{data.fee_type}'")
    if data.amount is not None:
        fields.append(f"amount = {data.amount}")
    if data.paid_amount is not None:
        fields.append(f"paid_amount = {data.paid_amount}")
    if data.note is not None:
        fields.append(f"note = '{data.note}'")
    elif data.note == "":
        fields.append("note = NULL")
    if data.match_idx is not None:
        fields.append(f"match_idx = {data.match_idx}")

    if not fields:
        return {"ok": True}

    db.execute(text(
        f"UPDATE accounting_records SET {', '.join(fields)} WHERE record_idx = {record_idx}"
    ))
    db.commit()
    return {"ok": True}
