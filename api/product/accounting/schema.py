from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class AccountingSummary(BaseModel):
    user_idx: int
    name: str
    back_number: int
    member_type: Optional[str] = None
    total_amount: int
    total_paid: int
    match_participation_cnt: int
    note: Optional[str] = None


class AccountingRecord(BaseModel):
    record_idx: int
    user_idx: int
    dt: date
    fee_type: str
    amount: int
    paid_amount: int
    note: Optional[str] = None
    match_idx: Optional[int] = None
    opposing_team: Optional[str] = None


class MemberTypeUpsert(BaseModel):
    user_idx: int
    year: int
    quarter: int
    member_type: str


class RecordCreate(BaseModel):
    user_idx: int
    dt: date
    fee_type: str
    amount: int
    paid_amount: int = 0
    note: Optional[str] = None
    match_idx: Optional[int] = None


class RecordUpdate(BaseModel):
    dt: Optional[date] = None
    fee_type: Optional[str] = None
    amount: Optional[int] = None
    paid_amount: Optional[int] = None
    note: Optional[str] = None
    match_idx: Optional[int] = None
