#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR="/root/Medicine_Frontend_CRM"
SERVICE_NAME="medicine-frontend"
CONTAINER_NAME="medicine-crm-frontend-production"
DOCKER_IMAGE="ghcr.io/wasiquekh/medicine-frontend-production:latest"
HEALTH_TIMEOUT=60

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "\n${BLUE}➜ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✔ $1${NC}"
}

print_error() {
    echo -e "${RED}✖ $1${NC}"
}

cd "$APP_DIR"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Medicine Frontend Production Deploy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

print_step "Validating Docker Compose configuration..."
docker compose config >/dev/null
print_success "Docker Compose configuration is valid"

print_step "Removing old image cache..."
docker rmi "$DOCKER_IMAGE" >/dev/null 2>&1 || true
print_success "Old image cache cleared"

print_step "Pulling latest frontend image..."
docker compose pull "$SERVICE_NAME"
print_success "Latest frontend image pulled"

print_step "Recreating frontend container..."
docker compose up -d --force-recreate --no-deps "$SERVICE_NAME"
print_success "Frontend container recreated"

print_step "Waiting for frontend container..."

SECONDS_WAITED=0
STATUS="not-found"

while [ "$SECONDS_WAITED" -lt "$HEALTH_TIMEOUT" ]; do

    STATUS=$(docker inspect \
        --format='{{.State.Status}}' \
        "$CONTAINER_NAME" 2>/dev/null || echo "not-found")

    if [ "$STATUS" = "running" ]; then
        print_success "Frontend container is running"
        break
    fi

    sleep 2
    SECONDS_WAITED=$((SECONDS_WAITED + 2))

done

if [ "$STATUS" != "running" ]; then

    print_error "Frontend container failed to start"

    echo ""
    echo "Last frontend logs:"
    docker logs --tail=50 "$CONTAINER_NAME" || true

    exit 1
fi

print_step "Checking frontend container..."
docker ps --filter "name=$CONTAINER_NAME"
print_success "Frontend container is running"

print_step "Checking frontend port..."
docker port "$CONTAINER_NAME"
print_success "Frontend port check completed"

print_step "Cleaning unused Docker images..."
docker image prune -f >/dev/null 2>&1 || true
print_success "Docker cleanup completed"

echo ""
echo "Latest frontend logs:"
docker logs --tail=30 "$CONTAINER_NAME" || true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Medicine Frontend Deployment Successful${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit 0