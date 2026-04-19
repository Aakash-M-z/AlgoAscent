# AlgoAscent



<p align="center">
  <strong>A clean and practical dashboard to track your Data Structures and Algorithms learning journey</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-blue?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8.3-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-3.3.5-blue?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-7.0.4-purple?style=flat-square&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-20.x-green?style=flat-square&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-4.x-black?style=flat-square&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-6.x-green?style=flat-square&logo=mongodb" alt="MongoDB" />
</p>

---

## About the Project

Progress Tracker is a full-stack web application built to help developers stay consistent with their Data Structures and Algorithms practice.

Instead of solving problems randomly across platforms, this tool helps you log your activity, visualize your improvement, and maintain discipline throughout your preparation journey.

It is designed for students preparing for coding interviews, competitive programming, and placement exams.

---

## Core Features

### Activity Tracking
- Log solved problems with difficulty, platform, time spent, and notes  
- Categorize problems by topic and problem type  
- Track progress across platforms such as LeetCode, CodeForces, and HackerRank  

### Structured Learning Roadmap
- Follow a topic-by-topic DSA roadmap  
- Mark topics as completed or in progress  
- Filter topics by difficulty and category  

### Analytics and Visualization
- Daily activity heatmap to monitor consistency  
- Topic-wise and difficulty-wise performance insights  
- Visual trends showing long-term progress  

### Motivation and Productivity
- Daily streak tracking  
- Milestone-based progress monitoring  
- Built-in motivational quotes  

### User Experience
- Fully responsive design  
- Clean dark theme with minimal distractions  
- Smooth animations and intuitive layout  

---

## Technology Stack

Frontend  
- React 18 with TypeScript  
- Tailwind CSS for styling  
- Vite for fast development  

Backend  
- Express.js  
- File-based data storage  
- Google OAuth authentication  

State Management  
- React Context API  

---

## Getting Started

### Prerequisites

- Node.js v16 or higher  
- npm or yarn  

### Installation

```bash
git clone https://github.com/Aakash-M-z/Progress_tracker.git
cd Progress_tracker
npm install

### Running the Application

```bash
# Start the backend server
npm run server

# In a new terminal, start the frontend
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5000`

---

##  Usage
1. **Sign In**: Use Google OAuth or create an account
2. **Log Activities**: Add solved problems using the Activity Form
3. **Track Progress**: Monitor your progress via the DSA Roadmap
4. **Analyze Performance**: View detailed statistics and trends
5. **Stay Motivated**: Check daily motivational quotes and track your streak

---

## Build for Production
```bash
npm run build
# or
yarn build
```

Deploy the generated `dist` directory to any static hosting provider.

---

## Project Structure

```text
src/
├── components/
│   ├── ActivityForm.tsx        # Handles problem logging
│   ├── DSARoadmap.tsx          # Displays DSA topic roadmap
│   ├── Header.tsx              # Application header
│   ├── ProgressStats.tsx       # Analytics and statistics
│   ├── SimpleHeatmap.tsx       # Daily activity heatmap
│   ├── StreakTracker.tsx       # Streak and consistency tracking
│   ├── DailyMotivation.tsx     # Daily motivational quotes
│   ├── BadgeSystem.tsx         # Achievement badges
│   └── UserProfile.tsx         # User profile management
├── contexts/
│   └── AuthContext.tsx         # Authentication context
├── api/
│   └── database.ts             # API client
├── utils/
│   └── sessionManager.ts       # Session management
├── App.tsx                     # Root application component
├── main.tsx                    # Application entry point
├── types.ts                    # Global TypeScript types
└── style.css                   # Global styles

server/
├── app.ts                      # Express application
├── index.ts                    # Server entry point
├── file-storage.ts             # File-based storage
└── models.ts                   # Data models
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<p align="center"><strong><span style="font-size:18px;">Give your 💖</span></strong></p>

