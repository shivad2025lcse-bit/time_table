# Smart Classroom & Timetable Scheduler

A full-stack web application designed to manage college classrooms, teachers, students, substitutions, and automatically manage timetable schedules with role-based access.

---

## 📌 Features
The **Smart Classroom & Timetable Scheduler** provides an intuitive dashboard to manage educational institution logistics:
- **Role-Based Access Control**: Separate views and permissions for Admin, Faculty, and Students.
- **Class Advisor View**: Exclusive view for designated Class Advisors to manage and monitor their assigned class sections.
- **Staff Substitution & Leave Management**: Faculty can mark themselves on leave, opening up periods for substitution.
- **Student Management**: Register new students and allocate them to specific departments, courses, and sections.
- **Real-Time Notifications**: Simulated SMS & Email period notifications for students regarding faculty leave or substitutions.

---

## 🚀 Technology Stack
- **Frontend**: React (Vite), HTML5, CSS3, JavaScript, Bootstrap 5 (Responsive Dashboard)
- **Backend**: Java 25, Spring Boot 3.5.16, Spring Web, Spring Data JPA, Spring Security, Maven
- **Database**: H2 In-Memory Database (Default for development)
- **Architecture**: Decoupled Architecture (Vite Dev Server on 5173 proxying to Spring Boot on 8080)

---

## 🔐 Default User Credentials

| Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `shiva25012007` | `shiv2501` | Full access to management, scheduling, and substitutions. |
| **FACULTY (Class Advisor)** | `fkeerj012345` | `keerj012345` | Example Class Advisor. Can view their assigned class (II CSE C). |
| **STUDENT** | `smithp012345` | `mithp012345` | Example Student. Views their section schedule and notifications. |

*Note: Any newly added student will have their Register Number (lowercase) as their Username, and their UPPERCASE First Name + the last 4 digits of their phone number as the initial password.*

---

## 🛠️ Setup & Execution Instructions

### Prerequisites
- **Java 25** (`java -version`)
- **Maven 3.9+** (or use the included Maven Wrapper)
- **Node.js & npm** (for the Vite frontend)

### 1. Run the Backend (Spring Boot)
Open a terminal in the project root (`d:\MONISH\Java_project`):

```bash
# Clean and package the backend
mvn clean package -DskipTests

# Run Spring Boot Application (Starts on port 8080)
mvn spring-boot:run
```
*Note: The backend uses an in-memory H2 database by default. Data will be reset upon restart unless configured otherwise.*

### 2. Run the Frontend (Vite + React)
Open a second terminal in the frontend directory (`d:\MONISH\Java_project\frontend`):

```bash
# Install frontend dependencies
npm install

# Run the Vite dev server (Starts on port 5173)
npm run dev
```

### 3. Access the Application
Once both servers are running, open your browser and navigate to the frontend:
👉 **`http://localhost:5173`**

---

## 📡 REST API Structure

The backend exposes secured REST endpoints under `/api`. Here are the primary domains:
- **`/api/auth/login`**: Authenticate and return user token.
- **`/api/students`**: CRUD operations for managing students and allocations.
- **`/api/sections`, `/api/departments`, `/api/courses`**: Master data endpoints.