INSERT INTO hostel (hostel_name, gender, occupancy_type, total_rooms,phase)
VALUES
('Canary', 'Male', 'Double', 120,'1A'),
('Fulgar', 'Male', 'Single', 100,'1C'),
('Egret', 'Female', 'Double', 90,'1B'),
('Dedhar', 'Female', 'Double', 80,'1A'),
('Breag', 'Male','Double', 100,'1B');
-- phase and total number of rooms in each hostel theek kr dena

-- 2) Insert rooms using set-based generation (MySQL 8+ required)
-- WITH RECURSIVE 
--   nums(n) AS (
--     SELECT 1
--     UNION ALL
--     SELECT n + 1 FROM nums WHERE n < 28
--   ),
--   floors(f) AS (
--     SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
--     UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
--   ),
--   wings(w) AS (
--     SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
--   )
-- SELECT 
--   h.hostel_id,
--   CONCAT('PHASE', w) AS phase,
--   CONCAT('W', w) AS wing_code,
--   f AS floor_no,
--   CONCAT(f, LPAD(n, 3, '0')) AS room_no,
--   'B1' AS bed_id
-- FROM floors
-- CROSS JOIN wings
-- CROSS JOIN nums
-- JOIN hostel h ON h.hostel_name = 'FULGAR'
-- WHERE n <= CASE WHEN w IN (1,2) THEN 28 ELSE 18 END
-- ORDER BY f, w, n;

-- INSERT INTO rooms (hostel_id, wing_code, floor_no, room_no, bed_id)
-- WITH RECURSIVE 
--   nums(n) AS (
--     SELECT 1
--     UNION ALL
--     SELECT n + 1 FROM nums WHERE n < 92     -- total rooms per floor
--   ),
--   floors(f) AS (
--     SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
--     UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
--   )
-- SELECT 
--   h.hostel_id,
--   CASE 
--     WHEN n BETWEEN 1 AND 28 THEN 'W1'
--     WHEN n BETWEEN 29 AND 56 THEN 'W2'
--     WHEN n BETWEEN 57 AND 74 THEN 'W3'
--     WHEN n BETWEEN 75 AND 92 THEN 'W4'
--   END AS wing_code,
--   f AS floor_no,
--   CONCAT(f, LPAD(n, 3, '0')) AS room_no,
--   'B1' AS bed_id
-- FROM floors
-- CROSS JOIN nums
-- JOIN hostel h ON h.hostel_name = 'FULGAR'
-- ORDER BY f, n;


INSERT INTO room (hostel_id, wing_code, floor_no, room_no, bed_id)
WITH RECURSIVE 
  nums(n) AS (
    SELECT 1
    UNION ALL
    SELECT n + 1 FROM nums WHERE n < 92     -- total rooms per floor
  ),
  floors(f) AS (
    SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
    UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
  ),
  beds AS (
    SELECT 'A1' AS bed_id
    UNION ALL
    SELECT 'B1'
  )
SELECT 
  h.hostel_id,
  CASE 
    WHEN n BETWEEN 1 AND 28 THEN 'W1'
    WHEN n BETWEEN 29 AND 56 THEN 'W2'
    WHEN n BETWEEN 57 AND 74 THEN 'W3'
    WHEN n BETWEEN 75 AND 92 THEN 'W4'
  END AS wing_code,
  f AS floor_no,
  CONCAT(f, LPAD(n, 3, '0')) AS room_no,
  -- choose bed based on occupancy type
  b.bed_id
FROM hostel h
JOIN floors f
JOIN nums n
-- cross join only if hostel is Double occupancy
JOIN beds b 
  ON (h.occupancy_type = 'Double' OR b.bed_id = 'B1')
WHERE h.hostel_name = 'FULGAR'
ORDER BY f, n, b.bed_id;

-----------------------
--verify
SELECT 
  h.hostel_name, h.phase,
  r.floor_no, r.room_no, r.wing_code, r.bed_id
FROM room r
JOIN hostel h ON r.hostel_id = h.hostel_id
WHERE h.hostel_name = 'FULGAR'
ORDER BY r.floor_no, r.room_no;
-----------------------

INSERT into batches (batch_id,program,year_of_study)
VALUES
("UG2022",'BTech',4),
("UG2023",'BTech',3),
("UG2024",'BTech',2),
("UG2025",'BTech',1);

-- administrator aur room_alloc_zones ke tables bnane hai
-- hostels me total number of rooms theek krne hai
-- students ka data bhi push krna hai
-- roommates table ko bhi dekhna hai agr as a relation set krna hai toh
-- hostel ke 1st and ground floor ke total number of rooms, wing wise'=
-- room_alloc_zones add krdo