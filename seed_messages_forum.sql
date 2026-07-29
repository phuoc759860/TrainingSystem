-- ============================================================
-- Seed: Messages + Discussion Forum data
-- All passwords: 123456
-- ============================================================

-- ── Messages (inbox/sent for Messaging page) ──
INSERT IGNORE INTO Messages (SenderID, ReceiverID, Subject, Body, IsRead, SentAt) VALUES
-- Messages TO phuoc tan (ID 1)
(7,  1,  'Lesson plan update',     'Please review the updated lesson plan for next week.',                FALSE, NOW() - INTERVAL 1 HOUR),
(10, 1,  'New course proposal',    'I have an idea for a new advanced programming course.',               FALSE, NOW() - INTERVAL 2 HOUR),
(11, 1,  'Server maintenance',     'Scheduled maintenance this weekend. Please announce to students.',    TRUE,  NOW() - INTERVAL 1 DAY),

-- Messages from phuoc tan (ID 1)
(1, 7,  'Re: Lesson plan update',  'Looks good. I approved the changes.',                                TRUE,  NOW() - INTERVAL 50 MINUTE),
(1, 10, 'Re: New course proposal', 'Sounds interesting. Prepare a syllabus draft.',                      FALSE, NOW() - INTERVAL 90 MINUTE),

-- Messages between trainers
(7,  10, 'Student performance',    'Several students scored low on the latest quiz. Should we offer a retake?', FALSE, NOW() - INTERVAL 3 HOUR),
(10, 7,  'Re: Student performance', 'Yes, I think a retake would be fair. Let me set it up.',           FALSE, NOW() - INTERVAL 2 HOUR),

-- Messages between students
(37, 38, 'Study group',            'Want to form a study group for the final exam?',                     FALSE, NOW() - INTERVAL 5 HOUR),
(38, 37, 'Re: Study group',        'Sure! Maybe we can invite a few more people.',                      TRUE,  NOW() - INTERVAL 4 HOUR),
(39, 37, 'Assignment help',        'Can you help me with the last assignment? I am stuck on part 3.',    FALSE, NOW() - INTERVAL 1 DAY),

-- Messages from trainers to students
(7,  37, 'Great progress',         'I noticed your improvement on the last exam. Keep it up!',          FALSE, NOW() - INTERVAL 6 HOUR),
(10, 38, 'Missing assignment',     'Please submit your assignment by end of week.',                      TRUE,  NOW() - INTERVAL 2 DAY),

-- Admin messages
(11, 1,  'System update',          'All systems operational. No issues to report.',                      TRUE,  NOW() - INTERVAL 12 HOUR),
(11, 7,  'Trainer orientation',    'New trainer orientation is scheduled for Friday.',                   FALSE, NOW() - INTERVAL 1 DAY);

-- ── CourseThreads (discussion forum) ──
INSERT IGNORE INTO CourseThreads (CourseID, Title, Content, AuthorID, IsPinned, CreatedAt, LastActivityAt) VALUES
-- ASP.NET Core (Course 1)
(1, 'Getting started with ASP.NET Core',       'Anyone have good resources for beginners?',                                   37, FALSE, NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 9 DAY),
(1, 'Middleware ordering question',            'What is the correct order for custom middleware?',                             38, FALSE, NOW() - INTERVAL 5 DAY,  NOW() - INTERVAL 4 DAY),

-- Data Structure and Algorithm (Course 2)
(2, 'Binary tree traversal help',              'Can someone explain inorder vs preorder?',                                    39, FALSE, NOW() - INTERVAL 7 DAY,  NOW() - INTERVAL 6 DAY),
(2, 'Big O notation cheat sheet',              'Here is a summary I made for common complexities.',                            37, TRUE,  NOW() - INTERVAL 3 DAY,  NOW() - INTERVAL 2 DAY),

-- DEMO Course 1 - Data Science (Course 11)
(11, 'Python vs R for data science',           'Which one does the course focus on more?',                                     37, FALSE, NOW() - INTERVAL 6 DAY,  NOW() - INTERVAL 5 DAY),
(11, 'Kaggle competition advice',              'Any tips for my first Kaggle competition?',                                    38, FALSE, NOW() - INTERVAL 2 DAY,  NOW() - INTERVAL 1 DAY),

-- DEMO Course 2 - Cloud Computing (Course 12)
(12, 'AWS vs Azure vs GCP',                   'Which cloud provider does this course cover?',                                  39, FALSE, NOW() - INTERVAL 4 DAY,  NOW() - INTERVAL 3 DAY),
(12, 'Deploying a containerized app',          'Step-by-step guide I followed to deploy on AWS ECS.',                          37, TRUE,  NOW() - INTERVAL 1 DAY,  NOW() - INTERVAL 12 HOUR),

