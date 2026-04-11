-- Add profile format upgrade fields (Facebook-style profile)
-- Adds profile photo, cover photo, website, and location to User and CreatorProfile

ALTER TABLE `user` ADD COLUMN `profilePhotoUrl` VARCHAR(500) AFTER `clerkMetadata`;
ALTER TABLE `user` ADD COLUMN `coverPhotoUrl` VARCHAR(500) AFTER `profilePhotoUrl`;
ALTER TABLE `user` ADD COLUMN `website` VARCHAR(255) AFTER `coverPhotoUrl`;
ALTER TABLE `user` ADD COLUMN `location` VARCHAR(255) AFTER `website`;

-- Add profile format fields to CreatorProfile table
ALTER TABLE `creatorprofile` ADD COLUMN `profilePhotoUrl` VARCHAR(500) AFTER `bio`;
ALTER TABLE `creatorprofile` ADD COLUMN `coverPhotoUrl` VARCHAR(500) AFTER `profilePhotoUrl`;
ALTER TABLE `creatorprofile` ADD COLUMN `website` VARCHAR(255) AFTER `coverPhotoUrl`;
ALTER TABLE `creatorprofile` ADD COLUMN `location` VARCHAR(255) AFTER `website`;
ALTER TABLE `creatorprofile` ADD COLUMN `socialLinks` JSON AFTER `location`;

-- Create indexes for faster profile lookups
CREATE INDEX `idx_profilePhotoUrl` ON `user` (`profilePhotoUrl`);
CREATE INDEX `idx_location` ON `user` (`location`);
