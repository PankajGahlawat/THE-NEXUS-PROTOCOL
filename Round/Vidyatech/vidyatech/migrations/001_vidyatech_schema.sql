-- Vidyatech University Portal - PostgreSQL Schema
-- Database: vidyatech

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    roll_no TEXT UNIQUE,
    name TEXT,
    email TEXT,
    password TEXT,
    branch TEXT,
    year INTEGER,
    cgpa REAL,
    phone TEXT
);

CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    emp_id TEXT UNIQUE,
    name TEXT,
    email TEXT,
    password TEXT,
    department TEXT,
    role TEXT DEFAULT 'faculty'
);

CREATE TABLE IF NOT EXISTS notices (
    id SERIAL PRIMARY KEY,
    title TEXT,
    content TEXT,
    posted_by TEXT,
    posted_on TEXT,
    category TEXT
);

CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    student_id INTEGER,
    roll_no TEXT,
    subject TEXT,
    marks INTEGER,
    grade TEXT,
    semester INTEGER
);

CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER,
    subject TEXT,
    filename TEXT,
    submitted_on TEXT
);

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title TEXT,
    description TEXT,
    date TEXT,
    venue TEXT,
    organizer TEXT
);

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT
);

-- Seed data
INSERT INTO admins (username, password) VALUES ('admin', 'admin@123') ON CONFLICT DO NOTHING;

INSERT INTO staff (emp_id, name, email, password, department, role) VALUES
    ('FAC001','Dr. Ramesh Patel','r.patel@vidyatech.edu','admin123','Computer Science','admin'),
    ('FAC002','Prof. Sunita Sharma','s.sharma@vidyatech.edu','faculty2024','Electronics','faculty'),
    ('FAC003','Dr. Anjali Mehta','a.mehta@vidyatech.edu','anjali@123','Mechanical','faculty'),
    ('FAC004','Prof. Kiran Joshi','k.joshi@vidyatech.edu','kiran2024','Civil','faculty')
ON CONFLICT DO NOTHING;

INSERT INTO students (roll_no, name, email, password, branch, year, cgpa, phone) VALUES
    ('VTU2021001','Arjun Sharma','arjun@student.vidyatech.edu','arjun123','CSE',3,8.4,'9876543210'),
    ('VTU2021002','Priya Nair','priya@student.vidyatech.edu','priya456','ECE',3,7.9,'9876543211'),
    ('VTU2021003','Rahul Verma','rahul@student.vidyatech.edu','rahul789','MECH',3,6.5,'9876543212'),
    ('VTU2021004','Sneha Patel','sneha@student.vidyatech.edu','sneha321','CIVIL',3,9.1,'9876543213'),
    ('VTU2022001','Dev Joshi','dev@student.vidyatech.edu','dev2022','CSE',2,7.2,'9876543214')
ON CONFLICT DO NOTHING;

INSERT INTO results (student_id, roll_no, subject, marks, grade, semester) VALUES
    (1,'VTU2021001','Data Structures',88,'A',5),
    (1,'VTU2021001','Computer Networks',76,'B',5),
    (2,'VTU2021002','Signals & Systems',91,'O',5),
    (3,'VTU2021003','Thermodynamics',62,'C',5),
    (4,'VTU2021004','Structural Analysis',95,'O',5),
    (5,'VTU2022001','Programming in C',80,'A',3)
ON CONFLICT DO NOTHING;

INSERT INTO notices (title, content, posted_by, posted_on, category) VALUES
    ('Semester Exam Schedule Released','The timetable for 5th and 6th semester examinations has been published.','Dr. Ramesh Patel','2024-01-10','Examination'),
    ('Hackathon 2024 — Registrations Open','Annual inter-college hackathon registrations are now open.','Prof. Sunita Sharma','2024-01-12','Events'),
    ('Library Timing Change','Library will remain open till 10 PM during exam season.','Admin','2024-01-14','General'),
    ('Placement Drive — Infosys','Infosys campus recruitment drive scheduled for Jan 28.','Placement Cell','2024-01-15','Placement')
ON CONFLICT DO NOTHING;

INSERT INTO events (title, description, date, venue, organizer) VALUES
    ('Hackathon 2024','24-hour coding competition open to all branches.','2024-02-10','Innovation Lab, Block C','CSE Department'),
    ('Tech Symposium','Annual technical symposium featuring guest lectures.','2024-02-20','Auditorium','Principal Office'),
    ('Sports Week','Inter-branch sports competition.','2024-03-01','Sports Ground','Sports Committee')
ON CONFLICT DO NOTHING;
