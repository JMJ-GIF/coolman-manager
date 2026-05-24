from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from fastapi import Depends

from db import get_db
from auth.dependencies import get_current_user
from product.playfield.router import router


@router.put("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_idx = current_user["user_idx"]
    db.execute(
        text("""
            INSERT INTO playground_reads (user_idx, announcement_id)
            SELECT :user_idx, id FROM playground_announcements
            ON CONFLICT DO NOTHING
        """),
        {"user_idx": user_idx},
    )
    db.commit()
    return {"ok": True}


@router.put("/{announcement_id}/read")
def mark_as_read(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_idx = current_user["user_idx"]
    db.execute(
        text("""
            INSERT INTO playground_reads (user_idx, announcement_id)
            VALUES (:user_idx, :announcement_id)
            ON CONFLICT DO NOTHING
        """),
        {"user_idx": user_idx, "announcement_id": announcement_id},
    )
    db.commit()
    return {"ok": True}
