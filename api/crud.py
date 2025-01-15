from sqlalchemy.orm import Session
from typing import Type, TypeVar, Generic, Any, List
from pydantic import BaseModel
from sqlalchemy.ext.declarative import as_declarative, declared_attr
from sqlalchemy import Integer, Column, and_

ModelType = TypeVar("ModelType")  # SQLAlchemy 모델
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)  # Pydantic 스키마
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)  # Pydantic 스키마

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType], primary_key: str = "id"):
        self.model = model
        self.primary_key = primary_key

    # CREATE
    def create(self, db: Session, obj_input: CreateSchemaType):
        obj = self.model(**obj_input.dict())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    # READ (by primary key)
    def get(self, db: Session, key_value: Any):
        return db.query(self.model).filter(getattr(self.model, self.primary_key) == key_value).first()
    
    # READ (by primary key)
    def get_multi(self, db: Session, values: List[Any]):
        key_column = getattr(self.model, self.primary_key)
        return db.query(self.model).filter(key_column.in_(values)).all()
    
    # READ (for pagination by dt)
    def get_by_last_item_with_dt(self, db: Session, last_item_id: Any = None, last_item_dt: Any = None, page_size: int = 10):
        id_column = getattr(self.model, self.primary_key)
        dt_column = self.model.dt

        query = db.query(self.model).order_by(dt_column.desc(), id_column.desc())
        
        if last_item_id is not None and last_item_dt is not None:
            query = query.filter(
            (dt_column < last_item_dt) |  
            (dt_column == last_item_dt) & (id_column < last_item_id)
        ) 

        items = query.limit(page_size).all()

        return items

    # READ (by idx)
    def get_by_id(self, db: Session, id_col: str, id_value: Any):
        return db.query(self.model).filter(getattr(self.model, id_col) == id_value).all()
    
    # READ (all)
    def get_all(self, db: Session):
        return db.query(self.model).all()

    # UPDATE
    def update(self, db: Session, key_value: Any, obj_input: UpdateSchemaType):
        obj = self.get(db, key_value)
        if obj: 
            update_data = obj_input.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(obj, key, value)
            db.commit()
            db.refresh(obj)
        return obj

    # DELETE
    def delete(self, db: Session, key_value: Any):
        obj = self.get(db, key_value)
        if obj:
            db.delete(obj)
            db.commit()
        return obj