-- DEMO Course 3 - Cyber Security (Course 13)
(13, 'Ethical hacking tools',                  'What tools will we be using in this course?',                                  38, FALSE, NOW() - INTERVAL 8 DAY,  NOW() - INTERVAL 7 DAY),
(13, 'CTF challenge writeup',                  'I solved the first CTF challenge! Here is how.',                               39, FALSE, NOW() - INTERVAL 1 DAY,  NOW() - INTERVAL 20 HOUR),

-- DEMO Course 4 - UI/UX Design (Course 14)
(14, 'Figma vs Sketch vs Adobe XD',           'Which design tool is best for beginners?',                                     37, FALSE, NOW() - INTERVAL 9 DAY,  NOW() - INTERVAL 8 DAY),
(14, 'Color theory resources',                 'Great YouTube channels for learning color theory.',                            38, TRUE,  NOW() - INTERVAL 2 DAY,  NOW() - INTERVAL 1 DAY);

-- ── ThreadReplies ──
INSERT IGNORE INTO ThreadReplies (CourseThreadID, Content, AuthorID, CreatedAt) VALUES
-- Replies for ASP.NET Core thread 1
(1, 'Check out the official Microsoft docs, they are excellent for beginners.',  7,  NOW() - INTERVAL 10 DAY),
(1, 'I also recommend the "Fundamentals" section on learn.microsoft.com.',      10, NOW() - INTERVAL 9 DAY),

-- Replies for ASP.NET Core thread 2
(2, 'Use app.Use() before app.UseRouting() and app.UseEndpoints().',            7,  NOW() - INTERVAL 5 DAY),
(2, 'Here is a sample ordering: UseExceptionHandler → UseHttpsRedirection → UseStaticFiles → UseRouting → UseAuthentication → UseAuthorization → UseEndpoints.', 10, NOW() - INTERVAL 4 DAY),

-- Replies for Data Structure thread 3
(3, 'Inorder: left → root → right. Preorder: root → left → right.',            7,  NOW() - INTERVAL 7 DAY),
(3, 'Think of preorder as "visit root first, then traverse left, then right".', 22, NOW() - INTERVAL 6 DAY),

-- Replies for Data Structure thread 4
(4, 'Great summary! I printed this for reference.',                             38, NOW() - INTERVAL 2 DAY),
(4, 'You forgot to mention O(n log n) for merge sort.',                         39, NOW() - INTERVAL 2 DAY),

-- Replies for Data Science thread 5
(5, 'The course uses Python with pandas and scikit-learn.',                     10, NOW() - INTERVAL 6 DAY),
(5, 'Python is more beginner-friendly for data science.',                       37, NOW() - INTERVAL 5 DAY),

-- Replies for Cloud Computing thread 7
(7, 'This course covers AWS primarily.',                                         7, NOW() - INTERVAL 4 DAY),
(7, 'AWS has the widest free tier, great for learning.',                        22, NOW() - INTERVAL 3 DAY);

-- ── Notifications for the new messages and threads ──
INSERT IGNORE INTO Notifications (UserID, Title, Body, Link, IsRead, CreatedAt) VALUES
(1,  'New message from phuoc',          'Lesson plan update',                       '/inbox',  FALSE, NOW() - INTERVAL 1 HOUR),
(1,  'New message from trainer1',       'New course proposal',                      '/inbox',  FALSE, NOW() - INTERVAL 2 HOUR),
(1,  'New message from admin for real', 'Server maintenance',                       '/inbox',  TRUE,  NOW() - INTERVAL 1 DAY),
(7,  'New message from phuoc tan',      'Re: Lesson plan update',                   '/inbox',  TRUE,  NOW() - INTERVAL 50 MINUTE),
(7,  'New message from admin for real', 'Trainer orientation',                      '/inbox',  FALSE, NOW() - INTERVAL 1 DAY),
(10, 'New message from phuoc tan',      'Re: New course proposal',                  '/inbox',  FALSE, NOW() - INTERVAL 90 MINUTE),
(10, 'New message from phuoc',          'Student performance',                      '/inbox',  FALSE, NOW() - INTERVAL 3 HOUR),
(37, 'New reply on your thread',        'Binary tree traversal help has new replies', '/courses/2/forum', FALSE, NOW() - INTERVAL 6 DAY),
(37, 'New message from phuoc',          'Great progress',                           '/inbox',  FALSE, NOW() - INTERVAL 6 HOUR),
(37, 'New message from Student 3',      'Assignment help',                          '/inbox',  FALSE, NOW() - INTERVAL 1 DAY),
(38, 'New message from Student 1',      'Study group',                              '/inbox',  FALSE, NOW() - INTERVAL 5 HOUR),
(38, 'New message from Trainer 1',      'Missing assignment',                       '/inbox',  TRUE,  NOW() - INTERVAL 2 DAY),
(39, 'New message from Student 1',      'Assignment help',                          '/inbox',  FALSE, NOW() - INTERVAL 1 DAY);
