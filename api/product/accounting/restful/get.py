from datetime import date
from typing import List, Optional
from sqlalchemy.sql import text
from sqlalchemy.orm import Session
from fastapi import Depends, Query

from db import get_db
from product.accounting.router import router
from product.accounting.schema import AccountingSummary, AccountingRecord


def quarter_months(quarter: int):
    m1 = (quarter - 1) * 3 + 1
    return m1, m1 + 1, m1 + 2


@router.get("", response_model=List[AccountingSummary])
def get_accounting_summary(
    year: int = Query(...),
    quarter: int = Query(...),
    db: Session = Depends(get_db)
):
    m1, m2, m3 = quarter_months(quarter)
    sql = f"""
        SELECT
            u.user_idx,
            u.name,
            u.back_number,
            (
                SELECT mt.member_type
                FROM member_types mt
                WHERE mt.user_idx = u.user_idx
                  AND mt.year = {year}
                  AND mt.month BETWEEN {m1} AND {m3}
                ORDER BY mt.month DESC
                LIMIT 1
            ) AS member_type,
            COALESCE(SUM(ar.amount), 0) AS total_amount,
            COALESCE(SUM(ar.paid_amount), 0) AS total_paid,
            COUNT(CASE WHEN ar.fee_type = '휴회경기참가비' THEN 1 END) AS match_participation_cnt,
            NULLIF(STRING_AGG(ar.note, ', ') FILTER (WHERE ar.note IS NOT NULL AND ar.note != ''), '') AS note
        FROM users u
        LEFT JOIN accounting_records ar
            ON ar.user_idx = u.user_idx
            AND EXTRACT(YEAR FROM ar.dt)::int = {year}
            AND EXTRACT(MONTH FROM ar.dt)::int BETWEEN {m1} AND {m3}
        WHERE u.role != '용병'
        GROUP BY u.user_idx, u.name, u.back_number
        ORDER BY u.back_number
    """
    result = db.execute(text(sql)).mappings().all()
    return result


@router.get("/records/{user_idx}", response_model=List[AccountingRecord])
def get_user_accounting_records(
    user_idx: int,
    year: int = Query(...),
    quarter: int = Query(...),
    db: Session = Depends(get_db)
):
    m1, m2, m3 = quarter_months(quarter)
    sql = f"""
        SELECT
            ar.record_idx,
            ar.user_idx,
            ar.dt,
            ar.fee_type,
            ar.amount,
            ar.paid_amount,
            ar.note,
            ar.match_idx,
            m.opposing_team
        FROM accounting_records ar
        LEFT JOIN matches m ON ar.match_idx = m.match_idx
        WHERE ar.user_idx = {user_idx}
          AND EXTRACT(YEAR FROM ar.dt)::int = {year}
          AND EXTRACT(MONTH FROM ar.dt)::int BETWEEN {m1} AND {m3}
        ORDER BY ar.dt, ar.record_idx
    """
    result = db.execute(text(sql)).mappings().all()
    return result
