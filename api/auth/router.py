from fastapi import APIRouter

router = APIRouter()

from auth.restful.get import *
from auth.restful.post import *