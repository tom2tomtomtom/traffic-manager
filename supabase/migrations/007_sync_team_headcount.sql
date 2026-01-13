-- ============================================================================
-- Alt/Shift Traffic Manager - Sync Team Headcount (January 2026)
-- Migration: 007_sync_team_headcount.sql
-- ============================================================================

-- First, mark all existing team members as inactive
UPDATE team_members SET active = false;

-- Now upsert the current headcount
-- Using email as the unique identifier

-- Ainsley Coote - Account Executive, Melbourne
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Ainsley Coote', 'ainsley@altshift.com.au', 'Account Executive', 40, true,
  ARRAY['Ideas', 'Content'], ARRAY['Client Management', 'Social Media', 'Writing'], ARRAY[]::TEXT[], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Alexandra Moloney - Social Media Account Director, Melbourne
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Alexandra Moloney', 'alexandra@altshift.com.au', 'Social Media Account Director', 40, true,
  ARRAY['Content', 'Strategy'], ARRAY['Social Media', 'Client Management', 'Writing'], ARRAY[]::TEXT[], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Alison Prowse - Account Director, Brisbane
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Alison Prowse', 'alison@altshift.com.au', 'Account Director', 40, true,
  ARRAY['Ideas', 'Strategy'], ARRAY['Client Management', 'Planning', 'Writing', 'Travel/Tourism'], ARRAY['Travel/Tourism', 'Consumer'], ARRAY['The Y Australia', '99 Bikes', 'TEQ', 'TIQ'])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Alycia Jack - Head of PR, Melbourne
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Alycia Jack', 'alycia@altshift.com.au', 'Head of PR', 40, true,
  ARRAY['Strategy', 'Ideas', 'Content'], ARRAY['Media Relations', 'Writing', 'Client Management', 'Travel/Tourism', 'Consumer', 'New Business'], ARRAY['Travel/Tourism', 'Consumer', 'Retail', 'Not-for-Profit'], ARRAY['Officeworks', 'Intrepid Travel', 'Bakers Delight', 'Dylan Alcott Foundation'])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Anna Fullerton - Group Creative Director, Melbourne
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Anna Fullerton', 'anna@altshift.com.au', 'Group Creative Director', 40, true,
  ARRAY['Creative', 'Ideas', 'Strategy'], ARRAY['Design', 'Production', 'New Business'], ARRAY[]::TEXT[], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Anton Staindl - Director, Melbourne (Part-time)
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Anton Staindl', 'anton@altshift.com.au', 'Director', 20, true,
  ARRAY['Strategy'], ARRAY['New Business', 'Client Management'], ARRAY[]::TEXT[], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, weekly_capacity_hours = 20, active = true;

-- Borna Robaei - Financial Controller, Melbourne (Part-time)
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Borna Robaei', 'borna@altshift.com.au', 'Financial Controller', 20, true,
  ARRAY['Operations'], ARRAY['Finance'], ARRAY[]::TEXT[], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, weekly_capacity_hours = 20, active = true;

-- Brodie Beel - Senior Account Director, Melbourne
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Brodie Beel', 'brodie@altshift.com.au', 'Senior Account Director', 40, true,
  ARRAY['Ideas', 'Content'], ARRAY['Events', 'Planning', 'Client Management'], ARRAY[]::TEXT[], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Cassie Dellit - Senior Account Director, Brisbane (Part-time)
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Cassie Dellit', 'cassie@altshift.com.au', 'Senior Account Director', 24, true,
  ARRAY['Ideas', 'Strategy'], ARRAY['Client Management', 'Planning', 'Writing'], ARRAY[]::TEXT[], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, weekly_capacity_hours = 24, active = true;

