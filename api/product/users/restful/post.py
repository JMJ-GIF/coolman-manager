import os
import logging
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy.sql import text
from sqlalchemy.orm import Session  
from fastapi import UploadFile, File, Form, HTTPException, Depends

from db import get_db
from image_client import upload_image 
from product.users.router import router

logging.basicConfig(level=logging.ERROR)

load_dotenv()
raw_name_list = os.getenv("VALID_NAME_LIST", "")
VALID_NAME_LIST = [name.replace(" ", "") for name in raw_name_list.split(",") if name.strip()]

@router.post("", status_code=201)
async def create_user(
    social_uuid: str = Form(...),
    name: str = Form(...),
    position: str = Form(...),
    back_number: int = Form(...),
    role: str = Form(...),
    image: UploadFile = File(None),  # 이미지 파일 수신
    db: Session = Depends(get_db)
):
    try:
        join_date = datetime.utcnow()

        cleaned_name = name.replace(" ", "")
        if cleaned_name not in VALID_NAME_LIST:
            raise HTTPException(
                status_code=400,
                detail={
                    "error_code": "INVALID_NAME",
                    "error_message": "쾌남FC 등록된 멤버만 가입이 가능합니다."
                }
            )
        
        sql_check_uuid = "SELECT * FROM users WHERE social_uuid = :social_uuid"
        existing_user = db.execute(text(sql_check_uuid), {"social_uuid": social_uuid}).mappings().fetchone()
        if existing_user:
            raise HTTPException(
                status_code=409,
                detail={"error_code": "EXISTING_USER", "error_message": "이미 존재하는 유저입니다."}
        )
        
        sql_check_number = "SELECT * FROM users WHERE back_number = :back_number"
        existing_number = db.execute(text(sql_check_number), {"back_number": back_number}).mappings().fetchone()
        if existing_number:
            raise HTTPException(
                status_code=409,
                detail={"error_code": "DUPLICATE_BACK_NUMBER", "error_message": "이미 사용 중인 등번호입니다."}
        )

        # 사용자 정보 데이터베이스에 저장 및 user_idx 반환
        sql_insert_user = """
            INSERT INTO users (name, position, back_number, join_date, role, social_uuid, created_at)
            VALUES (:name, :position, :back_number, :join_date, :role, :social_uuid, CURRENT_TIMESTAMP)
            RETURNING user_idx;
        """
        result = db.execute(
            text(sql_insert_user),
            {
                "name": name,
                "position": position,
                "back_number": back_number,
                "join_date": join_date,
                "role": role,
                "social_uuid": social_uuid,
            },
        )
        user_idx = result.fetchone()[0] 
        
        # 이미지 업로드 및 URL 반환
        image_url = None
        if image:
            raw_image_url = upload_image(image.file, user_idx)
            image_url = f"{raw_image_url}?v={int(datetime.utcnow().timestamp())}"


        # 이미지 URL 업데이트
        sql_update_user_image = """
            UPDATE users
            SET image_url = :image_url
            WHERE user_idx = :user_idx
        """
        db.execute(
            text(sql_update_user_image),
            {
                "image_url": image_url,
                "user_idx": user_idx,
            },
        )
        db.commit()

        return {"message": "회원가입 성공","social_uuid": social_uuid}

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