#!/bin/bash
mkdir -p /tmp/mongodb-data
mongod --dbpath /tmp/mongodb-data --port 27017 --logpath /tmp/mongod.log &
MONGOD_PID=$!
sleep 3
cd backend
uvicorn server:app --host localhost --port 8000 --reload
