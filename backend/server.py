from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=True)

import os
import re
import uuid
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from urllib.parse import quote

from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends, Request, Response
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field

# -------------- Config --------------
JWT_ALGORITHM = "HS256"
ALLOWED_EXT = {".pdf", ".png", ".jpg", ".jpeg", ".webp"}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB per file; total storage handled by MongoDB GridFS (scales to TB+)
CHUNK_SIZE = 1024 * 1024  # 1MB streaming chunks

BIOLOGY_CHAPTERS = [
    "The Living World",
    "Biological Classification",
    "Plant Kingdom",
    "Animal Kingdom",
    "Morphology of Flowering Plants",
    "Anatomy of Flowering Plants",
    "Structural Organisation in Animals",
    "Cell: The Unit of Life",
    "Biomolecules",
    "Cell Cycle and Cell Division",
    "Photosynthesis in Higher Plants",
    "Respiration in Plants",
    "Plant Growth and Development",
    "Breathing and Exchange of Gases",
    "Body Fluids and Circulation",
    "Excretory Products and their Elimination",
    "Locomotion and Movement",
    "Neural Control and Coordination",
    "Chemical Coordination and Integration",
    "Other / General",
]

# -------------- DB --------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
fs_bucket = AsyncIOMotorGridFSBucket(db, bucket_name="note_files")

app = FastAPI(title="Class 11 Notes Hub")
api_router = APIRouter(prefix="/api")

# -------------- Helpers --------------
def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> Optional[dict]:
    """Returns user dict if authenticated, None otherwise (optional auth)."""
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        return None
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            return None
        user.pop("password_hash", None)
        user.pop("_id", None)
        return user
    except Exception:
        return None

async def require_user(request: Request) -> dict:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

def session_id_from_request(request: Request) -> str:
    ip = request.client.host if request.client else "anon"
    ua = request.headers.get("user-agent", "")[:50]
    return f"{ip}::{ua}"

def doc_to_note(d: dict) -> dict:
    d.pop("_id", None)
    return d

def safe_disposition(filename: str, attachment: bool = False) -> str:
    """RFC 5987 Content-Disposition that handles unicode (em-dashes, etc.)."""
    fallback = re.sub(r'[^\x20-\x7E]', '_', filename or "file")
    encoded = quote(filename or "file")
    kind = "attachment" if attachment else "inline"
    return f'{kind}; filename="{fallback}"; filename*=UTF-8\'\'{encoded}'

async def _stream_gridfs(file_id: ObjectId):
    """Async generator that streams a GridFS file in chunks."""
    grid_out = await fs_bucket.open_download_stream(file_id)
    try:
        while True:
            chunk = await grid_out.readchunk()
            if not chunk:
                break
            yield chunk
    finally:
        pass

# -------------- Models --------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=80)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    name: str

class AuthResponse(BaseModel):
    token: str
    user: UserOut

# -------------- Auth Routes --------------
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(payload: RegisterIn):
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": email,
        "name": payload.name.strip(),
        "password_hash": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_access_token(user_id, email)
    return AuthResponse(token=token, user=UserOut(id=user_id, email=email, name=payload.name.strip()))

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(payload: LoginIn):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email)
    return AuthResponse(token=token, user=UserOut(id=user["id"], email=email, name=user["name"]))

@api_router.get("/auth/me", response_model=UserOut)
async def me(request: Request):
    user = await require_user(request)
    return UserOut(id=user["id"], email=user["email"], name=user["name"])

