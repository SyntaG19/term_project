SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS room_alloc_zones;
DROP TABLE IF EXISTS batches;
DROP TABLE IF EXISTS roommates;
DROP TABLE IF EXISTS room;
DROP TABLE IF EXISTS student;
DROP TABLE IF EXISTS administrator;
DROP TABLE IF EXISTS hostel;

SET FOREIGN_KEY_CHECKS = 1;

CREATE DATABASE IF NOT EXISTS iitjammu_hostel;
USE iitjammu_hostel;

CREATE TABLE hostel (
    hostel_id INT AUTO_INCREMENT PRIMARY KEY,
    hostel_name VARCHAR(50) UNIQUE NOT NULL,
    gender ENUM('Male', 'Female', 'Other'),
    year_allocated INT NOT NULL,
    occupancy_type ENUM('Single', 'Double') NOT NULL,
    total_rooms INT
);

CREATE TABLE administrator (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(15),
    email VARCHAR(100) UNIQUE,
    hostel_id INT NOT NULL,
    FOREIGN KEY (hostel_id) REFERENCES hostel(hostel_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE batches (
    batch_id VARCHAR(50) PRIMARY KEY,
    batch_name VARCHAR(50) UNIQUE NOT NULL,
    program ENUM('UG', 'MTech', 'PhD', 'Guest', 'Other') DEFAULT 'UG',
    year_of_study INT NULL,
    remarks VARCHAR(100)
);

CREATE TABLE student (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    roll_no VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    department VARCHAR(50),
    phone VARCHAR(15),
    email VARCHAR(100),
    rm_key INT DEFAULT 0,
    status ENUM('Active', 'Graduated', 'Left') DEFAULT 'Active',
    hostel_id INT NOT NULL,
    batch_id VARCHAR(50),
    FOREIGN KEY (hostel_id) REFERENCES hostel(hostel_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(batch_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE room (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    hostel_id INT NOT NULL,
    phase VARCHAR(5),
    wing_code VARCHAR(10),
    floor_no INT,
    room_no VARCHAR(10) NOT NULL,
    bed_id ENUM('A1', 'B1') DEFAULT 'A1',
    allotted_to INT NULL,
    UNIQUE(hostel_id, room_no, bed_id),
    FOREIGN KEY (hostel_id) REFERENCES hostel(hostel_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (allotted_to) REFERENCES student(student_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE roommates (
    rm_key INT PRIMARY KEY,
    student1_id INT NOT NULL,
    student2_id INT NULL,
    FOREIGN KEY (student1_id) REFERENCES student(student_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (student2_id) REFERENCES student(student_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE room_alloc_zones (
    zone_id INT AUTO_INCREMENT PRIMARY KEY,
    hostel_id INT NOT NULL,
    batch_id VARCHAR(50) NOT NULL,
    start_room_no VARCHAR(10) NOT NULL,
    end_room_no VARCHAR(10) NOT NULL,
    remarks VARCHAR(100),
    FOREIGN KEY (hostel_id) REFERENCES hostel(hostel_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(batch_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);
