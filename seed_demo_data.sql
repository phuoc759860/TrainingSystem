-- ============================================================
-- Seed demo data for Messages, UserPoints, UserBadges, Notifications
-- All existing passwords: 123456
-- Roles: 1=Admin, 2=Trainer, 3=Student
-- ============================================================

-- ── UserPoints (gamification scores for Profile page) ──
INSERT IGNORE INTO UserPoints (UserID, Points, StreakDays, LastActivityAt) VALUES
(1,  350,  5, NOW() - INTERVAL 1 DAY),   -- phuoc tan (Admin)
(2,  120,  2, NOW() - INTERVAL 2 DAY),   -- doggy (Admin)
(7,  780,  12, NOW()),                    -- phuoc (Trainer)
(10, 1500, 20, NOW()),                   -- trainer1 (Trainer)
(11, 3000, 45, NOW()),                   -- admin for real (Admin)
(14, 80,   1, NOW() - INTERVAL 1 DAY),   -- test (Student)
(22, 2200, 30, NOW()),                   -- Trainer 1
(23, 900,  8, NOW()),                    -- Trainer 2
(37, 450,  6, NOW()),                    -- Student 1
(38, 200,  3, NOW()),                    -- Student 2
(39, 50,   1, NOW());                    -- Student 3

-- ── UserBadges (earned badges) ──
INSERT IGNORE INTO UserBadges (UserID, BadgeID, EarnedAt) VALUES
(1,  1, NOW() - INTERVAL 30 DAY),  -- phuoc tan → First Steps (50 pts)
(1,  2, NOW() - INTERVAL 14 DAY),  -- phuoc tan → Active Learner (200 pts)
(7,  1, NOW() - INTERVAL 20 DAY),  -- phuoc → First Steps
(7,  2, NOW() - INTERVAL 10 DAY),  -- phuoc → Active Learner
(7,  3, NOW() - INTERVAL 5 DAY),   -- phuoc → Course Explorer (500 pts)
(10, 1, NOW() - INTERVAL 40 DAY),  -- trainer1 → First Steps
(10, 2, NOW() - INTERVAL 25 DAY),  -- trainer1 → Active Learner
(10, 3, NOW() - INTERVAL 15 DAY),  -- trainer1 → Course Explorer
(10, 4, NOW() - INTERVAL 3 DAY),   -- trainer1 → Forum Contributor (1000 pts)
(11, 1, NOW() - INTERVAL 60 DAY),  -- admin for real → First Steps
(11, 2, NOW() - INTERVAL 45 DAY),  -- admin for real → Active Learner
(11, 3, NOW() - INTERVAL 30 DAY),  -- admin for real → Course Explorer
(11, 4, NOW() - INTERVAL 15 DAY),  -- admin for real → Forum Contributor
(11, 5, NOW() - INTERVAL 2 DAY),   -- admin for real → Knowledge Master (2000 pts)
(22, 1, NOW() - INTERVAL 30 DAY),  -- Trainer 1 → First Steps
(22, 2, NOW() - INTERVAL 20 DAY),  -- Trainer 1 → Active Learner
(22, 3, NOW() - INTERVAL 10 DAY),  -- Trainer 1 → Course Explorer
(22, 4, NOW() - INTERVAL 5 DAY),   -- Trainer 1 → Forum Contributor
(37, 1, NOW() - INTERVAL 10 DAY),  -- Student 1 → First Steps
(37, 2, NOW() - INTERVAL 2 DAY);   -- Student 1 → Active Learner

-- ── Messages (inbox/sent for Messaging page) ──
INSERT IGNORE INTO Messages (SenderID, ReceiverID, Subject, Body, IsRead, SentAt) VALUES
-- Messages TO phuoc tan (ID 1)
(7,  1,  'Lesson plan update', 'Please review the updated lesson plan for next week.', FALSE, NOW() - INTERVAL 1 HOUR),
(10, 1,  'New course proposal', 'I have an idea for a new advanced programming course.', FALSE, NOW() - INTERVAL 2 HOUR),
(11, 1,  'Server maintenance', 'Scheduled maintenance this weekend. Please announce to students.', TRUE, NOW() - INTERVAL 1 DAY),

