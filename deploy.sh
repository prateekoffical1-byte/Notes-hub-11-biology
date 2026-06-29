#!/bin/bash
mkdir -p /tmp/mongodb-data

# Start mongod in background (no fork, so process stays tracked)
mongod --dbpath /tmp/mongodb-data --port 27017 --quiet --bind_ip 127.0.0.1 &

# Wait for MongoDB to accept connections (up to 30 seconds)
echo "Waiting for MongoDB to start..."
python3 - <<'EOF'
import time, sys
for i in range(30):
    try:
        from pymongo import MongoClient
        MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=1000).admin.command("ping")
        print(f"MongoDB ready after {i+1}s")
        sys.exit(0)
    except Exception as e:
        time.sleep(1)
print("MongoDB did not start in time")
sys.exit(1)
EOF

cd backend
exec uvicorn server:app --host 0.0.0.0 --port 5000
