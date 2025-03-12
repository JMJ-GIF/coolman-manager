from fastapi import APIRouter

router = APIRouter()

from product.matches.restful.get import *
from product.matches.restful.post import *
from product.matches.restful.put import *
from product.matches.restful.delete import *