-- Conor Nastasi - Account Director, Sydney
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Conor Nastasi', 'conor@altshift.com.au', 'Account Director', 40, true,
  ARRAY['Ideas', 'Strategy'], ARRAY['Client Management', 'Planning', 'Writing'], ARRAY['Not-for-Profit', 'Health'], ARRAY['Cancer Council NSW'])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Damian Davitt - Head of Social & Content, Melbourne
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Damian Davitt', 'damian@altshift.com.au', 'Head of Social & Content', 40, true,
  ARRAY['Strategy', 'Ideas', 'Creative', 'Content'], ARRAY['Social Media', 'Production', 'Writing', 'Consumer', 'New Business'], ARRAY['Consumer', 'FMCG', 'Government', 'Energy'], ARRAY['Boost Juice', 'TAC', 'Origin Energy', 'Y Careers'])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Elly Hewitt - CEO, Melbourne (Part-time)
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Elly Hewitt', 'elly@altshift.com.au', 'CEO', 20, true,
  ARRAY['Strategy', 'Creative', 'Ideas'], ARRAY['Client Management', 'New Business', 'Travel/Tourism', 'Consumer'], ARRAY['Travel/Tourism', 'Consumer'], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, weekly_capacity_hours = 20, active = true;

-- Georgia Gogoll - Account Director, Melbourne
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Georgia Gogoll', 'georgia@altshift.com.au', 'Account Director', 40, true,
  ARRAY['Ideas', 'Strategy'], ARRAY['Client Management', 'Planning', 'Writing', 'Travel/Tourism'], ARRAY['Travel/Tourism'], ARRAY['Intrepid Travel', 'Camplify'])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Grace Redman - Senior Account Manager, Melbourne
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Grace Redman', 'grace@altshift.com.au', 'Senior Account Manager', 40, true,
  ARRAY['Ideas'], ARRAY['Client Management', 'Writing'], ARRAY[]::TEXT[], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Jacqueline McPherson - General Manager, Melbourne (Part-time)
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Jacqueline McPherson', 'jacqueline@altshift.com.au', 'General Manager', 24, true,
  ARRAY['Strategy', 'Ideas'], ARRAY['Client Management', 'Consumer', 'Planning'], ARRAY['Consumer'], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, weekly_capacity_hours = 24, active = true;

-- Jemima Crawford Smith - Account Director, Melbourne
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Jemima Crawford Smith', 'jemima@altshift.com.au', 'Account Director', 40, true,
  ARRAY['Ideas', 'Strategy'], ARRAY['Client Management', 'Planning', 'Writing'], ARRAY[]::TEXT[], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Katie Raleigh - Managing Director Sydney (Part-time)
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Katie Raleigh', 'katie@altshift.com.au', 'Managing Director, Sydney', 24, true,
  ARRAY['Strategy', 'Ideas', 'Creative'], ARRAY['Client Management', 'New Business', 'Consumer'], ARRAY['Consumer', 'Travel/Tourism', 'Retail'], ARRAY['IKEA', 'CBA', 'Tourism Australia', 'Woolworths', 'Qantas'])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, weekly_capacity_hours = 24, active = true;

-- Lucy Morgan - Melbourne
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Lucy Morgan', 'lucy@altshift.com.au', 'Team Member', 40, true,
  ARRAY['Ideas'], ARRAY['Client Management', 'Writing'], ARRAY[]::TEXT[], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Madeline Garisto - Senior Account Director, Melbourne
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Madeline Garisto', 'madeline@altshift.com.au', 'Senior Account Director', 40, true,
  ARRAY['Strategy', 'Ideas'], ARRAY['Research', 'Data/Analytics', 'Writing', 'Planning', 'Government', 'Not-for-Profit', 'Behavioral Science'], ARRAY['Government', 'Health', 'Not-for-Profit'], ARRAY['Victorian Department of Health', 'Cancer Council Victoria', 'Sustainability Victoria'])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Martha Palmer-Endean - Senior Account Executive, Sydney
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Martha Palmer-Endean', 'martha@altshift.com.au', 'Senior Account Executive', 40, true,
  ARRAY['Ideas'], ARRAY['Client Management', 'Writing', 'Travel/Tourism'], ARRAY['Travel/Tourism'], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Paula Cardamone - Senior Account Manager, Melbourne
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Paula Cardamone', 'paula@altshift.com.au', 'Senior Account Manager', 40, true,
  ARRAY['Ideas'], ARRAY['Client Management', 'Planning', 'Writing'], ARRAY['Retail'], ARRAY['Officeworks'])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Priscilla Jeha - General Manager, Brisbane
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Priscilla Jeha', 'priscilla@altshift.com.au', 'General Manager', 40, true,
  ARRAY['Strategy', 'Ideas'], ARRAY['Client Management', 'Government'], ARRAY['Government'], ARRAY['TEQ', 'TIQ'])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Priya Shah - Account Manager, Brisbane
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Priya Shah', 'priya@altshift.com.au', 'Account Manager', 40, true,
  ARRAY['Ideas'], ARRAY['Client Management', 'Writing'], ARRAY[]::TEXT[], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Rachael Mortimore - Senior Creative, Melbourne
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Rachael Mortimore', 'rachael@altshift.com.au', 'Senior Creative', 40, true,
  ARRAY['Creative', 'Ideas'], ARRAY['Design', 'Production', 'Writing'], ARRAY[]::TEXT[], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Richard Hayward - Director, Melbourne (Part-time)
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Richard Hayward', 'richard@altshift.com.au', 'Director', 20, true,
  ARRAY['Strategy', 'Ideas'], ARRAY['Client Management', 'Media Relations', 'B2B/Corporate'], ARRAY['B2B/Corporate', 'Corporate Affairs'], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, weekly_capacity_hours = 20, active = true;

