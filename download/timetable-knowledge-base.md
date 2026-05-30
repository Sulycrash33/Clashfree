# Timetable Generator Knowledge Base

## 1. Real Exam Timetable Structures Analyzed

### 1.1 Al-Qalam University Katsina (Draft 2nd Sem 25/26)

**Time Slots Per Day:**
- Morning: 08:00 AM - 11:00 AM (3 hours)
- Afternoon: 11:00 AM - 1:00 PM (2 hours)
- Evening: 2:00 PM - 4:00 PM (2 hours)

**Venue Types:**
- MPH (Multi-Purpose Hall) - Large capacity
- BLOCK A-J - Medium halls
- AGH - Assembly Hall
- NBU1, NBU2 - New Block Upper
- NBD1, NBD2 - New Block Down
- MLK - Mallam Hall
- NH1-NH6 - New Halls
- OUT Hall - Overflow venue

**Course Code Patterns:**
- Education: EDU, LIS, SED
- Sciences: CSC, MTH, PHY, CHM, BIO, STA, MCB, BCH, GLT
- Arts: ARA, ISL, ALA, ALH, LIT, HAU, SHA, ENG
- Social Sciences: SSC, POL, SOC, ECO, ACC, BUS, BUA
- Health: HEE, EHO, NUT

**Key Observations:**
- Saturday is a regular exam day
- Multiple courses can share a venue (e.g., "EDU3222, LIS222")
- Invigilators assigned by ID numbers in brackets
- CO (Carry-over) courses explicitly marked (e.g., "CSC3221 (CO)")
- Split venues for large courses (e.g., "NH3 and NH4 ENG4326")

---

### 1.2 Niger State Polytechnic Zungeru (1st Sem 25/26)

**Time Slots:**
- Single slot: 8:30 AM - 11:30 AM (3 hours)

**Venue Naming Convention:**
- RS - Resource Centre
- S.COMPLEX DF RM XX - Science Complex Down Floor Room XX
- P.COMPLEX DF RM XX - Provost Complex Down Floor Room XX
- CS.COMPLEX UF RM XX - Computer Science Complex Upper Floor Room XX
- AUDITORIUM - Main auditorium

**Program Codes:**
- HNDMB - HND Microbiology
- HNDB - HND Biology
- HNDBCH - HND Biochemistry
- HNDPE - HND Petroleum Engineering
- HNDCHE - HND Chemical Engineering
- HNDSWD - HND Software Development
- HNDNCC - HND Network & Cloud Computing
- HNDCS - HND Computer Science
- HNDST - HND Statistics
- NDSLT - ND Science Lab Technology
- NDCS - ND Computer Science

**Course Structure:**
- GNS 301, GNS 311, GNS 321 - General Studies
- STM, STB, STH - Statistics/Mathematics courses
- PYE - Petroleum Engineering courses
- STC - Chemistry courses
- AIT, NCC, COM, STA - Computing courses
- GLT, BAM - General courses

---

## 2. System UI Design Patterns (From Images)

### 2.1 Landing Page (ClashFree/EduSchedule)
- Hero section with tagline
- Role selection cards: SA, IA, TO, LC, ST
- Institution type support badges
- "Get started free" / "Request demo" CTAs

### 2.2 Super Admin Dashboard
- Platform metrics: Institutions, Users, Timetables generated, Unresolved clashes
- Institution registry table with status
- Platform alerts (blocked generation, pending approvals)
- System health monitor
- Recent activity log

### 2.3 Institution Admin Dashboard
- Institution context: Name, Type, Location, Session
- Overview: Faculties, Departments, Students, Courses
- Setup checklist with progress
- Scheduling status cards (Exam/Lecture timetable)
- Recent activity

### 2.4 Faculty Dashboard (Applied Sciences - NSUK)
- Faculty overview: Courses, Students, Lecturers, Departments
- Data readiness indicators
- Navigation sidebar: Overview, Courses, Lecturers, Students, Rooms, Exam timetable, Lecture timetable, Conflicts, Reports
- CO students count prominently displayed

### 2.5 Exam Timetable Preview
- Day columns with time slots
- Course cards showing: Course code, Level, CO status
- Validation status badge (PASSED, conflicts count)
- Publish button

---

## 3. Constraint Engine Knowledge

### 3.1 Hard Constraints (MUST NOT BREAK)
1. No student double-booked (same student in two exams at same time)
2. No lecturer double-booked (teaching/invigilating two exams at same time)
3. No room double-booked (two exams in same venue at same time)
4. Room capacity >= student enrollment
5. Lab courses must be in lab rooms
6. Invigilator must be available at assigned time

