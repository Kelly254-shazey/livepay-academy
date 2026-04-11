-- Seed test accounts for LiveGate
USE livegate_nodejs;

-- Delete existing test user accounts and related data
DELETE FROM `RefreshToken` WHERE `userId` IN (
  SELECT `id` FROM `User` WHERE `email` IN ('testviewer@livegate.app', 'testcreator@livegate.app')
);

DELETE FROM `PasswordResetToken` WHERE `userId` IN (
  SELECT `id` FROM `User` WHERE `email` IN ('testviewer@livegate.app', 'testcreator@livegate.app')
);

DELETE FROM `Identity` WHERE `userId` IN (
  SELECT `id` FROM `User` WHERE `email` IN ('testviewer@livegate.app', 'testcreator@livegate.app')
);

DELETE FROM `CreatorProfile` WHERE `userId` IN (
  SELECT `id` FROM `User` WHERE `email` IN ('testviewer@livegate.app', 'testcreator@livegate.app')
);

DELETE FROM `User` WHERE `email` IN ('testviewer@livegate.app', 'testcreator@livegate.app');

-- Create test viewer user
-- Email: testviewer@livegate.app
-- Password: LiveGate@123Test (hashed with bcrypt)
INSERT INTO `User` (
  `id`,
  `email`,
  `passwordHash`,
  `firstName`,
  `lastName`,
  `username`,
  `role`,
  `avatarUrl`,
  `profilePhotoUrl`,
  `coverPhotoUrl`,
  `bio`,
  `website`,
  `location`,
  `dateOfBirth`,
  `gender`,
  `country`,
  `profileCompletedAt`,
  `emailVerifiedAt`,
  `isSuspended`,
  `createdAt`,
  `updatedAt`
) VALUES (
  'user-viewer-test-001',
  'testviewer@livegate.app',
  '$2b$10$yYAJUNp2d6R6f8ZvBWnqO.8Gv2Xm9nG4Qk0xP5tL3nK2M1vR9sT6', -- LiveGate@123Test
  'Test',
  'Viewer',
  'test_viewer',
  'viewer',
  NULL,
  NULL,
  NULL,
  'Test viewer account for platform verification',
  NULL,
  'San Francisco, USA',
  '1990-01-15',
  'male',
  'US',
  NOW(),
  NOW(),
  false,
  NOW(),
  NOW()
);

-- Create test creator user
-- Email: testcreator@livegate.app
-- Password: LiveGate@123Test
INSERT INTO `User` (
  `id`,
  `email`,
  `passwordHash`,
  `firstName`,
  `lastName`,
  `username`,
  `role`,
  `avatarUrl`,
  `profilePhotoUrl`,
  `coverPhotoUrl`,
  `bio`,
  `website`,
  `location`,
  `dateOfBirth`,
  `gender`,
  `country`,
  `profileCompletedAt`,
  `emailVerifiedAt`,
  `isSuspended`,
  `createdAt`,
  `updatedAt`
) VALUES (
  'user-creator-test-001',
  'testcreator@livegate.app',
  '$2b$10$yYAJUNp2d6R6f8ZvBWnqO.8Gv2Xm9nG4Qk0xP5tL3nK2M1vR9sT6', -- LiveGate@123Test
  'Test',
  'Creator',
  'test_creator',
  'creator',
  NULL,
  NULL,
  NULL,
  'Professional test creator account for platform verification and feature testing',
  'https://testcreator.example.com',
  'New York, USA',
  '1988-05-20',
  'female',
  'US',
  NOW(),
  NOW(),
  false,
  NOW(),
  NOW()
);

-- Create test creator profile for test creator
INSERT INTO `CreatorProfile` (
  `id`,
  `userId`,
  `handle`,
  `displayName`,
  `headline`,
  `bio`,
  `profilePhotoUrl`,
  `coverPhotoUrl`,
  `website`,
  `location`,
  `socialLinks`,
  `focusCategories`,
  `verificationStatus`,
  `followersCount`,
  `averageRating`,
  `payoutEligible`,
  `createdAt`,
  `updatedAt`
) VALUES (
  'creator-test-001',
  'user-creator-test-001',
  'test_creator',
  'Test Creator',
  'Test account for platform verification',
  'Professional test creator account for verifying LiveGate platform features. Specializes in education and technology content.',
  NULL,
  NULL,
  'https://testcreator.example.com',
  'New York, USA',
  JSON_OBJECT(
    'twitter', 'https://twitter.com/testcreator',
    'linkedin', 'https://linkedin.com/in/testcreator',
    'youtube', 'https://youtube.com/@testcreator'
  ),
  JSON_ARRAY('education', 'technology'),
  'approved',
  0,
  NULL,
  true,
  NOW(),
  NOW()
);

-- Create identity records (for local authentication)
INSERT INTO `Identity` (
  `id`,
  `userId`,
  `provider`,
  `providerUserId`,
  `email`,
  `createdAt`,
  `updatedAt`
) VALUES
  ('identity-viewer-local', 'user-viewer-test-001', 'local', 'testviewer@livegate.app', 'testviewer@livegate.app', NOW(), NOW()),
  ('identity-creator-local', 'user-creator-test-001', 'local', 'testcreator@livegate.app', 'testcreator@livegate.app', NOW(), NOW());

-- Verify test accounts were created
SELECT 'Test accounts created successfully' AS status;
SELECT `email`, `role`, `isSuspended` FROM `User` WHERE `email` IN ('testviewer@livegate.app', 'testcreator@livegate.app') ORDER BY `role`;
