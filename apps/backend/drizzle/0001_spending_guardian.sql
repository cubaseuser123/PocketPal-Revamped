-- Spending Guardian: Add 'nudge' notification type and user toggle columns
-- Run this against your Neon Postgres database

-- 1. Add 'nudge' to the NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'nudge';

-- 2. Add Plan B toggle (default: enabled for all users)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan_b_enabled" boolean NOT NULL DEFAULT true;

-- 3. Add Autonomous Mode toggle (default: disabled, user opts in)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "autonomous_mode_enabled" boolean NOT NULL DEFAULT false;
