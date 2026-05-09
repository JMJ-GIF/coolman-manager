from datetime import date
from sqlalchemy.sql import text
from sqlalchemy.orm import Session
from fastapi import Depends, Query, HTTPException

from db import get_db
from product.accounting.router import router
from product.accounting.schema import RecordCreate

FEE_AMOUNTS = {
    '분기회비': 75000,
    '월회비': 27000,
    '휴회비': 10000,
    '휴회경기참가비': 9000,
}


@router.post("/generate")
def generate_accounting_records(
    year: int = Query(...),
    quarter: int = Query(...),
    db: Session = Depends(get_db)
):
    m1 = (quarter - 1) * 3 + 1
    months = [m1, m1 + 1, m1 + 2]
    first_day = date(year, m1, 1)

    users = db.execute(text(
        "SELECT user_idx FROM users WHERE role != '용병'"
    )).mappings().all()

    created = 0

    for user in users:
        uid = user['user_idx']

        types_result = db.execute(text(
            f"SELECT month, member_type FROM member_types "
            f"WHERE user_idx = {uid} AND year = {year} "
            f"AND month BETWEEN {months[0]} AND {months[2]}"
        )).mappings().all()
        type_by_month = {r['month']: r['member_type'] for r in types_result}

        first_type = type_by_month.get(months[0])

        # 분기회비 (정회원)
        if first_type == '정회원':
            exists = db.execute(text(
                f"SELECT 1 FROM accounting_records "
                f"WHERE user_idx = {uid} AND dt = '{first_day}' AND fee_type = '분기회비'"
            )).scalar()
            if not exists:
                db.execute(text(
                    f"INSERT INTO accounting_records (user_idx, dt, fee_type, amount) "
                    f"VALUES ({uid}, '{first_day}', '분기회비', 75000)"
                ))
                created += 1

        # 휴회비 (휴회원)
        if first_type == '휴회원':
            exists = db.execute(text(
                f"SELECT 1 FROM accounting_records "
                f"WHERE user_idx = {uid} AND dt = '{first_day}' AND fee_type = '휴회비'"
            )).scalar()
            if not exists:
                db.execute(text(
                    f"INSERT INTO accounting_records (user_idx, dt, fee_type, amount) "
                    f"VALUES ({uid}, '{first_day}', '휴회비', 10000)"
                ))
                created += 1

        # 월회비 (월회원 — 월별)
        for month in months:
            if type_by_month.get(month) == '월회원':
                month_day = date(year, month, 1)
                exists = db.execute(text(
                    f"SELECT 1 FROM accounting_records "
                    f"WHERE user_idx = {uid} AND dt = '{month_day}' AND fee_type = '월회비'"
                )).scalar()
                if not exists:
                    db.execute(text(
                        f"INSERT INTO accounting_records (user_idx, dt, fee_type, amount) "
                        f"VALUES ({uid}, '{month_day}', '월회비', 27000)"
                    ))
                    created += 1

        # 휴회경기참가비 (휴회원이 경기에 참가한 경우)
        is_suspended = any(type_by_month.get(m) == '휴회원' for m in months)
        if is_suspended:
            matches = db.execute(text(
                f"SELECT DISTINCT m.match_idx, m.dt FROM matches m "
                f"JOIN quarters q ON m.match_idx = q.match_idx "
                f"JOIN quarters_lineup ql ON q.quarter_idx = ql.quarter_idx "
                f"WHERE ql.player_idx = {uid} "
                f"AND EXTRACT(YEAR FROM m.dt)::int = {year} "
                f"AND EXTRACT(MONTH FROM m.dt)::int BETWEEN {months[0]} AND {months[2]}"
            )).mappings().all()

            for match in matches:
                exists = db.execute(text(
                    f"SELECT 1 FROM accounting_records "
                    f"WHERE user_idx = {uid} AND match_idx = {match['match_idx']} "
                    f"AND fee_type = '휴회경기참가비'"
                )).scalar()
                if not exists:
                    db.execute(text(
                        f"INSERT INTO accounting_records (user_idx, dt, fee_type, amount, match_idx) "
                        f"VALUES ({uid}, '{match['dt']}', '휴회경기참가비', 9000, {match['match_idx']})"
                    ))
                    created += 1

    db.commit()
    return {"created": created, "year": year, "quarter": quarter}


@router.post("/records")
def create_accounting_record(data: RecordCreate, db: Session = Depends(get_db)):
    match_val = f"{data.match_idx}" if data.match_idx else "NULL"
    note_val = f"'{data.note}'" if data.note else "NULL"
    sql = (
        f"INSERT INTO accounting_records (user_idx, dt, fee_type, amount, paid_amount, note, match_idx) "
        f"VALUES ({data.user_idx}, '{data.dt}', '{data.fee_type}', {data.amount}, "
        f"{data.paid_amount}, {note_val}, {match_val}) "
        f"RETURNING record_idx"
    )
    result = db.execute(text(sql)).mappings().first()
    db.commit()
    return {"record_idx": result['record_idx']}
