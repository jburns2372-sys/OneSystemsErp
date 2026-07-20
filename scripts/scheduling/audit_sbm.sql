-- Audit ScheduleBOQMapping in local sanitized database
SELECT 'ROW_COUNT' AS metric, count(*)::text AS value FROM "ScheduleBOQMapping";

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='ScheduleBOQMapping' 
ORDER BY ordinal_position;

SELECT tc.constraint_name, tc.constraint_type, kcu.column_name, ccu.table_name AS foreign_table 
FROM information_schema.table_constraints tc 
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name 
LEFT JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name 
WHERE tc.table_name = 'ScheduleBOQMapping';

-- Check for referencing tables (inbound FKs)
SELECT tc.table_name AS referencing_table, kcu.column_name, ccu.table_name AS referenced_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE ccu.table_name = 'ScheduleBOQMapping' AND tc.constraint_type = 'FOREIGN KEY';
