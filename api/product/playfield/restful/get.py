from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from fastapi import Depends, Query

from db import get_db
from auth.dependencies import get_current_user
from product.playfield.router import router
from product.playfield.schema import PlayfieldAnnouncement


@router.get("/status")
def get_crawler_status(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    row = db.execute(
        text("SELECT value FROM crawler_metadata WHERE key = 'last_crawled_at'")
    ).fetchone()
    return {"last_crawled_at": row[0] if row else None}


@router.get("", response_model=List[PlayfieldAnnouncement])
def get_announcements(
    school: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_idx = current_user["user_idx"]

    base_sql = """
        SELECT
            pa.id,
            pa.school_name,
            pa.title,
            pa.upload_date,
            pa.link,
            pa.created_at,
            (pr.user_idx IS NULL) AS is_new
        FROM playground_announcements pa
        LEFT JOIN playground_reads pr
            ON pr.announcement_id = pa.id AND pr.user_idx = :user_idx
        {where}
        ORDER BY
            CASE
                WHEN pa.upload_date ~ '^\d{{4}}[.\-]\d{{1,2}}[.\-]\d{{1,2}}$'
                THEN TO_DATE(REGEXP_REPLACE(pa.upload_date, '[.]', '-', 'g'), 'YYYY-MM-DD')
                ELSE NULL
            END DESC NULLS LAST,
            pa.created_at DESC
    """

    if school:
        sql = base_sql.format(where="WHERE pa.school_name = :school")
        result = db.execute(text(sql), {"user_idx": user_idx, "school": school}).mappings().all()
    else:
        sql = base_sql.format(where="")
        result = db.execute(text(sql), {"user_idx": user_idx}).mappings().all()

    return result
