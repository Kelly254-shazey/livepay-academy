ALTER TABLE `User`
    ADD COLUMN `username` VARCHAR(191) NULL,
    ADD COLUMN `avatarUrl` VARCHAR(191) NULL,
    ADD COLUMN `dateOfBirth` DATE NULL,
    ADD COLUMN `gender` VARCHAR(191) NULL,
    ADD COLUMN `customGender` VARCHAR(191) NULL,
    ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL,
    ADD COLUMN `profileCompletedAt` DATETIME(3) NULL,
    ADD COLUMN `lastLoginAt` DATETIME(3) NULL,
    MODIFY `passwordHash` VARCHAR(191) NULL;

UPDATE `User`
SET
    `username` = LOWER(
        CONCAT(
            COALESCE(
                NULLIF(
                    LEFT(
                        REGEXP_REPLACE(SUBSTRING_INDEX(`email`, '@', 1), '[^A-Za-z0-9_]+', ''),
                        20
                    ),
                    ''
                ),
                'user'
            ),
            '_',
            RIGHT(REPLACE(`id`, '-', ''), 6)
        )
    ),
    `emailVerifiedAt` = COALESCE(`emailVerifiedAt`, `createdAt`),
    `profileCompletedAt` = COALESCE(`profileCompletedAt`, CASE WHEN `passwordHash` IS NOT NULL THEN `createdAt` ELSE NULL END);

ALTER TABLE `User`
    MODIFY `username` VARCHAR(191) NOT NULL;

ALTER TABLE `User`
    ADD UNIQUE INDEX `User_username_key` (`username`);

CREATE TABLE `AuthIdentity` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `provider` ENUM('local', 'google') NOT NULL,
    `providerUserId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`),
    UNIQUE INDEX `AuthIdentity_provider_providerUserId_key` (`provider`, `providerUserId`),
    UNIQUE INDEX `AuthIdentity_userId_provider_key` (`userId`, `provider`),
    INDEX `AuthIdentity_userId_idx` (`userId`),
    INDEX `AuthIdentity_email_idx` (`email`)
);

CREATE TABLE `OneTimeCode` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `purpose` ENUM('email_verification', 'password_reset') NOT NULL,
    `codeHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    INDEX `OneTimeCode_userId_purpose_expiresAt_idx` (`userId`, `purpose`, `expiresAt`),
    INDEX `OneTimeCode_purpose_codeHash_idx` (`purpose`, `codeHash`)
);

ALTER TABLE `RefreshToken`
    ADD COLUMN `ipAddress` VARCHAR(191) NULL,
    ADD COLUMN `userAgent` VARCHAR(191) NULL,
    ADD COLUMN `lastUsedAt` DATETIME(3) NULL;

INSERT INTO `AuthIdentity` (`id`, `userId`, `provider`, `providerUserId`, `email`, `createdAt`, `updatedAt`)
SELECT UUID(), `id`, 'local', `email`, `email`, `createdAt`, `updatedAt`
FROM `User`
WHERE `passwordHash` IS NOT NULL;

ALTER TABLE `AuthIdentity`
    ADD CONSTRAINT `AuthIdentity_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `OneTimeCode`
    ADD CONSTRAINT `OneTimeCode_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
