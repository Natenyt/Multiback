-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: gov_db
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ai_endpoints_aianalysis`
--

DROP TABLE IF EXISTS `ai_endpoints_aianalysis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_endpoints_aianalysis` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `intent_label` varchar(64) DEFAULT NULL,
  `confidence_score` double DEFAULT NULL,
  `suggested_department_id` bigint DEFAULT NULL,
  `suggested_department_name` varchar(255) DEFAULT NULL,
  `reason` longtext,
  `vector_search_results` json DEFAULT NULL,
  `is_corrected` tinyint(1) NOT NULL,
  `corrected_department_id` bigint DEFAULT NULL,
  `correction_notes` longtext,
  `prompt_tokens` int DEFAULT NULL,
  `embedding_tokens` int DEFAULT NULL,
  `processing_time_ms` int DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `corrected_by_uuid` char(32) DEFAULT NULL,
  `message_uuid` char(32) NOT NULL,
  `session_uuid` char(32) NOT NULL,
  `language_detected` varchar(64) DEFAULT NULL,
  `total_tokens` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ai_endpoints_aianalysis_intent_label_a1136ee4` (`intent_label`),
  KEY `ai_endpoints_aianalysis_suggested_department_id_5c0fd143` (`suggested_department_id`),
  KEY `ai_endpoints_aianalysis_is_corrected_ae2681ab` (`is_corrected`),
  KEY `ai_endpoints_aianaly_message_uuid_ef81d986_fk_message_a` (`message_uuid`),
  KEY `ai_endpoints_aianaly_session_uuid_b23a6aeb_fk_message_a` (`session_uuid`),
  KEY `ai_endpoints_aianaly_corrected_by_uuid_520be028_fk_users_use` (`corrected_by_uuid`),
  KEY `ai_endpoints_aianalysis_language_detected_7d645930` (`language_detected`),
  CONSTRAINT `ai_endpoints_aianaly_corrected_by_uuid_520be028_fk_users_use` FOREIGN KEY (`corrected_by_uuid`) REFERENCES `users_user` (`user_uuid`),
  CONSTRAINT `ai_endpoints_aianaly_message_uuid_ef81d986_fk_message_a` FOREIGN KEY (`message_uuid`) REFERENCES `message_app_message` (`message_uuid`),
  CONSTRAINT `ai_endpoints_aianaly_session_uuid_b23a6aeb_fk_message_a` FOREIGN KEY (`session_uuid`) REFERENCES `message_app_session` (`session_uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_endpoints_aianalysis`
--

LOCK TABLES `ai_endpoints_aianalysis` WRITE;
/*!40000 ALTER TABLE `ai_endpoints_aianalysis` DISABLE KEYS */;
INSERT INTO `ai_endpoints_aianalysis` VALUES (14,'Auto-detected',59,1,'Tuman hokimi','LLM unavailable (quota exceeded). Using top vector search result with 59.59% similarity.','[{\"id\": \"1\", \"name\": \"Tuman hokimi\", \"score\": 0.59592617, \"description\": \"Tuman ijroiya hokimiyatiga umumiy rahbarlik qiladi va davlat siyosatini amalga oshiradi.\"}, {\"id\": \"40\", \"name\": \"Ijtimoiy himoya milliy agentligining Narpay tumani Inson ijtimoiy xizmatlar markazi direktori\", \"score\": 0.58120763, \"description\": \"Aholining ijtimoiy himoyaga muhtoj qatlamlariga xizmat ko\'rsatish.\"}, {\"id\": \"43\", \"name\": \"Narpay tumani Navqirov Narpay gazetesi bosh muharriri\", \"score\": 0.5767695, \"description\": \"Tuman hayotini yorituvchi rasmiy gazetaga rahbarlik qilish.\"}]',0,NULL,NULL,0,14,4592,'2025-12-15 16:06:06.734829','2025-12-15 16:06:06.734829',NULL,'6e93725e4dbf4bb7bc1b1193f7bce8f1','3ee7e57415b04581a47c03689801f352','uz',0),(15,'Auto-detected',59,1,'Tuman hokimi','LLM unavailable (quota exceeded). Using top vector search result with 59.59% similarity.','[{\"id\": \"1\", \"name\": \"Tuman hokimi\", \"score\": 0.59592617, \"description\": \"Tuman ijroiya hokimiyatiga umumiy rahbarlik qiladi va davlat siyosatini amalga oshiradi.\"}, {\"id\": \"40\", \"name\": \"Ijtimoiy himoya milliy agentligining Narpay tumani Inson ijtimoiy xizmatlar markazi direktori\", \"score\": 0.58120763, \"description\": \"Aholining ijtimoiy himoyaga muhtoj qatlamlariga xizmat ko\'rsatish.\"}, {\"id\": \"43\", \"name\": \"Narpay tumani Navqirov Narpay gazetesi bosh muharriri\", \"score\": 0.5767695, \"description\": \"Tuman hayotini yorituvchi rasmiy gazetaga rahbarlik qilish.\"}]',0,NULL,NULL,0,14,6469,'2025-12-16 05:25:10.575016','2025-12-16 05:25:10.575016',NULL,'d00ff710e1034d35b5d8710bec656f4e','6b506db8e930474c9553f57149bc2ced','uz',0),(16,'Auto-detected',59,1,'Tuman hokimi','LLM unavailable (quota exceeded). Using top vector search result with 59.59% similarity.','[{\"id\": \"1\", \"name\": \"Tuman hokimi\", \"score\": 0.59592617, \"description\": \"Tuman ijroiya hokimiyatiga umumiy rahbarlik qiladi va davlat siyosatini amalga oshiradi.\"}, {\"id\": \"40\", \"name\": \"Ijtimoiy himoya milliy agentligining Narpay tumani Inson ijtimoiy xizmatlar markazi direktori\", \"score\": 0.58120763, \"description\": \"Aholining ijtimoiy himoyaga muhtoj qatlamlariga xizmat ko\'rsatish.\"}, {\"id\": \"43\", \"name\": \"Narpay tumani Navqirov Narpay gazetesi bosh muharriri\", \"score\": 0.5767695, \"description\": \"Tuman hayotini yorituvchi rasmiy gazetaga rahbarlik qilish.\"}]',0,NULL,NULL,0,14,4172,'2025-12-16 05:39:38.653695','2025-12-16 05:39:38.653695',NULL,'9f652bfedab84db585fc299d8fcbc25f','37259581da5e48cf98b5e4151f48119e','uz',0),(17,'Auto-detected',59,1,'Tuman hokimi','LLM unavailable (quota exceeded). Using top vector search result with 59.59% similarity.','[{\"id\": \"1\", \"name\": \"Tuman hokimi\", \"score\": 0.59592617, \"description\": \"Tuman ijroiya hokimiyatiga umumiy rahbarlik qiladi va davlat siyosatini amalga oshiradi.\"}, {\"id\": \"40\", \"name\": \"Ijtimoiy himoya milliy agentligining Narpay tumani Inson ijtimoiy xizmatlar markazi direktori\", \"score\": 0.58120763, \"description\": \"Aholining ijtimoiy himoyaga muhtoj qatlamlariga xizmat ko\'rsatish.\"}, {\"id\": \"43\", \"name\": \"Narpay tumani Navqirov Narpay gazetesi bosh muharriri\", \"score\": 0.5767695, \"description\": \"Tuman hayotini yorituvchi rasmiy gazetaga rahbarlik qilish.\"}]',0,NULL,NULL,0,14,4154,'2025-12-16 06:18:26.194211','2025-12-16 06:18:26.194211',NULL,'86ce3355560a4e09aa286cc4cff8d6ca','4eab0087959a4d9ca12dcbb91f9ae27a','uz',0),(18,'Auto-detected',59,1,'Tuman hokimi','LLM unavailable (quota exceeded). Using top vector search result with 59.59% similarity.','[{\"id\": \"1\", \"name\": \"Tuman hokimi\", \"score\": 0.59592617, \"description\": \"Tuman ijroiya hokimiyatiga umumiy rahbarlik qiladi va davlat siyosatini amalga oshiradi.\"}, {\"id\": \"40\", \"name\": \"Ijtimoiy himoya milliy agentligining Narpay tumani Inson ijtimoiy xizmatlar markazi direktori\", \"score\": 0.58120763, \"description\": \"Aholining ijtimoiy himoyaga muhtoj qatlamlariga xizmat ko\'rsatish.\"}, {\"id\": \"43\", \"name\": \"Narpay tumani Navqirov Narpay gazetesi bosh muharriri\", \"score\": 0.5767695, \"description\": \"Tuman hayotini yorituvchi rasmiy gazetaga rahbarlik qilish.\"}]',0,NULL,NULL,0,14,3674,'2025-12-16 06:19:22.408271','2025-12-16 06:19:22.408271',NULL,'2e41ffd797c4416a98d69c1b88a706bf','40007e8c6a5d48f68e58a5d93c8ab7d0','uz',0),(19,'Auto-detected',59,1,'Tuman hokimi','LLM unavailable (quota exceeded). Using top vector search result with 59.59% similarity.','[{\"id\": \"1\", \"name\": \"Tuman hokimi\", \"score\": 0.59592617, \"description\": \"Tuman ijroiya hokimiyatiga umumiy rahbarlik qiladi va davlat siyosatini amalga oshiradi.\"}, {\"id\": \"40\", \"name\": \"Ijtimoiy himoya milliy agentligining Narpay tumani Inson ijtimoiy xizmatlar markazi direktori\", \"score\": 0.58120763, \"description\": \"Aholining ijtimoiy himoyaga muhtoj qatlamlariga xizmat ko\'rsatish.\"}, {\"id\": \"43\", \"name\": \"Narpay tumani Navqirov Narpay gazetesi bosh muharriri\", \"score\": 0.5767695, \"description\": \"Tuman hayotini yorituvchi rasmiy gazetaga rahbarlik qilish.\"}]',0,NULL,NULL,0,14,3665,'2025-12-16 06:22:33.824990','2025-12-16 06:22:33.824990',NULL,'8ab77ea8dcde4418a4038b04c7979332','b300e50811734aada062986b7598d5ee','uz',0),(20,'Auto-detected',59,1,'Tuman hokimi','LLM unavailable (quota exceeded). Using top vector search result with 59.59% similarity.','[{\"id\": \"1\", \"name\": \"Tuman hokimi\", \"score\": 0.59592617, \"description\": \"Tuman ijroiya hokimiyatiga umumiy rahbarlik qiladi va davlat siyosatini amalga oshiradi.\"}, {\"id\": \"40\", \"name\": \"Ijtimoiy himoya milliy agentligining Narpay tumani Inson ijtimoiy xizmatlar markazi direktori\", \"score\": 0.58120763, \"description\": \"Aholining ijtimoiy himoyaga muhtoj qatlamlariga xizmat ko\'rsatish.\"}, {\"id\": \"43\", \"name\": \"Narpay tumani Navqirov Narpay gazetesi bosh muharriri\", \"score\": 0.5767695, \"description\": \"Tuman hayotini yorituvchi rasmiy gazetaga rahbarlik qilish.\"}]',0,NULL,NULL,0,14,3905,'2025-12-16 06:24:48.112066','2025-12-16 06:24:48.112066',NULL,'e51eeaead937443dafd9c48860bfb4d1','cf9ea7bc528f47bd8489bf9226085e6f','uz',0),(21,'Auto-detected',59,1,'Tuman hokimi','LLM unavailable (quota exceeded). Using top vector search result with 59.59% similarity.','[{\"id\": \"1\", \"name\": \"Tuman hokimi\", \"score\": 0.59592617, \"description\": \"Tuman ijroiya hokimiyatiga umumiy rahbarlik qiladi va davlat siyosatini amalga oshiradi.\"}, {\"id\": \"40\", \"name\": \"Ijtimoiy himoya milliy agentligining Narpay tumani Inson ijtimoiy xizmatlar markazi direktori\", \"score\": 0.58120763, \"description\": \"Aholining ijtimoiy himoyaga muhtoj qatlamlariga xizmat ko\'rsatish.\"}, {\"id\": \"43\", \"name\": \"Narpay tumani Navqirov Narpay gazetesi bosh muharriri\", \"score\": 0.5767695, \"description\": \"Tuman hayotini yorituvchi rasmiy gazetaga rahbarlik qilish.\"}]',0,NULL,NULL,0,14,8687,'2025-12-16 06:39:37.391153','2025-12-16 06:39:37.391153',NULL,'2cbaf82437f4474886caee40c9956486','eab13631a590429199f0ce973624594a','uz',0),(22,'Auto-detected',59,1,'Tuman hokimi','LLM unavailable (quota exceeded). Using top vector search result with 59.59% similarity.','[{\"id\": \"1\", \"name\": \"Tuman hokimi\", \"score\": 0.59592617, \"description\": \"Tuman ijroiya hokimiyatiga umumiy rahbarlik qiladi va davlat siyosatini amalga oshiradi.\"}, {\"id\": \"40\", \"name\": \"Ijtimoiy himoya milliy agentligining Narpay tumani Inson ijtimoiy xizmatlar markazi direktori\", \"score\": 0.58120763, \"description\": \"Aholining ijtimoiy himoyaga muhtoj qatlamlariga xizmat ko\'rsatish.\"}, {\"id\": \"43\", \"name\": \"Narpay tumani Navqirov Narpay gazetesi bosh muharriri\", \"score\": 0.5767695, \"description\": \"Tuman hayotini yorituvchi rasmiy gazetaga rahbarlik qilish.\"}]',0,NULL,NULL,0,14,4761,'2025-12-16 06:40:42.239200','2025-12-16 06:40:42.239200',NULL,'47c42282ee8540509cefdfaf3af7f1e1','00b481b07fb74b1a9a46f4d7f82961ac','uz',0),(23,'Auto-detected',59,1,'Tuman hokimi','LLM unavailable (quota exceeded). Using top vector search result with 59.59% similarity.','[{\"id\": \"1\", \"name\": \"Tuman hokimi\", \"score\": 0.59592617, \"description\": \"Tuman ijroiya hokimiyatiga umumiy rahbarlik qiladi va davlat siyosatini amalga oshiradi.\"}, {\"id\": \"40\", \"name\": \"Ijtimoiy himoya milliy agentligining Narpay tumani Inson ijtimoiy xizmatlar markazi direktori\", \"score\": 0.58120763, \"description\": \"Aholining ijtimoiy himoyaga muhtoj qatlamlariga xizmat ko\'rsatish.\"}, {\"id\": \"43\", \"name\": \"Narpay tumani Navqirov Narpay gazetesi bosh muharriri\", \"score\": 0.5767695, \"description\": \"Tuman hayotini yorituvchi rasmiy gazetaga rahbarlik qilish.\"}]',0,NULL,NULL,0,14,3817,'2025-12-16 12:07:37.578467','2025-12-16 12:07:37.578467',NULL,'7f10cabbd5bf4c648e093b51561a5856','4ec7ec1179fd47f7a2e3700b8d3088bc','uz',0),(24,'Auto-detected',59,1,'Tuman hokimi','LLM unavailable (quota exceeded). Using top vector search result with 59.59% similarity.','[{\"id\": \"1\", \"name\": \"Tuman hokimi\", \"score\": 0.59592617, \"description\": \"Tuman ijroiya hokimiyatiga umumiy rahbarlik qiladi va davlat siyosatini amalga oshiradi.\"}, {\"id\": \"40\", \"name\": \"Ijtimoiy himoya milliy agentligining Narpay tumani Inson ijtimoiy xizmatlar markazi direktori\", \"score\": 0.58120763, \"description\": \"Aholining ijtimoiy himoyaga muhtoj qatlamlariga xizmat ko\'rsatish.\"}, {\"id\": \"43\", \"name\": \"Narpay tumani Navqirov Narpay gazetesi bosh muharriri\", \"score\": 0.5767695, \"description\": \"Tuman hayotini yorituvchi rasmiy gazetaga rahbarlik qilish.\"}]',0,NULL,NULL,0,14,3221,'2025-12-16 12:10:04.040188','2025-12-16 12:10:04.040188',NULL,'ff98385573f44a2bbde0407b26dc51be','005dbc6e760a42219fe9c5ef155d1c3f','uz',0),(25,'Auto-detected',59,1,'Tuman hokimi','LLM unavailable (quota exceeded). Using top vector search result with 59.59% similarity.','[{\"id\": \"1\", \"name\": \"Tuman hokimi\", \"score\": 0.59592617, \"description\": \"Tuman ijroiya hokimiyatiga umumiy rahbarlik qiladi va davlat siyosatini amalga oshiradi.\"}, {\"id\": \"40\", \"name\": \"Ijtimoiy himoya milliy agentligining Narpay tumani Inson ijtimoiy xizmatlar markazi direktori\", \"score\": 0.58120763, \"description\": \"Aholining ijtimoiy himoyaga muhtoj qatlamlariga xizmat ko\'rsatish.\"}, {\"id\": \"43\", \"name\": \"Narpay tumani Navqirov Narpay gazetesi bosh muharriri\", \"score\": 0.5767695, \"description\": \"Tuman hayotini yorituvchi rasmiy gazetaga rahbarlik qilish.\"}]',0,NULL,NULL,0,14,4220,'2025-12-16 14:58:50.721338','2025-12-16 14:58:50.721338',NULL,'02766bfebaeb40e8b1112322400b5687','f87607bf0f714667a25fd5ed1d7239d6','uz',0),(26,'Auto-detected',59,1,'Tuman hokimi','LLM unavailable (quota exceeded). Using top vector search result with 59.59% similarity.','[{\"id\": \"1\", \"name\": \"Tuman hokimi\", \"score\": 0.59592617, \"description\": \"Tuman ijroiya hokimiyatiga umumiy rahbarlik qiladi va davlat siyosatini amalga oshiradi.\"}, {\"id\": \"40\", \"name\": \"Ijtimoiy himoya milliy agentligining Narpay tumani Inson ijtimoiy xizmatlar markazi direktori\", \"score\": 0.58120763, \"description\": \"Aholining ijtimoiy himoyaga muhtoj qatlamlariga xizmat ko\'rsatish.\"}, {\"id\": \"43\", \"name\": \"Narpay tumani Navqirov Narpay gazetesi bosh muharriri\", \"score\": 0.5767695, \"description\": \"Tuman hayotini yorituvchi rasmiy gazetaga rahbarlik qilish.\"}]',0,NULL,NULL,0,14,5126,'2025-12-16 15:01:48.107447','2025-12-16 15:01:48.107447',NULL,'27ce2351d8d54654be58926a6c9938da','f646881ebe7c4b55946df98f11ae503b','uz',0),(27,'Auto-detected',59,1,'Tuman hokimi','LLM unavailable (quota exceeded). Using top vector search result with 59.59% similarity.','[{\"id\": \"1\", \"name\": \"Tuman hokimi\", \"score\": 0.59592617, \"description\": \"Tuman ijroiya hokimiyatiga umumiy rahbarlik qiladi va davlat siyosatini amalga oshiradi.\"}, {\"id\": \"40\", \"name\": \"Ijtimoiy himoya milliy agentligining Narpay tumani Inson ijtimoiy xizmatlar markazi direktori\", \"score\": 0.58120763, \"description\": \"Aholining ijtimoiy himoyaga muhtoj qatlamlariga xizmat ko\'rsatish.\"}, {\"id\": \"43\", \"name\": \"Narpay tumani Navqirov Narpay gazetesi bosh muharriri\", \"score\": 0.5767695, \"description\": \"Tuman hayotini yorituvchi rasmiy gazetaga rahbarlik qilish.\"}]',0,NULL,NULL,0,14,4769,'2025-12-16 15:10:45.429260','2025-12-16 15:10:45.429260',NULL,'ddc61c183b3d408d8f67c307b923e3b3','7f0465e3529e46288736245dafe52f60','uz',0);
/*!40000 ALTER TABLE `ai_endpoints_aianalysis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ai_endpoints_injectionlog`
--

DROP TABLE IF EXISTS `ai_endpoints_injectionlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_endpoints_injectionlog` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `is_injection` tinyint(1) NOT NULL,
  `risk_score` double NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `message_uuid` char(32) NOT NULL,
  `processing_time_ms` int DEFAULT NULL,
  `tokens_used` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ai_endpoints_injectionlog_is_injection_659f2365` (`is_injection`),
  KEY `ai_endpoints_injecti_message_uuid_0f7a0ddf_fk_message_a` (`message_uuid`),
  CONSTRAINT `ai_endpoints_injecti_message_uuid_0f7a0ddf_fk_message_a` FOREIGN KEY (`message_uuid`) REFERENCES `message_app_message` (`message_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_endpoints_injectionlog`
--

LOCK TABLES `ai_endpoints_injectionlog` WRITE;
/*!40000 ALTER TABLE `ai_endpoints_injectionlog` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_endpoints_injectionlog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',2,'add_permission'),(6,'Can change permission',2,'change_permission'),(7,'Can delete permission',2,'delete_permission'),(8,'Can view permission',2,'view_permission'),(9,'Can add group',3,'add_group'),(10,'Can change group',3,'change_group'),(11,'Can delete group',3,'delete_group'),(12,'Can view group',3,'view_group'),(13,'Can add content type',4,'add_contenttype'),(14,'Can change content type',4,'change_contenttype'),(15,'Can delete content type',4,'delete_contenttype'),(16,'Can view content type',4,'view_contenttype'),(17,'Can add session',5,'add_session'),(18,'Can change session',5,'change_session'),(19,'Can delete session',5,'delete_session'),(20,'Can view session',5,'view_session'),(21,'Can add AI Analysis Log',6,'add_aianalysis'),(22,'Can change AI Analysis Log',6,'change_aianalysis'),(23,'Can delete AI Analysis Log',6,'delete_aianalysis'),(24,'Can view AI Analysis Log',6,'view_aianalysis'),(25,'Can add injection log',7,'add_injectionlog'),(26,'Can change injection log',7,'change_injectionlog'),(27,'Can delete injection log',7,'delete_injectionlog'),(28,'Can view injection log',7,'view_injectionlog'),(29,'Can add department',8,'add_department'),(30,'Can change department',8,'change_department'),(31,'Can delete department',8,'delete_department'),(32,'Can view department',8,'view_department'),(33,'Can add staff profile',9,'add_staffprofile'),(34,'Can change staff profile',9,'change_staffprofile'),(35,'Can delete staff profile',9,'delete_staffprofile'),(36,'Can view staff profile',9,'view_staffprofile'),(37,'Can add message',10,'add_message'),(38,'Can change message',10,'change_message'),(39,'Can delete message',10,'delete_message'),(40,'Can view message',10,'view_message'),(41,'Can add message content',11,'add_messagecontent'),(42,'Can change message content',11,'change_messagecontent'),(43,'Can delete message content',11,'delete_messagecontent'),(44,'Can view message content',11,'view_messagecontent'),(45,'Can add session',12,'add_session'),(46,'Can change session',12,'change_session'),(47,'Can delete session',12,'delete_session'),(48,'Can view session',12,'view_session'),(49,'Can add User',13,'add_user'),(50,'Can change User',13,'change_user'),(51,'Can delete User',13,'delete_user'),(52,'Can view User',13,'view_user'),(53,'Can add telegram connection',14,'add_telegramconnection'),(54,'Can change telegram connection',14,'change_telegramconnection'),(55,'Can delete telegram connection',14,'delete_telegramconnection'),(56,'Can view telegram connection',14,'view_telegramconnection'),(57,'Can add Neighborhood',15,'add_neighborhood'),(58,'Can change Neighborhood',15,'change_neighborhood'),(59,'Can delete Neighborhood',15,'delete_neighborhood'),(60,'Can view Neighborhood',15,'view_neighborhood'),(61,'Can add Staff Daily Performance',16,'add_staffdailyperformance'),(62,'Can change Staff Daily Performance',16,'change_staffdailyperformance'),(63,'Can delete Staff Daily Performance',16,'delete_staffdailyperformance'),(64,'Can view Staff Daily Performance',16,'view_staffdailyperformance'),(65,'Can add broadcast',17,'add_broadcast'),(66,'Can change broadcast',17,'change_broadcast'),(67,'Can delete broadcast',17,'delete_broadcast'),(68,'Can view broadcast',17,'view_broadcast'),(69,'Can add Broadcast Acknowledgment',18,'add_broadcastacknowledgment'),(70,'Can change Broadcast Acknowledgment',18,'change_broadcastacknowledgment'),(71,'Can delete Broadcast Acknowledgment',18,'delete_broadcastacknowledgment'),(72,'Can view Broadcast Acknowledgment',18,'view_broadcastacknowledgment'),(73,'Can add Quick Reply',19,'add_quickreply'),(74,'Can change Quick Reply',19,'change_quickreply'),(75,'Can delete Quick Reply',19,'delete_quickreply'),(76,'Can view Quick Reply',19,'view_quickreply');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `broadcast_broadcast`
--

DROP TABLE IF EXISTS `broadcast_broadcast`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `broadcast_broadcast` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `message` longtext NOT NULL,
  `priority` varchar(10) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_by_id` char(32) DEFAULT NULL,
  `expires_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `broadcast_broadcast_created_by_id_f714e191_fk_users_use` (`created_by_id`),
  CONSTRAINT `broadcast_broadcast_created_by_id_f714e191_fk_users_use` FOREIGN KEY (`created_by_id`) REFERENCES `users_user` (`user_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `broadcast_broadcast`
--

LOCK TABLES `broadcast_broadcast` WRITE;
/*!40000 ALTER TABLE `broadcast_broadcast` DISABLE KEYS */;
/*!40000 ALTER TABLE `broadcast_broadcast` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `broadcast_broadcastacknowledgment`
--

DROP TABLE IF EXISTS `broadcast_broadcastacknowledgment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `broadcast_broadcastacknowledgment` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `read_at` datetime(6) DEFAULT NULL,
  `broadcast_id` bigint NOT NULL,
  `staff_id` char(32) NOT NULL,
  `acknowledged_at` datetime(6) DEFAULT NULL,
  `is_acknowledged` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `broadcast_broadcastackno_broadcast_id_staff_id_0a07aec5_uniq` (`broadcast_id`,`staff_id`),
  KEY `broadcast_broadcasta_staff_id_86d6565e_fk_users_use` (`staff_id`),
  CONSTRAINT `broadcast_broadcasta_broadcast_id_9c05994a_fk_broadcast` FOREIGN KEY (`broadcast_id`) REFERENCES `broadcast_broadcast` (`id`),
  CONSTRAINT `broadcast_broadcasta_staff_id_86d6565e_fk_users_use` FOREIGN KEY (`staff_id`) REFERENCES `users_user` (`user_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `broadcast_broadcastacknowledgment`
--

LOCK TABLES `broadcast_broadcastacknowledgment` WRITE;
/*!40000 ALTER TABLE `broadcast_broadcastacknowledgment` DISABLE KEYS */;
/*!40000 ALTER TABLE `broadcast_broadcastacknowledgment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments_department`
--

DROP TABLE IF EXISTS `departments_department`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments_department` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `description_uz` longtext,
  `description_ru` longtext,
  `name_uz` varchar(500) DEFAULT NULL,
  `name_ru` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments_department`
--

LOCK TABLES `departments_department` WRITE;
/*!40000 ALTER TABLE `departments_department` DISABLE KEYS */;
INSERT INTO `departments_department` VALUES (1,'Tuman ijroiya hokimiyatiga umumiy rahbarlik qiladi va davlat siyosatini amalga oshiradi.','Осуществляет общее руководство исполнительной властью и реализует госполитику.','Tuman hokimi','Хоким района',1,'2025-12-15 17:43:19.000000'),(2,'Iqtisodiyot va tadbirkorlikni rivojlantirish masalalarini muvofiqlashtiradi.','Координирует вопросы развития экономики и предпринимательства.','Tuman hokimining birinchi o\'rinbosari','Первый заместитель хокима района',1,'2025-12-15 17:43:19.000000'),(3,'Iqtisodiy islohotlar va kambag\'allikni qisqartirish dasturlarini tahlil qiladi.','Анализирует программы экономических реформ и сокращения бедности.','Narpay tumani hokimining moliya-iqtisodiyot va kambag\'allikni qisqartirish masalalari bo\'yicha birinchi o\'rinbosari bosh mutaxassisi','Главный специалист первого заместителя хокима по вопросам финансов, экономики и сокращения бедности',1,'2025-12-15 17:43:19.000000'),(4,'Qurilish, kommunikatsiya va obodonlashtirish ishlarini nazorat qiladi.','Контролирует строительство, коммуникации и работы по благоустройству.','Narpay tuman hokimining qurilish, kommunikatsiyalar, kommunal xo\'jalik, ekologiya va ko\'kalamzorlashtirish masalalari bo\'yicha o\'rinbosari','Заместитель хокима по вопросам строительства, коммуникаций, коммунального хозяйства, экологии и озеленения',1,'2025-12-15 17:43:19.000000'),(5,'Agrar soha, fermerlik va suv resurslaridan foydalanishni boshqaradi.','Управляет аграрным сектором, фермерством и водными ресурсами.','Tuman hokimining qishloq va suv xo\'jalik masalalari bo\'yicha o\'rinbosari','Заместитель хокима по вопросам сельского и водного хозяйства',1,'2025-12-15 17:43:19.000000'),(6,'Tumanga investitsiyalarni jalb qilish va eksport salohiyatini oshirish.','Привлечение инвестиций в район и повышение экспортного потенциала.','Tuman hokimining o\'rinbosari, investitsiyalar va tashqi savdo bo\'limi boshlig\'i','Заместитель хокима, начальник отдела инвестиций и внешней торговли',1,'2025-12-15 17:43:19.000000'),(7,'Yoshlar bilan ishlash va ijtimoiy-ma\'naviy muhitni yaxshilash.','Работа с молодежью и улучшение социально-духовной среды.','Tuman hokimining yoshlar siyosati, ijtimoiy rivojlantirish va ma\'naviy-ma\'rifiy ishlar bo\'yicha o\'rinbosari','Заместитель хокима по молодежной политике, социальному развитию и духовно-просветительской работе',1,'2025-12-15 17:43:19.000000'),(8,'Xotin-qizlarning huquqlarini himoya qilish va oilaviy qadriyatlarni mustahkamlash.','Защита прав женщин и укрепление семейных ценностей.','Tuman hokimining o\'rinbosari - oilani va xotin-qizlar bo\'limi boshlig\'i','Заместитель хокима - начальник отдела по делам семьи и женщин',1,'2025-12-15 17:43:19.000000'),(9,'Hokimlik kadrlar siyosati va tashkiliy ishlarni yuritadi.','Ведет кадровую политику и организационные дела хокимията.','Tuman hokimligi Tashkiliy-kadrlar guruhi rahbari','Руководитель организационно-кадровой группы хокимията',1,'2025-12-15 17:43:19.000000'),(10,'Hokimlik hujjat aylanishi va ijro intizomini ta\'minlaydi.','Обеспечивает документооборот и исполнительскую дисциплину.','Tuman hokimligi devonxonasi mudiri','Заведующий канцелярией хокимията',1,'2025-12-15 17:43:19.000000'),(11,'Davlat tili qonunlariga rioya etilishini nazorat qiladi.','Контролирует соблюдение законов о государственном языке.','Narpay tumani hokimining ma\'naviy-ma\'rifiy ishlar samaradorligini oshirish, davlat tili to\'g\'risidagi qonun hujjatlariga rioya etilishini ta\'minlash masalalari bo\'yicha maslahatchisi','Советник хокима по повышению эффективности духовно-просветительской работы и обеспечению соблюдения законодательства о государственном языке',1,'2025-12-15 17:43:19.000000'),(12,'Hokimlik faoliyatini OAVda yoritish va jamoatchilik bilan aloqalar.','Освещение деятельности хокимията в СМИ и связи с общественностью.','Tuman hokimligi axborot xizmati rahbari - matbuot kotibi','Руководитель информационной службы хокимията - пресс-секретарь',1,'2025-12-15 17:43:19.000000'),(13,'Kengash sessiyalarini tashkil etish va deputatlar faoliyatiga ko\'maklashish.','Организация сессий Кенгаша и содействие деятельности депутатов.','Xalq deputatlari Narpay tuman Kengash kotibiyati mudiri','Заведующий секретариатом Нарпайского районного Кенгаша народных депутатов',1,'2025-12-15 17:43:19.000000'),(14,'Aholini ish bilan ta\'minlash va ishsizlikni kamaytirish choralari.','Меры по трудоустройству населения и снижению безработицы.','Narpay tumani kambag\'allikni qisqartirish va bandlik bo\'limi boshlig\'i','Начальник отдела сокращения бедности и занятости Нарпайского района',1,'2025-12-15 17:43:19.000000'),(15,'Tuman byudjetini shakllantirish va iqtisodiy ko\'rsatkichlarni tahlil qilish.','Формирование бюджета района и анализ экономических показателей.','Narpay tumani moliya va iqtisodiyot bo\'limi boshlig\'i','Начальник отдела финансов и экономики Нарпайского района',1,'2025-12-15 17:43:19.000000'),(16,'Pensiya va nafaqalarni hisoblash va to\'lashni tashkil etish.','Организация начисления и выплаты пенсий и пособий.','Byudjetdan tashqari Pensiya jamg\'armasi Narpay tuman bo\'limi boshlig\'i','Начальник Нарпайского районного отдела внебюджетного Пенсионного фонда',1,'2025-12-15 17:43:19.000000'),(17,'Iste\'molchilarning qonuniy huquq va manfaatlarini himoya qilish.','Защита законных прав и интересов потребителей.','Narpay tumani iste\'molchilar huquqlarini himoya qilish jamiyati raisi','Председатель общества защиты прав потребителей Нарпайского района',1,'2025-12-15 17:43:19.000000'),(18,'Qishloq xo\'jaligi subyektlarini moliyalashtirish va bank xizmatlari.','Финансирование субъектов сельского хозяйства и банковские услуги.','Aksiyadorlik tijorat banki Agrobank Narpay tuman filiali boshqaruvchisi','Управляющий Нарпайским районным филиалом АКБ Агробанк',1,'2025-12-15 17:43:19.000000'),(19,'Kichik biznes va tadbirkorlik uchun mikrokreditlar ajratish.','Выделение микрокредитов для малого бизнеса и предпринимательства.','Aksiyadorlik tijorat banki Mikrokreditbank Ziyovuddin filiali Oqtosh bank xizmatlari markazi boshlig\'i','Начальник центра банковских услуг Октош Зиёвуддинского филиала АКБ Микрокредитбанк',1,'2025-12-15 17:43:19.000000'),(20,'Aholiga pensiya tarqatish va universal bank xizmatlarini ko\'rsatish.','Раздача пенсий населению и оказание универсальных банковских услуг.','Aksiyadorlik tijorat Xalq bank Narpay filiali boshqaruvchisi v.v.b','И.о. управляющего Нарпайским филиалом АК Народный банк',1,'2025-12-15 17:43:19.000000'),(21,'Tadbirkorlik loyihalarini qo\'llab-quvvatlash va moliyalashtirish.','Поддержка и финансирование предпринимательских проектов.','\"Biznesni rivojlantirish banki\" Narpay tumani filiali','Нарпайский районный филиал \"Банка развития бизнеса\"',1,'2025-12-15 17:43:19.000000'),(22,'Davlat hujjatlarini saqlash va arxiv fondini shakllantirish.','Хранение государственных документов и формирование архивного фонда.','Tuman Davlat arxiv bo\'limi boshlig\'i','Начальник районного отдела государственного архива',1,'2025-12-15 17:43:19.000000'),(23,'Tuman bo\'yicha statistik ma\'lumotlarni yig\'ish va tahlil qilish.','Сбор и анализ статистических данных по району.','Narpay tuman Statistika bo\'limi boshlig\'i','Начальник отдела статистики Нарпайского района',1,'2025-12-15 17:43:19.000000'),(24,'Pochta jo\'natmalari va davriy nashrlarni yetkazib berish xizmati.','Услуги доставки почтовых отправлений и периодических изданий.','Narpay tuman Oqtosh pochta aloqa bog\'lanmasi','Узел почтовой связи Октош Нарпайского района',1,'2025-12-15 17:43:19.000000'),(25,'Qishloq xo\'jaligi mahsulotlari savdosini tashkil etish.','Организация торговли сельскохозяйственной продукцией.','Oqtosh dehqonobod dehqon bozori mas\'uliyati cheklangan jamiyati','ООО \"Дехканский рынок Октош Дехконобод\"',1,'2025-12-15 17:43:19.000000'),(26,'Aholiga savdo xizmatlarini ko\'rsatish va bozor faoliyatini yuritish.','Оказание торговых услуг населению и ведение рыночной деятельности.','Mirbozor bozori mas\'uliyati cheklangan jamiyati','ООО \"Рынок Мирбозор\"',1,'2025-12-15 17:43:19.000000'),(27,'Tadbirkorlarning huquqlarini himoya qilish va biznesga ko\'maklashish.','Защита прав предпринимателей и содействие бизнесу.','O\'zbekiston Savdo-sanoat palatasi Tadbirkorlikka ko\'maklashish markazi Narpay tuman bo\'linmasi','Нарпайское районное отделение Центра содействия предпринимательству ТПП Узбекистана',1,'2025-12-15 17:43:19.000000'),(28,'Milliy hunarmandchilikni rivojlantirish va ustalar faoliyatini qo\'llab-quvvatlash.','Развитие национального ремесленничества и поддержка мастеров.','Respublika Hunarmand uyushmasi Narpay tumani bo\'limi rahbari','Руководитель Нарпайского районного отделения Ассоциации \"Хунарманд\"',1,'2025-12-15 17:43:19.000000'),(29,'Tumandagi barcha qurilish va ta\'mirlash ishlarini nazorat qilish.','Контроль всех строительных и ремонтных работ в районе.','Narpay tumani qurilish bo\'limi boshlig\'i','Начальник отдела строительства Нарпайского района',1,'2025-12-15 17:43:19.000000'),(30,'Ko\'chalar va jamoat joylarini toza saqlash va ko\'kalamzorlashtirish.','Содержание улиц и общественных мест в чистоте и озеленение.','Narpay tumani hokimligi huzuridagi obodonlashtirish boshqarmasi boshlig\'i','Начальник управления благоустройства при хокимияте Нарпайского района',1,'2025-12-15 17:43:19.000000'),(31,'Xususiy investitsiya loyihalarini boshqarish va tijorat faoliyati.','Управление частными инвестпроектами и коммерческая деятельность.','Anvarjon biznes invest mas\'uliyati cheklangan jamiyati ish boshqaruvchisi','Управляющий делами ООО \"Анваржон бизнес инвест\"',1,'2025-12-15 17:43:19.000000'),(32,'Aholini toza ichimlik suvi bilan ta\'minlash va oqova xizmatlari.','Обеспечение населения чистой питьевой водой и услуги канализации.','Samarqand suv ta\'minot MChJ Narpay tumani bo\'limi','Нарпайский районный отдел ООО \"Самарканд сув таъминот\"',1,'2025-12-15 17:43:19.000000'),(33,'Iste\'molchilarga tabiiy va suyultirilgan gaz yetkazib berish.','Поставка природного и сжиженного газа потребителям.','Narpay tuman Gaz ta\'minoti rahbari','Руководитель газоснабжения Нарпайского района',1,'2025-12-15 17:43:19.000000'),(34,'Elektr energiyasini taqsimlash va tarmoqlarni texnik xizmat ko\'rsatish.','Распределение электроэнергии и техобслуживание сетей.','Narpay tuman Elektr tarmoqlari korxonasi boshlig\'i','Начальник предприятия электрических сетей Нарпайского района',1,'2025-12-15 17:43:19.000000'),(35,'Tabiatni muhofaza qilish va ekologik qonunchilik nazorati.','Охрана природы и контроль экологического законодательства.','Narpay tumani Ekologiya, atrof-muhitni muhofaza qilish va iqlim o\'zgarishi inspektsiyasi boshlig\'i','Начальник инспекции экологии, охраны окружающей среды и изменения климата Нарпайского района',1,'2025-12-15 17:43:19.000000'),(36,'Avtomobil yo\'llarini ta\'mirlash va saqlash ishlarini bajaradi.','Выполняет работы по ремонту и содержанию автомобильных дорог.','Narpay tumani yo\'llardan foydalanish unitar korxonasi boshlig\'i','Начальник унитарного предприятия по эксплуатации дорог Нарпайского района',1,'2025-12-15 17:43:19.000000'),(37,'Yer hisobi va ko\'chmas mulk kadastrini yuritish.','Ведение учета земель и кадастра недвижимости.','Kadastr agentligining Narpay tumani bo\'limi boshlig\'i','Начальник Нарпайского районного отдела Агентства по кадастру',1,'2025-12-15 17:43:19.000000'),(38,'Ko\'chmas mulkka bo\'lgan huquqlarni davlat ro\'yxatidan o\'tkazish.','Государственная регистрация прав на недвижимое имущество.','Iqtisodiyot va moliya vazirligi huzuridagi davlat kadastrlar palatasining Samarqand viloyat boshqarmasi Narpay tuman filiali boshlig\'i','Начальник Нарпайского филиала Самаркандского областного управления Палаты государственных кадастров',1,'2025-12-15 17:43:19.000000'),(39,'Magistral gaz quvurlari orqali gaz transportini ta\'minlash.','Обеспечение транспортировки газа по магистральным газопроводам.','O\'ztransgaz aksiyadorlik jamiyati Zirabulok magistral gaz quvurlari boshqarmasi boshlig\'i','Начальник управления магистральных газопроводов \"Зирабулок\" АО \"Узтрансгаз\"',1,'2025-12-15 17:43:19.000000'),(40,'Aholining ijtimoiy himoyaga muhtoj qatlamlariga xizmat ko\'rsatish.','Оказание услуг социально уязвимым слоям населения.','Ijtimoiy himoya milliy agentligining Narpay tumani Inson ijtimoiy xizmatlar markazi direktori','Директор центра социальных услуг \"Инсон\" Нарпайского района Национального агентства социальной защиты',1,'2025-12-15 17:43:19.000000'),(41,'Mahalla fuqarolar yig\'inlari faoliyatini muvofiqlashtirish.','Координация деятельности сходов граждан махаллей.','O\'zbekiston mahalla uyushmasi Narpay tumani bo\'limi rahbari','Руководитель Нарпайского районного отделения Ассоциации махаллей Узбекистана',1,'2025-12-15 17:43:19.000000'),(42,'Ma\'naviy-ma\'rifiy targ\'ibot ishlarini tashkil etish.','Организация духовно-просветительской пропагандистской работы.','Respublika Ma\'naviyat va ma\'rifat markazi Narpay tumani bo\'linmasi rahbari','Руководитель Нарпайского районного отделения Республиканского центра духовности и просветительства',1,'2025-12-15 17:43:19.000000'),(43,'Tuman hayotini yorituvchi rasmiy gazetaga rahbarlik qilish.','Руководство официальной газетой, освещающей жизнь района.','Narpay tumani Navqirov Narpay gazetesi bosh muharriri','Главный редактор газеты \"Навкиров Нарпай\" Нарпайского района',1,'2025-12-15 17:43:19.000000'),(44,'Bog\'chalar va maktablar faoliyatini boshqarish va ta\'lim sifati.','Управление садами и школами, контроль качества образования.','Narpay tumani Maktabgacha va maktab ta\'limi bo\'limi boshlig\'i v.v.b','И.о. начальника отдела дошкольного и школьного образования Нарпайского района',1,'2025-12-15 17:43:19.000000'),(45,'Bolalar va o\'smirlar sportini rivojlantirish va mashg\'ulotlar o\'tish.','Развитие детско-юношеского спорта и проведение тренировок.','Narpay tumani Sport maktabi direktori','Директор спортивной школы Нарпайского района',1,'2025-12-15 17:43:19.000000'),(46,'Yoshlarning huquq va manfaatlarini himoya qilish, loyihalarini qo\'llash.','Защита прав и интересов молодежи, поддержка их проектов.','O\'zbekiston Yoshlar ishlari agentligi Narpay tumani bo\'limi boshlig\'i','Начальник Нарпайского районного отдела Агентства по делам молодежи Узбекистана',1,'2025-12-15 17:43:19.000000'),(47,'Tumandagi barcha tibbiyot muassasalari va sog\'liqni saqlash tizimi.','Все медучреждения района и система здравоохранения.','Narpay tumani tibbiyot birlashmasi boshlig\'i','Начальник медицинского объединения Нарпайского района',1,'2025-12-15 17:43:19.000000'),(48,'Madaniy tadbirlarni tashkil etish va san\'atni rivojlantirish.','Организация культурных мероприятий и развитие искусства.','Narpay tumani Madaniyat bo\'limi boshlig\'i','Начальник отдела культуры Нарпайского района',1,'2025-12-15 17:43:19.000000'),(49,'Aholiga kutubxona xizmatini ko\'rsatish va kitobxonlikni targ\'ib qilish.','Библиотечное обслуживание населения и пропаганда чтения.','Narpay tumani Axborot kutubxona markazi direktori','Директор информационно-библиотечного центра Нарпайского района',1,'2025-12-15 17:43:19.000000'),(50,'Sanitariya normalariga rioya etilishini va epidemiologik barqarorlik.','Соблюдение санитарных норм и эпидемиологическая стабильность.','Narpay tumani sanitariya epidemiologiya osoyishtalik markazi bosh vrachi','Главный врач центра санитарно-эпидемиологического благополучия Нарпайского района',1,'2025-12-15 17:43:19.000000'),(51,'Oliy ta\'lim muassasasida o\'quv jarayoni va ilmiy ishlarni boshqarish.','Управление учебным процессом и научной работой в ВУЗе.','Samarqand davlat chet tillari instituti Narpay tumani filiali xorijiy tillar fakulteti dekani','Декан факультета иностранных языков Нарпайского филиала Самаркандского государственного института иностранных языков',1,'2025-12-15 17:43:19.000000'),(52,'Bolalarga musiqa va san\'at sirlarini o\'rgatish.','Обучение детей музыке и искусству.','Narpay tumani 13-son bolalar musiqa va san\'at maktabi direktori','Директор детской школы музыки и искусств №13 Нарпайского района',1,'2025-12-15 17:43:19.000000'),(53,'Iqtidorli bolalarni aniqlash va ularni san\'atga yo\'naltirish.','Выявление одаренных детей и направление их в искусство.','Narpay tumani 27-son bolalar musiqa va san\'at maktabi direktori','Директор детской школы музыки и искусств №27 Нарпайского района',1,'2025-12-15 17:43:19.000000'),(54,'O\'quvchilarga boshlang\'ich kasb-hunar ta\'limini berish.','Начальное профессиональное образование для учащихся.','Narpay 1-son kasb-hunar maktabi direktori','Директор профессиональной школы №1 Нарпайского района',1,'2025-12-15 17:43:19.000000'),(55,'Texnik va xizmat ko\'rsatish sohalarida mutaxassislar tayyorlash.','Подготовка специалистов в технической и сервисной сферах.','Narpay 2-son kasb-hunar maktabi direktori','Директор профессиональной школы №2 Нарпайского района',1,'2025-12-15 17:43:19.000000'),(56,'Xizmat ko\'rsatish sohasi bo\'yicha o\'rta maxsus kadrlar tayyorlash.','Подготовка средне-специальных кадров в сфере услуг.','Narpay xizmat ko\'rsatish texnikumi direktori','Директор техникума обслуживания Нарпайского района',1,'2025-12-15 17:43:19.000000'),(57,'Qishloq xo\'jaligi ekinlarini joylashtirish va agrotexnik tadbirlar.','Размещение сельхозкультур и агротехнические мероприятия.','Narpay tuman Qishloq xo\'jalik bo\'limi boshlig\'i o\'rinbosari','Заместитель начальника отдела сельского хозяйства Нарпайского района',1,'2025-12-15 17:43:19.000000'),(58,'Chorva mollari salomatligini saqlash va chorvachilikni rivojlantirish.','Охрана здоровья скота и развитие животноводства.','Narpay tuman Veterinariya va chorvachilikni rivojlantirish bo\'limi boshlig\'i','Начальник отдела ветеринарии и развития животноводства Нарпайского района',1,'2025-12-15 17:43:19.000000'),(59,'Fermer va dehqonlarning manfaatlarini himoya qilish.','Защита интересов фермеров и дехкан.','O\'zbekiston fermer, dehqon xo\'jaliklari va tomorqa yer egalari Narpay tuman Kengashi raisi v.v.b','И.о. председателя Совета фермерских, дехканских хозяйств и владельцев приусадебных земель Нарпайского района',1,'2025-12-15 17:43:19.000000'),(60,'O\'simliklar zararkunandalariga qarshi kurash va fitosanitar nazorat.','Борьба с вредителями растений и фитосанитарный контроль.','Narpay tuman o\'simliklar karantini bo\'limi boshlig\'i','Начальник отдела карантина растений Нарпайского района',1,'2025-12-15 17:43:19.000000'),(61,'Qishloq xo\'jaligida qonunchilik va texnikalar holatini nazorat qilish.','Контроль законодательства и техники в сельском хозяйстве.','O\'zbekiston Respublikasi Vazirlar Mahkamasi huzuridagi agrosanoat majmuasi ustidan nazorat qilish inspektsiyasi Narpay tuman bo\'limi boshlig\'i v.v.b','И.о. начальника Нарпайского районного отдела Инспекции по контролю за агропромышленным комплексом при Кабинете Министров РУз',1,'2025-12-15 17:43:19.000000'),(62,'G\'alla qabul qilish, saqlash va qayta ishlash korxonasi.','Предприятие по приему, хранению и переработке зерна.','Oqtosh don aksiyadorlik jamiyati raisi, Humo agro platinium fermer xo\'jaligi','Председатель АО \"Октош дон\", Фермерское хозяйство Humo agro platinium',1,'2025-12-15 17:43:19.000000'),(63,'Paxta tolasini qayta ishlash va to\'qimachilik mahsulotlari.','Переработка хлопка-волокна и текстильная продукция.','Maraqand sifat mas\'uliyati cheklangan jamiyati raisi','Председатель ООО \"Мараканд сифат\"',1,'2025-12-15 17:43:19.000000'),(64,'Pillachilikni rivojlantirish va ipak mahsulotlari ishlab chiqarish.','Развитие шелководства и производство шелковой продукции.','Samarqand Silk AO MChJ pilla klasteri','Шелковый кластер \"Samarqand Silk\" АО ООО',1,'2025-12-15 17:43:19.000000'),(65,'Tuman boshqaruviga raqamli texnologiyalarni joriy etish.','Внедрение цифровых технологий в управление районом.','Tuman hokimligi raqamlashtirish bo\'limi','Отдел цифровизации хокимията района',1,'2025-12-15 17:43:19.000000'),(66,'Qonunlarning aniq va bir xilda bajarilishi ustidan nazorat.','Надзор за точным и единообразным исполнением законов.','Narpay tuman prokurori','Прокурор Нарпайского района',1,'2025-12-15 17:43:19.000000'),(67,'Jamoat tartibini saqlash va jinoyatchilikka qarshi kurash.','Охрана общественного порядка и борьба с преступностью.','Narpay tuman Ichki ishlar bo\'limi boshlig\'i','Начальник отдела внутренних дел Нарпайского района',1,'2025-12-15 17:43:19.000000'),(68,'Sud hujjatlari va boshqa organlar hujjatlarini majburiy ijro etish.','Принудительное исполнение судебных актов и актов других органов.','Majburiy ijro byurosi Narpay tumani bo\'limi','Нарпайский районный отдел Бюро принудительного исполнения',1,'2025-12-15 17:43:19.000000'),(69,'Huquqiy xizmat ko\'rsatish, notariat va FHDYo organlari faoliyatini yuritish.','Оказание правовых услуг, нотариат и деятельность органов ЗАГС.','Narpay tuman adliya bo\'limi','Отдел юстиции Нарпайского района',1,'2025-12-15 17:43:19.000000'),(70,'Soliq tushumlarini ta\'minlash va soliq qonunchiligini nazorat qilish.','Обеспечение налоговых поступлений и контроль налогового законодательства.','Narpay tuman Davlat soliq inspeksiyasi','Государственная налоговая инспекция Нарпайского района',1,'2025-12-15 17:43:19.000000');
/*!40000 ALTER TABLE `departments_department` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments_staffdailyperformance`
--

DROP TABLE IF EXISTS `departments_staffdailyperformance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments_staffdailyperformance` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `tickets_solved` int NOT NULL,
  `avg_response_time_seconds` double NOT NULL,
  `staff_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `departments_staffdailyperformance_staff_id_date_3d054d66_uniq` (`staff_id`,`date`),
  KEY `departments_staffdailyperformance_date_51ed26de` (`date`),
  CONSTRAINT `departments_staffdai_staff_id_c6542997_fk_users_use` FOREIGN KEY (`staff_id`) REFERENCES `users_user` (`user_uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=84 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments_staffdailyperformance`
--

LOCK TABLES `departments_staffdailyperformance` WRITE;
/*!40000 ALTER TABLE `departments_staffdailyperformance` DISABLE KEYS */;
INSERT INTO `departments_staffdailyperformance` VALUES (82,'2025-12-15',1,0,'a9d4deb4381e43099c23d68f76d2475d'),(83,'2025-12-16',14,0,'1128cf47706b4b8fb4c52407911c377d');
/*!40000 ALTER TABLE `departments_staffdailyperformance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments_staffprofile`
--

DROP TABLE IF EXISTS `departments_staffprofile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments_staffprofile` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `role` varchar(20) NOT NULL,
  `job_title` varchar(100) DEFAULT NULL,
  `joined_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `department_id` bigint DEFAULT NULL,
  `user_uuid` char(32) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `personal_best_record` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_uuid`),
  UNIQUE KEY `username` (`username`),
  KEY `departments_staffpro_department_id_3a468adf_fk_departmen` (`department_id`),
  CONSTRAINT `departments_staffpro_department_id_3a468adf_fk_departmen` FOREIGN KEY (`department_id`) REFERENCES `departments_department` (`id`),
  CONSTRAINT `departments_staffpro_user_uuid_62c3dc71_fk_users_use` FOREIGN KEY (`user_uuid`) REFERENCES `users_user` (`user_uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments_staffprofile`
--

LOCK TABLES `departments_staffprofile` WRITE;
/*!40000 ALTER TABLE `departments_staffprofile` DISABLE KEYS */;
INSERT INTO `departments_staffprofile` VALUES (17,'MANAGER','Dev','2025-12-15 14:24:01.426406','2025-12-15 14:24:01.426406',1,'1128cf47706b4b8fb4c52407911c377d','nathan',14),(18,'STAFF','Dev','2025-12-15 15:42:07.441057','2025-12-15 15:42:07.441057',59,'eaf16d27fecb421dbbca8894a87ef5cc','abdulloh',0),(19,'STAFF','Dev','2025-12-15 15:45:33.320891','2025-12-15 15:45:33.320891',59,'a9d4deb4381e43099c23d68f76d2475d','bb',1);
/*!40000 ALTER TABLE `departments_staffprofile` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_users_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users_user` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
INSERT INTO `django_admin_log` VALUES (1,'2025-12-15 14:24:01.429581','17','None [MANAGER] - Tuman hokimi',1,'[{\"added\": {}}]',9,96),(2,'2025-12-15 15:42:07.444118','18','Abdulloh [STAFF] - O\'zbekiston fermer, dehqon xo\'jaliklari va tomorqa yer egalari Narpay tuman Kengashi raisi v.v.b',1,'[{\"added\": {}}]',9,96),(3,'2025-12-15 15:44:07.062613','99','[User] 976281380',1,'[{\"added\": {}}]',13,96),(4,'2025-12-15 15:45:33.323929','19','None [STAFF] - O\'zbekiston fermer, dehqon xo\'jaliklari va tomorqa yer egalari Narpay tuman Kengashi raisi v.v.b',1,'[{\"added\": {}}]',9,96),(5,'2025-12-16 15:01:15.365289','96','[System Owner] Nathan Allard',2,'[{\"changed\": {\"fields\": [\"Full name\", \"Email\", \"Is verified\"]}}]',13,96);
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (1,'admin','logentry'),(6,'ai_endpoints','aianalysis'),(7,'ai_endpoints','injectionlog'),(3,'auth','group'),(2,'auth','permission'),(17,'broadcast','broadcast'),(18,'broadcast','broadcastacknowledgment'),(4,'contenttypes','contenttype'),(8,'departments','department'),(16,'departments','staffdailyperformance'),(9,'departments','staffprofile'),(10,'message_app','message'),(11,'message_app','messagecontent'),(12,'message_app','session'),(5,'sessions','session'),(15,'support_tools','neighborhood'),(19,'support_tools','quickreply'),(14,'users','telegramconnection'),(13,'users','user');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2025-12-05 15:56:09.431666'),(2,'contenttypes','0002_remove_content_type_name','2025-12-05 15:56:09.549618'),(3,'auth','0001_initial','2025-12-05 15:56:09.857921'),(4,'auth','0002_alter_permission_name_max_length','2025-12-05 15:56:09.932654'),(5,'auth','0003_alter_user_email_max_length','2025-12-05 15:56:09.940318'),(6,'auth','0004_alter_user_username_opts','2025-12-05 15:56:09.948459'),(7,'auth','0005_alter_user_last_login_null','2025-12-05 15:56:09.955363'),(8,'auth','0006_require_contenttypes_0002','2025-12-05 15:56:09.958955'),(9,'auth','0007_alter_validators_add_error_messages','2025-12-05 15:56:09.966680'),(10,'auth','0008_alter_user_username_max_length','2025-12-05 15:56:09.976228'),(11,'auth','0009_alter_user_last_name_max_length','2025-12-05 15:56:09.983958'),(12,'auth','0010_alter_group_name_max_length','2025-12-05 15:56:10.001557'),(13,'auth','0011_update_proxy_permissions','2025-12-05 15:56:10.009661'),(14,'auth','0012_alter_user_first_name_max_length','2025-12-05 15:56:10.016366'),(15,'users','0001_initial','2025-12-05 15:56:10.495283'),(16,'admin','0001_initial','2025-12-05 15:56:10.641511'),(17,'admin','0002_logentry_remove_auto_add','2025-12-05 15:56:10.650317'),(18,'admin','0003_logentry_add_action_flag_choices','2025-12-05 15:56:10.661033'),(19,'message_app','0001_initial','2025-12-05 15:56:10.755593'),(20,'departments','0001_initial','2025-12-05 15:56:10.880820'),(21,'departments','0002_initial','2025-12-05 15:56:10.959040'),(22,'message_app','0002_initial','2025-12-05 15:56:11.459099'),(23,'message_app','0003_alter_message_sender_alter_session_assigned_staff_and_more','2025-12-05 15:56:12.152726'),(24,'ai_endpoints','0001_initial','2025-12-05 15:56:12.268015'),(25,'ai_endpoints','0002_initial','2025-12-05 15:56:12.628064'),(26,'ai_endpoints','0003_alter_aianalysis_corrected_by_and_more','2025-12-05 15:56:13.051113'),(27,'departments','0003_remove_department_name','2025-12-05 15:56:13.098764'),(28,'departments','0004_alter_department_name_ru_alter_department_name_uz','2025-12-05 15:56:13.141712'),(29,'departments','0005_alter_staffprofile_user','2025-12-05 15:56:13.322122'),(30,'sessions','0001_initial','2025-12-05 15:56:13.366373'),(31,'support_tools','0001_initial','2025-12-05 15:56:13.426256'),(32,'ai_endpoints','0004_rename_completion_tokens_aianalysis_embedding_tokens_and_more','2025-12-06 14:48:49.226001'),(33,'departments','0006_staffprofile_username','2025-12-07 04:15:11.110684'),(34,'users','0002_user_avatar','2025-12-08 04:19:06.256908'),(35,'message_app','0004_session_location_session_neighborhood','2025-12-08 05:13:54.873397'),(36,'message_app','0005_remove_session_location_remove_session_neighborhood','2025-12-08 05:18:26.713660'),(37,'message_app','0006_alter_session_status','2025-12-09 04:36:36.881393'),(38,'message_app','0007_alter_session_status','2025-12-09 04:36:36.909378'),(39,'departments','0007_staffprofile_personal_best_record_and_more','2025-12-09 04:46:44.736134'),(40,'message_app','0008_alter_session_status','2025-12-09 04:46:44.762137'),(41,'broadcast','0001_initial','2025-12-09 04:48:27.787310'),(42,'broadcast','0002_alter_broadcast_created_by_and_more','2025-12-09 04:51:44.072284'),(43,'broadcast','0003_broadcast_expires_at_and_more','2025-12-09 10:01:00.652162'),(44,'users','0003_alter_user_neighborhood','2025-12-09 10:10:48.196114'),(45,'departments','0008_alter_staffdailyperformance_staff','2025-12-09 10:24:22.035418'),(46,'users','0004_alter_telegramconnection_updated_at','2025-12-09 10:24:22.058394'),(47,'broadcast','0004_alter_broadcastacknowledgment_acknowledged_at_and_more','2025-12-09 11:24:51.919858'),(48,'message_app','0009_rename_user_session_citizen','2025-12-10 05:56:12.331367'),(49,'message_app','0010_alter_session_citizen','2025-12-10 06:11:25.698988'),(50,'message_app','0011_alter_session_citizen','2025-12-10 06:11:25.766935'),(51,'message_app','0012_remove_session_citizen','2025-12-10 06:16:01.609421'),(52,'message_app','0013_session_citizen','2025-12-10 06:17:28.007098'),(53,'message_app','0014_message_client_message_id_session_origin_and_more','2025-12-10 08:25:25.731999'),(54,'message_app','0015_alter_message_unique_together_and_more','2025-12-10 13:56:32.363883'),(55,'support_tools','0002_quickreply','2025-12-11 03:46:24.533569'),(56,'message_app','0016_add_sla_fields','2025-12-11 05:11:41.406269'),(57,'users','0005_user_gender','2025-12-12 05:29:48.458384'),(58,'message_app','0017_session_description_session_intent_label','2025-12-15 06:55:27.137070'),(59,'message_app','0018_remove_session_description_and_more','2025-12-15 10:29:40.327917'),(60,'message_app','0019_session_assigned_at_session_description_and_more','2025-12-15 10:29:40.535879');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
INSERT INTO `django_session` VALUES ('n9mrkfa6by3h9jcyz2tkoqs2q4nwieuj','.eJxVjMsOwiAQRf-FtSHQwkBduvcbmhlmkKqBpI-V8d-1SRe6veec-1IjbmsZt0XmcWJ1VgOo0-9ImB5Sd8J3rLemU6vrPJHeFX3QRV8by_NyuH8HBZfyrckD-x6wS0TWGpuH0Bk0OZARtEmEI6c4GPCuB6ZI0TmPHfTBQc4U1fsDFhI4Nw:1vV9RX:eiDACPVE1-N7ifKNAoH8cceBoPJ25XWBF-39Jn3oOjw','2025-12-29 14:20:55.676090');
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message_app_message`
--

DROP TABLE IF EXISTS `message_app_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_app_message` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `message_uuid` char(32) NOT NULL,
  `is_staff_message` tinyint(1) NOT NULL,
  `sender_platform` varchar(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `delivered_at` datetime(6) DEFAULT NULL,
  `read_at` datetime(6) DEFAULT NULL,
  `quarantined` tinyint(1) NOT NULL,
  `quarantined_at` datetime(6) DEFAULT NULL,
  `sender_uuid` char(32) DEFAULT NULL,
  `session_uuid` char(32) NOT NULL,
  `client_message_id` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `message_uuid` (`message_uuid`),
  KEY `message_app_message_sender_uuid_a7790171_fk_users_user_user_uuid` (`sender_uuid`),
  KEY `message_app_message_session_uuid_b3874e69` (`session_uuid`),
  CONSTRAINT `message_app_message_sender_uuid_a7790171_fk_users_user_user_uuid` FOREIGN KEY (`sender_uuid`) REFERENCES `users_user` (`user_uuid`),
  CONSTRAINT `message_app_message_session_uuid_b3874e69_fk_message_a` FOREIGN KEY (`session_uuid`) REFERENCES `message_app_session` (`session_uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=206 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_app_message`
--

LOCK TABLES `message_app_message` WRITE;
/*!40000 ALTER TABLE `message_app_message` DISABLE KEYS */;
INSERT INTO `message_app_message` VALUES (113,'6e93725e4dbf4bb7bc1b1193f7bce8f1',0,'telegram','2025-12-15 16:06:01.795031',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','3ee7e57415b04581a47c03689801f352',NULL),(114,'0123031f75e44f61a9b7918cc77d317a',0,'telegram','2025-12-15 16:06:53.301946',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','3ee7e57415b04581a47c03689801f352',NULL),(115,'65fa14012548436ea1762dbfeccaa733',0,'telegram','2025-12-15 16:07:01.988341',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','3ee7e57415b04581a47c03689801f352',NULL),(116,'13cb4296f7bb47b582d41cc96fdbb9f4',1,'web','2025-12-15 16:07:27.291231',NULL,NULL,0,NULL,'1128cf47706b4b8fb4c52407911c377d','3ee7e57415b04581a47c03689801f352',NULL),(117,'752df5e2272c402e9ef277b561495537',1,'web','2025-12-16 05:01:26.586169',NULL,NULL,0,NULL,'1128cf47706b4b8fb4c52407911c377d','3ee7e57415b04581a47c03689801f352',NULL),(118,'d00ff710e1034d35b5d8710bec656f4e',0,'telegram','2025-12-16 05:25:03.587659',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(119,'866bcccf150b4976b997abd4de1efe63',1,'web','2025-12-16 05:26:15.838751',NULL,NULL,0,NULL,'1128cf47706b4b8fb4c52407911c377d','6b506db8e930474c9553f57149bc2ced',NULL),(120,'1ee2f1ee9cd54e5c8607bcf6cd2b2296',1,'web','2025-12-16 05:26:20.766344',NULL,NULL,0,NULL,'1128cf47706b4b8fb4c52407911c377d','6b506db8e930474c9553f57149bc2ced',NULL),(121,'e6c6c605655d488bb61e9d08862ba7b2',0,'telegram','2025-12-16 05:27:06.696278',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(122,'23abe95f8c614be6958df5152e0893f2',0,'telegram','2025-12-16 05:28:07.340142',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(123,'42eaa992f7364d3e94ccfe155f8c2154',1,'web','2025-12-16 05:28:27.974496',NULL,NULL,0,NULL,'1128cf47706b4b8fb4c52407911c377d','6b506db8e930474c9553f57149bc2ced',NULL),(124,'856d8c25fb6b4582a5d445e405cae2ce',0,'telegram','2025-12-16 05:28:37.615241',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(125,'0dee17293c674f348b4e558e5a4728df',0,'telegram','2025-12-16 05:30:51.859556',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(126,'3da139b9e3e345688dc5ba2703362369',1,'web','2025-12-16 05:31:52.194169',NULL,NULL,0,NULL,'1128cf47706b4b8fb4c52407911c377d','6b506db8e930474c9553f57149bc2ced',NULL),(127,'f1d3fbe2d35d4571b49bfd555c53fbd7',1,'web','2025-12-16 05:32:05.707196',NULL,NULL,0,NULL,'1128cf47706b4b8fb4c52407911c377d','6b506db8e930474c9553f57149bc2ced',NULL),(128,'ebc41c29a4824370bae23809b65246bd',1,'web','2025-12-16 05:32:14.146508',NULL,NULL,0,NULL,'1128cf47706b4b8fb4c52407911c377d','6b506db8e930474c9553f57149bc2ced',NULL),(129,'acc3e9572e8e430ebe1203908055d247',0,'telegram','2025-12-16 05:33:14.739059',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(130,'9f9269518aac480f8197a712f7cf2d88',0,'telegram','2025-12-16 05:35:42.001922',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(131,'436ce810de0e477daca7a6bd9d422e55',0,'telegram','2025-12-16 05:36:16.963510',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(132,'97ec4253ee224915b980e4b498d46ee2',0,'telegram','2025-12-16 05:36:17.534890',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(133,'610c5b7ef31548dd8ffd08fbca03dd68',0,'telegram','2025-12-16 05:36:18.087822',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(134,'db99fa5e498640d0b2a9a963905c9b3f',0,'telegram','2025-12-16 05:36:18.608929',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(135,'0ca212794ba94702a124acee83abd731',0,'telegram','2025-12-16 05:36:19.089653',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(136,'0a3c780c09a148ab8b063871476431e0',0,'telegram','2025-12-16 05:36:20.192606',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(137,'67c04b7c903644bf8248fa50107694a7',0,'telegram','2025-12-16 05:36:20.739351',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(138,'330be58edbd04958ad19287bafa83939',0,'telegram','2025-12-16 05:36:21.255255',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(139,'b201702357bb49fc9db51004dc1eed47',0,'telegram','2025-12-16 05:36:21.851139',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(140,'14c79bc6a16b448eb59059f92bb7f28f',0,'telegram','2025-12-16 05:36:26.373797',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(141,'7f20fc01fc3e4f5688d268562fd47724',0,'telegram','2025-12-16 05:36:27.604904',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(142,'0147085ec7ee42238ffebe4c00a06fd3',0,'telegram','2025-12-16 05:36:28.086858',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(143,'89fb163f9ed1424dbd4ba91702d66c09',0,'telegram','2025-12-16 05:36:28.518802',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(144,'055fa8753d7c4e429b445b2d0d3a07b3',0,'telegram','2025-12-16 05:36:28.914737',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(145,'68581c4e0ee94408b7bec39f8da8207a',0,'telegram','2025-12-16 05:36:29.335226',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(146,'d05264d783b3441087a9512f81f17abe',0,'telegram','2025-12-16 05:36:29.669051',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(147,'0312570c273c4674a836dd3282e262fd',0,'telegram','2025-12-16 05:36:30.180876',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(148,'ac2efcb7b77c4543b14b9164a916d2a0',0,'telegram','2025-12-16 05:36:30.541419',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(149,'546a04e123454ceeaa01f84a767a3737',0,'telegram','2025-12-16 05:36:31.181193',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(150,'8a756fea4d684b9fa0646a05e9c7d5b5',0,'telegram','2025-12-16 05:36:31.744378',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(151,'2789e21ca0c74d5fb4ba6bc16661832c',0,'telegram','2025-12-16 05:36:31.915048',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(152,'4f651ee27ad549eca253dc1cf23608e2',0,'telegram','2025-12-16 05:36:32.221624',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(153,'f6e82a5ff1da4ed7a3866e85c3228280',0,'telegram','2025-12-16 05:36:32.521328',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(154,'bb4f62687a384383b2847925461f0ce9',0,'telegram','2025-12-16 05:36:32.672351',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(155,'f917a9ee59da40ec95f4bb82cdebbe53',0,'telegram','2025-12-16 05:36:32.829823',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(156,'2f52f6f4a8634a8ab5ef3b4bc9a1e160',0,'telegram','2025-12-16 05:36:32.975414',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(157,'3ce069a30d674c09a310e5f11b6d3547',0,'telegram','2025-12-16 05:36:33.242393',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(158,'fb67d189b287400ebb740fdf3c204445',0,'telegram','2025-12-16 05:36:33.404115',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(159,'d1dc4d6a986c4364b9dd6406118e271f',0,'telegram','2025-12-16 05:36:33.575792',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(160,'72c5aa43bcfe46048eeb01972fe885e0',0,'telegram','2025-12-16 05:36:33.747721',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(161,'97e0d1358d7146bc8394e4070d80ec22',0,'telegram','2025-12-16 05:36:33.887929',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(162,'bcfd2209b6ee4e80b48c555565642e36',0,'telegram','2025-12-16 05:36:34.043752',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(163,'016d4b5ade46417eaf4a5ca6597cac24',0,'telegram','2025-12-16 05:36:39.996333',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(164,'f69ffc18d5e14b88b46c1b67f7ddb006',0,'telegram','2025-12-16 05:36:40.168778',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(165,'8a1875bf220b4f3e93d599b7add508d2',0,'telegram','2025-12-16 05:36:40.307600',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(166,'6af22b54b70446c19ea0d68efec7c7b4',0,'telegram','2025-12-16 05:36:40.469944',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(167,'40e0b100d9db4c0baf099c41d3d8008b',0,'telegram','2025-12-16 05:36:40.625799',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(168,'52912c66953146ee948edea69c9dd27d',0,'telegram','2025-12-16 05:36:40.892572',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(169,'122575a452584f38836731c881e6f9e6',0,'telegram','2025-12-16 05:36:41.122141',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(170,'d4a46d7c1f0b40289405ae8e427e004b',0,'telegram','2025-12-16 05:36:41.274788',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(171,'9e1bb0fa97b146a7a955c1c88207b9cf',0,'telegram','2025-12-16 05:36:41.416138',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(172,'cbb7e8e1bb0646ebb757ecc71d26306e',0,'telegram','2025-12-16 05:36:41.560389',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(173,'a0d906e34b6042469983e37e16c165e4',0,'telegram','2025-12-16 05:36:41.711435',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(174,'05fe751c48ac4110b2c031b92dbc903f',0,'telegram','2025-12-16 05:36:41.955784',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(175,'9c1e0c474bcf4f65aec1fbf1065cc59e',0,'telegram','2025-12-16 05:36:42.113218',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(176,'71d07f2488a14316ad0b944591f469a6',0,'telegram','2025-12-16 05:36:42.268594',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(177,'d4edb5349f2b4624a4044062c434f872',0,'telegram','2025-12-16 05:36:42.447896',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(178,'ee9404a527534878b7f029a11cd16f77',0,'telegram','2025-12-16 05:36:42.620120',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(179,'f0022f66f63c4a49800a64d413b5d08c',0,'telegram','2025-12-16 05:36:42.772965',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(180,'7d897a63face4da2be9e1309d572247a',0,'telegram','2025-12-16 05:36:42.932473',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(181,'5993063918a3433a9f61f1e65f9eb660',0,'telegram','2025-12-16 05:36:43.092882',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(182,'cf6aae59819f41a28a7129ffba884998',0,'telegram','2025-12-16 05:36:43.241298',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(183,'db99b07cd32e4547bfc943fa15de0ed5',0,'telegram','2025-12-16 05:36:43.405399',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(184,'a594249fd74d4d9a947ef8d9273dde0c',0,'telegram','2025-12-16 05:36:43.411576',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(185,'2c44effb75d9401fb3987c1e16f3d5c9',0,'telegram','2025-12-16 05:36:43.559660',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(186,'04c4943bc25f42a0a916f4c9aaf7345a',0,'telegram','2025-12-16 05:36:43.714550',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(187,'82394295fcdc440a93f5079624ef68a1',0,'telegram','2025-12-16 05:36:43.872936',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(188,'e49e15d2edd74f3db5aef2123a50c5a7',0,'telegram','2025-12-16 05:36:44.040448',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(189,'e4dc2a6fd80f4dfd8378ea2b34f32182',0,'telegram','2025-12-16 05:36:45.614143',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','6b506db8e930474c9553f57149bc2ced',NULL),(190,'eef15b2e35a942a6a6b98c6d7541663f',1,'web','2025-12-16 05:37:01.100480',NULL,NULL,0,NULL,'1128cf47706b4b8fb4c52407911c377d','6b506db8e930474c9553f57149bc2ced',NULL),(191,'71e6390411e44c21af84c6024947379a',1,'web','2025-12-16 05:37:11.448104',NULL,NULL,0,NULL,'1128cf47706b4b8fb4c52407911c377d','6b506db8e930474c9553f57149bc2ced',NULL),(192,'aa5a054ed9684c9cbfa5ad43b162833a',1,'web','2025-12-16 05:37:18.090045',NULL,NULL,0,NULL,'1128cf47706b4b8fb4c52407911c377d','6b506db8e930474c9553f57149bc2ced',NULL),(193,'9f652bfedab84db585fc299d8fcbc25f',0,'telegram','2025-12-16 05:39:34.146675',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','37259581da5e48cf98b5e4151f48119e',NULL),(194,'86ce3355560a4e09aa286cc4cff8d6ca',0,'telegram','2025-12-16 06:18:21.544350',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','4eab0087959a4d9ca12dcbb91f9ae27a',NULL),(195,'2e41ffd797c4416a98d69c1b88a706bf',0,'telegram','2025-12-16 06:19:18.417962',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','40007e8c6a5d48f68e58a5d93c8ab7d0',NULL),(196,'8ab77ea8dcde4418a4038b04c7979332',0,'telegram','2025-12-16 06:22:29.860085',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','b300e50811734aada062986b7598d5ee',NULL),(197,'e51eeaead937443dafd9c48860bfb4d1',0,'telegram','2025-12-16 06:24:43.776610',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','cf9ea7bc528f47bd8489bf9226085e6f',NULL),(198,'2cbaf82437f4474886caee40c9956486',0,'telegram','2025-12-16 06:39:28.263519',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','eab13631a590429199f0ce973624594a',NULL),(199,'47c42282ee8540509cefdfaf3af7f1e1',0,'telegram','2025-12-16 06:40:37.165721',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','00b481b07fb74b1a9a46f4d7f82961ac',NULL),(200,'7f10cabbd5bf4c648e093b51561a5856',0,'telegram','2025-12-16 12:07:33.360362',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','4ec7ec1179fd47f7a2e3700b8d3088bc',NULL),(201,'ff98385573f44a2bbde0407b26dc51be',0,'telegram','2025-12-16 12:10:00.490578',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','005dbc6e760a42219fe9c5ef155d1c3f',NULL),(202,'356a7a9fbd1747d6956e16066b8ab4c4',1,'web','2025-12-16 12:10:30.546004',NULL,NULL,0,NULL,'1128cf47706b4b8fb4c52407911c377d','005dbc6e760a42219fe9c5ef155d1c3f',NULL),(203,'02766bfebaeb40e8b1112322400b5687',0,'telegram','2025-12-16 14:58:46.095722',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','f87607bf0f714667a25fd5ed1d7239d6',NULL),(204,'27ce2351d8d54654be58926a6c9938da',0,'telegram','2025-12-16 15:01:42.643563',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','f646881ebe7c4b55946df98f11ae503b',NULL),(205,'ddc61c183b3d408d8f67c307b923e3b3',0,'telegram','2025-12-16 15:10:40.326445',NULL,NULL,0,NULL,'66d21bb67ce748aabb1e5300f688eaf7','7f0465e3529e46288736245dafe52f60',NULL);
/*!40000 ALTER TABLE `message_app_message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message_app_messagecontent`
--

DROP TABLE IF EXISTS `message_app_messagecontent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_app_messagecontent` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content_type` varchar(32) NOT NULL,
  `text` longtext,
  `caption` longtext,
  `file` varchar(100) DEFAULT NULL,
  `file_url` varchar(200) DEFAULT NULL,
  `telegram_file_id` varchar(256) DEFAULT NULL,
  `media_group_id` varchar(128) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `message_uuid` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `message_app_messagec_message_uuid_ccfdc4af_fk_message_a` (`message_uuid`),
  CONSTRAINT `message_app_messagec_message_uuid_ccfdc4af_fk_message_a` FOREIGN KEY (`message_uuid`) REFERENCES `message_app_message` (`message_uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=206 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_app_messagecontent`
--

LOCK TABLES `message_app_messagecontent` WRITE;
/*!40000 ALTER TABLE `message_app_messagecontent` DISABLE KEYS */;
INSERT INTO `message_app_messagecontent` VALUES (113,'text','Menga Tuman hokimi kerak iltimos tuman hokimiga ulab bering',NULL,'',NULL,NULL,NULL,'2025-12-15 16:06:01.805139','6e93725e4dbf4bb7bc1b1193f7bce8f1'),(114,'text','sdfsdfs',NULL,'',NULL,NULL,NULL,'2025-12-15 16:06:53.322400','0123031f75e44f61a9b7918cc77d317a'),(115,'text','asdadsad',NULL,'',NULL,NULL,NULL,'2025-12-15 16:07:01.992772','65fa14012548436ea1762dbfeccaa733'),(116,'text','ok',NULL,'',NULL,NULL,NULL,'2025-12-15 16:07:27.295189','13cb4296f7bb47b582d41cc96fdbb9f4'),(117,'text','hop buladi',NULL,'',NULL,NULL,NULL,'2025-12-16 05:01:26.589767','752df5e2272c402e9ef277b561495537'),(118,'text','Menga Tuman hokimi kerak iltimos tuman hokimiga ulab bering',NULL,'',NULL,NULL,NULL,'2025-12-16 05:25:03.593345','d00ff710e1034d35b5d8710bec656f4e'),(119,'text','Assalomu alekum',NULL,'',NULL,NULL,NULL,'2025-12-16 05:26:15.838751','866bcccf150b4976b997abd4de1efe63'),(120,'text','Yaxshimisiz',NULL,'',NULL,NULL,NULL,'2025-12-16 05:26:20.768060','1ee2f1ee9cd54e5c8607bcf6cd2b2296'),(121,'text','Albbat zor',NULL,'',NULL,NULL,NULL,'2025-12-16 05:27:06.713902','e6c6c605655d488bb61e9d08862ba7b2'),(122,'text','Yaxhsimi',NULL,'',NULL,NULL,NULL,'2025-12-16 05:28:07.355578','23abe95f8c614be6958df5152e0893f2'),(123,'text','Buladi',NULL,'',NULL,NULL,NULL,'2025-12-16 05:28:27.977872','42eaa992f7364d3e94ccfe155f8c2154'),(124,'text','Nima gaplar o\'zi',NULL,'',NULL,NULL,NULL,'2025-12-16 05:28:37.615241','856d8c25fb6b4582a5d445e405cae2ce'),(125,'text','Ishlayabdimi',NULL,'',NULL,NULL,NULL,'2025-12-16 05:30:51.864240','0dee17293c674f348b4e558e5a4728df'),(126,'text','Ok',NULL,'',NULL,NULL,NULL,'2025-12-16 05:31:52.202383','3da139b9e3e345688dc5ba2703362369'),(127,'text','hfdjlkd',NULL,'',NULL,NULL,NULL,'2025-12-16 05:32:05.707196','f1d3fbe2d35d4571b49bfd555c53fbd7'),(128,'text','Nima bulyabdi',NULL,'',NULL,NULL,NULL,'2025-12-16 05:32:14.149632','ebc41c29a4824370bae23809b65246bd'),(129,'text','Muommo bor',NULL,'',NULL,NULL,NULL,'2025-12-16 05:33:14.762724','acc3e9572e8e430ebe1203908055d247'),(130,'text','Ishalatad',NULL,'',NULL,NULL,NULL,'2025-12-16 05:35:42.017546','9f9269518aac480f8197a712f7cf2d88'),(131,'text','ssdf',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:16.994901','436ce810de0e477daca7a6bd9d422e55'),(132,'text','dfs',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:17.551489','97ec4253ee224915b980e4b498d46ee2'),(133,'text','dfsdf',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:18.100657','610c5b7ef31548dd8ffd08fbca03dd68'),(134,'text','sdfsdfs',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:18.622161','db99fa5e498640d0b2a9a963905c9b3f'),(135,'text','dfsdfs',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:19.098449','0ca212794ba94702a124acee83abd731'),(136,'text','fdsfsdffdfs',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:20.198779','0a3c780c09a148ab8b063871476431e0'),(137,'text','dfsfds',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:20.756160','67c04b7c903644bf8248fa50107694a7'),(138,'text','dfsfds',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:21.259475','330be58edbd04958ad19287bafa83939'),(139,'text','dfsfdsdf',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:21.853760','b201702357bb49fc9db51004dc1eed47'),(140,'text','sdfsdf',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:26.394876','14c79bc6a16b448eb59059f92bb7f28f'),(141,'text','sdfsfdsfdsbfdsdfs',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:27.630567','7f20fc01fc3e4f5688d268562fd47724'),(142,'text','fdsfds',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:28.094843','0147085ec7ee42238ffebe4c00a06fd3'),(143,'text','fsdfs',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:28.518802','89fb163f9ed1424dbd4ba91702d66c09'),(144,'text','fsfd',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:28.929181','055fa8753d7c4e429b445b2d0d3a07b3'),(145,'text','dfdf',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:29.338872','68581c4e0ee94408b7bec39f8da8207a'),(146,'text','dfd',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:29.673008','d05264d783b3441087a9512f81f17abe'),(147,'text','fsf',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:30.187012','0312570c273c4674a836dd3282e262fd'),(148,'text','dff',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:30.557613','ac2efcb7b77c4543b14b9164a916d2a0'),(149,'text','dfdfdfd',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:31.190914','546a04e123454ceeaa01f84a767a3737'),(150,'text','fff',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:31.780842','8a756fea4d684b9fa0646a05e9c7d5b5'),(151,'text','f',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:31.924711','2789e21ca0c74d5fb4ba6bc16661832c'),(152,'text','f',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:32.227939','4f651ee27ad549eca253dc1cf23608e2'),(153,'text','f',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:32.531455','f6e82a5ff1da4ed7a3866e85c3228280'),(154,'text','f',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:32.674433','bb4f62687a384383b2847925461f0ce9'),(155,'text','dfd',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:32.836824','f917a9ee59da40ec95f4bb82cdebbe53'),(156,'text','f',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:32.985805','2f52f6f4a8634a8ab5ef3b4bc9a1e160'),(157,'text','f',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:33.244980','3ce069a30d674c09a310e5f11b6d3547'),(158,'text','f',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:33.409215','fb67d189b287400ebb740fdf3c204445'),(159,'text','f',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:33.594170','d1dc4d6a986c4364b9dd6406118e271f'),(160,'text','f',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:33.751669','72c5aa43bcfe46048eeb01972fe885e0'),(161,'text','f',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:33.898741','97e0d1358d7146bc8394e4070d80ec22'),(162,'text','f',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:34.043752','bcfd2209b6ee4e80b48c555565642e36'),(163,'text','df',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:40.012486','016d4b5ade46417eaf4a5ca6597cac24'),(164,'text','df',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:40.168778','f69ffc18d5e14b88b46c1b67f7ddb006'),(165,'text','sd',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:40.311694','8a1875bf220b4f3e93d599b7add508d2'),(166,'text','g',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:40.478563','6af22b54b70446c19ea0d68efec7c7b4'),(167,'text','dsfg',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:40.633980','40e0b100d9db4c0baf099c41d3d8008b'),(168,'text','fdd',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:40.933478','52912c66953146ee948edea69c9dd27d'),(169,'text','gf',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:41.153625','122575a452584f38836731c881e6f9e6'),(170,'text','f',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:41.280482','d4a46d7c1f0b40289405ae8e427e004b'),(171,'text','g',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:41.422858','9e1bb0fa97b146a7a955c1c88207b9cf'),(172,'text','g',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:41.569528','cbb7e8e1bb0646ebb757ecc71d26306e'),(173,'text','ddf',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:41.713068','a0d906e34b6042469983e37e16c165e4'),(174,'text','g',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:41.960246','05fe751c48ac4110b2c031b92dbc903f'),(175,'text','dg',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:42.115453','9c1e0c474bcf4f65aec1fbf1065cc59e'),(176,'text','g',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:42.272958','71d07f2488a14316ad0b944591f469a6'),(177,'text','gdg',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:42.454508','d4edb5349f2b4624a4044062c434f872'),(178,'text','gd',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:42.638327','ee9404a527534878b7f029a11cd16f77'),(179,'text','g',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:42.772965','f0022f66f63c4a49800a64d413b5d08c'),(180,'text','dg',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:42.937695','7d897a63face4da2be9e1309d572247a'),(181,'text','g',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:43.097900','5993063918a3433a9f61f1e65f9eb660'),(182,'text','dg',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:43.258841','cf6aae59819f41a28a7129ffba884998'),(183,'text','g',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:43.406491','db99b07cd32e4547bfc943fa15de0ed5'),(184,'text','g',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:43.414813','a594249fd74d4d9a947ef8d9273dde0c'),(185,'text','g',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:43.578693','2c44effb75d9401fb3987c1e16f3d5c9'),(186,'text','g',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:43.717163','04c4943bc25f42a0a916f4c9aaf7345a'),(187,'text','dg',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:43.880952','82394295fcdc440a93f5079624ef68a1'),(188,'text','f',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:44.043731','e49e15d2edd74f3db5aef2123a50c5a7'),(189,'text','fg',NULL,'',NULL,NULL,NULL,'2025-12-16 05:36:45.627188','e4dc2a6fd80f4dfd8378ea2b34f32182'),(190,'text','Sekirnoq please',NULL,'',NULL,NULL,NULL,'2025-12-16 05:37:01.100480','eef15b2e35a942a6a6b98c6d7541663f'),(191,'text','bualdimi',NULL,'',NULL,NULL,NULL,'2025-12-16 05:37:11.449826','71e6390411e44c21af84c6024947379a'),(192,'text','Bumaydimi',NULL,'',NULL,NULL,NULL,'2025-12-16 05:37:18.090045','aa5a054ed9684c9cbfa5ad43b162833a'),(193,'text','Menga Tuman hokimi kerak iltimos tuman hokimiga ulab bering',NULL,'',NULL,NULL,NULL,'2025-12-16 05:39:34.154904','9f652bfedab84db585fc299d8fcbc25f'),(194,'text','Menga Tuman hokimi kerak iltimos tuman hokimiga ulab bering',NULL,'',NULL,NULL,NULL,'2025-12-16 06:18:21.550649','86ce3355560a4e09aa286cc4cff8d6ca'),(195,'text','Menga Tuman hokimi kerak iltimos tuman hokimiga ulab bering',NULL,'',NULL,NULL,NULL,'2025-12-16 06:19:18.417962','2e41ffd797c4416a98d69c1b88a706bf'),(196,'text','Menga Tuman hokimi kerak iltimos tuman hokimiga ulab bering',NULL,'',NULL,NULL,NULL,'2025-12-16 06:22:29.862440','8ab77ea8dcde4418a4038b04c7979332'),(197,'text','Menga Tuman hokimi kerak iltimos tuman hokimiga ulab bering',NULL,'',NULL,NULL,NULL,'2025-12-16 06:24:43.781319','e51eeaead937443dafd9c48860bfb4d1'),(198,'text','Menga Tuman hokimi kerak iltimos tuman hokimiga ulab bering',NULL,'',NULL,NULL,NULL,'2025-12-16 06:39:28.275795','2cbaf82437f4474886caee40c9956486'),(199,'text','Menga Tuman hokimi kerak iltimos tuman hokimiga ulab bering',NULL,'',NULL,NULL,NULL,'2025-12-16 06:40:37.166238','47c42282ee8540509cefdfaf3af7f1e1'),(200,'text','Menga Tuman hokimi kerak iltimos tuman hokimiga ulab bering',NULL,'',NULL,NULL,NULL,'2025-12-16 12:07:33.368083','7f10cabbd5bf4c648e093b51561a5856'),(201,'text','Menga Tuman hokimi kerak iltimos tuman hokimiga ulab bering',NULL,'',NULL,NULL,NULL,'2025-12-16 12:10:00.493150','ff98385573f44a2bbde0407b26dc51be'),(202,'text','Hello',NULL,'',NULL,NULL,NULL,'2025-12-16 12:10:30.548434','356a7a9fbd1747d6956e16066b8ab4c4'),(203,'text','Menga Tuman hokimi kerak iltimos tuman hokimiga ulab bering',NULL,'',NULL,NULL,NULL,'2025-12-16 14:58:46.104127','02766bfebaeb40e8b1112322400b5687'),(204,'text','Menga Tuman hokimi kerak iltimos tuman hokimiga ulab bering',NULL,'',NULL,NULL,NULL,'2025-12-16 15:01:42.656807','27ce2351d8d54654be58926a6c9938da'),(205,'text','Menga Tuman hokimi kerak iltimos tuman hokimiga ulab bering',NULL,'',NULL,NULL,NULL,'2025-12-16 15:10:40.332887','ddc61c183b3d408d8f67c307b923e3b3');
/*!40000 ALTER TABLE `message_app_messagecontent` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message_app_session`
--

DROP TABLE IF EXISTS `message_app_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_app_session` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `session_uuid` char(32) NOT NULL,
  `status` varchar(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `closed_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `assigned_department_id` bigint DEFAULT NULL,
  `assigned_staff_uuid` char(32) DEFAULT NULL,
  `citizen_uuid` char(32) NOT NULL,
  `origin` varchar(16) NOT NULL,
  `is_hold` tinyint(1) NOT NULL,
  `last_messaged` datetime(6) DEFAULT NULL,
  `sla_breached` tinyint(1) NOT NULL,
  `sla_deadline` datetime(6) DEFAULT NULL,
  `assigned_at` datetime(6) DEFAULT NULL,
  `description` longtext,
  `intent_label` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_uuid` (`session_uuid`),
  KEY `message_app_session_assigned_department__be1a2fd2_fk_departmen` (`assigned_department_id`),
  KEY `message_app_session_assigned_staff_uuid_a29e1c5c_fk_users_use` (`assigned_staff_uuid`),
  KEY `message_app_session_citizen_uuid_922a513c_fk_users_use` (`citizen_uuid`),
  CONSTRAINT `message_app_session_assigned_department__be1a2fd2_fk_departmen` FOREIGN KEY (`assigned_department_id`) REFERENCES `departments_department` (`id`),
  CONSTRAINT `message_app_session_assigned_staff_uuid_a29e1c5c_fk_users_use` FOREIGN KEY (`assigned_staff_uuid`) REFERENCES `users_user` (`user_uuid`),
  CONSTRAINT `message_app_session_citizen_uuid_922a513c_fk_users_use` FOREIGN KEY (`citizen_uuid`) REFERENCES `users_user` (`user_uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=18464 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_app_session`
--

LOCK TABLES `message_app_session` WRITE;
/*!40000 ALTER TABLE `message_app_session` DISABLE KEYS */;
INSERT INTO `message_app_session` VALUES (18450,'3ee7e57415b04581a47c03689801f352','closed','2025-12-15 16:06:01.795031','2025-12-16 05:24:03.500938',0,NULL,1,'1128cf47706b4b8fb4c52407911c377d','66d21bb67ce748aabb1e5300f688eaf7','telegram',0,'2025-12-16 05:01:26.589767',0,'2025-12-18 16:07:10.452713','2025-12-15 16:07:10.452713',NULL,'Auto-detected'),(18451,'6b506db8e930474c9553f57149bc2ced','closed','2025-12-16 05:25:03.556583','2025-12-16 05:37:59.266779',0,NULL,1,'1128cf47706b4b8fb4c52407911c377d','66d21bb67ce748aabb1e5300f688eaf7','telegram',0,'2025-12-16 05:37:18.090045',0,'2025-12-19 05:25:45.523230','2025-12-16 05:25:45.523230',NULL,'Auto-detected'),(18452,'37259581da5e48cf98b5e4151f48119e','closed','2025-12-16 05:39:34.142635','2025-12-16 06:17:13.984373',0,NULL,1,'1128cf47706b4b8fb4c52407911c377d','66d21bb67ce748aabb1e5300f688eaf7','telegram',0,NULL,0,'2025-12-19 06:17:11.196068','2025-12-16 06:17:11.196068',NULL,'Auto-detected'),(18453,'4eab0087959a4d9ca12dcbb91f9ae27a','closed','2025-12-16 06:18:21.527716','2025-12-16 06:18:57.122102',0,NULL,1,'1128cf47706b4b8fb4c52407911c377d','66d21bb67ce748aabb1e5300f688eaf7','telegram',0,NULL,0,'2025-12-19 06:18:50.615540','2025-12-16 06:18:50.615540',NULL,'Auto-detected'),(18454,'40007e8c6a5d48f68e58a5d93c8ab7d0','closed','2025-12-16 06:19:18.415297','2025-12-16 06:22:20.358505',0,NULL,1,'1128cf47706b4b8fb4c52407911c377d','66d21bb67ce748aabb1e5300f688eaf7','telegram',0,NULL,0,'2025-12-19 06:22:13.531499','2025-12-16 06:22:13.531499',NULL,'Auto-detected'),(18455,'b300e50811734aada062986b7598d5ee','closed','2025-12-16 06:22:29.856992','2025-12-16 06:22:54.383751',0,NULL,1,'1128cf47706b4b8fb4c52407911c377d','66d21bb67ce748aabb1e5300f688eaf7','telegram',0,NULL,0,'2025-12-19 06:22:51.609629','2025-12-16 06:22:51.609629',NULL,'Auto-detected'),(18456,'cf9ea7bc528f47bd8489bf9226085e6f','closed','2025-12-16 06:24:43.770934','2025-12-16 06:39:08.067546',0,NULL,1,'1128cf47706b4b8fb4c52407911c377d','66d21bb67ce748aabb1e5300f688eaf7','telegram',0,NULL,0,'2025-12-19 06:39:03.899877','2025-12-16 06:39:03.899877',NULL,'Auto-detected'),(18457,'eab13631a590429199f0ce973624594a','closed','2025-12-16 06:39:28.244370','2025-12-16 06:40:06.274552',0,NULL,1,'1128cf47706b4b8fb4c52407911c377d','66d21bb67ce748aabb1e5300f688eaf7','telegram',0,NULL,0,'2025-12-19 06:39:55.465658','2025-12-16 06:39:55.465658',NULL,'Auto-detected'),(18458,'00b481b07fb74b1a9a46f4d7f82961ac','closed','2025-12-16 06:40:37.150581','2025-12-16 06:51:01.053347',0,NULL,1,'1128cf47706b4b8fb4c52407911c377d','66d21bb67ce748aabb1e5300f688eaf7','telegram',0,NULL,0,'2025-12-19 06:45:50.585694','2025-12-16 06:45:50.585694',NULL,'Auto-detected'),(18459,'4ec7ec1179fd47f7a2e3700b8d3088bc','closed','2025-12-16 12:07:33.347631','2025-12-16 12:09:28.958413',0,NULL,1,'1128cf47706b4b8fb4c52407911c377d','66d21bb67ce748aabb1e5300f688eaf7','telegram',0,NULL,0,'2025-12-19 12:09:00.195436','2025-12-16 12:09:00.195436',NULL,'Auto-detected'),(18460,'005dbc6e760a42219fe9c5ef155d1c3f','closed','2025-12-16 12:10:00.480061','2025-12-16 12:10:59.761305',0,NULL,1,'1128cf47706b4b8fb4c52407911c377d','66d21bb67ce748aabb1e5300f688eaf7','telegram',0,'2025-12-16 12:10:30.550713',0,'2025-12-19 12:10:17.781461','2025-12-16 12:10:17.781461',NULL,'Auto-detected'),(18461,'f87607bf0f714667a25fd5ed1d7239d6','closed','2025-12-16 14:58:46.073534','2025-12-16 15:01:26.365976',0,NULL,1,'1128cf47706b4b8fb4c52407911c377d','66d21bb67ce748aabb1e5300f688eaf7','telegram',0,NULL,0,'2025-12-19 14:59:19.258668','2025-12-16 14:59:19.258668',NULL,'Auto-detected'),(18462,'f646881ebe7c4b55946df98f11ae503b','closed','2025-12-16 15:01:42.614927','2025-12-16 15:10:08.712575',0,NULL,1,'1128cf47706b4b8fb4c52407911c377d','66d21bb67ce748aabb1e5300f688eaf7','telegram',0,NULL,0,'2025-12-19 15:02:05.666083','2025-12-16 15:02:05.666083',NULL,'Auto-detected'),(18463,'7f0465e3529e46288736245dafe52f60','unassigned','2025-12-16 15:10:40.302681',NULL,0,NULL,1,NULL,'66d21bb67ce748aabb1e5300f688eaf7','telegram',0,NULL,0,NULL,NULL,NULL,'Auto-detected');
/*!40000 ALTER TABLE `message_app_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_tools_neighborhood`
--

DROP TABLE IF EXISTS `support_tools_neighborhood`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `support_tools_neighborhood` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name_uz` varchar(128) NOT NULL,
  `name_ru` varchar(128) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `support_tools_neighborhood_name_uz_5471a711` (`name_uz`),
  KEY `support_too_name_uz_cac152_idx` (`name_uz`)
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_tools_neighborhood`
--

LOCK TABLES `support_tools_neighborhood` WRITE;
/*!40000 ALTER TABLE `support_tools_neighborhood` DISABLE KEYS */;
INSERT INTO `support_tools_neighborhood` VALUES (1,'Dedan','Дедан',1,'2025-12-15 16:53:18.000000'),(2,'Do‘stlik','Дустлик',1,'2025-12-15 16:53:18.000000'),(3,'Iymon','Иймон',1,'2025-12-15 16:53:18.000000'),(4,'Ipak yo‘li','Ипак йули',1,'2025-12-15 16:53:18.000000'),(5,'Istiqlol','Истиклол',1,'2025-12-15 16:53:18.000000'),(6,'Qoziyoqli','Козиёкли',1,'2025-12-15 16:53:18.000000'),(7,'Qozikent','Козикент',1,'2025-12-15 16:53:18.000000'),(8,'Mustaqillik','Мустакиллик',1,'2025-12-15 16:53:18.000000'),(9,'Navro‘z','Навруз',1,'2025-12-15 16:53:18.000000'),(10,'No‘g‘ay','Нугай',1,'2025-12-15 16:53:18.000000'),(11,'Olti o‘g‘il','Олти угил',1,'2025-12-15 16:53:18.000000'),(12,'Salovat','Саловат',1,'2025-12-15 16:53:18.000000'),(13,'Sarbozor','Сарбозор',1,'2025-12-15 16:53:18.000000'),(14,'Tortuvli','Тортувли',1,'2025-12-15 16:53:18.000000'),(15,'Turon','Турон',1,'2025-12-15 16:53:18.000000'),(16,'O‘zbekiston','Узбекистон',1,'2025-12-15 16:53:18.000000'),(17,'Umid','Умид',1,'2025-12-15 16:53:18.000000'),(18,'Yangiariq','Янгиарик',1,'2025-12-15 16:53:18.000000'),(19,'Beklar','Беклар',1,'2025-12-15 16:53:18.000000'),(20,'Birlik','Бирлик',1,'2025-12-15 16:53:18.000000'),(21,'Obi hayot','Оби хаёт',1,'2025-12-15 16:53:18.000000'),(22,'Ravot Olchin','Равот Олчин',1,'2025-12-15 16:53:18.000000'),(23,'Sohibkor','Сохибкор',1,'2025-12-15 16:53:18.000000'),(24,'Tepaqo‘rg‘on','Тепакурган',1,'2025-12-15 16:53:18.000000'),(25,'O‘zbekkenti','Узбеккенти',1,'2025-12-15 16:53:18.000000'),(26,'Xo‘jakarzon','Хужакарзон',1,'2025-12-15 16:53:18.000000'),(27,'Haqiqat','Хакикат',1,'2025-12-15 16:53:18.000000'),(28,'Charxin','Чархин',1,'2025-12-15 16:53:18.000000'),(29,'Chorbog‘','Чорбог',1,'2025-12-15 16:53:18.000000'),(30,'Toshko‘prik','Тошкуприк',1,'2025-12-15 16:53:18.000000'),(31,'Xo‘jaqo‘rg‘on','Хужакурган',1,'2025-12-15 16:53:18.000000'),(32,'Oq-oltin','Ок-олтин',1,'2025-12-15 16:53:18.000000'),(33,'A. Temur','А. Темур',1,'2025-12-15 16:53:18.000000'),(34,'Bo‘ston','Бустон',1,'2025-12-15 16:53:18.000000'),(35,'Guliston','Гулистон',1,'2025-12-15 16:53:18.000000'),(36,'Islomoobod','Исломобод',1,'2025-12-15 16:53:18.000000'),(37,'Tinchlik','Тинчлик',1,'2025-12-15 16:53:18.000000'),(38,'Yangiobod','Янгиобод',1,'2025-12-15 16:53:18.000000'),(39,'Muqimiy','Мукимий',1,'2025-12-15 16:53:18.000000'),(40,'Xalqobod','Халкобод',1,'2025-12-15 16:53:18.000000'),(41,'Ahillik','Ахиллик',1,'2025-12-15 16:53:18.000000'),(42,'Oqto‘sh','Октуш',1,'2025-12-15 16:53:18.000000'),(43,'Islom Shoir','Ислом Шоир',1,'2025-12-15 16:53:18.000000'),(44,'Barkamol','Баркамол',1,'2025-12-15 16:53:18.000000'),(45,'Bolg‘ali','Болгали',1,'2025-12-15 16:53:18.000000'),(46,'Mang‘it','Мангит',1,'2025-12-15 16:53:18.000000'),(47,'Mushkent','Мушкент',1,'2025-12-15 16:53:18.000000'),(48,'Narpay','Нарпай',1,'2025-12-15 16:53:18.000000'),(49,'No‘garaxona','Нугарахона',1,'2025-12-15 16:53:18.000000'),(50,'Tepa','Тепа',1,'2025-12-15 16:53:18.000000'),(51,'Totkent','Тоткент',1,'2025-12-15 16:53:18.000000'),(52,'Chaykal','Чайкал',1,'2025-12-15 16:53:18.000000'),(53,'Ko‘k-ota','Кук-ота',1,'2025-12-15 16:53:18.000000');
/*!40000 ALTER TABLE `support_tools_neighborhood` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_tools_quickreply`
--

DROP TABLE IF EXISTS `support_tools_quickreply`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `support_tools_quickreply` (
  `id` int NOT NULL AUTO_INCREMENT,
  `text` varchar(500) NOT NULL,
  `order` int unsigned NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `support_tools_quickreply_chk_1` CHECK ((`order` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_tools_quickreply`
--

LOCK TABLES `support_tools_quickreply` WRITE;
/*!40000 ALTER TABLE `support_tools_quickreply` DISABLE KEYS */;
INSERT INTO `support_tools_quickreply` VALUES (1,'Assalomu alaykum!',0,NULL,'2025-12-11 03:46:32.681846'),(2,'Murojaatingiz qabul qilindi.',1,NULL,'2025-12-11 03:46:32.688231'),(3,'Iltimos, batafsil yozing.',2,NULL,'2025-12-11 03:46:32.694387'),(4,'Tez orada javob beramiz.',3,NULL,'2025-12-11 03:46:32.699175');
/*!40000 ALTER TABLE `support_tools_quickreply` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_telegramconnection`
--

DROP TABLE IF EXISTS `users_telegramconnection`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_telegramconnection` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `telegram_chat_id` bigint NOT NULL,
  `telegram_username` varchar(128) DEFAULT NULL,
  `is_bot` tinyint(1) NOT NULL,
  `language_preference` varchar(2) NOT NULL,
  `last_interaction` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `telegram_chat_id` (`telegram_chat_id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `users_telegramconnection_user_id_51d23751_fk_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_telegramconnection`
--

LOCK TABLES `users_telegramconnection` WRITE;
/*!40000 ALTER TABLE `users_telegramconnection` DISABLE KEYS */;
INSERT INTO `users_telegramconnection` VALUES (6,5991965874,'nathan_2net',0,'uz',NULL,'2025-12-15 12:22:17.137361','2025-12-16 15:38:36.884568',95),(7,8173430016,'Islam_0113',0,'uz',NULL,'2025-12-15 15:29:29.703437','2025-12-15 15:29:29.703437',97),(8,8530274619,NULL,0,'uz',NULL,'2025-12-15 15:37:33.941163','2025-12-15 15:37:33.941163',98);
/*!40000 ALTER TABLE `users_telegramconnection` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_user`
--

DROP TABLE IF EXISTS `users_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_user` (
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_uuid` char(32) NOT NULL,
  `phone_number` varchar(32) NOT NULL,
  `email` varchar(254) DEFAULT NULL,
  `full_name` varchar(128) DEFAULT NULL,
  `neighborhood_id` varchar(128) DEFAULT NULL,
  `location` varchar(256) DEFAULT NULL,
  `notes` longtext,
  `is_active` tinyint(1) NOT NULL,
  `is_verified` tinyint(1) NOT NULL,
  `is_operator` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `avatar` varchar(100) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_uuid` (`user_uuid`),
  UNIQUE KEY `phone_number` (`phone_number`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_user`
--

LOCK TABLES `users_user` WRITE;
/*!40000 ALTER TABLE `users_user` DISABLE KEYS */;
INSERT INTO `users_user` VALUES ('',NULL,0,95,'66d21bb67ce748aabb1e5300f688eaf7','+998997521832',NULL,'Davlat Eshnazarov','41','chilonzor 22',NULL,1,0,0,'2025-12-15 12:22:17.101167','2025-12-15 12:22:17.101167','','M'),('pbkdf2_sha256$1000000$rlPglZGyE8r3GVeQm4t6qc$mGbv2/L8MESH6q9ODTCYGv1uDvzvFeYNwXuta9aVslE=','2025-12-16 16:32:05.376845',1,96,'1128cf47706b4b8fb4c52407911c377d','997521832','zarinowasaxs@gmail.com','Nathan Allard',NULL,NULL,'',1,1,1,'2025-12-15 13:51:42.319763','2025-12-16 15:01:15.354809','','U'),('',NULL,0,97,'ee0f1b53171e4b548b539d6a5d5fe2fe','+998976281380',NULL,'Abdulloh',NULL,'Bog kochasi 13 uy',NULL,1,0,0,'2025-12-15 15:29:29.693285','2025-12-15 15:29:29.693285','','U'),('',NULL,0,98,'eaf16d27fecb421dbbca8894a87ef5cc','+998878881380',NULL,'Abdulloh','41','Ahillik 13',NULL,1,0,0,'2025-12-15 15:37:33.941066','2025-12-15 15:37:33.941066','','U'),('pbkdf2_sha256$1000000$NQO8ZCWd5y6hohrZQ6QQQ8$9TwRPZQPIQCjp+um4WW6cnrDkc68/MS1z3320drdUbg=','2025-12-15 15:45:43.267038',0,99,'a9d4deb4381e43099c23d68f76d2475d','976281380',NULL,NULL,NULL,NULL,NULL,1,0,0,'2025-12-15 15:44:07.060573','2025-12-15 15:44:07.060573','',NULL);
/*!40000 ALTER TABLE `users_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_user_groups`
--

DROP TABLE IF EXISTS `users_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_user_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_user_groups_user_id_group_id_b88eab82_uniq` (`user_id`,`group_id`),
  KEY `users_user_groups_group_id_9afc8d0e_fk_auth_group_id` (`group_id`),
  CONSTRAINT `users_user_groups_group_id_9afc8d0e_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `users_user_groups_user_id_5f6f5a90_fk_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_user_groups`
--

LOCK TABLES `users_user_groups` WRITE;
/*!40000 ALTER TABLE `users_user_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `users_user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_user_user_permissions`
--

DROP TABLE IF EXISTS `users_user_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_user_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_user_user_permissions_user_id_permission_id_43338c45_uniq` (`user_id`,`permission_id`),
  KEY `users_user_user_perm_permission_id_0b93982e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `users_user_user_perm_permission_id_0b93982e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `users_user_user_permissions_user_id_20aca447_fk_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_user_user_permissions`
--

LOCK TABLES `users_user_user_permissions` WRITE;
/*!40000 ALTER TABLE `users_user_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `users_user_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'gov_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-16 21:59:15