# -------------- Owner Admin Routes --------------
@api_router.get("/admin/users")
async def admin_list_users(passcode: str = ""):
    required = os.environ.get("OWNER_PASSCODE", "prateek2010")
    if passcode.strip() != required:
        raise HTTPException(status_code=403, detail="Invalid passcode")
    users = await db.users.find(
        {}, {"_id": 0, "id": 1, "name": 1, "email": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(1000)
    return {"users": users, "total": len(users)}

# -------------- Notes Routes --------------
@api_router.get("/chapters")
async def list_chapters():
    return {"chapters": BIOLOGY_CHAPTERS}

@api_router.get("/stats")
async def stats():
    notes_count = await db.notes.count_documents({})
    pdf_count = await db.notes.count_documents({"file_type": "pdf"})
    image_count = await db.notes.count_documents({"file_type": "image"})
    return {
        "categories": 1,
        "notes": notes_count,
        "pdfs": pdf_count,
        "pictures": image_count,
        "subject": "Biology",
    }

@api_router.get("/storage")
async def storage_info():
    agg = await db.notes.aggregate([
        {"$group": {"_id": None, "total_bytes": {"$sum": "$size_bytes"}, "count": {"$sum": 1}}}
    ]).to_list(1)
    total = agg[0]["total_bytes"] if agg else 0
    count = agg[0]["count"] if agg else 0
    return {
        "total_bytes": total,
        "total_mb": round(total / (1024 * 1024), 2),
        "total_gb": round(total / (1024 * 1024 * 1024), 3),
        "files": count,
        "backend": "MongoDB GridFS",
        "per_file_limit_mb": MAX_FILE_SIZE // (1024 * 1024),
        "capacity": "Scales with MongoDB cluster (50GB+ supported)",
    }

@api_router.get("/notes")
async def list_notes(
    chapter: Optional[str] = None,
    file_type: Optional[str] = None,
    folder_id: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = "recent",
    limit: int = 100,
):
    q = {}
    if chapter and chapter != "all":
        q["chapter"] = chapter
    if file_type and file_type != "all":
        q["file_type"] = file_type.lower()
    if folder_id == "unfiled":
        q["folder_id"] = {"$in": [None, ""]}
    elif folder_id and folder_id != "all":
        q["folder_id"] = folder_id
    if search:
        q["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]
    sort_key = {"recent": "created_at", "downloads": "downloads", "likes": "likes"}.get(sort, "created_at")
    cursor = db.notes.find(q).sort(sort_key, -1).limit(limit)
    docs = await cursor.to_list(limit)
    return [doc_to_note(d) for d in docs]

@api_router.get("/notes/{note_id}")
async def get_note(note_id: str):
    note = await db.notes.find_one({"id": note_id})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return doc_to_note(note)

@api_router.post("/notes")
async def upload_note(
    request: Request,
    title: str = Form(...),
    description: str = Form(""),
    chapter: str = Form("Other / General"),
    folder_id: str = Form(""),
    passcode: str = Form(""),
    file: UploadFile = File(...),
):
    required = os.environ.get("UPLOAD_PASSCODE", "")
    if required and passcode.strip() != required:
        raise HTTPException(status_code=403, detail="Invalid upload passcode")
    user = await get_current_user(request)
    if not title.strip():
        raise HTTPException(status_code=400, detail="Title is required")
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {', '.join(sorted(ALLOWED_EXT))}")

    note_id = str(uuid.uuid4())
    file_type = "pdf" if ext == ".pdf" else "image"
    file_ext_label = ext.replace(".", "").upper()
    media_type = "application/pdf" if ext == ".pdf" else f"image/{ext.replace('.', '').lower()}"

    upload_stream = fs_bucket.open_upload_stream(
        filename=file.filename or f"{note_id}{ext}",
        metadata={"note_id": note_id, "content_type": media_type},
    )
    size = 0
    try:
        while True:
            chunk = await file.read(CHUNK_SIZE)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_FILE_SIZE:
                await upload_stream.abort()
                raise HTTPException(status_code=400, detail=f"File too large (max {MAX_FILE_SIZE // (1024*1024)}MB)")
            await upload_stream.write(chunk)
        await upload_stream.close()
    except HTTPException:
        raise
    except Exception as e:
        try:
            await upload_stream.abort()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

    grid_file_id = upload_stream._id

    doc = {
        "id": note_id,
        "title": title.strip(),
        "description": description.strip(),
        "chapter": chapter if chapter in BIOLOGY_CHAPTERS else "Other / General",
        "subject": "Biology",
        "folder_id": folder_id or None,
        "file_type": file_type,
        "file_ext": file_ext_label,
        "media_type": media_type,
        "grid_file_id": str(grid_file_id),
        "original_name": file.filename,
        "size_bytes": size,
        "downloads": 0,
        "likes": 0,
        "liked_by": [],
        "uploader_id": user["id"] if user else None,
        "uploader_name": user["name"] if user else "Anonymous",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.notes.insert_one(doc)
    return doc_to_note(doc)

@api_router.get("/notes/{note_id}/file")
async def serve_file(note_id: str):
    note = await db.notes.find_one({"id": note_id})
    if not note or not note.get("grid_file_id"):
        raise HTTPException(status_code=404, detail="File not found")
    file_id = ObjectId(note["grid_file_id"])
    media = note.get("media_type") or ("application/pdf" if note["file_type"] == "pdf" else f"image/{note['file_ext'].lower()}")
    return StreamingResponse(
        _stream_gridfs(file_id),
        media_type=media,
        headers={
            "Content-Disposition": safe_disposition(note.get("original_name", note_id), attachment=False),
            "Content-Length": str(note.get("size_bytes", "")),
            "Cache-Control": "public, max-age=3600",
        },
    )

@api_router.post("/notes/{note_id}/download")
async def download_note(note_id: str):
    note = await db.notes.find_one({"id": note_id})
    if not note or not note.get("grid_file_id"):
        raise HTTPException(status_code=404, detail="File not found")
    file_id = ObjectId(note["grid_file_id"])
    await db.notes.update_one({"id": note_id}, {"$inc": {"downloads": 1}})
    media = note.get("media_type") or ("application/pdf" if note["file_type"] == "pdf" else f"image/{note['file_ext'].lower()}")
    return StreamingResponse(
        _stream_gridfs(file_id),
        media_type=media,
        headers={
            "Content-Disposition": safe_disposition(note.get("original_name", note_id), attachment=True),
            "Content-Length": str(note.get("size_bytes", "")),
        },
    )

@api_router.post("/notes/{note_id}/like")
async def toggle_like(note_id: str, request: Request):
    note = await db.notes.find_one({"id": note_id})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    user = await get_current_user(request)
    identifier = user["id"] if user else session_id_from_request(request)
    liked_by = note.get("liked_by", [])
    if identifier in liked_by:
        liked_by.remove(identifier)
        liked = False
    else:
        liked_by.append(identifier)
        liked = True
    await db.notes.update_one(
        {"id": note_id},
        {"$set": {"liked_by": liked_by, "likes": len(liked_by)}},
    )
    return {"liked": liked, "likes": len(liked_by)}

@api_router.delete("/notes/{note_id}")
async def delete_note(note_id: str, passcode: str = ""):
    required = os.environ.get("UPLOAD_PASSCODE", "")
    if required and passcode.strip() != required:
        raise HTTPException(status_code=403, detail="Invalid passcode")
    note = await db.notes.find_one({"id": note_id})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.get("grid_file_id"):
        try:
            await fs_bucket.delete(ObjectId(note["grid_file_id"]))
        except Exception:
            pass
    await db.notes.delete_one({"id": note_id})
    return {"deleted": True}


# -------------- Folders --------------
@api_router.get("/folders")
async def list_folders():
    folders = await db.folders.find({}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    for f in folders:
        f["note_count"] = await db.notes.count_documents({"folder_id": f["id"]})
    unfiled = await db.notes.count_documents({"folder_id": {"$in": [None, ""]}})
    return {"folders": folders, "unfiled_count": unfiled}


@api_router.post("/folders")
async def create_folder(payload: dict):
    name = (payload.get("name") or "").strip()
    passcode = (payload.get("passcode") or "").strip()
    required = os.environ.get("UPLOAD_PASSCODE", "")
    if required and passcode != required:
        raise HTTPException(status_code=403, detail="Invalid passcode")
    if not name:
        raise HTTPException(status_code=400, detail="Folder name is required")
    existing = await db.folders.find_one({"name": name})
    if existing:
        raise HTTPException(status_code=400, detail="A folder with that name already exists")
    doc = {
        "id": str(uuid.uuid4()),
        "name": name,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.folders.insert_one(doc)
    doc.pop("_id", None)
    doc["note_count"] = 0
    return doc


@api_router.delete("/folders/{folder_id}")
async def delete_folder(folder_id: str, passcode: str = "", delete_notes: bool = False):
    required = os.environ.get("UPLOAD_PASSCODE", "")
    if required and passcode.strip() != required:
        raise HTTPException(status_code=403, detail="Invalid passcode")
    folder = await db.folders.find_one({"id": folder_id})
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    if delete_notes:
        async for note in db.notes.find({"folder_id": folder_id}):
            if note.get("grid_file_id"):
                try:
                    await fs_bucket.delete(ObjectId(note["grid_file_id"]))
                except Exception:
                    pass
        await db.notes.delete_many({"folder_id": folder_id})
    else:
        await db.notes.update_many({"folder_id": folder_id}, {"$set": {"folder_id": None}})
    await db.folders.delete_one({"id": folder_id})
    return {"deleted": True, "removed_notes": delete_notes}


@api_router.post("/passcode/verify")
async def verify_passcode(payload: dict):
    required = os.environ.get("UPLOAD_PASSCODE", "")
    ok = (payload.get("passcode") or "").strip() == required
    if not ok:
        raise HTTPException(status_code=403, detail="Invalid passcode")
    return {"valid": True}

@api_router.get("/")
async def root():
    return {"app": "Class 11 Notes Hub", "subject": "Biology"}

# -------------- App Setup --------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    import asyncio
    for attempt in range(10):
        try:
            await db.users.create_index("email", unique=True)
            await db.users.create_index("id", unique=True)
            await db.notes.create_index("id", unique=True)
            await db.notes.create_index("created_at")
            await db.folders.create_index("id", unique=True)
            await db.folders.create_index("name", unique=True)
            break
        except Exception as e:
            logger.warning(f"DB index creation attempt {attempt+1}/10 failed: {e}")
            await asyncio.sleep(2)

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@notes.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    try:
        existing = await db.users.find_one({"email": admin_email})
        if not existing:
            await db.users.insert_one({
                "id": str(uuid.uuid4()),
                "email": admin_email,
                "name": "Admin",
                "password_hash": hash_password(admin_password),
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            logger.info(f"Seeded admin user: {admin_email}")
        elif not verify_password(admin_password, existing["password_hash"]):
            await db.users.update_one(
                {"email": admin_email},
                {"$set": {"password_hash": hash_password(admin_password)}}
            )
            logger.info(f"Updated admin password for: {admin_email}")
    except Exception as e:
        logger.warning(f"Admin seed skipped: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Serve React build in production (must be mounted last)
_frontend_build = ROOT_DIR.parent / "frontend" / "build"
if _frontend_build.exists():
    app.mount("/static", StaticFiles(directory=str(_frontend_build / "static")), name="static-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_react(full_path: str):
        index = _frontend_build / "index.html"
        return FileResponse(str(index))
