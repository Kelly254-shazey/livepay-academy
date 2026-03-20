CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `role` ENUM('viewer', 'creator', 'moderator', 'admin') NOT NULL DEFAULT 'viewer',
    `settings` JSON NULL,
    `notificationPreferences` JSON NULL,
    `isSuspended` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `User_email_key` (`email`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CreatorProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `handle` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `headline` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `focusCategories` JSON NULL,
    `verificationStatus` ENUM('pending', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending',
    `followersCount` INTEGER NOT NULL DEFAULT 0,
    `averageRating` DECIMAL(5, 2) NULL,
    `payoutEligible` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    CONSTRAINT `CreatorProfile_followersCount_chk` CHECK (`followersCount` >= 0),
    CONSTRAINT `CreatorProfile_averageRating_chk` CHECK (`averageRating` IS NULL OR (`averageRating` >= 0 AND `averageRating` <= 5)),
    UNIQUE INDEX `CreatorProfile_userId_key` (`userId`),
    UNIQUE INDEX `CreatorProfile_handle_key` (`handle`),
    INDEX `CreatorProfile_verificationStatus_payoutEligible_idx` (`verificationStatus`, `payoutEligible`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `RefreshToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `RefreshToken_tokenHash_key` (`tokenHash`),
    INDEX `RefreshToken_userId_idx` (`userId`),
    INDEX `RefreshToken_expiresAt_idx` (`expiresAt`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PasswordResetToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `PasswordResetToken_tokenHash_key` (`tokenHash`),
    INDEX `PasswordResetToken_userId_idx` (`userId`),
    INDEX `PasswordResetToken_expiresAt_idx` (`expiresAt`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `status` ENUM('active', 'archived') NOT NULL DEFAULT 'active',
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `Category_slug_key` (`slug`),
    UNIQUE INDEX `Category_name_key` (`name`),
    INDEX `Category_createdById_idx` (`createdById`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LiveSession` (
    `id` VARCHAR(191) NOT NULL,
    `creatorId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `isPaid` BOOLEAN NOT NULL DEFAULT false,
    `visibility` ENUM('public', 'followers_only', 'private') NOT NULL DEFAULT 'public',
    `status` ENUM('draft', 'scheduled', 'published', 'live', 'ended', 'cancelled', 'suspended') NOT NULL DEFAULT 'draft',
    `scheduledFor` DATETIME(3) NULL,
    `publishedAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `endedAt` DATETIME(3) NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `roomMetadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    CONSTRAINT `LiveSession_price_chk` CHECK (`price` >= 0),
    UNIQUE INDEX `LiveSession_roomId_key` (`roomId`),
    INDEX `LiveSession_creatorId_status_idx` (`creatorId`, `status`),
    INDEX `LiveSession_categoryId_scheduledFor_idx` (`categoryId`, `scheduledFor`),
    INDEX `LiveSession_status_visibility_scheduledFor_idx` (`status`, `visibility`, `scheduledFor`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LiveParticipant` (
    `id` VARCHAR(191) NOT NULL,
    `liveSessionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `leftAt` DATETIME(3) NULL,
    `attendanceSeconds` INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT `LiveParticipant_attendanceSeconds_chk` CHECK (`attendanceSeconds` >= 0),
    INDEX `LiveParticipant_liveSessionId_userId_idx` (`liveSessionId`, `userId`),
    INDEX `LiveParticipant_userId_joinedAt_idx` (`userId`, `joinedAt`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PremiumContent` (
    `id` VARCHAR(191) NOT NULL,
    `creatorId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `excerpt` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `isPaid` BOOLEAN NOT NULL DEFAULT true,
    `status` ENUM('draft', 'published', 'archived', 'suspended') NOT NULL DEFAULT 'draft',
    `previewAsset` VARCHAR(191) NULL,
    `contentAsset` VARCHAR(191) NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    CONSTRAINT `PremiumContent_price_chk` CHECK (`price` >= 0),
    INDEX `PremiumContent_creatorId_status_idx` (`creatorId`, `status`),
    INDEX `PremiumContent_categoryId_publishedAt_idx` (`categoryId`, `publishedAt`),
    INDEX `PremiumContent_status_publishedAt_idx` (`status`, `publishedAt`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `classes` (
    `id` VARCHAR(191) NOT NULL,
    `creatorId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `isPaid` BOOLEAN NOT NULL DEFAULT true,
    `status` ENUM('draft', 'published', 'archived', 'suspended') NOT NULL DEFAULT 'draft',
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    CONSTRAINT `classes_price_chk` CHECK (`price` >= 0),
    INDEX `classes_creatorId_status_idx` (`creatorId`, `status`),
    INDEX `classes_categoryId_startsAt_idx` (`categoryId`, `startsAt`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ClassLesson` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `orderIndex` INTEGER NOT NULL,
    `isPreview` BOOLEAN NOT NULL DEFAULT false,
    `assetUrl` VARCHAR(191) NULL,
    `scheduledFor` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    CONSTRAINT `ClassLesson_orderIndex_chk` CHECK (`orderIndex` > 0),
    UNIQUE INDEX `ClassLesson_classId_orderIndex_key` (`classId`, `orderIndex`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Enrollment` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `accessGrantId` VARCHAR(191) NULL,
    `status` ENUM('pending', 'active', 'refunded', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `Enrollment_classId_userId_key` (`classId`, `userId`),
    INDEX `Enrollment_userId_status_idx` (`userId`, `status`),
    INDEX `Enrollment_accessGrantId_idx` (`accessGrantId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Follow` (
    `id` VARCHAR(191) NOT NULL,
    `followerId` VARCHAR(191) NOT NULL,
    `creatorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT `Follow_self_follow_chk` CHECK (`followerId` <> `creatorId`),
    UNIQUE INDEX `Follow_followerId_creatorId_key` (`followerId`, `creatorId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('live_reminder', 'purchase', 'creator_announcement', 'system_alert', 'moderation') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `data` JSON NULL,
    `scheduledFor` DATETIME(3) NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `Notification_userId_createdAt_idx` (`userId`, `createdAt`),
    INDEX `Notification_scheduledFor_readAt_idx` (`scheduledFor`, `readAt`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AccessGrant` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `grantedById` VARCHAR(191) NULL,
    `targetType` ENUM('live_session', 'premium_content', 'class', 'lesson', 'private_live_invite') NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `status` ENUM('active', 'revoked', 'expired', 'pending_review') NOT NULL DEFAULT 'active',
    `sourceReference` VARCHAR(191) NULL,
    `price` DECIMAL(12, 2) NULL,
    `currency` VARCHAR(191) NULL,
    `riskScore` DECIMAL(5, 2) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    CONSTRAINT `AccessGrant_price_chk` CHECK (`price` IS NULL OR `price` >= 0),
    CONSTRAINT `AccessGrant_riskScore_chk` CHECK (`riskScore` IS NULL OR (`riskScore` >= 0 AND `riskScore` <= 100)),
    UNIQUE INDEX `AccessGrant_sourceReference_key` (`sourceReference`),
    INDEX `AccessGrant_userId_targetType_targetId_status_idx` (`userId`, `targetType`, `targetId`, `status`),
    INDEX `AccessGrant_targetType_targetId_status_idx` (`targetType`, `targetId`, `status`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Review` (
    `id` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `targetType` ENUM('creator', 'live_session', 'premium_content', 'class') NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    CONSTRAINT `Review_rating_chk` CHECK (`rating` >= 1 AND `rating` <= 5),
    UNIQUE INDEX `Review_authorId_targetType_targetId_key` (`authorId`, `targetType`, `targetId`),
    INDEX `Review_targetType_targetId_createdAt_idx` (`targetType`, `targetId`, `createdAt`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Report` (
    `id` VARCHAR(191) NOT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `targetType` ENUM('live_session', 'premium_content', 'class', 'user', 'message') NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `details` TEXT NULL,
    `status` ENUM('open', 'under_review', 'resolved', 'dismissed') NOT NULL DEFAULT 'open',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `Report_targetType_targetId_status_idx` (`targetType`, `targetId`, `status`),
    INDEX `Report_status_createdAt_idx` (`status`, `createdAt`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `actorRole` ENUM('viewer', 'creator', 'moderator', 'admin') NULL,
    `action` VARCHAR(191) NOT NULL,
    `resource` VARCHAR(191) NOT NULL,
    `resourceId` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `AuditLog_resource_resourceId_idx` (`resource`, `resourceId`),
    INDEX `AuditLog_action_createdAt_idx` (`action`, `createdAt`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LiveChatMessage` (
    `id` VARCHAR(191) NOT NULL,
    `liveSessionId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `status` ENUM('active', 'hidden', 'removed') NOT NULL DEFAULT 'active',
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `LiveChatMessage_liveSessionId_createdAt_idx` (`liveSessionId`, `createdAt`),
    INDEX `LiveChatMessage_senderId_createdAt_idx` (`senderId`, `createdAt`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CreatorVerificationReview` (
    `id` VARCHAR(191) NOT NULL,
    `creatorProfileId` VARCHAR(191) NOT NULL,
    `reviewerId` VARCHAR(191) NOT NULL,
    `decision` ENUM('approved', 'rejected', 'needs_changes') NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `CreatorVerificationReview_creatorProfileId_createdAt_idx` (`creatorProfileId`, `createdAt`),
    INDEX `CreatorVerificationReview_reviewerId_createdAt_idx` (`reviewerId`, `createdAt`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ModerationAction` (
    `id` VARCHAR(191) NOT NULL,
    `moderatorId` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NULL,
    `targetType` ENUM('user', 'creator_profile', 'live_session', 'premium_content', 'class', 'live_chat_message', 'review', 'report') NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `action` ENUM('creator_approved', 'creator_rejected', 'creator_suspended', 'account_suspended', 'account_restored', 'content_suspended', 'content_restored', 'message_removed', 'report_resolved', 'report_dismissed') NOT NULL,
    `reason` TEXT NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ModerationAction_targetType_targetId_createdAt_idx` (`targetType`, `targetId`, `createdAt`),
    INDEX `ModerationAction_moderatorId_createdAt_idx` (`moderatorId`, `createdAt`),
    INDEX `ModerationAction_reportId_idx` (`reportId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CreatorProfile`
    ADD CONSTRAINT `CreatorProfile_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RefreshToken`
    ADD CONSTRAINT `RefreshToken_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `PasswordResetToken`
    ADD CONSTRAINT `PasswordResetToken_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Category`
    ADD CONSTRAINT `Category_createdById_fkey`
    FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `LiveSession`
    ADD CONSTRAINT `LiveSession_creatorId_fkey`
    FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `LiveSession`
    ADD CONSTRAINT `LiveSession_categoryId_fkey`
    FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `LiveParticipant`
    ADD CONSTRAINT `LiveParticipant_liveSessionId_fkey`
    FOREIGN KEY (`liveSessionId`) REFERENCES `LiveSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `LiveParticipant`
    ADD CONSTRAINT `LiveParticipant_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `PremiumContent`
    ADD CONSTRAINT `PremiumContent_creatorId_fkey`
    FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `PremiumContent`
    ADD CONSTRAINT `PremiumContent_categoryId_fkey`
    FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `classes`
    ADD CONSTRAINT `classes_creatorId_fkey`
    FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `classes`
    ADD CONSTRAINT `classes_categoryId_fkey`
    FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ClassLesson`
    ADD CONSTRAINT `ClassLesson_classId_fkey`
    FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Enrollment`
    ADD CONSTRAINT `Enrollment_classId_fkey`
    FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Enrollment`
    ADD CONSTRAINT `Enrollment_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Enrollment`
    ADD CONSTRAINT `Enrollment_accessGrantId_fkey`
    FOREIGN KEY (`accessGrantId`) REFERENCES `AccessGrant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Follow`
    ADD CONSTRAINT `Follow_followerId_fkey`
    FOREIGN KEY (`followerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Follow`
    ADD CONSTRAINT `Follow_creatorId_fkey`
    FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Notification`
    ADD CONSTRAINT `Notification_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AccessGrant`
    ADD CONSTRAINT `AccessGrant_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AccessGrant`
    ADD CONSTRAINT `AccessGrant_grantedById_fkey`
    FOREIGN KEY (`grantedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Review`
    ADD CONSTRAINT `Review_authorId_fkey`
    FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Report`
    ADD CONSTRAINT `Report_reporterId_fkey`
    FOREIGN KEY (`reporterId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AuditLog`
    ADD CONSTRAINT `AuditLog_actorId_fkey`
    FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `LiveChatMessage`
    ADD CONSTRAINT `LiveChatMessage_liveSessionId_fkey`
    FOREIGN KEY (`liveSessionId`) REFERENCES `LiveSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `LiveChatMessage`
    ADD CONSTRAINT `LiveChatMessage_senderId_fkey`
    FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CreatorVerificationReview`
    ADD CONSTRAINT `CreatorVerificationReview_creatorProfileId_fkey`
    FOREIGN KEY (`creatorProfileId`) REFERENCES `CreatorProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CreatorVerificationReview`
    ADD CONSTRAINT `CreatorVerificationReview_reviewerId_fkey`
    FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ModerationAction`
    ADD CONSTRAINT `ModerationAction_moderatorId_fkey`
    FOREIGN KEY (`moderatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ModerationAction`
    ADD CONSTRAINT `ModerationAction_reportId_fkey`
    FOREIGN KEY (`reportId`) REFERENCES `Report`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