-- Samantha Vassos - Managing Director, Melbourne (Part-time)
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Samantha Vassos', 'sam.vassos@altshift.com.au', 'Managing Director', 24, true,
  ARRAY['Strategy', 'Ideas', 'Creative'], ARRAY['Client Management', 'New Business', 'Consumer'], ARRAY['Consumer'], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, weekly_capacity_hours = 24, active = true;

-- Sandra Wikberg - Senior Account Manager, Melbourne
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Sandra Wikberg', 'sandra@altshift.com.au', 'Senior Account Manager', 40, true,
  ARRAY['Ideas'], ARRAY['Client Management', 'Writing', 'Social Media'], ARRAY[]::TEXT[], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Shanya Sylvester - Account Coordinator, Melbourne
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Shanya Sylvester', 'shanya@altshift.com.au', 'Account Coordinator', 40, true,
  ARRAY['Ideas'], ARRAY['Client Management', 'Writing'], ARRAY[]::TEXT[], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Sofya Daroy - People, Performance & Culture Director, Melbourne (Part-time)
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Sofya Daroy', 'sofya@altshift.com.au', 'People, Performance & Culture Director', 24, true,
  ARRAY['Strategy', 'Ideas'], ARRAY['Client Management', 'Planning'], ARRAY[]::TEXT[], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, weekly_capacity_hours = 24, active = true;

-- Sophie Truter - Head of Integrated, Melbourne
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Sophie Truter', 'sophie@altshift.com.au', 'Head of Integrated', 40, true,
  ARRAY['Strategy', 'Ideas', 'Content'], ARRAY['Client Management', 'Writing', 'Government', 'B2B/Corporate', 'Not-for-Profit', 'New Business'], ARRAY['Government', 'Health', 'Not-for-Profit', 'B2B/Corporate'], ARRAY['TAC', 'Victorian Department of Health', 'Sustainability Victoria', 'Cancer Council Victoria'])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Toby Hearst - Finance Assistant, Melbourne (Casual)
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Toby Hearst', 'toby@altshift.com.au', 'Finance Assistant', 16, true,
  ARRAY['Operations'], ARRAY['Finance'], ARRAY[]::TEXT[], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, weekly_capacity_hours = 16, active = true;

-- Uttara Rallabandi - Social Media Executive, Melbourne
INSERT INTO team_members (full_name, email, role, weekly_capacity_hours, active, core_roles, capabilities, industries, known_clients)
VALUES ('Uttara Rallabandi', 'uttara@altshift.com.au', 'Social Media Executive', 40, true,
  ARRAY['Content'], ARRAY['Social Media', 'Writing'], ARRAY[]::TEXT[], ARRAY[]::TEXT[])
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

-- Summary: 32 active team members synced from headcount CSV
