CREATE DATABASE IF NOT EXISTS studentsdb;

CREATE TABLE IF NOT EXISTS students (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_students_email (email)
);

INSERT IGNORE INTO students (name, email) VALUES
    ('Asha Rao', 'asha.rao@example.com'),
    ('Daniel Kim', 'daniel.kim@example.com'),
    ('Maya Singh', 'maya.singh@example.com');
