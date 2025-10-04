/*
  # Set up daily increment job for days_borrowed

  1. Changes
    - Create a pg_cron extension to schedule daily jobs
    - Schedule the increment_days_borrowed() function to run daily at midnight
    
  2. Notes
    - The function increment_days_borrowed() was already created in the initial migration
    - This migration sets up the automated daily execution
    - pg_cron runs tasks based on UTC timezone
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'increment_days_borrowed_daily'
  ) THEN
    PERFORM cron.schedule(
      'increment_days_borrowed_daily',
      '0 0 * * *',
      'SELECT increment_days_borrowed()'
    );
  END IF;
END $$;