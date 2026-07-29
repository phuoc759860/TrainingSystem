-- ============================================================================
-- MySQL Query Lesson — Education System
-- Based on: TrainingHub schema (Roles, Users, Courses, Lessons, Exams, etc.)
-- Run these against your MySQL database to learn and test.
-- ============================================================================

-- ============================================================================
-- 1. BASIC SELECTS
-- ============================================================================

-- 1.1 All columns from a table
SELECT * FROM Users;

-- 1.2 Specific columns
SELECT UserID, Name, Email FROM Users;

-- 1.3 Column aliases
SELECT Name AS FullName, Email AS Contact FROM Users;

-- 1.4 WHERE clause — equality
SELECT * FROM Users WHERE RoleID = 2;

-- 1.5 WHERE — multiple conditions (AND / OR)
SELECT * FROM Users WHERE RoleID = 1 OR RoleID = 2;
SELECT * FROM Users WHERE Name LIKE 'J%' AND RoleID = 3;

-- 1.6 WHERE — IN, BETWEEN, LIKE
SELECT * FROM Users WHERE RoleID IN (1, 3);
SELECT * FROM Enrollments WHERE EnrollDate BETWEEN '2025-01-01' AND '2025-12-31';
SELECT * FROM Users WHERE Email LIKE '%@example.com';

-- 1.7 ORDER BY
SELECT * FROM Lessons ORDER BY OrderIndex ASC;
SELECT * FROM ExamResult ORDER BY Score DESC;

-- 1.8 LIMIT / OFFSET (MySQL uses LIMIT + OFFSET; no TOP)
SELECT * FROM Users ORDER BY UserID LIMIT 5;
SELECT * FROM Users ORDER BY UserID LIMIT 5 OFFSET 5;  -- page 2

-- 1.9 DISTINCT
SELECT DISTINCT RoleID FROM Users;
SELECT DISTINCT Status FROM Enrollments;

-- ============================================================================
-- 2. JOINs
-- ============================================================================

-- 2.1 INNER JOIN — users with their role names
SELECT u.Name, u.Email, r.RoleName
FROM Users u
JOIN Roles r ON u.RoleID = r.RoleID;

-- 2.2 LEFT JOIN — all courses + their trainer names (even if trainer missing)
SELECT c.Title, t.Name AS TrainerName
FROM Courses c
LEFT JOIN Users t ON c.TrainerID = t.UserID;

-- 2.3 Multi-table JOIN — exam results with student name, exam title, course title
SELECT er.ResultID, u.Name AS Student, e.Title AS Exam, c.Title AS Course, er.Score
FROM ExamResult er
JOIN Users        u ON er.UserID = u.UserID
JOIN Exams        e ON er.ExamID = e.ExamID
JOIN Courses      c ON e.CourseID = c.CourseID;

-- 2.4 Self-JOIN — lessons that unlock other lessons (drip content)
SELECT l1.Title AS Lesson, l2.Title AS UnlocksAfter
FROM Lessons l1
LEFT JOIN Lessons l2 ON l1.UnlocksAfterLessonID = l2.LessonID;

-- ============================================================================
-- 3. AGGREGATIONS & GROUP BY
-- ============================================================================

-- 3.1 Basic aggregates
SELECT COUNT(*) AS TotalUsers FROM Users;
SELECT AVG(Score) AS AverageScore FROM ExamResult;
SELECT MAX(Score) AS HighestScore, MIN(Score) AS LowestScore FROM ExamResult;

-- 3.2 GROUP BY — count users per role
SELECT r.RoleName, COUNT(u.UserID) AS UserCount
FROM Users u
JOIN Roles r ON u.RoleID = r.RoleID
GROUP BY r.RoleName;

-- 3.3 HAVING — filter after GROUP BY (like WHERE for groups)
SELECT e.CourseID, COUNT(er.ResultID) AS Attempts
FROM ExamResult er
JOIN Exams e ON er.ExamID = e.ExamID
GROUP BY e.CourseID
HAVING Attempts > 5;

-- 3.4 Multiple aggregates per group
SELECT c.Title,
       COUNT(l.LessonID) AS LessonCount,
       COALESCE(AVG(lp.IsCompleted), 0) AS AvgCompletion
FROM Courses c
LEFT JOIN Lessons l ON c.CourseID = l.CourseID
LEFT JOIN LessonProgress lp ON l.LessonID = lp.LessonID
GROUP BY c.CourseID, c.Title;

-- ============================================================================
-- 4. SUBQUERIES
-- ============================================================================

-- 4.1 Subquery in WHERE — users who have submitted exam results
SELECT * FROM Users
WHERE UserID IN (SELECT DISTINCT UserID FROM ExamResult);

-- 4.2 Subquery with EXISTS (often faster than IN)
SELECT * FROM Courses c
WHERE EXISTS (
    SELECT 1 FROM Lessons l WHERE l.CourseID = c.CourseID
);

-- 4.3 Scalar subquery — each course with its highest exam score
SELECT c.Title,
       (SELECT MAX(Score) FROM ExamResult er
        JOIN Exams e ON er.ExamID = e.ExamID
        WHERE e.CourseID = c.CourseID) AS HighestScore
