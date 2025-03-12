from fastapi import APIRouter

router = APIRouter()

from product.users.restful.get import *
from product.users.restful.post import *
from product.users.restful.put import *