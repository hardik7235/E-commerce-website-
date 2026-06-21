Dhaga Piroi - Comprehensive E-Commerce Platform Documentation

1. Project Overview
Dhaga Piroi is a custom-built, full-stack e-commerce web application designed specifically for a handmade accessories brand. Developed as a final internship project, it facilitates the browsing, cart management, and purchasing of handcrafted items such as crochet bag charms, floral hair claw clips, and scrunchies.

The application bypasses the need for heavy front-end frameworks (like React or Angular) by utilizing advanced Vanilla JavaScript techniques to create a Single Page Application (SPA) feel. It integrates a secure, real-time backend using Supabase for database management and user authentication.

2. Table of Contents
Project Overview

Technology Stack

Complete System Workflow

Technical Architecture & Database Schema

Core Features & Implementation Details

Directory & File Structure

Setup & Installation

Developer Information

3. Technology Stack

Front-End Layer:

HTML5 (Semantic structuring)
CSS3 (Custom Responsive Layouts, Flexbox, CSS Grid, custom animations)
Vanilla JavaScript (ES6+, asynchronous programming, DOM manipulation)

Back-End Layer (Backend-as-a-Service):

Supabase Auth (User authentication and session handling)
Supabase PostgreSQL (Relational database mapping)

Third-Party Libraries:

HTML2PDF.js (Client-side PDF invoice generation)
Supabase JS Client (Database communication)

4. Complete System Workflow (User Journey)
   
A. The Browsing Experience
Entry Point: The user lands on index.html (Home Page), which showcases featured categories and hero banners.

Navigation: When a user clicks on a category (e.g., "Hair Clips" or "Bag Charms"), they are routed to categories.html?category=TargetName.

Dynamic Fetching: The JavaScript reads the URL parameter, connects to the Supabase products table, and fetches only the items matching the requested category.

Empty State Handling: If a category currently holds no inventory, the system gracefully handles the null response and dynamically injects a "No products found in this category yet" message, preventing broken layouts.

B. Cart and Session Workflow
Adding to Cart: When a user clicks "Add to Cart", the item is immediately pushed to the browser's localStorage. This guarantees zero latency and immediate UI updates (updating the cart counter and triggering a toast notification).

Authentication Check:

If the user is a Guest, the cart remains entirely in localStorage.

If the user is Logged In, an asynchronous background process syncToDBInBackground() is triggered. It silently updates the Supabase cart_items table to ensure data is preserved across different devices.

Session Monitoring: As the user navigates, session-manager.js monitors their activity (clicks, scrolls). It uses a 60-second throttling mechanism to update a timestamp cookie. If 15 days pass without activity, the system auto-logs the user out.

C. Checkout & Order Processing
Cart Review: The user opens the cart modal, where they can adjust quantities. The JavaScript dynamically recalculates subtotals.

Delivery Logic: During checkout, the user inputs their Pincode. The system calculates shipping costs dynamically (e.g., free shipping for local codes, flat rate for others) and updates the Grand Total.

Payment Selection: The user selects Cash on Delivery (COD) or Online Payment (which triggers a mock processing UI).

Order Placement:

The system constructs a JSON object combining the cart array, user profile data, and formatted shipping address.

This object is pushed to the orders table in Supabase.

Upon success, the cart is cleared (both locally and in the database), and a digital receipt can be downloaded via HTML2PDF.

5. Core Features & Implementation Details
5.1. Dynamic Routing & DOM Injection (The SPA Engine)
Where it is used: categories.html

How it works: Instead of hardcoding separate HTML files for "About Us", "Necklaces", or "Charms", the system uses URLSearchParams.

If window.location.search contains ?category=About, the script completely clears the standard product grid DOM and injects the HTML for the "Our Story/About Us" section.

This drastically reduces the project's file footprint and ensures ultra-fast page transitions.

5.2. Local-First Hybrid Data State
Where it is used: cart.js

How it works: This handles the complex synchronization between client and server.

Conflict Resolution Logic: When a user logs in, the script compares the localStorage cart with the Supabase cart. If the database is empty but the local storage has items (meaning the user added items while logged out), it merges these items into the database, ensuring no data is lost during the login transition.

5.3. Advanced Session Throttling
Where it is used: session-manager.js (Included in the <head> of all HTML files).

How it works: Tracking user activity can cause severe performance issues if database calls or DOM updates fire on every single mouse movement. This script implements a custom throttle function. Event listeners are attached to mousemove, keydown, and scroll, but the actual timestamp update logic only executes a maximum of once every 60 seconds.

5.4. Relational Database Mapping (Supabase)
Where it is used: User Profiles and Order History logic.

How it works: The system relies on primary and foreign keys within PostgreSQL. The orders table contains a user_id column linked directly to the profiles table. When a user opens their dashboard, the script queries the orders table where user_id matches the authenticated user's UUID, mapping the data into a chronological visual history of their purchases.

5.5. Footer Contact Integration
Where it is used: Global Footer across all pages.

How it works: Actionable anchor tags are utilized.

href="mailto:..." for opening default email clients.

href="tel:..." for opening mobile dialers.

href="[https://maps.google.com/](https://maps.google.com/)..." for immediate location routing.

href="[https://instagram.com/](https://instagram.com/)..." for social media redirection.

6. Directory & File Structure
index.html: The main landing page featuring hero banners and featured product highlights.

categories.html: The core dynamic routing page. Renders product grids, empty states, and standalone content like "About Us" based on URL parameters.

product-details.html: Renders specific, granular details for a single product utilizing a unique Product ID passed via the URL.

/css/style.css: Contains all global styles, CSS variables for theming, flexbox/grid layouts, and responsive media queries.

/js/cart.js: The central state management file. Handles the cart array, local storage syncing, Supabase data pushing, checkout calculations, and DOM updates for the cart modal.

/js/session-manager.js: The global security and authentication script governing user session timeouts and cookie tracking.

/js/auth.js: Handles Supabase login, signup, password recovery, and active state UI toggling (e.g., changing "Login" buttons to "Profile" avatars).

/assets/: Directory containing all raw assets, including product images (e.g., boho bag charm.jpg, crochet flower hair clip.jpg) and site icons.

7. Setup & Installation
To run this application in a local development environment:

Clone the Repository:
Download or clone the repository to your local machine.

Environment Configuration:
The application requires an active Supabase project. Ensure the following tables are created in your PostgreSQL database with appropriate Row Level Security (RLS) policies:

products
categories
profiles
cart_items
orders

API Keys:
Locate the Supabase initialization block within the JavaScript files. Replace the placeholder URL and Anon Key with your actual Supabase project credentials.

Local Server:
Due to ES6 module imports and CORS policies, the project cannot be run by simply opening the HTML files in a browser. You must serve the directory using a local web server (such as the "Live Server" extension in VS Code or a Python/Node local server).

Execution:
Open index.html on your localhost port to begin utilizing the platform.

8. Developer Information:
Hardik
Frontend Developer & Intern
