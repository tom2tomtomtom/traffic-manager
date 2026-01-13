-- ============================================================================
-- Alt/Shift Traffic Manager - Populate Team Capabilities
-- Migration: 004_populate_capabilities.sql
-- ============================================================================

-- Senior Leadership
UPDATE team_members SET
  core_roles = ARRAY['Strategy', 'Creative', 'Ideas'],
  capabilities = ARRAY['Client Management', 'New Business', 'Travel/Tourism', 'Consumer'],
  industries = ARRAY['Travel/Tourism', 'Consumer'],
  permission_level = 'Approver',
  known_clients = ARRAY[]::TEXT[]
WHERE email = 'elly@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Strategy', 'Ideas'],
  capabilities = ARRAY['Client Management', 'Media Relations', 'B2B/Corporate'],
  industries = ARRAY['B2B/Corporate', 'Corporate Affairs'],
  permission_level = 'Approver',
  known_clients = ARRAY[]::TEXT[]
WHERE email = 'richard@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Strategy', 'Ideas', 'Creative'],
  capabilities = ARRAY['Client Management', 'New Business', 'Consumer'],
  industries = ARRAY['Consumer'],
  permission_level = 'Approver',
  known_clients = ARRAY[]::TEXT[]
WHERE email = 'sam.vassos@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Strategy', 'Ideas', 'Creative'],
  capabilities = ARRAY['Client Management', 'New Business', 'Consumer'],
  industries = ARRAY['Consumer', 'Travel/Tourism', 'Retail'],
  permission_level = 'Approver',
  known_clients = ARRAY['IKEA', 'CBA', 'Tourism Australia', 'Woolworths', 'Qantas']
WHERE email = 'katie@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Strategy', 'Ideas'],
  capabilities = ARRAY['Client Management', 'Government'],
  industries = ARRAY['Government'],
  permission_level = 'Approver',
  known_clients = ARRAY['TEQ', 'TIQ']
WHERE email = 'priscilla@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Strategy', 'Ideas'],
  capabilities = ARRAY['Client Management'],
  industries = ARRAY[]::TEXT[],
  permission_level = 'Approver',
  known_clients = ARRAY[]::TEXT[]
WHERE email = 'samantha.razzell@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Strategy', 'Ideas'],
  capabilities = ARRAY['Client Management', 'Consumer'],
  industries = ARRAY['Consumer'],
  permission_level = 'Approver',
  known_clients = ARRAY[]::TEXT[]
WHERE email = 'jj@altshift.com.au';

-- Practice Heads
UPDATE team_members SET
  core_roles = ARRAY['Strategy', 'Ideas', 'Content'],
  capabilities = ARRAY['Media Relations', 'Writing', 'Client Management', 'Travel/Tourism', 'Consumer', 'New Business'],
  industries = ARRAY['Travel/Tourism', 'Consumer', 'Retail', 'Not-for-Profit'],
  permission_level = 'Approver',
  known_clients = ARRAY['Officeworks', 'Intrepid Travel', 'Bakers Delight', 'Dylan Alcott Foundation']
WHERE email = 'alycia@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Strategy', 'Ideas', 'Creative', 'Content'],
  capabilities = ARRAY['Social Media', 'Production', 'Writing', 'Consumer', 'New Business'],
  industries = ARRAY['Consumer', 'FMCG', 'Government', 'Energy'],
  permission_level = 'Approver',
  known_clients = ARRAY['Boost Juice', 'TAC', 'Origin Energy', 'Y Careers']
WHERE email = 'damian@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Strategy', 'Ideas', 'Content'],
  capabilities = ARRAY['Client Management', 'Writing', 'Government', 'B2B/Corporate', 'Not-for-Profit', 'New Business'],
  industries = ARRAY['Government', 'Health', 'Not-for-Profit', 'B2B/Corporate'],
  permission_level = 'Approver',
  known_clients = ARRAY['TAC', 'Victorian Department of Health', 'Sustainability Victoria', 'Cancer Council Victoria']
WHERE email = 'sophie@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Strategy', 'Ideas'],
  capabilities = ARRAY['Client Management', 'Planning'],
  industries = ARRAY[]::TEXT[],
  permission_level = 'Approver',
  known_clients = ARRAY[]::TEXT[]
WHERE email = 'sofya@altshift.com.au';

