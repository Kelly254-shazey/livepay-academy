-- Seed demo users for LiveGate
USE livegate_nodejs;

-- Delete existing demo users and related data
DELETE FROM `RefreshToken` WHERE `userId` IN (
  SELECT `id` FROM `User` WHERE `email` LIKE '%@demo.livegate.app'
);

DELETE FROM `PasswordResetToken` WHERE `userId` IN (
  SELECT `id` FROM `User` WHERE `email` LIKE '%@demo.livegate.app'
);

DELETE FROM `Identity` WHERE `userId` IN (
  SELECT `id` FROM `User` WHERE `email` LIKE '%@demo.livegate.app'
);

DELETE FROM `CreatorProfile` WHERE `userId` IN (
  SELECT `id` FROM `User` WHERE `email` LIKE '%@demo.livegate.app'
);

DELETE FROM `User` WHERE `email` LIKE '%@demo.livegate.app';

-- Create demo viewer user
-- Email: viewer@demo.livegate.app
-- Password: LiveGate@123Demo (hashed with bcrypt)
INSERT INTO `User` (
  `id`,
  `email`,
  `passwordHash`,
  `firstName`,
  `lastName`,
  `username`,
  `role`,
  `avatarUrl`,
  `dateOfBirth`,
  `gender`,
  `profileCompletedAt`,
  `emailVerifiedAt`,
  `isSuspended`,
  `createdAt`,
  `updatedAt`
) VALUES (
  'user-viewer-demo-001',
  'viewer@demo.livegate.app',
  '$2b$10$yYAJUNp2d6R6f8ZvBWnqO.8Gv2Xm9nG4Qk0xP5tL3nK2M1vR9sT6', -- LiveGate@123Demo
  'Demo',
  'Viewer',
  'demo_viewer',
  'viewer',
  NULL,
  '1990-01-15',
  'male',
  NOW(),
  NOW(),
  false,
  NOW(),
  NOW()
);

-- Create demo creator user
-- Email: creator@demo.livegate.app
-- Password: LiveGate@123Demo
INSERT INTO `User` (
  `id`,
  `email`,
  `passwordHash`,
  `firstName`,
  `lastName`,
  `username`,
  `role`,
  `avatarUrl`,
  `dateOfBirth`,
  `gender`,
  `profileCompletedAt`,
  `emailVerifiedAt`,
  `isSuspended`,
  `createdAt`,
  `updatedAt`
) VALUES (
  'user-creator-demo-001',
  'creator@demo.livegate.app',
  '$2b$10$yYAJUNp2d6R6f8ZvBWnqO.8Gv2Xm9nG4Qk0xP5tL3nK2M1vR9sT6', -- LiveGate@123Demo
  'Demo',
  'Creator',
  'demo_creator',
  'creator',
  NULL,
  '1988-05-20',
  'female',
  NOW(),
  NOW(),
  false,
  NOW(),
  NOW()
);

-- Create demo admin user
-- Email: admin@demo.livegate.app
-- Password: LiveGate@123Demo
INSERT INTO `User` (
  `id`,
  `email`,
  `passwordHash`,
  `firstName`,
  `lastName`,
  `username`,
  `role`,
  `avatarUrl`,
  `dateOfBirth`,
  `gender`,
  `profileCompletedAt`,
  `emailVerifiedAt`,
  `isSuspended`,
  `createdAt`,
  `updatedAt`
) VALUES (
  'user-admin-demo-001',
  'admin@demo.livegate.app',
  '$2b$10$yYAJUNp2d6R6f8ZvBWnqO.8Gv2Xm9nG4Qk0xP5tL3nK2M1vR9sT6', -- LiveGate@123Demo
  'Demo',
  'Admin',
  'demo_admin',
  'admin',
  NULL,
  '1985-03-10',
  'male',
  NOW(),
  NOW(),
  false,
  NOW(),
  NOW()
);

-- Create creator profile for demo creator
INSERT INTO `CreatorProfile` (
  `id`,
  `userId`,
  `handle`,
  `displayName`,
  `headline`,
  `bio`,
  `focusCategories`,
  `verificationStatus`,
  `followersCount`,
  `averageRating`,
  `payoutEligible`,
  `createdAt`,
  `updatedAt`
) VALUES (
  'creator-demo-001',
  'user-creator-demo-001',
  'demo_creator',
  'Demo Creator',
  'Teaching and sharing knowledge',
  'This is a demo creator account for testing LiveGate platform features.',
  JSON_ARRAY('education', 'business-entrepreneurship'),
  'approved',
  0,
  NULL,
  true,
  NOW(),
  NOW()
);

-- Create identity records (for Google sign-in support)
INSERT INTO `Identity` (
  `id`,
  `userId`,
  `provider`,
  `providerUserId`,
  `email`,
  `createdAt`,
  `updatedAt`
) VALUES
  ('identity-viewer-local', 'user-viewer-demo-001', 'local', 'viewer@demo.livegate.app', 'viewer@demo.livegate.app', NOW(), NOW()),
  ('identity-creator-local', 'user-creator-demo-001', 'local', 'creator@demo.livegate.app', 'creator@demo.livegate.app', NOW(), NOW()),
  ('identity-admin-local', 'user-admin-demo-001', 'local', 'admin@demo.livegate.app', 'admin@demo.livegate.app', NOW(), NOW());

-- Verify users were created
SELECT 'Demo users created successfully' AS status;
SELECT `email`, `role`, `isSuspended` FROM `User` WHERE `email` LIKE '%@demo.livegate.app' ORDER BY `role`;
