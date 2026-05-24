from datetime import datetime
from pydantic import BaseModel


class PlayfieldAnnouncement(BaseModel):
    id: int
    school_name: str
    title: str
    upload_date: str
    link: str
    is_new: bool
    created_at: datetime

    model_config = {"from_attributes": True}