-- Creative & Strategy
UPDATE team_members SET
  core_roles = ARRAY['Creative', 'Ideas', 'Strategy'],
  capabilities = ARRAY['Design', 'Production', 'New Business'],
  industries = ARRAY[]::TEXT[],
  permission_level = 'Approver',
  known_clients = ARRAY[]::TEXT[]
WHERE email = 'anna@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Strategy', 'Ideas'],
  capabilities = ARRAY['Data/Analytics', 'Planning', 'AI'],
  industries = ARRAY['Technology'],
  permission_level = 'Reviewer',
  known_clients = ARRAY[]::TEXT[]
WHERE email = 'tom@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Strategy', 'Ideas'],
  capabilities = ARRAY['Research', 'Data/Analytics', 'Writing', 'Planning', 'Government', 'Not-for-Profit', 'Behavioral Science'],
  industries = ARRAY['Government', 'Health', 'Not-for-Profit'],
  permission_level = 'Executor',
  known_clients = ARRAY['Victorian Department of Health', 'Cancer Council Victoria', 'Sustainability Victoria']
WHERE email = 'maddy@altshift.com.au';

-- Brisbane Office
UPDATE team_members SET
  core_roles = ARRAY['Ideas', 'Strategy'],
  capabilities = ARRAY['Client Management', 'Planning', 'Writing', 'Travel/Tourism'],
  industries = ARRAY['Travel/Tourism', 'Consumer'],
  permission_level = 'Reviewer',
  known_clients = ARRAY['The Y Australia', '99 Bikes', 'TEQ', 'TIQ']
WHERE email = 'alison@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Ideas', 'Strategy'],
  capabilities = ARRAY['Client Management', 'Planning', 'Writing'],
  industries = ARRAY[]::TEXT[],
  permission_level = 'Reviewer',
  known_clients = ARRAY[]::TEXT[]
WHERE email = 'cassie@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Ideas'],
  capabilities = ARRAY['Client Management', 'Planning', 'Writing'],
  industries = ARRAY[]::TEXT[],
  permission_level = 'Executor',
  known_clients = ARRAY[]::TEXT[]
WHERE email = 'kate.healy@altshift.com.au';

-- Sydney Office
UPDATE team_members SET
  core_roles = ARRAY['Ideas', 'Strategy'],
  capabilities = ARRAY['Client Management', 'Planning', 'Writing'],
  industries = ARRAY['Not-for-Profit', 'Health'],
  permission_level = 'Reviewer',
  known_clients = ARRAY['Cancer Council NSW']
WHERE email = 'conor@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Ideas'],
  capabilities = ARRAY['Client Management', 'Writing'],
  industries = ARRAY[]::TEXT[],
  permission_level = 'Executor',
  known_clients = ARRAY[]::TEXT[]
WHERE email = 'taylor@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Ideas'],
  capabilities = ARRAY['Client Management', 'Writing'],
  industries = ARRAY[]::TEXT[],
  permission_level = 'Executor',
  known_clients = ARRAY[]::TEXT[]
WHERE email = 'lucy@altshift.com.au';

-- Melbourne Office - Account Directors/Senior
UPDATE team_members SET
  core_roles = ARRAY['Ideas', 'Strategy'],
  capabilities = ARRAY['Client Management', 'Planning', 'Writing'],
  industries = ARRAY[]::TEXT[],
  permission_level = 'Reviewer',
  known_clients = ARRAY[]::TEXT[]
WHERE email = 'jemima@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Ideas', 'Strategy'],
  capabilities = ARRAY['Client Management', 'Planning', 'Writing', 'Travel/Tourism'],
  industries = ARRAY['Travel/Tourism'],
  permission_level = 'Reviewer',
  known_clients = ARRAY['Intrepid Travel', 'Camplify']
WHERE email = 'georgia@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Ideas'],
  capabilities = ARRAY['Client Management', 'Planning', 'Writing'],
  industries = ARRAY['Retail'],
  permission_level = 'Executor',
  known_clients = ARRAY['Officeworks']
WHERE email = 'paula@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Ideas', 'Strategy'],
  capabilities = ARRAY['Client Management', 'Planning', 'Writing', 'Consumer'],
  industries = ARRAY['Retail', 'Consumer'],
  permission_level = 'Reviewer',
  known_clients = ARRAY['Officeworks']