FROM Courses c;

-- 4.4 Correlated subquery — students who scored above avg on their exam
SELECT u.Name, er.Score, e.Title
FROM ExamResult er
JOIN Users u ON er.UserID = u.UserID
JOIN Exams e ON er.ExamID = e.ExamID
WHERE er.Score > (
    SELECT AVG(Score) FROM ExamResult WHERE ExamID = er.ExamID
);

-- ============================================================================
-- 5. INSERT, UPDATE, DELETE
-- ============================================================================

-- 5.1 INSERT a single row
INSERT INTO Users (Name, Email, PasswordHash, RoleID)
VALUES ('John Doe', 'john@example.com', 'hashed_pw_here', 3);

-- 5.2 INSERT multiple rows
INSERT INTO Enrollments (UserID, CourseID, EnrollDate, Status)
VALUES
    (1, 2, NOW(), 'Enrolled'),
    (3, 2, NOW(), 'Enrolled'),
    (4, 2, NOW(), 'Enrolled');

-- 5.3 INSERT from SELECT
INSERT INTO UserPoints (UserID, Points, StreakDays, LastActivityAt)
SELECT UserID, 0, 0, NULL FROM Users
WHERE UserID NOT IN (SELECT UserID FROM UserPoints);

-- 5.4 UPDATE a single row
UPDATE Users SET Email = 'newemail@example.com' WHERE UserID = 1;

-- 5.5 UPDATE with JOIN
UPDATE LessonProgress lp
JOIN Lessons l ON lp.LessonID = l.LessonID
SET lp.IsCompleted = TRUE
WHERE l.Title LIKE '%Intro%';

-- 5.6 DELETE with caution
DELETE FROM Enrollments WHERE Status = 'Dropped';

-- 5.7 DELETE with JOIN (delete orphaned answers)
DELETE ea FROM ExamAnswers ea
LEFT JOIN ExamResult er ON ea.ResultID = er.ResultID
WHERE er.ResultID IS NULL;

-- ============================================================================
-- 6. CREATING & ALTERING TABLES
-- ============================================================================

