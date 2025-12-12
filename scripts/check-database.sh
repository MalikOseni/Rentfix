#!/bin/bash

# RentFix Database Inspection Script
# Quick database health check and data inspection

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

CONTAINER_NAME=${POSTGRES_CONTAINER:-rentfix-postgres-dev}
DB_USER=${DB_USER:-rentfix}
DB_NAME=${DB_NAME:-rentfix}

echo "=================================================="
echo "🗄️  RentFix Database Inspection"
echo "=================================================="
echo ""

# Check if container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ PostgreSQL container '$CONTAINER_NAME' is not running"
    echo "Start it with: docker-compose -f docker-compose.dev.yml up -d postgres"
    exit 1
fi

echo -e "${GREEN}✓${NC} PostgreSQL container is running"
echo ""

# Function to run psql command
psql_exec() {
    docker exec -it $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "$1"
}

# Function to run psql command without formatting
psql_exec_raw() {
    docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "$1"
}

echo "1. Database Information"
echo "-----------------------"

echo -n "PostgreSQL Version: "
psql_exec_raw "SELECT version()" | head -1 | xargs

echo -n "PostGIS Version: "
if psql_exec_raw "SELECT PostGIS_version()" 2>/dev/null | grep -q "."; then
    psql_exec_raw "SELECT PostGIS_version()" | xargs
else
    echo "⚠️  PostGIS not enabled. Run: CREATE EXTENSION IF NOT EXISTS postgis;"
fi

echo -n "Database Size: "
psql_exec_raw "SELECT pg_size_pretty(pg_database_size('$DB_NAME'))" | xargs

echo ""
echo "2. Tables Overview"
echo "------------------"

echo "Listing all tables..."
psql_exec "\dt"

echo ""
echo "3. Row Counts"
echo "-------------"

# Get list of tables
tables=$(psql_exec_raw "\dt" | awk '{print $3}' | tail -n +2)

if [ -z "$tables" ]; then
    echo "No tables found in the database."
else
    for table in $tables; do
        count=$(psql_exec_raw "SELECT COUNT(*) FROM $table" 2>/dev/null | xargs)
        if [ -n "$count" ]; then
            echo "$table: $count rows"
        fi
    done
fi

echo ""
echo "4. Recent Activity"
echo "------------------"

# Check if users table exists
if psql_exec_raw "\dt users" 2>/dev/null | grep -q "users"; then
    echo "Recent users (last 5):"
    psql_exec "SELECT id, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5"
fi

# Check if tickets table exists
if psql_exec_raw "\dt tickets" 2>/dev/null | grep -q "tickets"; then
    echo ""
    echo "Recent tickets (last 5):"
    psql_exec "SELECT id, title, status, created_at FROM tickets ORDER BY created_at DESC LIMIT 5"
fi

# Check if contractors table exists
if psql_exec_raw "\dt contractors" 2>/dev/null | grep -q "contractors"; then
    echo ""
    echo "Contractors count by availability:"
    psql_exec "SELECT availability_status, COUNT(*) FROM contractors GROUP BY availability_status"
fi

echo ""
echo "5. Indexes"
echo "----------"

echo "Listing spatial indexes (PostGIS):"
index_count=$(psql_exec_raw "SELECT COUNT(*) FROM pg_indexes WHERE indexdef LIKE '%GIST%'" | xargs)
echo "Total GIST indexes: $index_count"

if [ "$index_count" -gt 0 ]; then
    psql_exec "SELECT tablename, indexname FROM pg_indexes WHERE indexdef LIKE '%GIST%'"
fi

echo ""
echo "6. Redis Information"
echo "--------------------"

REDIS_CONTAINER=${REDIS_CONTAINER:-rentfix-redis-dev}

if docker ps | grep -q "$REDIS_CONTAINER"; then
    echo -e "${GREEN}✓${NC} Redis container is running"

    echo -n "Redis Version: "
    docker exec $REDIS_CONTAINER redis-cli INFO server | grep redis_version | cut -d':' -f2

    echo -n "Total Keys: "
    docker exec $REDIS_CONTAINER redis-cli DBSIZE | cut -d':' -f2

    echo -n "Memory Usage: "
    docker exec $REDIS_CONTAINER redis-cli INFO memory | grep used_memory_human | cut -d':' -f2

    echo ""
    echo "Sample keys:"
    docker exec $REDIS_CONTAINER redis-cli --scan --count 10 | head -5
else
    echo "⚠️  Redis container '$REDIS_CONTAINER' is not running"
fi

echo ""
echo "=================================================="
echo "✅ Database inspection complete"
echo "=================================================="
echo ""
echo "To connect manually:"
echo "  PostgreSQL: docker exec -it $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME"
echo "  Redis: docker exec -it $REDIS_CONTAINER redis-cli"
