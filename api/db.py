import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError

DATABASE_URL = "postgresql://jmj:a12345@db:5432/coolman"


engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

logging.basicConfig(level=logging.DEBUG)

def get_db():
    try:
        db = SessionLocal()
        yield db
    except OperationalError as e:
        logging.error("Database connection failed:", exc_info=True)
    finally:
        db.close()