WHERE email = 'sarah@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Strategy', 'Ideas'],
  capabilities = ARRAY['Client Management', 'Consumer', 'Planning'],
  industries = ARRAY['Consumer'],
  permission_level = 'Reviewer',
  known_clients = ARRAY[]::TEXT[]
WHERE email = 'jacqueline@altshift.com.au';

-- Melbourne Office - Account Managers
UPDATE team_members SET
  core_roles = ARRAY['Ideas'],
  capabilities = ARRAY['Client Management', 'Writing'],
  industries = ARRAY['Retail'],
  permission_level = 'Executor',
  known_clients = ARRAY['Officeworks']
WHERE email = 'steph@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Ideas'],
  capabilities = ARRAY['Client Management', 'Writing'],
  industries = ARRAY['Retail'],
  permission_level = 'Executor',
  known_clients = ARRAY['Officeworks']
WHERE email = 'clementine@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Ideas'],
  capabilities = ARRAY['Client Management', 'Writing', 'Travel/Tourism'],
  industries = ARRAY['Travel/Tourism'],
  permission_level = 'Executor',
  known_clients = ARRAY[]::TEXT[]
WHERE email = 'martha@altshift.com.au';

-- Melbourne Office - Junior Team
UPDATE team_members SET
  core_roles = ARRAY['Ideas', 'Content'],
  capabilities = ARRAY['Client Management', 'Social Media', 'Writing'],
  industries = ARRAY[]::TEXT[],
  permission_level = 'Executor',
  known_clients = ARRAY[]::TEXT[]
WHERE email = 'ainsley@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Ideas'],
  capabilities = ARRAY['Client Management', 'Writing'],
  industries = ARRAY['Retail'],
  permission_level = 'Executor',
  known_clients = ARRAY['Officeworks']
WHERE email = 'bronte@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Ideas'],
  capabilities = ARRAY['Client Management', 'Writing'],
  industries = ARRAY['Retail'],
  permission_level = 'Executor',
  known_clients = ARRAY['Officeworks']
WHERE email = 'joey@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Ideas'],
  capabilities = ARRAY['Client Management', 'Writing'],
  industries = ARRAY[]::TEXT[],
  permission_level = 'Executor',
  known_clients = ARRAY[]::TEXT[]
WHERE email = 'shanya@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Ideas'],
  capabilities = ARRAY['Client Management', 'Writing'],
  industries = ARRAY['Retail'],
  permission_level = 'Executor',
  known_clients = ARRAY['Officeworks']
WHERE email = 'tilly@altshift.com.au';

-- Content & Social
UPDATE team_members SET
  core_roles = ARRAY['Content', 'Ideas'],
  capabilities = ARRAY['Production', 'Social Media', 'Writing'],
  industries = ARRAY['Retail'],
  permission_level = 'Executor',
  known_clients = ARRAY['Officeworks']
WHERE email = 'genevieve@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Content', 'Ideas', 'Creative'],
  capabilities = ARRAY['Social Media', 'Production', 'Writing', 'Media Relations'],
  industries = ARRAY['Media', 'Entertainment'],
  permission_level = 'Reviewer',
  known_clients = ARRAY[]::TEXT[]
WHERE email = 'emma@altshift.com.au';

-- Creative & Production
UPDATE team_members SET
  core_roles = ARRAY['Content', 'Creative'],
  capabilities = ARRAY['Paid Media', 'Data/Analytics'],
  industries = ARRAY['Retail'],
  permission_level = 'Executor',
  known_clients = ARRAY['Officeworks']
WHERE email = 'david@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Creative', 'Ideas'],
  capabilities = ARRAY['Design', 'Production', 'Writing'],
  industries = ARRAY['Retail'],
  permission_level = 'Executor',
  known_clients = ARRAY['Officeworks']
WHERE email = 'omar@altshift.com.au';

UPDATE team_members SET
  core_roles = ARRAY['Content', 'Creative'],
  capabilities = ARRAY['Production', 'Events'],
  industries = ARRAY[]::TEXT[],
  permission_level = 'Executor',
  known_clients = ARRAY[]::TEXT[]
WHERE email = 'jess@altshift.com.au';

-- Events
UPDATE team_members SET
  core_roles = ARRAY['Ideas', 'Content'],
  capabilities = ARRAY['Events', 'Planning'],
  industries = ARRAY[]::TEXT[],
  permission_level = 'Executor',
  known_clients = ARRAY[]::TEXT[]
WHERE email = 'brodie@altshift.com.au';
