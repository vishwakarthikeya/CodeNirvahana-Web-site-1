# TechnoFest Event Management System

A complete event management system for TechnoFest at Sri Nidhi College of Engineering, Cybersecurity Department. This is a multi-page website with Firebase backend integration, admin panel, and user authentication.

## Features

- **Modern Design**: Vibrant color scheme with glassmorphism effects and smooth animations
- **Responsive Layout**: Works on all devices from mobile to desktop
- **User Authentication**: Email/Password and Google Sign-In
- **Event Management**: Create, read, update, and delete events
- **Admin Dashboard**: Full control over events and users
- **Real-time Updates**: Firebase Realtime Database for instant updates
- **Interactive UI**: Modern CSS animations and hover effects

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Authentication, Realtime Database)
- **Icons**: Font Awesome 6
- **Fonts**: Google Fonts (Poppins, Inter)

## File Structure
technofest-event-system/
├── index.html # Homepage
├── events.html # Events listing page
├── login.html # User login page
├── register.html # User registration page
├── admin.html # Admin dashboard
├── styles/
│ ├── styles.css # Global styles
│ ├── index.css # Homepage specific styles
│ ├── events.css # Events page specific styles
│ ├── auth.css # Login/Register page styles
│ └── admin.css # Admin page specific styles
├── js/
│ ├── main.js # Global JavaScript functions
│ ├── auth.js # Authentication logic
│ ├── events.js # Events page functionality
│ ├── admin.js # Admin panel functionality
│ └── firebase-config.js # Firebase configuration
└── README.md # This file


## Firebase Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: "technofest-snce"
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Click "Sign-in method" tab
4. Enable "Email/Password"
5. Enable "Google"

### 3. Create Realtime Database

1. Go to "Realtime Database"
2. Click "Create database"
3. Start in test mode (for development)
4. Choose location closest to you

### 4. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click web app icon (</>)
4. Register app: "TechnoFest Web App"
5. Copy the firebaseConfig object
6. Paste it in `js/firebase-config.js` replacing the placeholder values

### 5. Set Database Rules

Go to "Realtime Database" → "Rules" tab and replace with:

```json
{
  "rules": {
    "events": {
      ".read": true,
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },
    "users": {
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || root.child('admins').child(auth.uid).exists())",
        ".write": "auth != null && (auth.uid === $uid || root.child('admins').child(auth.uid).exists())"
      }
    },
    "admins": {
      ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
      ".write": false
    },
    "registrations": {
      ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
      ".write": "auth != null"
    }
  }
}