-- Setup script for the local MySQL (localhost:3306) used by NeighborNest.
-- Creates the service databases and the 'neighbornest' user that Docker
-- containers use to reach the host database via host.docker.internal.
-- Safe to re-run (IF NOT EXISTS / IF NOT EXISTS).
CREATE DATABASE IF NOT EXISTS user_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS matching_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS nest_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS chat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS notification_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Dedicated user for the Dockerized services (reachable from any host so the
-- containers can connect through host.docker.internal).
CREATE USER IF NOT EXISTS 'neighbornest'@'%' IDENTIFIED BY '22A91A1252@s';
GRANT ALL PRIVILEGES ON neighbornest_auth.* TO 'neighbornest'@'%';
GRANT ALL PRIVILEGES ON user_db.* TO 'neighbornest'@'%';
GRANT ALL PRIVILEGES ON matching_db.* TO 'neighbornest'@'%';
GRANT ALL PRIVILEGES ON nest_db.* TO 'neighbornest'@'%';
GRANT ALL PRIVILEGES ON chat_db.* TO 'neighbornest'@'%';
GRANT ALL PRIVILEGES ON notification_db.* TO 'neighbornest'@'%';
FLUSH PRIVILEGES;
