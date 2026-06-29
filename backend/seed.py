"""Seed sample Biology notes for the archive into MongoDB + GridFS."""
import asyncio, os, uuid, base64
from pathlib import Path
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket

SAMPLES = [
    {"title": "Cell Biology — Structure and Function", "description": "Cell organelles, cell membrane, mitosis and meiosis with detailed diagrams.", "chapter": "Cell: The Unit of Life", "file_type": "pdf", "file_ext": "PDF", "downloads": 28, "likes": 12},
    {"title": "Plant Kingdom Classification", "description": "Division of plant kingdom: Thallophyta, Bryophyta, Pteridophyta, Gymnosperm and Angiosperm.", "chapter": "Plant Kingdom", "file_type": "pdf", "file_ext": "PDF", "downloads": 22, "likes": 9},
    {"title": "Biological Classification — Five Kingdom", "description": "Whittaker's five kingdom classification with examples and characteristics.", "chapter": "Biological Classification", "file_type": "pdf", "file_ext": "PDF", "downloads": 15, "likes": 6},
    {"title": "Photosynthesis — Light & Dark Reactions", "description": "C3, C4 pathways, Calvin cycle, factors affecting photosynthesis.", "chapter": "Photosynthesis in Higher Plants", "file_type": "pdf", "file_ext": "PDF", "downloads": 31, "likes": 14},
    {"title": "Human Respiratory System Diagram", "description": "Labelled diagram of respiratory tract with key alveolar gas exchange notes.", "chapter": "Breathing and Exchange of Gases", "file_type": "image", "file_ext": "PNG", "downloads": 11, "likes": 4},
    {"title": "Biomolecules — Proteins & Enzymes", "description": "Amino acids, protein structure, enzyme kinetics and inhibition.", "chapter": "Biomolecules", "file_type": "pdf", "file_ext": "PDF", "downloads": 19, "likes": 8},
    {"title": "Animal Kingdom — Phyla Chart", "description": "Quick-reference chart of animal phyla with key features and examples.", "chapter": "Animal Kingdom", "file_type": "image", "file_ext": "PNG", "downloads": 8, "likes": 3},
    {"title": "Cell Cycle & Cell Division MCQs", "description": "100+ MCQs covering mitosis, meiosis, and cell cycle regulation.", "chapter": "Cell Cycle and Cell Division", "file_type": "pdf", "file_ext": "PDF", "downloads": 24, "likes": 11},
]

PDF_MIN = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]/Contents 4 0 R/Resources<<>>>>endobj 4 0 obj<</Length 44>>stream\nBT /F1 18 Tf 60 100 Td (Sample Biology Note) Tj ET\nendstream endobj xref\n0 5\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000098 00000 n\n0000000175 00000 n\ntrailer<</Size 5/Root 1 0 R>>\nstartxref 268\n%%EOF"
PNG_MIN = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==")

async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    fs_bucket = AsyncIOMotorGridFSBucket(db, bucket_name="note_files")

    await db.notes.delete_many({})
    await db["note_files.files"].delete_many({})
    await db["note_files.chunks"].delete_many({})

    now = datetime.now(timezone.utc)
    for i, s in enumerate(SAMPLES):
        note_id = str(uuid.uuid4())
        ext = ".pdf" if s["file_type"] == "pdf" else ".png"
        data = PDF_MIN if ext == ".pdf" else PNG_MIN
        media = "application/pdf" if ext == ".pdf" else "image/png"
        filename = f"{s['title'].replace(' ', '_').lower()}{ext}"

        grid_id = await fs_bucket.upload_from_stream(
            filename, data, metadata={"note_id": note_id, "content_type": media}
        )

        doc = {
            "id": note_id,
            "title": s["title"],
            "description": s["description"],
            "chapter": s["chapter"],
            "subject": "Biology",
            "file_type": s["file_type"],
            "file_ext": s["file_ext"],
            "media_type": media,
            "grid_file_id": str(grid_id),
            "original_name": filename,
            "size_bytes": len(data),
            "downloads": s["downloads"],
            "likes": s["likes"],
            "liked_by": [],
            "uploader_id": None,
            "uploader_name": "Sample Contributor",
            "created_at": (now - timedelta(days=i)).isoformat(),
        }
        await db.notes.insert_one(doc)
    print(f"Seeded {len(SAMPLES)} notes into GridFS")

if __name__ == "__main__":
    asyncio.run(main())
