
import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv(override=True)

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "RoomieMatch")

if not MONGODB_URL:
    raise ValueError("MONGODB_URL is missing from .env")

client = MongoClient(
    MONGODB_URL,
    serverSelectionTimeoutMS=10000
)

database = client[DATABASE_NAME]

def check_database_connection():
    client.admin.command("ping")
    return True
