import logging
from datetime import datetime
from typing import Optional
from fastapi import HTTPException, Depends, Form, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy.sql import text  
from db import get_db
from product.users.router import router

UPLOAD_DIR = "uploads/"

@router.put("/{user_idx}")
async def update_user(
    user_idx: int,
    name: str = Form(...),
    position: str = Form(...),
    back_number: int = Form(...),
    role: str = Form(...),    
    join_date: datetime = Form(...),
    image: Optional[UploadFile] = File(None), 
    db: Session = Depends(get_db)
):
    try:
        with db.begin():  # 🔹 트랜잭션 시작
            
            sql_check_idx = "SELECT * FROM users WHERE user_idx = :user_idx"
            existing_user = db.execute(text(sql_check_idx), {"user_idx": user_idx}).fetchone()
            if not existing_user:
                raise HTTPException(
                    status_code=409,
                    detail={"error_code": "NOT EXISTING_USER", "error_message": "존재하지 않는 유저입니다."}
                )
        
            sql_check_number = "SELECT * FROM users WHERE back_number = :back_number"
            existing_number = db.execute(text(sql_check_number), {"back_number": back_number}).fetchone()
            if existing_number:
                raise HTTPException(
                    status_code=409,
                    detail={"error_code": "DUPLICATE_BACK_NUMBER", "error_message": "이미 사용 중인 등번호입니다."}
                )

            # image_path = existing_user.image  # 기존 이미지 경로 유지

            # # ✅ 2. 이미지 처리
            # if image:
            #     image_path = os.path.join(UPLOAD_DIR, f"user_{user_idx}.jpg")  # 새로운 파일 경로 설정
            #     with open(image_path, "wb") as buffer:
            #         shutil.copyfileobj(image.file, buffer)

            # ✅ 3. 유저 정보 업데이트
            update_query = """
                UPDATE users
                SET name = :name, position = :position, back_number = :back_number,
                    role = :role, join_date = :join_date                    
                WHERE user_idx = :user_idx
            """
            update_values = {
                "user_idx": user_idx,
                "name": name,
                "position": position,
                "back_number": back_number,
                "role": role,                
                "join_date": join_date,
                # "image": image_path  
            }

            db.execute(text(update_query), update_values)

        return {"message": f"User {user_idx} successfully updated"}
    
    except HTTPException as http_err:
        db.rollback()  
        raise http_err 
    
    except Exception as e:
        db.rollback()  # ❌ 실패 시 롤백
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
