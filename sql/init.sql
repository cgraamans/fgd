/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE IF NOT EXISTS `fgd` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `fgd`;

CREATE TABLE IF NOT EXISTS `items` (
  `id` int(255) NOT NULL AUTO_INCREMENT,
  `message_id` varchar(128) NOT NULL DEFAULT '',
  `reply_to` int(255) DEFAULT NULL,
  `category_id` int(11) NOT NULL,
  `user` text NOT NULL,
  `content` text DEFAULT NULL,
  `dt` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `itemcategory_to_categories` (`category_id`) USING BTREE,
  KEY `itemreplyto_toitemid` (`reply_to`),
  CONSTRAINT `itemcategory_to_categories` FOREIGN KEY (`category_id`) REFERENCES `i_categories` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `itemreplyto_toitemid` FOREIGN KEY (`reply_to`) REFERENCES `items` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS `i_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `channel_id` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `i_categories` (`id`, `name`, `channel_id`) VALUES
	(1, 'reddit', '609511947762925597'),
	(2, 'europe', '1302728854036807731'),
	(3, 'media', '1302730763044913213'),
	(4, 'climate', '1361818922067693711'),
	(5, 'culture', '1361820446148001965'),
	(6, 'defence', '1361818646233743503'),
	(7, 'economics', '1361818680174051539'),
	(8, 'elections', '1361818705876484186'),
	(9, 'scitech', '1361818598602965304'),
	(10, 'sports', '1385732416785744002'),
	(11, 'africa', '1302728750718255184'),
	(12, 'americas', '1302728815784759389'),
	(13, 'asia', '1302728785015083082'),
	(14, 'middle-east', '1302728708154720436'),
	(15, 'oceania', '1302728980343951521'),
	(16, 'EU Café', '929129509792395274'),
	(17, 'EU Café', '257838262943481857'),
	(18, 'EU Café', '929129161728069674');

CREATE TABLE IF NOT EXISTS `i_content` (
  `entry_id` int(255) NOT NULL,
  `title` text NOT NULL,
  `description` longtext DEFAULT NULL,
  `name` text DEFAULT NULL,
  KEY `fk_entry_content` (`entry_id`),
  CONSTRAINT `fk_entry_content` FOREIGN KEY (`entry_id`) REFERENCES `items` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS `i_links` (
  `id` int(255) NOT NULL AUTO_INCREMENT,
  `item_id` int(255) NOT NULL,
  `url` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `links_to_entry` (`item_id`) USING BTREE,
  CONSTRAINT `links_to_entry` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS `i_metadata` (
  `link_id` int(255) NOT NULL,
  `title` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image` text DEFAULT NULL,
  `video` text DEFAULT NULL,
  KEY `item_link_metadata_to_item_link` (`link_id`),
  CONSTRAINT `item_link_metadata_to_item_link` FOREIGN KEY (`link_id`) REFERENCES `i_links` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
