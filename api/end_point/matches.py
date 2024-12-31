from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from api.db import Base, engine, get_db
from api.models.matches import Matches
from api.schemas.matches import Match, MatchCreate, MatchUpdate
from api.crud.matches import create_match, get_match_by_id, get_all_matches, update_match, delete_match

Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.post("/matches/", response_model=Match)
def create_match_endpoint(match_data: MatchCreate, db: Session = Depends(get_db)):
    return create_match(db, match_data)

@app.get("/matches/{match_idx}", response_model=Match)
def get_match_endpoint(match_idx: int, db: Session = Depends(get_db)):
    match = get_match_by_id(db, match_idx)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match

@app.get("/matches/", response_model=List[Match])
def get_all_matches_endpoint(db: Session = Depends(get_db)):
    return get_all_matches(db)

@app.put("/matches/{match_idx}", response_model=Match)
def update_match_endpoint(match_idx: int, update_data: MatchUpdate, db: Session = Depends(get_db)):
    match = update_match(db, match_idx, update_data)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match

@app.delete("/matches/{match_idx}", response_model=dict)
def delete_match_endpoint(match_idx: int, db: Session = Depends(get_db)):
    match = delete_match(db, match_idx)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return {"detail": "Match deleted successfully"}
