import logging
from datetime import datetime
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.sql import text  
from db import get_db
from product.users.router import router
from product.users.schema import UserCreate

logging.basicConfig(level=logging.ERROR)

@router.post("/", status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        join_date = datetime.utcnow()
        
        sql_check_uuid = "SELECT * FROM users WHERE social_uuid = :social_uuid"
        existing_user = db.execute(text(sql_check_uuid), {"social_uuid": user.social_uuid}).mappings().fetchone()
        if existing_user:
            raise HTTPException(
                status_code=409,
                detail={"error_code": "EXISTING_USER", "error_message": "이미 존재하는 유저입니다."}
            )
        
        sql_check_number = "SELECT * FROM users WHERE back_number = :back_number"
        existing_number = db.execute(text(sql_check_number), {"back_number": user.back_number}).mappings().fetchone()
        if existing_number:
            raise HTTPException(
                status_code=409,
                detail={"error_code": "DUPLICATE_BACK_NUMBER", "error_message": "이미 사용 중인 등번호입니다."}
            )
        
        sql_insert_user = """
            INSERT INTO users (name, position, back_number, join_date, role, social_uuid, created_at)
            VALUES (:name, :position, :back_number, :join_date, :role, :social_uuid, CURRENT_TIMESTAMP)
        """
        db.execute(
            text(sql_insert_user),
            {
                "name": user.name,
                "position": user.position,
                "back_number": user.back_number,
                "join_date": join_date,
                "role": user.role,
                "social_uuid": user.social_uuid,
            },
        )
        db.commit() 

        return {"message": "회원가입 성공","social_uuid": user.social_uuid}

    except HTTPException as http_err:
        db.rollback()  
        raise http_err 

    except Exception as e:
        db.rollback()  
        logging.error(f"Error during user creation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error_code": "SERVER_ERROR", "error_message": "서버 내부 오류가 발생했습니다."}
        )

    finally:
        db.close() 