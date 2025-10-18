-- Sample Medication Data for Current User
-- Run this after running the main schema.sql
-- This will create sample medications for the current authenticated user

-- Get current user ID (you'll need to replace this with your actual user ID)
-- You can get your user ID by running: SELECT auth.uid();

-- Insert sample medications for multiple days
-- Replace 'YOUR_USER_ID_HERE' with your actual Supabase user UUID

DO $$
DECLARE
    current_user_id UUID;
    doctor_user_id UUID;
    today_date DATE := CURRENT_DATE;
    yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
    tomorrow_date DATE := CURRENT_DATE + INTERVAL '1 day';
BEGIN
    -- Get the current user ID (this will work when run as authenticated user)
    current_user_id := auth.uid();
    
    -- Use the same user as both patient and doctor for demo purposes
    doctor_user_id := current_user_id;
    
    -- Only proceed if we have a valid user
    IF current_user_id IS NOT NULL THEN
        
        -- Yesterday's medications (all completed)
        INSERT INTO medications (patient_id, doctor_id, name, dosage, instructions, start_date, end_date, time_of_day, label, scheduled_date, is_completed, completed_at) VALUES
        (current_user_id, doctor_user_id, 'Metformin', '500mg', 'Take with meals to reduce stomach upset', yesterday_date, yesterday_date + INTERVAL '30 days', '08:00:00', '8:00 AM', yesterday_date, true, yesterday_date + INTERVAL '8 hours'),
        (current_user_id, doctor_user_id, 'Vitamin D3', '1000 IU', 'Take with breakfast for better absorption', yesterday_date, yesterday_date + INTERVAL '30 days', '08:30:00', '8:30 AM', yesterday_date, true, yesterday_date + INTERVAL '8 hours 30 minutes'),
        (current_user_id, doctor_user_id, 'Metformin', '500mg', 'Take with meals to reduce stomach upset', yesterday_date, yesterday_date + INTERVAL '30 days', '18:00:00', '6:00 PM', yesterday_date, true, yesterday_date + INTERVAL '18 hours');
        
        -- Today's medications (mixed completion status)
        INSERT INTO medications (patient_id, doctor_id, name, dosage, instructions, start_date, end_date, time_of_day, label, scheduled_date, is_completed, completed_at) VALUES
        (current_user_id, doctor_user_id, 'Metformin', '500mg', 'Take with meals to reduce stomach upset', today_date, today_date + INTERVAL '30 days', '08:00:00', '8:00 AM', today_date, true, today_date + INTERVAL '8 hours'),
        (current_user_id, doctor_user_id, 'Vitamin D3', '1000 IU', 'Take with breakfast for better absorption', today_date, today_date + INTERVAL '30 days', '08:30:00', '8:30 AM', today_date, false, NULL),
        (current_user_id, doctor_user_id, 'Omega-3', '1200mg', 'Take with food to improve absorption', today_date, today_date + INTERVAL '30 days', '12:00:00', '12:00 PM', today_date, false, NULL),
        (current_user_id, doctor_user_id, 'Metformin', '500mg', 'Take with meals to reduce stomach upset', today_date, today_date + INTERVAL '30 days', '18:00:00', '6:00 PM', today_date, false, NULL),
        (current_user_id, doctor_user_id, 'Lisinopril', '10mg', 'Take at the same time each day', today_date, today_date + INTERVAL '30 days', '20:00:00', '8:00 PM', today_date, false, NULL);
        
        -- Tomorrow's medications (all pending)
        INSERT INTO medications (patient_id, doctor_id, name, dosage, instructions, start_date, end_date, time_of_day, label, scheduled_date, is_completed) VALUES
        (current_user_id, doctor_user_id, 'Metformin', '500mg', 'Take with meals to reduce stomach upset', tomorrow_date, tomorrow_date + INTERVAL '30 days', '08:00:00', '8:00 AM', tomorrow_date, false),
        (current_user_id, doctor_user_id, 'Vitamin D3', '1000 IU', 'Take with breakfast for better absorption', tomorrow_date, tomorrow_date + INTERVAL '30 days', '08:30:00', '8:30 AM', tomorrow_date, false),
        (current_user_id, doctor_user_id, 'Omega-3', '1200mg', 'Take with food to improve absorption', tomorrow_date, tomorrow_date + INTERVAL '30 days', '12:00:00', '12:00 PM', tomorrow_date, false);
        
        RAISE NOTICE 'Sample medications inserted successfully for user: %', current_user_id;
    ELSE
        RAISE NOTICE 'No authenticated user found. Please run this as an authenticated user.';
    END IF;
END $$;