CREATE DATABASE IF NOT EXISTS zetech_event_system;

USE zetech_event_system;

CREATE TABLE IF NOT EXISTS student_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  admission_number VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  status ENUM('active', 'deleted') DEFAULT 'active',
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'club_leader') DEFAULT 'admin',
  name VARCHAR(100) NULL,
  club VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  max_participants INT,
  image_url VARCHAR(500),
  status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admins(id)
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  student_id INT NOT NULL,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('registered', 'attended', 'cancelled') DEFAULT 'registered',
  UNIQUE KEY unique_registration (event_id, student_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES student_registrations(id) ON DELETE CASCADE
);

-- Seed default admin (password will be upgraded on first login)
INSERT INTO admins (email, password, role, name)
VALUES ('admin@zetech.ac.ke', 'admin123', 'admin', 'Admin User')
ON DUPLICATE KEY UPDATE role = VALUES(role), name = COALESCE(admins.name, VALUES(name));

-- Migrations for existing databases (safe to run multiple times)
ALTER TABLE admins ADD COLUMN IF NOT EXISTS role ENUM('admin', 'club_leader') DEFAULT 'admin';
ALTER TABLE admins ADD COLUMN IF NOT EXISTS name VARCHAR(100) NULL;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS club VARCHAR(100) NULL;
ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL;
