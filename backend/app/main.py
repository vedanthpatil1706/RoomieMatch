
import os
import hashlib
import secrets
import hmac
from datetime import datetime, timezone, timedelta

import jwt
from bson import ObjectId
from bson.errors import InvalidId
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from pydantic import BaseModel, EmailStr, Field
from pymongo.errors import DuplicateKeyError

# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

load_dotenv(override=True)

from app.database import check_database_connection, database

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is missing from backend/.env")

security = HTTPBearer()

users_collection = database["users"]
profiles_collection = database["profiles"]

# --------------------------------------------------
# FASTAPI APPLICATION
# --------------------------------------------------

app = FastAPI(
    title="RoomieMatch API",
    description="AI-powered Flatmate Matching Platform",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://roomie-match-delta.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ProfileRequest(BaseModel):
    age: int = Field(ge=18, le=100)
    gender: str = Field(min_length=1, max_length=40)
    university: str = Field(min_length=1, max_length=150)
    city: str = Field(min_length=1, max_length=100)
    budget_min: int = Field(ge=0)
    budget_max: int = Field(ge=0)
    food_preference: str = Field(min_length=1, max_length=60)
    smoking: bool
    drinking: bool
    sleep_schedule: str = Field(min_length=1, max_length=60)
    interests: list[str] = Field(default_factory=list)

# --------------------------------------------------
# HELPER FUNCTIONS
# --------------------------------------------------

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)

    hashed = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=16384,
        r=8,
        p=1
    )

    return f"scrypt${salt.hex()}${hashed.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, salt_hex, hash_hex = stored_hash.split("$")

        if algorithm != "scrypt":
            return False

        salt = bytes.fromhex(salt_hex)
        expected_hash = bytes.fromhex(hash_hex)

        actual_hash = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=16384,
            r=8,
            p=1
        )

        return hmac.compare_digest(actual_hash, expected_hash)

    except (ValueError, TypeError):
        return False


def create_access_token(email: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": email,
        "exp": expiration
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=ALGORITHM
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("sub")

        if not email:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    current_user = users_collection.find_one({
        "email": email
    })

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return current_user


def normalize_text(value) -> str:
    return str(value or "").strip().casefold()

# --------------------------------------------------
# BASIC ROUTES
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Welcome to RoomieMatch API!",
        "status": "Running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/db-check")
def database_check():
    try:
        check_database_connection()

        return {
            "status": "connected",
            "database": "RoomieMatch",
            "message": "MongoDB connection successful!"
        }

    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Database connection unavailable"
        )

# --------------------------------------------------
# AUTHENTICATION ROUTES
# --------------------------------------------------

@app.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user: RegisterRequest):
    email = str(user.email).lower().strip()
    name = user.name.strip()

    if len(name) < 2:
        raise HTTPException(
            status_code=422,
            detail="Name must contain at least 2 characters"
        )

    try:
        users_collection.create_index(
            "email",
            unique=True
        )

        new_user = {
            "name": name,
            "email": email,
            "password_hash": hash_password(user.password),
            "created_at": datetime.now(timezone.utc)
        }

        result = users_collection.insert_one(new_user)

        return {
            "message": "Registration successful!",
            "user": {
                "id": str(result.inserted_id),
                "name": name,
                "email": email
            }
        }

    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="Email already registered."
        )


@app.post("/login")
def login_user(user: LoginRequest):
    email = str(user.email).lower().strip()

    existing_user = users_collection.find_one({
        "email": email
    })

    if not existing_user or not verify_password(
        user.password,
        existing_user.get("password_hash", "")
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return {
        "message": "Login successful!",
        "access_token": create_access_token(email),
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": str(existing_user["_id"]),
            "name": existing_user["name"],
            "email": existing_user["email"]
        }
    }


@app.get("/me")
def get_my_profile(
    current_user: dict = Depends(get_current_user)
):
    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "created_at": current_user.get("created_at")
    }

# --------------------------------------------------
# FLATMATE PROFILE ROUTES
# --------------------------------------------------

