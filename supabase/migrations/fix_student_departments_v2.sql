-- Update student departments to full names (Explicit Schema)

UPDATE public.group_members SET department = 'Computer Science' WHERE department = 'CSE' OR department = 'CS';
UPDATE public.group_members SET department = 'Computer Science with AI & ML' WHERE department = 'CS-AIML' OR department = 'CS(AI&ML)';
UPDATE public.group_members SET department = 'Electronics and Communication Engineering' WHERE department = 'ECE';
UPDATE public.group_members SET department = 'Mechanical Engineering' WHERE department = 'ME';
UPDATE public.group_members SET department = 'Mechanical Automobile Engineering' WHERE department = 'AE' OR department = 'MAE';
UPDATE public.group_members SET department = 'Biotechnology and Biochemical Engineering' WHERE department = 'BT';
