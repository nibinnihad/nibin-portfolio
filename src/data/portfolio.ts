export interface Project {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  description: string;
  technologies: string[];
  features: string[];
  githubUrl?: string;
  liveUrl?: string;
  highlights: string[];
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  duration: string;
  badge?: string;
  description: string;
  pagesDeveloped?: string[];
  deliverables?: string[];
  technologies: string[];
  bulletPoints: string[];
}

export interface SkillCategory {
  category: string;
  skills: string[];
  description?: string;
}

export interface EducationItem {
  degree: string;
  institution: string;
  duration: string;
  grade: string;
  details?: string;
}

export interface CertificationItem {
  title: string;
  issuer: string;
  year: string;
  description?: string;
}

export const portfolioData = {
  personal: {
    name: "Nibin Nihad",
    title: "Software Developer with a Creative Mind",
    location: "Kerala, India",
    email: "nibincnihad@gmail.com",
    phone: "+91 8590814081",
    linkedin: "https://www.linkedin.com/in/nibin-nihad",
    github: "https://github.com/nibinnihad",
    resumeUrl: "/resume.pdf", // Configurable PDF path in public directory
    status: "Open to Software Development Roles",
    shortBio:
      "Computer Science and Engineering graduate with a strong foundation in software development, data structures and algorithms, DBMS and object-oriented programming. Skilled in Python, Java, SQL and RESTful APIs, with hands-on experience building web, mobile and IoT applications. Passionate about writing clean, maintainable code and continuously learning.",
    aboutNarrative: [
      "I am a Computer Science and Engineering graduate from AWH Engineering College, Kozhikode, with a strong foundation in web development, software engineering, and analytical computing.",
      "My hands-on experience includes building production pages for the official HLB HAMT website as a Full Stack Developer Intern, developing a full-stack Django platform with authentication and an admin dashboard, building an IoT gas sensor app, and analysing data with Python, Excel and Power BI.",
      "My technical interests center around creating responsive, accessible, and high-performance digital applications. I value clean component design, thoughtful database schemas, and pragmatic problem-solving over unnecessary complexity. My career goal is to contribute as a Software Developer in an environment that prioritizes code quality, user impact, and continuous technical growth."
    ]
  },

  navigation: [
    { label: "Home", href: "#hero" },
    { label: "Profile", href: "#about" },
    { label: "Skills", href: "#skills" },
    { label: "Experience", href: "#experience" },
    { label: "Projects", href: "#projects" },
    { label: "Education", href: "#education" },
    { label: "Certifications", href: "#certifications" },
    { label: "Contact", href: "#contact" },
  ],

  experiences: [
    {
      id: "bairuha-tech",
      role: "Full Stack Developer Intern",
      company: "Bairuha Tech",
      duration: "Present",
      badge: "Production Client Project",
      description:
        "Contributing to the official HLB HAMT website, a professional website for an international audit, tax, and advisory firm.",
      pagesDeveloped: [
        "Podcast",
        "About HLB",
        "Publications",
        "Awards & Recognition",
        "HLB Global",
        "CSR (Corporate Social Responsibility)",
        "Leadership"
      ],
      technologies: [
        "Next.js",
        "React",
        "TypeScript",
        "Tailwind CSS",
        "Docker",
        "Git",
        "Claude Code"
      ],
      bulletPoints: [
        "Developed a wide range of responsive pages across the official HLB HAMT website, including Podcast, About HLB, Publications and Leadership, following the firm's brand guidelines.",
        "Built website interfaces and page functionality as part of the development team, using reusable React components written in TypeScript.",
        "Implemented transitions, audio/video sections and layouts that work across mobile, tablet and desktop.",
        "Use AI-assisted coding tools alongside Git and Docker to support development and improve workflow efficiency."
      ]
    },
    {
      id: "codeme-hub",
      role: "Data Analyst Intern",
      company: "CodeMe Hub International Pvt. Ltd.",
      duration: "June 2025 – July 2025",
      badge: "Data Analysis & Business Intelligence",
      description:
        "Worked on structured data processing, exploratory analysis, visualization, and automated business reporting.",
      deliverables: [
        "Power BI dashboards",
        "Cleaned & transformed datasets",
        "Excel summary reports",
        "Matplotlib trend charts"
      ],
      technologies: [
        "Python",
        "Pandas",
        "NumPy",
        "Matplotlib",
        "Power BI",
        "Excel (VLOOKUP, PivotTables)"
      ],
      bulletPoints: [
        "Processed and analysed datasets using Python (Pandas, NumPy) and Excel, including data cleaning and transformation.",
        "Developed Power BI dashboards to visualise data and generate insights.",
        "Used Excel functions such as VLOOKUP and PivotTables to organise, summarise and analyse datasets.",
        "Created charts with Matplotlib to explore trends in the data."
      ]
    }
  ] as Experience[],

  projects: [
    {
      id: "fintrack-pro",
      title: "FinTrack Pro",
      subtitle: "Personal finance dashboard",
      category: "Frontend Application",
      description:
        "A web app that helps people keep track of their money. You can add what you spend and earn, see where your money goes, and check your monthly spending in simple charts.",
      technologies: ["React.js", "TypeScript", "Recharts", "Tailwind CSS"],
      features: [
        "Add, edit and delete transactions, and see the changes right away",
        "Search, filter and sort transactions to find what you need",
        "Your data is saved in the browser, so it is still there next time",
        "Download your transactions as a CSV file in one click",
        "Charts that show your spending by category and by month",
        "Built from small, reusable parts that are easy to change"
      ],
      highlights: [
        "Written in TypeScript, so many mistakes are caught early",
        "Works well on phone, tablet and desktop",
        "Search and filters work on the data saved in the browser"
      ]
      // GitHub and Live URLs omitted until provided; UI gracefully hides missing links
    },
    {
      id: "nss-connect",
      title: "NSS Connect",
      subtitle: "Volunteer management website",
      category: "Full Stack Web Application",
      description:
        "A website for the National Service Scheme (NSS) at college. It helps the team sign up volunteers, plan events, share announcements and keep a record of volunteer work.",
      technologies: ["Python", "Django", "HTML5", "CSS3", "SQLite", "JavaScript"],
      features: [
        "Secure login, with different access for admins and volunteers",
        "Volunteers can sign up, and their activities are tracked",
        "Plan events and post announcements on a notice board",
        "A photo gallery for pictures from events",
        "Volunteers can log their work and send feedback",
        "An admin dashboard to view and manage all the data"
      ],
      highlights: [
        "Built with Django, handling both the front end and the back end",
        "Data stored in an SQLite database, managed through Django",
        "Admin tools that make it easy for many people to work together"
      ]
    },
    {
      id: "bio-cyber-sensor",
      title: "Bio-Cyber Hybrid Neuromorphic Chemical Sensor",
      subtitle: "Smart gas sensor with a mobile app",
      category: "IoT, Mobile & Machine Learning",
      description:
        "A device that senses gases in the air, uses a brain-inspired AI model to work out which gas it is, and shows the results live in a mobile app.",
      technologies: ["Flutter", "Dart", "Python", "ESP32", "MQ Gas Sensors", "Brian2 SNN"],
      features: [
        "Gas sensors read the air continuously",
        "A brain-inspired AI model (a spiking neural network) identifies the gas",
        "A Flutter mobile app shows the live readings",
        "Sends an alert to your phone when gas levels get too high",
        "An ESP32 board sends the sensor data over Wi-Fi",
        "An API connects the device, the Python processing and the app"
      ],
      highlights: [
        "Brings together hardware, AI and a mobile app in one system",
        "Readings move quickly from the sensor to the app, so alerts arrive fast",
        "Data flow: ESP32 board → Python → Flutter app"
      ]
    }
  ] as Project[],

  skills: [
    {
      category: "Programming Languages",
      skills: ["Python", "Java", "JavaScript", "TypeScript", "Dart", "C"],
      description: "Core languages used across frontend, backend, scripting, and mobile development."
    },
    {
      category: "Frontend Development",
      skills: ["React.js", "Next.js", "HTML", "CSS", "Tailwind CSS"],
      description: "Modern component-driven development, server-side rendering, and responsive styling."
    },
    {
      category: "Backend Development",
      skills: ["Django", "RESTful APIs"],
      description: "Server architecture, API design, authentication, and application routing."
    },
    {
      category: "Mobile Development",
      skills: ["Flutter"],
      description: "Cross-platform mobile client engineering with Dart."
    },
    {
      category: "Databases",
      skills: ["SQL", "MySQL", "SQLite"],
      description: "Relational schema design, normalization, query optimization, and ORM integration."
    },
    {
      category: "Data Analysis & Visualization",
      skills: ["Pandas", "NumPy", "Matplotlib", "Power BI", "Excel", "Recharts"],
      description: "Data manipulation, business intelligence reporting, and SVG charting."
    },
    {
      category: "Developer Tools & DevOps",
      skills: [
        "Git",
        "GitHub",
        "VS Code",
        "Android Studio",
        "Claude Code",
        "GitHub Copilot",
        "Antigravity",
        "Docker",
        "Vercel"
      ],
      description: "Version control, modern IDEs, containerization, and AI-accelerated workflows."
    },
    {
      category: "Core Computer Science Fundamentals",
      skills: [
        "OOP",
        "Data Structures & Algorithms",
        "DBMS",
        "Design Patterns",
        "Software Testing and Debugging"
      ],
      description: "Strong foundational principles behind maintainable software architecture."
    }
  ] as SkillCategory[],

  education: [
    {
      degree: "Bachelor of Technology (B.Tech) – Computer Science and Engineering",
      institution: "AWH Engineering College, Kozhikode",
      duration: "2022 – 2026",
      grade: "CGPA: 6.69 | First Class",
      details: "Comprehensive engineering curriculum covering software engineering, database systems, networking, and algorithms."
    },
    {
      degree: "Higher Secondary Education (12th Grade)",
      institution: "W.O.H.S.S, Pinangode",
      duration: "2020 – 2022",
      grade: "78.25%",
      details: "Focus in Science and Mathematics."
    },
    {
      degree: "Secondary School Education (10th Grade)",
      institution: "W.O.H.S.S, Pinangode",
      duration: "2019 – 2020",
      grade: "84.44%",
      details: "Foundational academic education."
    }
  ] as EducationItem[],

  certifications: [
    {
      title: "Boot Camp on Allied Technologies for UAS / Drone",
      issuer: "National Institute of Electronics & Information Technology (NIELIT), Calicut",
      year: "2025",
      description: "Hands-on boot camp on Unmanned Aircraft Systems (drones) and their allied technologies."
    }
  ] as CertificationItem[],

  personalSkills: ["Problem Solving", "Analytical Thinking", "Continuous Learning", "Communication and Teamwork"]
};

