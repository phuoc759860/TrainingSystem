-- ============================================
-- Seed Quizzes + Questions for Testing
-- Run this after migration is applied
-- ============================================

-- 1. Quiz for Lesson 1 (Introduction) - LessonID = 1
INSERT INTO Quizzes (Title, Description, LessonID, TimeLimitMinutes, PassingScore, IsActive)
VALUES ('Introduction to ASP.NET Core', 'Test your knowledge about ASP.NET Core basics', 1, 10, 70, 1);

SET @quiz1 = LAST_INSERT_ID();

INSERT INTO QuizQuestions (QuizID, QuestionText, Options, CorrectIndex, Points) VALUES
(@quiz1, 'What does ASP.NET Core stand for?',
 '["Active Server Pages .NET Core", "Advanced Server Protocol .NET Core", "Application Server Platform .NET Core", "Active System Program .NET Core"]',
 0, 1),
(@quiz1, 'Which of the following is NOT a valid ASP.NET Core middleware?',
 '["Authentication", "Routing", "Compilation", "Session"]',
 2, 1),
(@quiz1, 'What is the default port for Kestrel in development?',
 '["80", "443", "5000", "8080"]',
 2, 1),
(@quiz1, 'Which file configures services in an ASP.NET Core app?',
 '["appsettings.json", "Program.cs", "Startup.cs", "web.config"]',
 1, 1),
(@quiz1, 'What does DI stand for in ASP.NET Core?',
 '["Data Integration", "Dependency Injection", "Digital Interface", "Direct Invocation"]',
 1, 1);

-- 2. Quiz for Lesson 2 (Important Idea of DATA) - LessonID = 2
INSERT INTO Quizzes (Title, Description, LessonID, TimeLimitMinutes, PassingScore, IsActive)
VALUES ('Data Structures Fundamentals', 'Test your understanding of core data structures', 2, 15, 60, 1);

SET @quiz2 = LAST_INSERT_ID();

INSERT INTO QuizQuestions (QuizID, QuestionText, Options, CorrectIndex, Points) VALUES
(@quiz2, 'Which data structure uses FIFO (First In First Out)?',
 '["Stack", "Queue", "Tree", "Graph"]',
 1, 1),
(@quiz2, 'What is the time complexity of searching in a balanced Binary Search Tree?',
 '["O(1)", "O(n)", "O(log n)", "O(n^2)"]',
 2, 2),
(@quiz2, 'Which data structure is best for implementing a dictionary?',
 '["Array", "Linked List", "Hash Table", "Stack"]',
 2, 1),
(@quiz2, 'What is a linked list?',
 '["A collection of elements stored at contiguous memory locations", "A collection of elements where each element points to the next", "A hierarchical structure of nodes", "A circular data structure"]',
 1, 1),
(@quiz2, 'Which sorting algorithm has the best average-case time complexity?',
 '["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"]',
 2, 2);

-- 3. Quiz for Lesson 19 (Course 1 - Lesson 1) - LessonID = 19
INSERT INTO Quizzes (Title, Description, LessonID, TimeLimitMinutes, PassingScore, IsActive)
VALUES ('Data Science Intro Quiz', 'Quick check on data science fundamentals', 19, 10, 70, 1);

SET @quiz3 = LAST_INSERT_ID();

INSERT INTO QuizQuestions (QuizID, QuestionText, Options, CorrectIndex, Points) VALUES
(@quiz3, 'What is the first step in a data science project?',
 '["Build a model", "Collect and clean data", "Deploy the model", "Visualize results"]',
 1, 1),
(@quiz3, 'Which library is most commonly used for data manipulation in Python?',
 '["NumPy", "Pandas", "Matplotlib", "Scikit-learn"]',
 1, 1),
(@quiz3, 'What is supervised learning?',
 '["Learning without labeled data", "Learning from labeled data", "Learning by trial and error", "Learning from unsupervised data"]',
 1, 1),
(@quiz3, 'Which metric is used for classification problems?',
 '["Mean Squared Error", "R-squared", "Accuracy", "All of the above"]',
 2, 1);

-- 4. Quiz for Lesson 51 (Course 1 - Lesson 3) - LessonID = 51
INSERT INTO Quizzes (Title, Description, LessonID, TimeLimitMinutes, PassingScore, IsActive)
VALUES ('Data Science Advanced Quiz', 'Test your advanced data science knowledge', 51, 15, 75, 1);

SET @quiz4 = LAST_INSERT_ID();

INSERT INTO QuizQuestions (QuizID, QuestionText, Options, CorrectIndex, Points) VALUES
(@quiz4, 'What is overfitting in machine learning?',
 '["Model performs well on training and test data", "Model performs well on training but poorly on test data", "Model performs poorly on both", "Model cannot learn patterns"]',
 1, 2),
(@quiz4, 'Which technique helps prevent overfitting?',
 '["Increasing model complexity", "Regularization", "Adding more features", "Removing validation set"]',
 1, 1),
(@quiz4, 'What is cross-validation?',
 '["Training on the same data twice", "Splitting data into multiple folds for robust evaluation", "Using test data for training", "A type of data augmentation"]',
 1, 2),
(@quiz4, 'What is the purpose of a confusion matrix?',
 '["To visualize model architecture", "To evaluate classification performance", "To store training data", "To optimize hyperparameters"]',
 1, 1),
(@quiz4, 'Which algorithm is used for clustering?',
 '["Linear Regression", "K-Means", "Logistic Regression", "Decision Tree"]',
 1, 1);

-- 5. Quiz for Lesson 69 (Test lesson) - LessonID = 69
INSERT INTO Quizzes (Title, Description, LessonID, TimeLimitMinutes, PassingScore, IsActive)
VALUES ('Test Quiz', 'A quick test quiz', 69, 5, 50, 1);

SET @quiz5 = LAST_INSERT_ID();

INSERT INTO QuizQuestions (QuizID, QuestionText, Options, CorrectIndex, Points) VALUES
(@quiz5, 'What is 2 + 2?',
 '["3", "4", "5", "6"]',
 1, 1),
(@quiz5, 'What color is the sky?',
 '["Green", "Red", "Blue", "Yellow"]',
 2, 1),
(@quiz5, 'Which is a programming language?',
 '["HTML", "CSS", "Python", "SQL"]',
 2, 1);
