CREATE DATABASE IF NOT EXISTS noteapp;

USE noteapp;

CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  dueDate DATE,
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium'
);

CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  startDate DATETIME,
  endDate DATETIME,
  location VARCHAR(255)
);
