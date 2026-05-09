from fastapi import APIRouter

router = APIRouter()

from product.accounting.restful.get import *
from product.accounting.restful.post import *
from product.accounting.restful.put import *
from product.accounting.restful.delete import *
