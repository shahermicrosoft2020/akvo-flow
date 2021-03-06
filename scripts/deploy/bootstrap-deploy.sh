#!/usr/bin/env sh

set -eu

apk add --no-cache \
    bash~=5.0 \
    git~=2 \
    jq~=1.6 \
    parallel \
    shadow~=4.6 \
    su-exec~=0.2 \
    unzip~=6.0 \
    zip~=3.0 \


adduser -D -h /home/akvo -s /bin/bash akvo akvo

NEW_UID=$(stat -c '%u' /akvo-flow)
NEW_GID=$(stat -c '%g' /akvo-flow)

groupmod -g "$NEW_GID" -o akvo >/dev/null 2>&1
usermod -u "$NEW_UID" -o akvo >/dev/null 2>&1

# Disable annoying citation warning
mkdir -p /home/akvo/.parallel
touch /home/akvo/.parallel/will-cite
chown akvo:akvo /home/akvo/.parallel/will-cite

exec su-exec akvo:akvo ./scripts/deploy/deploy.sh "$@"
