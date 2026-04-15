# Project Synopsis: Knotty Town – Oversized Streetwear

## 1. Project Overview
**Knotty Town** is a premium, editorial-style e-commerce platform specializing in a wide range of fashion including oversized streetwear, regular shirts, polo shirts, formal wear, women's dresses, and curated "Metal Boutique" posters. The application is designed to provide a "Quiet Luxury" shopping experience, moving away from generic e-commerce aesthetics towards a sophisticated, fashion-forward interface.

---

## 2. Core Vision & Branding
- **Brand Identity**: "Atelier Access" – A high-end, exclusive feel.
- **Design Philosophy**: Minimalist but bold, utilizing a palette of gold, forest green, and sleek dark modes.
- **Target Audience**: Fashion-conscious individuals seeking varied premium apparel—from casual oversized gear and polo shirts to formal dresses and elegant women's wear—alongside exclusive home decor (Metal Posters).

---

## 3. Technology Stack
### Frontend
- **Framework**: React 19 (built with Vite for high-speed development).
- **Styling**: Tailwind CSS for responsive and modern UI components.
- **Icons**: Lucide React for consistent and elegant iconography.
- **State Management**: React Context API (Cart, Auth, and Design contexts).
- **Navigation**: React Router DOM (v7).

### Backend
- **Environment**: PHP (running on Hostinger or similar LAMP/LEMP stacks).
- **Communication**: RESTful API endpoints for products, orders, and authentication.
- **Messaging**: Integration with a WhatsApp Service for automated order confirmations and status updates.

### Database
- **Engine**: MySQL / MariaDB.
- **Architecture**: Relational schema including `users`, `products`, `orders`, `order_items`, and global `settings`.

---

## 4. Key Features
### A. Customer Experience
- **Dynamic Shop**: Category-based filtering and high-quality product imagery.
- **Custom Design Studio**: A dedicated space for users to create or request custom streetwear designs.
- **Seamless Checkout**: Support for multiple payment methods including:
  - **Razorpay**: Integrated digital payments.
  - **Manual QR**: Direct payment via screenshot verification.
  - **COD**: Cash on delivery support.
- **Order Tracking**: Real-time status lookup for customers.
- **Wishlist & Cart**: Persistent storage of preferences using database synchronization.

### B. Admin Infrastructure ("Atelier Access")
- **Comprehensive Dashboard**: Centralized hub for managing inventory, viewing sales analytics, and processing orders.
- **Metal Boutique Management**: Specialized section for uploading and narrating "Metal Boutique" collections.
- **Settings Control**: Real-time updates for shipping prices, branding assets, and payment credentials.

---

## 5. Architectural Highlights
- **Schema Management**: Includes automated schema verification and migration scripts (`check_schema.php`, `fix_db_schema.php`).
- **Security**: JWT-style authentication handles (via `jwt-decode`) and secure PHP backend logic.
- **Deployment Ready**: Specialized directory structure (`hostinger-deploy`) for seamless production rollout.

---

## 6. Future Enhancements (Roadmap)
- **AI-Powered Recommendations**: Leveraging the integrated Google Generative AI components to suggest styles based on user browsing.
- **Advanced Analytics**: Deeper insights into customer behavior and sales trends.
- **Expanded Exclusive Collections**: Further development of the "Secret Vault" for VIP members.
