from sqlalchemy.sql import text  
from sqlalchemy.orm import Session 
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, Depends

from db import get_db
from product.matches.router import router
from product.matches.schema import *

@router.put("/{match_idx}")
def update_match(match_idx: int, match_data: MatchUpdate, db: Session = Depends(get_db)):
    try:
        with db.begin(): 
            # ✅ 1. Match 업데이트
            match_query = """
                UPDATE matches
                SET dt = :dt, result = :result, winning_point = :winning_point, 
                    losing_point = :losing_point, opposing_team = :opposing_team, 
                    location = :location, start_time = :start_time, end_time = :end_time,
                    weather = :weather, num_players = :num_players, main_tactics = :main_tactics
                WHERE match_idx = :match_idx
            """
            match_values = {
                "match_idx": match_idx,
                "dt": match_data.dt,
                "result": match_data.result,
                "winning_point": match_data.winning_point,
                "losing_point": match_data.losing_point,
                "opposing_team": match_data.opposing_team,
                "location": match_data.location,
                "start_time": match_data.start_time,
                "end_time": match_data.end_time,
                "weather": match_data.weather,
                "num_players": match_data.num_players,
                "main_tactics": match_data.main_tactics
            }

            db.execute(text(match_query), match_values)

            # ✅ 2. 기존 Quarters 조회
            existing_quarters = db.execute(text("""
                SELECT quarter_idx FROM quarters WHERE match_idx = :match_idx
            """), {"match_idx": match_idx}).fetchall()
            existing_quarter_ids = {q[0] for q in existing_quarters}
            received_quarter_ids = {q.quarter_idx for q in match_data.quarters if q.quarter_idx}

            # 🔹 삭제할 Quarters 찾기
            quarters_to_delete = existing_quarter_ids - received_quarter_ids
            if quarters_to_delete:
                db.execute(text("DELETE FROM quarters WHERE quarter_idx IN :ids"), {"ids": tuple(quarters_to_delete)})
            
            # 🔹 업데이트 or 삽입할 Quarters
            quarter_map = {}
            for q_data in match_data.quarters:
                q_data.match_idx = match_idx
                if q_data.quarter_idx:  
                    db.execute(text("""
                        UPDATE quarters
                        SET quarter_number = :quarter_number, tactics = :tactics
                        WHERE quarter_idx = :quarter_idx
                    """), q_data.dict())
                    quarter_map[q_data.quarter_number] = q_data.quarter_idx
                else: 
                    result = db.execute(text("""
                        INSERT INTO quarters (match_idx, quarter_number, tactics) 
                        VALUES (:match_idx, :quarter_number, :tactics) RETURNING quarter_idx
                    """), q_data.dict())
                    new_quarter_idx = result.fetchone()[0]
                    quarter_map[q_data.quarter_number] = new_quarter_idx
            
            # ✅ 3. Lineup & Goal 처리 (Quarters와 비슷한 로직)
            for q_data in match_data.quarters:
                q_data.match_idx = match_idx
                quarter_idx = quarter_map[q_data.quarter_number]

                # 🔹 기존 Lineups 가져오기
                existing_lineups = db.execute(text("""
                    SELECT lineup_idx FROM quarters_lineup WHERE quarter_idx = :quarter_idx
                """), {"quarter_idx": quarter_idx}).fetchall()
                existing_lineup_ids = {l[0] for l in existing_lineups}
                received_lineup_ids = {l.lineup_idx for l in q_data.lineups if l.lineup_idx}

                # 🔹 삭제할 Lineups 찾기
                lineups_to_delete = existing_lineup_ids - received_lineup_ids
                if lineups_to_delete:
                    db.execute(text("DELETE FROM quarters_lineup WHERE lineup_idx IN :ids"), {"ids": tuple(lineups_to_delete)})
                
                # 🔹 업데이트 or 삽입할 Lineups
                for l_data in q_data.lineups:
                    l_data.quarter_idx = quarter_idx
                    
                    if l_data.lineup_idx:                          
                        db.execute(text("""
                            UPDATE quarters_lineup
                            SET player_idx = :user_idx, position_idx = :position_idx, lineup_status = :lineup_status
                            WHERE lineup_idx = :lineup_idx
                        """), l_data.dict())
                    else:  
                        db.execute(text("""
                            INSERT INTO quarters_lineup (quarter_idx, player_idx, position_idx, lineup_status)
                            VALUES (:quarter_idx, :user_idx, :position_idx, :lineup_status)
                        """), l_data.dict())

                # 🔹 기존 Goals 가져오기
                existing_goals = db.execute(text("""
                    SELECT goal_idx FROM goals WHERE quarter_idx = :quarter_idx
                """), {"quarter_idx": quarter_idx}).fetchall()
                existing_goal_ids = {g[0] for g in existing_goals}
                received_goal_ids = {g.goal_idx for g in q_data.goals if g.goal_idx}

                # 🔹 삭제할 Goals 찾기
                goals_to_delete = existing_goal_ids - received_goal_ids
                if goals_to_delete:
                    db.execute(text("DELETE FROM goals WHERE goal_idx IN :ids"), {"ids": tuple(goals_to_delete)})

                # 🔹 업데이트 or 삽입할 Goals
                for g_data in q_data.goals:
                    g_data.match_idx = match_idx
                    g_data.quarter_idx = quarter_idx  # 새롭게 생성된 quarter_idx 반영

                    if g_data.goal_idx:  # UPDATE
                        db.execute(text("""
                            UPDATE goals
                            SET goal_player_id = :goal_player_id, assist_player_id = :assist_player_id, goal_type = :goal_type
                            WHERE goal_idx = :goal_idx
                        """), g_data.dict())
                    else:  # INSERT
                        db.execute(text("""
                            INSERT INTO goals (quarter_idx, match_idx, goal_player_id, assist_player_id, goal_type)
                            VALUES (:quarter_idx, :match_idx, :goal_player_id, :assist_player_id, :goal_type)
                        """), g_data.dict())
        
        return {"message": "Match successfully updated", "match_idx": match_idx}

    except SQLAlchemyError as e:
        print(f"SQL Error while inserting quarter: {e}")
        db.rollback()  # 실패 시 모든 작업 롤백
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    except Exception as e:
        print(f"Exception Error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")