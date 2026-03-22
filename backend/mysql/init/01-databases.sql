CREATE DATABASE IF NOT EXISTS livegate_nodejs
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS livegate_python
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS livegate_java
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'livegate'@'%' IDENTIFIED BY 'livegate';

GRANT ALL PRIVILEGES ON livegate_nodejs.* TO 'livegate'@'%';
GRANT ALL PRIVILEGES ON livegate_python.* TO 'livegate'@'%';
GRANT ALL PRIVILEGES ON livegate_java.* TO 'livegate'@'%';

FLUSH PRIVILEGES;
