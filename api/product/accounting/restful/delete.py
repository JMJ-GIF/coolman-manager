from sqlalchemy.sql import text
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, Query

from db import get_db
from product.accounting.router import router


@router.delete("/records/{record_idx}")
def delete_accounting_record(record_idx: int, db: Session = Depends(get_db)):
    existing = db.execute(text(
        f"SELECT record_idx FROM accounting_records WHERE record_idx = {record_idx}"
    )).scalar()
    if not existing:
        raise HTTPException(status_code=404, detail="Record not found")
    db.execute(text(f"DELETE FROM accounting_records WHERE record_idx = {record_idx}"))
    db.commit()
    return {"ok": True}


@router.delete("/reset")
def reset_quarter(
    year: int = Query(...),
    quarter: int = Query(...),
    db: Session = Depends(get_db)
):
    m1 = (quarter - 1) * 3 + 1
    m3 = quarter * 3
    db.execute(text(
        f"DELETE FROM accounting_records "
        f"WHERE EXTRACT(YEAR FROM dt)::int = {year} "
        f"AND EXTRACT(MONTH FROM dt)::int BETWEEN {m1} AND {m3}"
    ))
    db.execute(text(
        f"DELETE FROM member_types "
        f"WHERE year = {year} AND month BETWEEN {m1} AND {m3}"
    ))
    db.commit()
    return {"ok": True, "year": year, "quarter": quarter}