-- 6.1 CREATE TABLE with constraints
CREATE TABLE CourseCategories (
    CategoryID   INT AUTO_INCREMENT PRIMARY KEY,
    CategoryName VARCHAR(100) NOT NULL UNIQUE,
    Description  TEXT,
    CreatedAt    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6.2 ALTER TABLE — add a column
ALTER TABLE Courses ADD COLUMN CategoryID INT;
ALTER TABLE Courses ADD FOREIGN KEY (CategoryID) REFERENCES CourseCategories(CategoryID);

-- 6.3 ALTER TABLE — modify column
ALTER TABLE Users MODIFY COLUMN Email VARCHAR(255) NOT NULL;

-- 6.4 ALTER TABLE — add/drop index
CREATE INDEX idx_courses_title ON Courses(Title(50));
DROP INDEX idx_courses_title ON Courses;

-- ============================================================================
-- 7. INDEXES & PERFORMANCE
-- ============================================================================

-- 7.1 See existing indexes
SHOW INDEX FROM Users;
SHOW INDEX FROM ExamResult;

-- 7.2 Composite index for common query pattern
-- Query: find exam results by user + exam
CREATE INDEX idx_result_user_exam ON ExamResult(UserID, ExamID);

-- 7.3 EXPLAIN to check query plan
EXPLAIN SELECT * FROM ExamResult WHERE UserID = 5 AND ExamID = 3;

-- 7.4 Slow query log check (requires SUPER privileges)
SHOW VARIABLES LIKE 'slow_query_log';

-- ============================================================================
-- 8. VIEWS
-- ============================================================================

-- 8.1 Create a view — student transcripts
CREATE VIEW StudentTranscript AS
SELECT
    u.UserID,
    u.Name AS StudentName,
    c.Title AS Course,
    e.Title AS Exam,
    er.Score,
    er.Passed,
    er.SubmittedAt
FROM Users u
JOIN ExamResult er ON u.UserID = er.UserID
JOIN Exams e ON er.ExamID = e.ExamID
JOIN Courses c ON e.CourseID = c.CourseID;

-- Use the view like a table
SELECT * FROM StudentTranscript WHERE Passed = TRUE;

-- 8.2 Create a view — course completion stats
CREATE VIEW CourseStats AS
SELECT
    c.CourseID,
    c.Title,
    COUNT(DISTINCT e.UserID) AS EnrolledStudents,
    COUNT(DISTINCT l.LessonID) AS TotalLessons,
    ROUND(AVG(
        (SELECT COUNT(*) FROM LessonProgress lp2
         WHERE lp2.LessonID IN (SELECT LessonID FROM Lessons WHERE CourseID = c.CourseID)
         AND lp2.IsCompleted = TRUE)
        / NULLIF((SELECT COUNT(*) FROM Lessons WHERE CourseID = c.CourseID), 0)
        * 100
    ), 1) AS AvgProgressPercent
FROM Courses c
LEFT JOIN Enrollments e ON c.CourseID = e.CourseID
LEFT JOIN Lessons l ON c.CourseID = l.CourseID
GROUP BY c.CourseID;

-- ============================================================================
-- 9. STORED PROCEDURES
-- ============================================================================

DELIMITER $$

-- 9.1 Simple procedure — get user by role
CREATE PROCEDURE GetUsersByRole(IN roleId INT)
BEGIN
    SELECT UserID, Name, Email FROM Users WHERE RoleID = roleId;
END$$

-- 9.2 Procedure with OUT parameter — count users
CREATE PROCEDURE CountUsersByRole(IN roleId INT, OUT userCount INT)
BEGIN
    SELECT COUNT(*) INTO userCount FROM Users WHERE RoleID = roleId;
END$$

-- 9.3 Procedure — enroll student with validation
CREATE PROCEDURE EnrollStudent(
    IN p_UserID INT,
    IN p_CourseID INT,
    IN p_Status VARCHAR(50)
)
BEGIN
    DECLARE alreadyEnrolled INT;

    SELECT COUNT(*) INTO alreadyEnrolled
    FROM Enrollments
    WHERE UserID = p_UserID AND CourseID = p_CourseID;

    IF alreadyEnrolled = 0 THEN
        INSERT INTO Enrollments (UserID, CourseID, EnrollDate, Status)
        VALUES (p_UserID, p_CourseID, NOW(), p_Status);
        SELECT 'Enrolled' AS Result;
    ELSE
        SELECT 'Already enrolled' AS Result;
    END IF;
END$$

DELIMITER ;

-- Call them
CALL GetUsersByRole(3);
CALL CountUsersByRole(2, @count); SELECT @count;
CALL EnrollStudent(5, 3, 'Enrolled');

-- ============================================================================
-- 10. TRANSACTIONS
-- ============================================================================

-- 10.1 Basic transaction — create user + assign points atomically
START TRANSACTION;

INSERT INTO Users (Name, Email, PasswordHash, RoleID)
VALUES ('Alice Smith', 'alice@example.com', 'hash123', 3);

INSERT INTO UserPoints (UserID, Points, StreakDays, LastActivityAt)
VALUES (LAST_INSERT_ID(), 10, 1, NOW());

COMMIT;
-- ROLLBACK;  -- use this instead of COMMIT to undo

-- 10.2 Transaction with SAVEPOINT (partial rollback)
START TRANSACTION;

UPDATE Users SET Email = 'temp@example.com' WHERE UserID = 1;
SAVEPOINT after_email_update;

UPDATE ExamResult SET Score = 100 WHERE UserID = 1;
-- oops, that was wrong
ROLLBACK TO after_email_update;

COMMIT;  -- only the email update is kept

-- ============================================================================
-- 11. PRACTICE EXERCISES (try these yourself)
-- ============================================================================

-- 11.1 List all courses with their trainer name and total student count.
-- Hint: LEFT JOIN Courses → Users, LEFT JOIN Enrollments, GROUP BY, COUNT

-- 11.2 For each exam, show the pass rate (percentage of results that passed).
-- Hint: JOIN ExamResult, GROUP BY ExamID, SUM(Passed)/COUNT(*)*100

-- 11.3 Find the top 5 students by average exam score (min 3 exams taken).
-- Hint: GROUP BY UserID, AVG(Score), HAVING COUNT(*) >= 3, ORDER BY, LIMIT

-- 11.4 Get all unread messages for a user with sender names.
-- Hint: JOIN Messages + Users, WHERE ReceiverID = ? AND IsRead = FALSE

-- 11.5 Show each lesson with its material count and quiz count.
-- Hint: LEFT JOIN Materials + LEFT JOIN Quizzes, GROUP BY LessonID

-- 11.6 Find courses that have exams but zero exam results submitted.
-- Hint: LEFT JOIN Exams → ExamResult, WHERE ResultID IS NULL

-- 11.7 For every day of the week, count how many schedule entries exist.
-- Hint: GROUP BY DayOfWeek, ORDER BY DayOfWeek

-- ============================================================================
-- 12. BONUS: COMMON MISTAKES TO AVOID
-- ============================================================================

-- 12.1 Forgetting WHERE on UPDATE/DELETE (runs on ALL rows!)
-- Always SELECT first to preview:
SELECT * FROM Users WHERE UserID = 999;
-- Then UPDATE/DELETE:
-- DELETE FROM Users WHERE UserID = 999;

-- 12.2 NULL comparison: use IS NULL, not = NULL
SELECT * FROM Users WHERE Email IS NULL;       -- correct
SELECT * FROM Users WHERE Email = NULL;        -- wrong, returns nothing

-- 12.3 GROUP BY without aggregating all non-grouped columns
-- Wrong: SELECT u.Name, c.Title, COUNT(*) ... GROUP BY u.UserID
-- Right: SELECT u.Name, COUNT(*) ... GROUP BY u.UserID

-- 12.4 Integer division: MySQL does integer division with /
-- SELECT 5 / 2;       -- 2.5 (decimal)
-- SELECT 5 DIV 2;     -- 2 (integer)
-- For percentage: ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ...), 1)
