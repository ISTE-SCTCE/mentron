-- Update student departments to full names

UPDATE group_members SET department = 'Computer Science' WHERE department = 'CSE' OR department = 'CS';
UPDATE group_members SET department = 'Computer Science with AI & ML' WHERE department = 'CS-AIML' OR department = 'CS(AI&ML)';
UPDATE group_members SET department = 'Electronics and Communication Engineering' WHERE department = 'ECE';
UPDATE group_members SET department = 'Mechanical Engineering' WHERE department = 'ME';
UPDATE group_members SET department = 'Mechanical Automobile Engineering' WHERE department = 'AE' OR department = 'MAE';
UPDATE group_members SET department = 'Biotechnology and Biochemical Engineering' WHERE department = 'BT';

-- Clean up others or leave them (EEE, CE not in new list, maybe map to closest or leave)
-- User instruction: "remove other types". We can't delete students implicitly.
-- We will leave them for now, but they won't appear in the main filtered lists if we filter by DEPARTMENTS.
