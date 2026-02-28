# FindMyJob - Job Board Application

A modern job board platform built with **Java Spring Boot** backend and **React** frontend, inspired by Foundit's design.

## 🚀 Features

- **Beautiful UI**: Purple gradient hero section with floating search pill
- **Job Search**: Search by skills, company, job title, or location
- **Responsive Design**: Works seamlessly on desktop and mobile
- **RESTful API**: Spring Boot backend with JPA and H2 database
- **Real-time Updates**: Dynamic job listings with smooth animations

## 📋 Prerequisites

Before running this application, ensure you have:

- **Java 17 or higher** - [Download](https://www.oracle.com/java/technologies/downloads/)
- **Maven 3.6+** - [Download](https://maven.apache.org/download.cgi)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)

## 🛠️ Installation & Setup

### Backend (Spring Boot)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Build the project:
   ```bash
   mvn clean install
   ```

3. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```

   The backend will start on `http://localhost:8080`

### Frontend (React)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will start on `http://localhost:5173`

## 📡 API Endpoints

### Jobs API

- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/{id}` - Get job by ID
- `POST /api/jobs` - Create a new job
- `PUT /api/jobs/{id}` - Update a job
- `DELETE /api/jobs/{id}` - Delete a job
- `GET /api/jobs/search?keyword={keyword}` - Search jobs by keyword
- `GET /api/jobs/location?location={location}` - Search jobs by location

### Example Job Object

```json
{
  "title": "Java Full Stack Developer",
  "company": "Infosys Limited",
  "companyLogo": "https://via.placeholder.com/50",
  "location": "Pune, India",
  "description": "We are looking for an experienced Java Full Stack Developer...",
  "experienceLevel": "2.5 - 6.5 LPA",
  "jobType": "Full-time",
  "category": "Software Development",
  "skills": "Java, Spring Boot, React, MySQL"
}
```

## 🗄️ Database

The application uses **H2 in-memory database** for development. 

- **H2 Console**: `http://localhost:8080/h2-console`
- **JDBC URL**: `jdbc:h2:mem:findmyjobdb`
- **Username**: `sa`
- **Password**: (leave empty)

Sample data is automatically loaded on startup from `data.sql`.

## 🎨 Tech Stack

### Backend
- Java 17
- Spring Boot 3.2.1
- Spring Data JPA
- H2 Database
- Lombok
- Maven

### Frontend
- React 18
- Vite
- Modern CSS with custom properties
- Inter font family

## 📱 Screenshots

The application features:
- Purple gradient hero section (inspired by Foundit)
- Floating search bar with keyword and location filters
- Horizontal job cards with company logos
- Skill tags and job details
- Hover effects and smooth animations

## 🔧 Configuration

### Backend Configuration (`application.properties`)

```properties
server.port=8080
spring.datasource.url=jdbc:h2:mem:findmyjobdb
spring.jpa.hibernate.ddl-auto=create-drop
spring.h2.console.enabled=true
```

### CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative React port)

## 🚀 Quick Start (Alternative Method)

If you don't have Maven installed, you can use the Maven Wrapper:

**Windows:**
```bash
cd backend
.\mvnw.cmd spring-boot:run
```

**Linux/Mac:**
```bash
cd backend
./mvnw spring-boot:run
```

## 📝 Sample Data

The application comes with 8 pre-loaded job listings including:
- Java Full Stack Developer
- Junior Java Developer
- Python Interns
- Frontend Developer
- Backend Developer
- Data Analyst
- UI/UX Designer
- Computer Operator

## 🤝 Contributing

Feel free to fork this project and submit pull requests!

## 📄 License

This project is open source and available under the MIT License.

## 🐛 Troubleshooting

### Backend won't start
- Ensure Java 17+ is installed: `java -version`
- Check if port 8080 is available
- Verify Maven installation: `mvn -version`

### Frontend won't start
- Ensure Node.js is installed: `node -version`
- Delete `node_modules` and run `npm install` again
- Check if port 5173 is available

### CORS errors
- Ensure backend is running on port 8080
- Check CORS configuration in `WebConfig.java`

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using Spring Boot and React**