-- Messages from phuoc tan (ID 1)
(1, 7,  'Re: Lesson plan update', 'Looks good. I approved the changes.', TRUE, NOW() - INTERVAL 50 MINUTE),
(1, 10, 'Re: New course proposal', 'Sounds interesting. Prepare a syllabus draft.', FALSE, NOW() - INTERVAL 90 MINUTE),

-- Messages between trainers
(7,  10, 'Student performance', 'Several students scored low on the latest quiz. Should we offer a retake?', FALSE, NOW() - INTERVAL 3 HOUR),
(10, 7,  'Re: Student performance', 'Yes, I think a retake would be fair. Let me set it up.', FALSE, NOW() - INTERVAL 2 HOUR),

-- Messages between students
(37, 38, 'Study group', 'Want to form a study group for the final exam?', FALSE, NOW() - INTERVAL 5 HOUR),
(38, 37, 'Re: Study group', 'Sure! Maybe we can invite a few more people.', TRUE, NOW() - INTERVAL 4 HOUR),
(39, 37, 'Assignment help', 'Can you help me with the last assignment? I am stuck on part 3.', FALSE, NOW() - INTERVAL 1 DAY),

-- Messages from trainers to students
(7,  37, 'Great progress', 'I noticed your improvement on the last exam. Keep it up!', FALSE, NOW() - INTERVAL 6 HOUR),
(10, 38, 'Missing assignment', 'Please submit your assignment by end of week.', TRUE, NOW() - INTERVAL 2 DAY),

-- Admin messages
(11, 1,  'System update', 'All systems operational. No issues to report.', TRUE, NOW() - INTERVAL 12 HOUR),
(11, 7,  'Trainer orientation', 'New trainer orientation is scheduled for Friday.', FALSE, NOW() - INTERVAL 1 DAY);

-- ── Notifications (bell icon dropdown) ──
INSERT IGNORE INTO Notifications (UserID, Title, Body, Link, IsRead, CreatedAt) VALUES
(1,  'Badge unlocked: Active Learner!',  'You earned 200 points.',                  '/profile',             FALSE, NOW() - INTERVAL 14 DAY),
(1,  'New message from phuoc',          'Lesson plan update',                      '/inbox',               FALSE, NOW() - INTERVAL 1 HOUR),
(7,  'Badge unlocked: Course Explorer!', 'You earned 500 points.',                  '/profile',             FALSE, NOW() - INTERVAL 5 DAY),
(7,  'New message from admin for real',  'Trainer orientation',                     '/inbox',               FALSE, NOW() - INTERVAL 1 DAY),
(10, 'Badge unlocked: Forum Contributor!','You earned 1000 points.',                 '/profile',             FALSE, NOW() - INTERVAL 3 DAY),
(10, 'New message from phuoc',           'Student performance',                     '/inbox',               FALSE, NOW() - INTERVAL 3 HOUR),
(11, 'Badge unlocked: Knowledge Master!', 'You earned 2000 points.',                 '/profile',             TRUE,  NOW() - INTERVAL 2 DAY),
(37, 'New message from phuoc',           'Great progress',                          '/inbox',               FALSE, NOW() - INTERVAL 6 HOUR),
(37, 'Badge unlocked: Active Learner!',  'You earned 200 points.',                  '/profile',             TRUE,  NOW() - INTERVAL 2 DAY),
(38, 'New message from Student 1',       'Study group',                             '/inbox',               FALSE, NOW() - INTERVAL 5 HOUR),
(38, 'New message from Trainer 1',       'Missing assignment',                      '/inbox',               TRUE,  NOW() - INTERVAL 2 DAY),
(39, 'New message from Student 1',       'Assignment help',                         '/inbox',               FALSE, NOW() - INTERVAL 1 DAY);