@app.post("/profile")
def create_profile(
    profile: ProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    if profile.budget_max < profile.budget_min:
        raise HTTPException(
            status_code=400,
            detail="Maximum budget cannot be less than minimum budget"
        )

    profile_data = profile.model_dump()

    profile_data["user_id"] = str(current_user["_id"])

    profile_data["interests"] = [
        item.strip()
        for item in profile_data["interests"]
        if item and item.strip()
    ]

    for field in [
        "gender",
        "university",
        "city",
        "food_preference",
        "sleep_schedule"
    ]:
        profile_data[field] = profile_data[field].strip()

    profiles_collection.update_one(
        {"user_id": profile_data["user_id"]},
        {"$set": profile_data},
        upsert=True
    )

    return {
        "message": "Profile saved successfully!",
        "profile": profile_data
    }


@app.get("/profile")
def get_profile(
    current_user: dict = Depends(get_current_user)
):
    profile = profiles_collection.find_one(
        {"user_id": str(current_user["_id"])},
        {"_id": 0}
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found. Please create your profile."
        )

    return profile

# --------------------------------------------------
# ROOMIEMATCH MATCHING ALGORITHM
# --------------------------------------------------

def calculate_budget_score(user, candidate):

    user_min = user["budget_min"]
    user_max = user["budget_max"]

    candidate_min = candidate["budget_min"]
    candidate_max = candidate["budget_max"]

    overlap = max(
        0,
        min(user_max, candidate_max) - max(user_min, candidate_min)
    )

    if user_min == user_max == candidate_min == candidate_max:
        return 100.0

    largest_range = max(
        user_max - user_min,
        candidate_max - candidate_min
    )

    if largest_range == 0:
        return 0.0

    return (overlap / largest_range) * 100


def calculate_match_score(user, candidate):

    # Budget: 30%
    budget_score = calculate_budget_score(user, candidate)

    # City: 20%
    city_score = (
        100.0
        if normalize_text(user.get("city"))
        == normalize_text(candidate.get("city"))
        else 0.0
    )

    # Lifestyle: 20%
    lifestyle_fields = [
        "smoking",
        "drinking",
        "sleep_schedule"
    ]

    lifestyle_score = sum(
        100.0 if (
            user.get(field) == candidate.get(field)
            if field != "sleep_schedule"
            else normalize_text(user.get(field))
            == normalize_text(candidate.get(field))
        ) else 0.0
        for field in lifestyle_fields
    ) / len(lifestyle_fields)

    # Food: 10%
    food_score = (
        100.0
        if normalize_text(user.get("food_preference"))
        == normalize_text(candidate.get("food_preference"))
        else 0.0
    )

    # Interests: 10%
    user_interests = {
        normalize_text(item)
        for item in user.get("interests", [])
        if normalize_text(item)
    }

    candidate_interests = {
        normalize_text(item)
        for item in candidate.get("interests", [])
        if normalize_text(item)
    }

    if user_interests or candidate_interests:
        shared = user_interests.intersection(candidate_interests)
        combined = user_interests.union(candidate_interests)

        interests_score = (
            len(shared) / len(combined)
        ) * 100

    else:
        interests_score = 0.0

    # University: 10%
    university_score = (
        100.0
        if normalize_text(user.get("university"))
        == normalize_text(candidate.get("university"))
        else 0.0
    )

    # Individual compatibility breakdown
    breakdown = {
        "budget": round(budget_score, 2),
        "city": round(city_score, 2),
        "lifestyle": round(lifestyle_score, 2),
        "food": round(food_score, 2),
        "interests": round(interests_score, 2),
        "university": round(university_score, 2)
    }

    # Weighted overall score
    total_score = (
        budget_score * 0.30
        + city_score * 0.20
        + lifestyle_score * 0.20
        + food_score * 0.10
        + interests_score * 0.10
        + university_score * 0.10
    )

    return {
        "overall_score": round(total_score, 2),
        "breakdown": breakdown
    }

# --------------------------------------------------
# MATCHES ROUTE
# --------------------------------------------------

@app.get("/matches")
def get_matches(
    current_user: dict = Depends(get_current_user)
):
    current_user_id = str(current_user["_id"])

    user_profile = profiles_collection.find_one(
        {"user_id": current_user_id},
        {"_id": 0}
    )

    if not user_profile:
        raise HTTPException(
            status_code=404,
            detail="Create your profile before finding matches."
        )

    all_profiles = profiles_collection.find(
        {"user_id": {"$ne": current_user_id}},
        {"_id": 0}
    )

    matches = []

    for candidate in all_profiles:

        score_result = calculate_match_score(
            user_profile,
            candidate
        )

        # Get actual roommate name from users collection
        candidate_name = "RoomieMatch User"

        try:
            candidate_user = users_collection.find_one(
                {"_id": ObjectId(candidate["user_id"])},
                {"name": 1}
            )

            if candidate_user:
                candidate_name = candidate_user.get(
                    "name",
                    "RoomieMatch User"
                )

        except (InvalidId, TypeError, KeyError):
            pass

        matches.append({
            "user_id": candidate.get("user_id"),
            "name": candidate_name,
            "city": candidate.get("city", ""),
            "university": candidate.get("university", ""),
            "budget_min": candidate.get("budget_min", 0),
            "budget_max": candidate.get("budget_max", 0),
            "compatibility_score": score_result["overall_score"],
            "compatibility_breakdown": score_result["breakdown"]
        })

    matches.sort(
        key=lambda match: match["compatibility_score"],
        reverse=True
    )

    return {
        "total_matches": len(matches),
        "matches": matches
    }

# ==========================================
# ROOMIEMATCH CONNECTION REQUEST SYSTEM
# ==========================================

from bson import ObjectId
from bson.errors import InvalidId
from pydantic import BaseModel
from datetime import datetime, timezone

# MongoDB collection
connection_requests_collection = database["connection_requests"]

# Create indexes
connection_requests_collection.create_index(
    [("sender_id", 1), ("recipient_id", 1), ("status", 1)]
)

connection_requests_collection.create_index(
    [("recipient_id", 1), ("status", 1)]
)


# Request response model
class ConnectionResponse(BaseModel):
    action: str


# Send a connection request
@app.post("/connections/request/{recipient_user_id}")
def send_connection_request(
    recipient_user_id: str,
    current_user: dict = Depends(get_current_user)
):
    sender_id = str(current_user["_id"])

    # Validate recipient ID
    try:
        recipient_object_id = ObjectId(recipient_user_id)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid recipient user ID"
        )

    # Prevent sending request to yourself
    if sender_id == recipient_user_id:
        raise HTTPException(
            status_code=400,
            detail="You cannot send a request to yourself"
        )

    # Check whether recipient exists
    recipient = users_collection.find_one({
        "_id": recipient_object_id
    })

    if not recipient:
        raise HTTPException(
            status_code=404,
            detail="Roommate user not found"
        )

    # Check whether recipient has a profile
    profiles_collection = database["profiles"]

    recipient_profile = profiles_collection.find_one({
        "user_id": recipient_user_id
    })

    if not recipient_profile:
        raise HTTPException(
            status_code=404,
            detail="This user does not have a roommate profile"
        )

    # Prevent duplicate pending or accepted requests
    existing_request = connection_requests_collection.find_one({
        "$or": [
            {
                "sender_id": sender_id,
                "recipient_id": recipient_user_id
            },
            {
                "sender_id": recipient_user_id,
                "recipient_id": sender_id
            }
        ],
        "status": {"$in": ["pending", "accepted"]}
    })

    if existing_request:
        raise HTTPException(
            status_code=409,
            detail="A pending request or connection already exists"
        )

    # Create request
    request_data = {
        "sender_id": sender_id,
        "recipient_id": recipient_user_id,
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    result = connection_requests_collection.insert_one(
        request_data
    )

    return {
        "message": "Connection request sent successfully!",
        "request_id": str(result.inserted_id),
        "status": "pending"
    }


# View incoming and outgoing requests
@app.get("/connections/requests")
def get_connection_requests(
    current_user: dict = Depends(get_current_user)
):
    current_user_id = str(current_user["_id"])

    requests = connection_requests_collection.find({
        "$or": [
            {"sender_id": current_user_id},
            {"recipient_id": current_user_id}
        ]
    }).sort("created_at", -1)

    result = []

    for request in requests:
        sender = users_collection.find_one({
            "_id": ObjectId(request["sender_id"])
        })

        recipient = users_collection.find_one({
            "_id": ObjectId(request["recipient_id"])
        })

        result.append({
            "request_id": str(request["_id"]),
            "sender_id": request["sender_id"],
            "sender_name": sender["name"] if sender else "Unknown User",
            "recipient_id": request["recipient_id"],
            "recipient_name": recipient["name"] if recipient else "Unknown User",
            "status": request["status"],
            "direction": (
                "incoming"
                if request["recipient_id"] == current_user_id
                else "outgoing"
            ),
            "created_at": request["created_at"]
        })

    return {
        "total_requests": len(result),
        "requests": result
    }


# Accept or reject a connection request
@app.post("/connections/respond/{request_id}")
def respond_to_connection_request(
    request_id: str,
    response: ConnectionResponse,
    current_user: dict = Depends(get_current_user)
):
    current_user_id = str(current_user["_id"])

    if response.action not in ["accepted", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Action must be accepted or rejected"
        )

    try:
        request_object_id = ObjectId(request_id)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid connection request ID"
        )

    connection_request = connection_requests_collection.find_one({
        "_id": request_object_id
    })

    if not connection_request:
        raise HTTPException(
            status_code=404,
            detail="Connection request not found"
        )

    # Only recipient can respond
    if connection_request["recipient_id"] != current_user_id:
        raise HTTPException(
            status_code=403,
            detail="You cannot respond to this request"
        )

    if connection_request["status"] != "pending":
        raise HTTPException(
            status_code=409,
            detail="This request has already been processed"
        )

    connection_requests_collection.update_one(
        {"_id": request_object_id},
        {
            "$set": {
                "status": response.action,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )

    return {
        "message": f"Connection request {response.action}!",
        "request_id": request_id,
        "status": response.action
    }


# View accepted connections
@app.get("/connections")
def get_accepted_connections(
    current_user: dict = Depends(get_current_user)
):
    current_user_id = str(current_user["_id"])

    connections = connection_requests_collection.find({
        "$or": [
            {"sender_id": current_user_id},
            {"recipient_id": current_user_id}
        ],
        "status": "accepted"
    })

    result = []

    for connection in connections:
        other_user_id = (
            connection["recipient_id"]
            if connection["sender_id"] == current_user_id
            else connection["sender_id"]
        )

        other_user = users_collection.find_one({
            "_id": ObjectId(other_user_id)
        })

        if other_user:
            result.append({
                "user_id": other_user_id,
                "name": other_user["name"],
                "email": other_user["email"],
                "connected_at": connection["updated_at"]
            })

    return {
        "total_connections": len(result),
        "connections": result
    }


# ==============================
# CONNECTED ROOMMATE PROFILE API
# ==============================

@app.get("/connections/profile/{other_user_id}")
def get_connected_roommate_profile(
    other_user_id: str,
    current_user: dict = Depends(get_current_user)
):
    current_user_id = str(current_user["_id"])

    if other_user_id == current_user_id:
        raise HTTPException(
            status_code=400,
            detail="You cannot view your own profile here."
        )

    # Verify that both users have an accepted connection
    connection = database["connection_requests"].find_one({
        "status": "accepted",
        "$or": [
            {
                "sender_id": current_user_id,
                "recipient_id": other_user_id
            },
            {
                "sender_id": other_user_id,
                "recipient_id": current_user_id
            }
        ]
    })

    if not connection:
        raise HTTPException(
            status_code=403,
            detail="You can only view profiles of connected roommates."
        )

    # Fetch roommate's profile
    roommate_profile = database["profiles"].find_one(
        {"user_id": other_user_id},
        {"_id": 0, "user_id": 0}
    )

    if not roommate_profile:
        raise HTTPException(
            status_code=404,
            detail="Roommate profile not found."
        )

    # Fetch basic account information
    roommate_user = users_collection.find_one(
        {"_id": database["users"].find_one(
            {"_id": {"$exists": True}, "email": {
                "$exists": True
            }}
        )["_id"]} if False else {"_id": None}
    )

    # Get the connected user's account by matching their ID
    from bson import ObjectId

    try:
        roommate_user = users_collection.find_one(
            {"_id": ObjectId(other_user_id)},
            {"_id": 0, "password_hash": 0}
        )
    except Exception:
        roommate_user = None

    return {
        "name": roommate_user.get("name", "RoomieMatch User")
        if roommate_user else "RoomieMatch User",
        "email": roommate_user.get("email", "")
        if roommate_user else "",
        "profile": roommate_profile
    }
