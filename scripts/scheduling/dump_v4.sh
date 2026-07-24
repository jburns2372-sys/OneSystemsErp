#!/bin/sh
pg_dump -U postgres -d sanitized_audit -Fc --data-only -T '"ScheduleBOQMapping"' -T '"_prisma_migrations"' -N neon_auth -f /tmp/scheduling-reconstruction-sanitized-pre-gate7-data-v4-compatible.dump
