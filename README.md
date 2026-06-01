# ClashFree - Automatic Timetable Generator

> Revolutionary academic scheduling system for Nigerian universities. Smart engine detects conflicts before they happen. Zero clashes guaranteed.

![ClashFree Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-38bdf8)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2d3748)

---

## 🚀 Features

### Smart Scheduling Engine
- **Zero Clashes Guaranteed** - The engine halts if any conflict is detected
- **Carry-Over Detection** - Automatically validates CO students against all registered courses
- **Real-time Conflict Resolution** - Interactive conflict resolution suggestions

### Multi-Tenant Architecture
- Support for **47+ institution types** (Federal, State, Private Universities, Polytechnics, etc.)
- Role-based access control (Super Admin, Institution Admin, Timetable Officer, Lecturer, Student)
- Institution-level data isolation

### Exam & Lecture Timetables
- Automatic timetable generation
- 3 exam sessions per day (Morning, Afternoon, Evening)
- Room capacity optimization
- Invigilator assignment
- Version history & approval workflow

### Data Management
- Bulk upload via CSV/Excel
- Export to PDF
- Real-time validation
- Conflict reporting

### Modern UI/UX
- Light/Dark mode support
- Responsive design
- Real-time updates
- Intuitive dashboard

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Database** | SQLite (Prisma ORM) |
| **Auth** | NextAuth.js |
| **Icons** | Lucide React |
| **Animations** | Framer Motion |

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/clashfree.git
cd clashfree

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your settings

# Initialize database
bun run db:push
bun run db:seed

# Start development server
bun run dev
```

---

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@clashfree.com | admin123 |
| Institution Admin | ia@nsuk.edu.ng | admin123 |
| Timetable Officer | to@nsuk.edu.ng | admin123 |
| Lecturer | lecturer@nsuk.edu.ng | admin123 |
| Student | student@nsuk.edu.ng | admin123 |

---

## 📁 Project Structure

```
clashfree/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Demo data
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── dashboard/     # Dashboard pages
│   │   └── login/         # Authentication
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   └── layout/        # Layout components
│   └── lib/
│       ├── engine/        # Timetable generation engine
│       ├── auth.ts        # Authentication config
│       └── db.ts          # Database client
└── public/                # Static assets
```

---

## 🎯 Role-Based Access

| Role | Scope | Capabilities |
|------|-------|--------------|
| **SA** (Super Admin) | Platform | Manage all institutions, users, system health |
| **IA** (Institution Admin) | Institution | Full control within institution, approval workflow |
| **TO** (Timetable Officer) | Faculty | Manage courses, students, rooms, generate timetables |
| **LC** (Lecturer) | Personal | View schedule, set availability, see invigilation duties |
| **ST** (Student) | Personal | View personal exam timetable, CO status |

---

## 🏫 Supported Institutions

- Federal Universities
- State Universities
- Private Universities
- Polytechnics
- Monotechnics
- Colleges of Education
- Schools of Nursing
- Health Technology Schools

---

## 📊 Database Schema

The system uses a comprehensive schema supporting:

- **Multi-tenancy**: Institution → Faculty → Department hierarchy
- **Academic Structure**: Courses, Students, Lecturers
- **Scheduling**: Exam Periods, Slots, Rooms
- **Conflict Detection**: Automatic clash detection for students, lecturers, rooms
- **Version Control**: Timetable version history
- **Audit Trail**: Activity logs, conflict reports

---

## 🔧 Environment Variables

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 📝 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

---

## 📞 Support

For support, email support@clashfree.com or join our Discord channel.

---

**Built with ❤️ for Nigerian Tertiary Institutions**
