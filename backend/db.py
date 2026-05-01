"""Shared MongoDB client + database handle.

Single source of truth — all routers import `db` from here so the connection
is established once at process start.
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient

mongo_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = mongo_client[os.environ["DB_NAME"]]