### 3.2 Soft Constraints (OPTIMIZE)
1. Spread exams across days (avoid 3 exams in one day for student)
2. Respect lecturer availability preferences
3. Balanced invigilation workload
4. No early morning exams on Monday (optional)
5. Avoid back-to-back exams for same student

### 3.3 Carry-Over (CO) Handling
- CO students have courses from multiple levels
- System must pull full registered course list per student
- CO courses must NOT clash with current level courses
- CO status displayed clearly on timetable

---

## 4. Data Model Requirements

### 4.1 Core Entities

```
Institution
├── name, type (federal/state/private/poly/college), location
├── session (e.g., "2025/2026"), semester
└── admin_users[]

Faculty
├── institution_id
├── name, code
└── departments[]

Department
├── faculty_id
├── name, code
└── courses[], students[], lecturers[]

Course
├── code, name, credit_units
├── level (100-600)
├── department_id
├── lecturer_id
├── is_shared (service course)
├── requires_lab
└── student_enrollment[]

Room
├── code, name, capacity
├── type (lecture_hall/lab/classroom/auditorium)
├── building
└── faculty_id (optional, for faculty-specific rooms)

Student
├── reg_number, name
├── level, department_id
├── registered_courses[]
└── carry_over_courses[]

Lecturer
├── staff_id, name, email
├── department_id
├── courses[]
├── unavailable_days[]
└── unavailable_times[]

ExamSlot
├── date, day, time_start, time_end
├── course_id
├── room_id
└── invigilators[]

InvigilatorAssignment
├── exam_slot_id
├── lecturer_id
└── role (chief/assistant)
```

### 4.2 Generation Process

1. **Data Validation Phase**
   - All courses have assigned lecturers
   - All rooms have capacity defined
   - Student registrations imported
   - CO registrations confirmed
   - No orphaned data

2. **Priority Scheduling**
   - GST/Shared courses first (widest impact)
   - Large enrollment courses next (need big venues)
   - CO-aware scheduling (check each student's full course list)
   - Remaining courses by department

3. **Conflict Detection**
   - Student-clash matrix
   - Lecturer-clash matrix
   - Room-clash matrix
   - CO-clash detection

4. **Post-Generation**
   - Conflict report
   - Unresolved issues flagged
   - Admin approval workflow
   - Version control

---

## 5. Nigerian University Specifics

### 5.1 Exam Period Structure
- Duration: 2-4 weeks typical
- Days: Monday-Saturday (Friday Jumu'ah break considered)
- Slots per day: 2-3
- Morning slot: 8:00/9:00 AM start
- Afternoon slot: 12:00/2:00 PM start
- Evening slot: 4:00 PM start (less common)

### 5.2 Venue Naming Patterns
- University Theatre (UT) / Main Auditorium
- Faculty-based lecture halls (FLT, CLT, SLT)
- Departmental rooms
- Labs prefixed by type (PHY-LAB, CHM-LAB, CSC-LAB)
- Block/Building naming (BLOCK A, NEW COMPLEX)

### 5.3 Course Code Format
- 3-letter prefix + 3-digit number
- First digit = level (100, 200, 300, 400, 500, 600)
- GST courses common across all faculties
- Service courses shared between departments

### 5.4 Academic Calendar Considerations
- ASUU strike buffer (reschedule capability)
- Public holidays (marked as non-exam days)
- Orientation week
- Mid-semester breaks

---

## 6. Technical Implementation Notes

### 6.1 Algorithm Approaches
- **CSP (Constraint Satisfaction Problem)** - Backtracking with constraint propagation
- **Genetic Algorithm** - Population-based optimization
- **Simulated Annealing** - Local search with temperature schedule
- **Hybrid** - GA for initial solution, CSP for refinement

### 6.2 Performance Considerations
- Large data: 10,000+ students, 500+ courses
- Pre-compute conflict graphs
- Incremental updates (don't regenerate entire timetable for small changes)
- Parallel processing for independent faculties

### 6.3 Output Formats
- Printable PDF timetable
- Excel/CSV export
- Student personal timetable view
- Lecturer schedule view
- Venue utilization report
- Invigilation duty roster

---

## 7. UI/UX Patterns Observed

### 7.1 Dashboard Cards
- Metric cards with numbers and trends
- Status indicators (active, pending, blocked)
- Progress bars for setup completion

### 7.2 Tables
- Sortable columns
- Status badges
- Action buttons (view, edit, delete)
- Pagination for large datasets

### 7.3 Navigation
- Sidebar with role-appropriate menu
- Breadcrumbs for deep navigation
- Context switcher (institution, faculty, semester)

### 7.4 Validation Feedback
- Conflict count badge
- Pass/fail indicators
- Detailed conflict report modal
- Resolution suggestions

---

This knowledge base will be continuously updated as the project progresses.
