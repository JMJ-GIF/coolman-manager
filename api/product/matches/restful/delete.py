from sqlalchemy.sql import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, Depends, Query, Request

from db import get_db
from product.matches.schema import *
from product.matches.router import router
from auth.dependencies import check_member_permission
from auth.jwt import verify_token
from image_client import delete_match_image

@router.delete("")
def delete_matches(request: Request, match_ids: List[int] = Query(...), db: Session = Depends(get_db)):
    
    # Demo 세션 체크 - demo 세션이면 403 에러
    check_member_permission(request)
    
    try:
        with db.begin():
            # 🔹 존재하는 match_idx 조회
            existing_matches = db.execute(
                text("SELECT match_idx FROM matches WHERE match_idx IN :ids"),
                {"ids": tuple(match_ids)}
            ).fetchall()
            existing_match_ids = {m[0] for m in existing_matches}

            # 🔹 삭제 요청한 match_idx 중 존재하지 않는 것 필터링
            invalid_ids = set(match_ids) - existing_match_ids
            if invalid_ids:
                raise HTTPException(status_code=404, detail=f"Matches not found: {list(invalid_ids)}")

            # 🔹 삭제 실행 (ON DELETE CASCADE)
            db.execute(text("DELETE FROM matches WHERE match_idx IN :ids"), {"ids": tuple(match_ids)})

        return {"message": "Matches deleted successfully", "deleted_ids": match_ids}
    
    except SQLAlchemyError as e:
        print(f"SQL Error while inserting quarter: {e}")
        db.rollback()  # 실패 시 모든 작업 롤백
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.delete("/{match_idx}/photo")
def delete_match_photo(match_idx: int, request: Request, db: Session = Depends(get_db)):
    """Delete match photo from storage and database"""

    # Demo 세션 체크 - demo 세션이면 403 에러
    check_member_permission(request)

    # 세션 타입 확인
    token = request.cookies.get("access_token")
    payload = verify_token(token) or {}
    session_type = "demo" if payload.get("session_type") == "demo" else "member"

    try:
        with db.begin():
            # 매치가 존재하는지 확인
            match_exists = db.execute(
                text("SELECT match_idx FROM matches WHERE match_idx = :match_idx"),
                {"match_idx": match_idx}
            ).fetchone()

            if not match_exists:
                raise HTTPException(status_code=404, detail=f"Match {match_idx} not found")

            # S3에서 이미지 삭제
            try:
                delete_match_image(match_idx, session_type)
            except Exception as e:
                print(f"Warning: Failed to delete image from storage: {e}")
                # Storage 삭제 실패해도 DB는 업데이트

            # DB에서 photo_url NULL로 설정
            db.execute(
                text("UPDATE matches SET photo_url = NULL WHERE match_idx = :match_idx"),
                {"match_idx": match_idx}
            )

        return {"message": "Match photo deleted successfully", "match_idx": match_idx}

    except SQLAlchemyError as e:
        print(f"SQL Error while deleting photo: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    except Exception as e:
        print(f"Error deleting match photo: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")