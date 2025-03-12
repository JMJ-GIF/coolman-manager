import os
from dotenv import load_dotenv
from sqlalchemy.sql import text  
from sqlalchemy.orm import Session 
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, Response, Request, Depends

from db import get_db
from product.matches.router import router
from product.matches.schema import *

@router.post("/")
def create_match(match_data: MatchCreate, db: Session = Depends(get_db)):
    try:
        with db.begin():  # 트랜잭션 시작
            # ✅ 1. Match 테이블 삽입
            match_query = """
                INSERT INTO matches (dt, result, winning_point, losing_point, opposing_team, location, 
                                     start_time, end_time, weather, num_players, main_tactics)
                VALUES (:dt, :result, :winning_point, :losing_point, :opposing_team, :location, 
                        :start_time, :end_time, :weather, :num_players, :main_tactics)
                RETURNING match_idx;
            """
            match_values = {
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
                "main_tactics": match_data.main_tactics,
            }
            match_idx = db.execute(text(match_query), match_values).scalar()

            # ✅ 2. Quarter 테이블 삽입
            quarter_idx_map = {}
            for quarter_data in match_data.quarters:
                
                quarter_query = """
                    INSERT INTO quarters (match_idx, quarter_number, tactics)
                    VALUES (:match_idx, :quarter_number, :tactics)
                    RETURNING quarter_idx;
                """
                quarter_values = {
                    "match_idx": match_idx,
                    "quarter_number": quarter_data.quarter_number,
                    "tactics": quarter_data.tactics,
                }
                quarter_idx = db.execute(text(quarter_query), quarter_values).scalar()                
                quarter_idx_map[quarter_data.quarter_number] = quarter_idx

            # ✅ 3. Goal 테이블 삽입
            for quarter_data in match_data.quarters:
                quarter_idx = quarter_idx_map[quarter_data.quarter_number]

                for goal_data in quarter_data.goals:
                    goal_query = """
                        INSERT INTO goals (match_idx, quarter_idx, goal_player_id, assist_player_id, goal_type)
                        VALUES (:match_idx, :quarter_idx, :goal_player_id, :assist_player_id, :goal_type);
                    """
                    goal_values = {
                        "match_idx": match_idx,
                        "quarter_idx": quarter_idx,
                        "goal_player_id": goal_data.goal_player_id,
                        "assist_player_id": goal_data.assist_player_id,
                        "goal_type": goal_data.goal_type,
                    }
                    db.execute(text(goal_query), goal_values)

            # ✅ 4. Lineup 테이블 삽입
            for quarter_data in match_data.quarters:
                quarter_idx = quarter_idx_map[quarter_data.quarter_number]

                for lineup_data in quarter_data.lineups:
                    lineup_query = """
                        INSERT INTO quarters_lineup (player_idx, quarter_idx, position_idx, lineup_status)
                        VALUES (:player_idx, :quarter_idx, :position_idx, :lineup_status);
                    """
                    lineup_values = {
                        "player_idx": lineup_data.user_idx,
                        "quarter_idx": quarter_idx,
                        "position_idx": lineup_data.position_idx,
                        "lineup_status": lineup_data.lineup_status,
                    }
                    db.execute(text(lineup_query), lineup_values)

            db.commit()  # 모든 데이터 삽입 성공 시 커밋

            return {"message": "Match created successfully", "match_id": match_idx}

    except SQLAlchemyError as e:
        print(f"SQL Error while inserting quarter: {e}")
        db.rollback()  # 실패 시 모든 작업 롤백
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    except Exception as e:
        print(f"Exception Error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
