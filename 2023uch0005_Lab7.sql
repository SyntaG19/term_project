SELECT Name
FROM Students
WHERE DeptID = (
    SELECT DeptID
    FROM Departments
    WHERE DeptName = 'Computer Science');

SELECT s.Name, er.MarksObtained
FROM Students s
JOIN ExamResults er ON s.StudentID = er.StudentID
JOIN Exams ex ON er.ExamID = ex.ExamID
JOIN Courses c ON ex.CourseID = c.CourseID
WHERE c.CourseName = 'Database Systems'
ORDER BY er.MarksObtained DESC
LIMIT 3;

SELECT s.StudentID, ha.RoomNo, h.HostelName
FROM Students s
JOIN HostelAllotment ha ON s.StudentID = ha.StudentID
JOIN Hostels h ON ha.HostelID = h.HostelID
WHERE h.Capacity > 200;

SELECT s.StudentID, s.Name
FROM Students s
WHERE (
    SELECT SUM(er.MarksObtained)
    FROM ExamResults er
    WHERE er.StudentID = s.StudentID
) > ALL (
    SELECT SUM(er2.MarksObtained)
    FROM ExamResults er2
    JOIN Students s2 ON er2.StudentID = s2.StudentID
    WHERE s2.ProgramID = 2
    GROUP BY er2.StudentID
);

SELECT s.StudentID,
       s.Name,
       ROUND(AVG(er.MarksObtained), 2) AS AvgMarks,
       CASE
           WHEN ROUND(AVG(er.MarksObtained), 0) % 2 = 0 THEN 'Even'
           ELSE 'Odd'
       END AS MarkType
FROM Students s
JOIN ExamResults er ON s.StudentID = er.StudentID
GROUP BY s.StudentID, s.Name;

SELECT s.StudentID,
       s.Name,
       CASE
           WHEN COUNT(e.CourseID) >= 5 THEN 'Full Load'
           WHEN COUNT(e.CourseID) BETWEEN 3 AND 4 THEN 'Medium Load'
           WHEN COUNT(e.CourseID) BETWEEN 1 AND 2 THEN 'Light Load'
           ELSE 'Not Enrolled'
       END AS CourseLoad
FROM Students s
LEFT JOIN Enrollments e ON s.StudentID = e.StudentID
GROUP BY s.StudentID, s.Name;

SELECT f.FacultyID,
       f.Name,
       f.HireDate,
       TIMESTAMPDIFF(YEAR, f.HireDate, CURDATE()) AS YearsTeaching
FROM Faculty f
WHERE YEAR(f.HireDate) < 2020
  AND TIMESTAMPDIFF(YEAR, f.HireDate, CURDATE()) > 5;

SELECT DISTINCT s.StudentID, s.Name, s.DOB
FROM Students s
JOIN Attendance a ON s.StudentID = a.StudentID
WHERE YEAR(s.DOB) > 2000
  AND a.Date >= DATE_SUB(CURDATE(), INTERVAL 2 YEAR);

SELECT s.StudentID,
       UPPER(s.Name) AS UpperName,
       TRIM(s.EmailID) AS CleanedEmail,
       SUBSTRING(TRIM(s.EmailID), 1, 10) AS ShortEmail,
       s.Phone,
       REPLACE(s.EmailID, '@gmail.com', '@hotmail.com') AS ModifiedEmail
FROM Students s
WHERE s.ProgramID IN (
    SELECT ProgramID
    FROM Students
    GROUP BY ProgramID
    HAVING COUNT(StudentID) > 50
);

SELECT f.FacultyID,
       f.Name AS FullName,
       CHAR_LENGTH(f.Name) AS NameLength,
       SUBSTRING(f.Email, INSTR(f.Email, '@') + 1) AS EmailDomain,
       CONCAT(LEFT(f.Name, 1),
              LEFT(SUBSTRING_INDEX(f.Name, ' ', -1), 1)) AS Initials
FROM Faculty f
WHERE f.DeptID IN (
    SELECT DeptID
    FROM Faculty
    GROUP BY DeptID
    HAVING COUNT(FacultyID) > 5
);

SELECT s.StudentID,
       s.Name,
       s.DOB,
       (SELECT COUNT(*) FROM Enrollments e WHERE e.StudentID = s.StudentID) AS CourseCount,
       (SELECT COUNT(*) FROM Attendance a WHERE a.StudentID = s.StudentID) AS AttendanceCount
FROM Students s
WHERE YEAR(s.DOB) > 2000
  AND EXISTS (SELECT 1 FROM Attendance a WHERE a.StudentID = s.StudentID);

SELECT s.StudentID, s.Name
FROM Students s
WHERE NOT EXISTS (
    SELECT 1 FROM Payments p
    WHERE p.StudentID = s.StudentID AND p.Status <> 'Paid'
)
AND (
    SELECT AVG(er.MarksObtained)
    FROM ExamResults er
    WHERE er.StudentID = s.StudentID
) > SOME (
    SELECT AVG(er2.MarksObtained)
    FROM ExamResults er2
    JOIN Students s2 ON er2.StudentID = s2.StudentID
    GROUP BY s2.ProgramID
);
