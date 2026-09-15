# Muhammad Zaheer Portfolio

> A modern, responsive portfolio website showcasing web applications, API tooling, interactive projects, and a Firebase-powered contact form.

🔗 **Live Demo:** https://mzaheer1070.github.io/TESTING/

---

## 📌 About

This is a personal portfolio website featuring web development projects, API integrations, live dashboards, interactive UI effects, and a functional contact system powered by Firebase Firestore.

## ✨ Features

| Feature | Description |
| --- | --- |
| 🎨 Modern UI & Design | Responsive dark/light portfolio interface with animated interactions |
| 📱 Responsive Layout | Optimized for mobile, tablet, and desktop screens |
| 🔥 Firebase Contact Form | Contact messages stored through Firestore with restrictive security rules |
| 🌤️ Weather Dashboard | Real-time weather, air quality, forecasts, maps, and cinematic effects |
| 📊 API Dashboard | Real HTTP endpoint monitoring with status and latency reporting |
| ✅ Todo Application | Client-side task management with browser persistence |
| 📂 Project Showcase | Standalone live applications linked from the portfolio |
| 🏷️ Version Control | Semantic versioning and Git-based history |
| 🚀 CI/CD Deployment | Automatic GitHub Pages deployment through GitHub Actions |

## 🛠️ Tech Stack

### Frontend

* HTML5 semantic markup
* Vanilla CSS with responsive Grid/Flexbox layouts
* JavaScript (ES6+)
* Google Fonts (Plus Jakarta Sans & JetBrains Mono)

### Services & APIs

* Firebase Firestore
* Open-Meteo weather and geocoding APIs
* Public REST APIs

### Development & Hosting

* Git & GitHub
* GitHub Actions
* GitHub Pages

## 📁 Project Structure

```text
TESTING/
├── index.html
├── about.html
├── projects.html
├── contact.html
├── favicon.svg
├── Muhammad_Zaheer_Resume.pdf
├── firestore.rules
├── README.md
├── css/
├── js/
│   ├── script.js
│   ├── firebase.js
│   └── portfolio-links.js
├── images/
└── projects/
    ├── weather-app/
    ├── weather-dashboard/
    ├── todo-app/
    ├── api-dashboard/
    └── shared/
```

## 🔒 Security

* Firestore contact submissions are create-only.
* Submitted contact records are not publicly readable, editable, or deletable.
* Firestore rules validate field names, types, and value lengths server-side.
* Firebase web configuration is intentionally client-visible; Firestore Security Rules provide the access control.

## 🚀 Run Locally

Clone the repository:

```bash
git clone https://github.com/mzaheer1070/TESTING.git
cd TESTING
```

Start a local static server:

```bash
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000
```

## 🏷️ Version History

| Version | Release Notes |
| --- | --- |
| **v3.3.0** | Improve weather dashboard location detection, city suggestions, and local testing workflow |
| **v3.2.0** | Migrate weather dashboard to Open-Meteo, add soundscapes, GPS-friendly location names, and refined light theme |
| **v3.1.0** | Add live weather-scene animations |
| **v3.0.0** | Major UI redesign, dark/light design system, Google typography, privacy updates, and profile refresh |
| **v2.1.0** | Add Weather Dashboard with live API integration |
| **v2.0.0** | Add Firebase Firestore contact form with validation |
| **v1.0.0** | Initial portfolio release with GitHub Pages deployment |

## 🤝 Feedback

Suggestions and improvements are welcome. Feel free to open an issue or share feedback about the project.