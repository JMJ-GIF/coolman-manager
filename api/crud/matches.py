from sqlalchemy.orm import Session
from api.models.matches import Matches
from api.schemas.matches import MatchCreate, MatchUpdate

# CREATE
def create_match(db: Session, match_data: MatchCreate):
    new_match = Matches(**match_data.dict())
    db.add(new_match)
    db.commit()
    db.refresh(new_match)
    return new_match

# READ
def get_match_by_id(db: Session, match_idx: int):
    return db.query(Matches).filter(Matches.match_idx == match_idx).first()

def get_all_matches(db: Session):
    return db.query(Matches).all()

# UPDATE
def update_match(db: Session, match_idx: int, update_data: MatchUpdate):
    match = db.query(Matches).filter(Matches.match_idx == match_idx).first()
    if match:
        update_dict = update_data.dict(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(match, key, value)
        db.commit()
        db.refresh(match)
        return match
    return None

# DELETE
def delete_match(db: Session, match_idx: int):
    match = db.query(Matches).filter(Matches.match_idx == match_idx).first()
    if match:
        db.delete(match)
        db.commit()
        return match
    return None
