# Campus Market

A mobile marketplace application built for student entrepreneurs within a campus community.  
Students can create stores, upload products, discover items, and place orders from trusted campus sellers.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Objectives](#objectives)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [System Modules](#system-modules)
- [Project Folder Structure](#project-folder-structure)
- [API Design Overview](#api-design-overview)
- [Database Design Overview](#database-design-overview)
- [Frontend Development Overview](#frontend-development-overview)
- [Team Workflow (3 Developers)](#team-workflow-3-developers)
- [Git Branch Strategy](#git-branch-strategy)
- [Development Phases](#development-phases)
- [Task Assignment Plan](#task-assignment-plan)
- [Deployment Process](#deployment-process)
- [Contribution Guidelines](#contribution-guidelines)
- [Pull Request Rules](#pull-request-rules)
- [Commit Message Convention](#commit-message-convention)
- [How to Run the Project](#how-to-run-the-project)
- [Future Improvements](#future-improvements)

---

## Project Overview

**Campus Market** is a campus-focused mobile marketplace where students can buy and sell products easily.

The app supports:
- User authentication
- Store creation
- Product management
- Product discovery
- Search and filter
- Cart and order processing
- User account management

This project is developed by a team of 3 student developers using Agile-style collaboration.

---

## Objectives

- Help student entrepreneurs sell products on campus
- Make it easy for students to discover local campus stores
- Provide a secure and smooth purchase process
- Practice real-world team software engineering workflow

---

## Core Features

### Authentication
- User sign up
- User login
- Logout
- Password reset
- Authentication required before purchases

### Main App Tabs

#### 1) Home Tab
- Browse products
- View featured products
- Product cards with details
- Store location info
- Marketplace feed (Hubtel-like experience)

#### 2) Purchase Tab
- View cart
- Place orders
- View purchase history

#### 3) Search Tab
- Search products
- Search stores
- Filter by category, price, store, etc.

#### 4) Account Tab
- View and edit profile
- App settings
- Create store
- Manage account details

#### 5) Store Tab
- View all stores
- Open individual store pages
- View store products

### Store Management
- Create store
- Upload products
- Edit products
- Delete products

---

## Technology Stack

### Frontend (Mobile)
- Java (Android Studio)

### Backend
- Node.js
- Express.js

### Database
- MongoDB

### API
- REST API

### Version Control & Collaboration
- Git
- GitHub

---

## System Modules

1. **Auth Module**
   - Registration, login, token validation, reset password

2. **User Module**
   - Profile, settings, account data

3. **Store Module**
   - Create and manage stores

4. **Product Module**
   - CRUD for products, product listing

5. **Search Module**
   - Product/store search + filters

6. **Cart & Order Module**
   - Add to cart, checkout, order history

---

## Project Folder Structure

```bash
Campus-Market/
│
├── README.md
├── docs/
│   ├── PROJECT_WORKFLOW.md
│   ├── API_SPEC.md
│   ├── DB_SCHEMA.md
│   └── UI_WIREFRAMES.md
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Store.js
│   │   │   ├── Product.js
│   │   │   ├── Cart.js
│   │   │   └── Order.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── storeController.js
│   │   │   ├── productController.js
│   │   │   └── orderController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── storeRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   └── orderRoutes.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorHandler.js
│   │   │   └── validateRequest.js
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── mobile-app/
│   ├── app/
│   │   ├── src/main/java/com/campusmarket/
│   │   │   ├── ui/
│   │   │   │   ├── auth/
│   │   │   │   ├── home/
│   │   │   │   ├── purchase/
│   │   │   │   ├── search/
│   │   │   │   ├── account/
│   │   │   │   └── store/
│   │   │   ├── data/
│   │   │   │   ├── api/
│   │   │   │   ├── models/
│   │   │   │   └── repository/
│   │   │   ├── adapters/
│   │   │   ├── utils/
│   │   │   └── MainActivity.java
│   │   ├── res/
│   │   └── AndroidManifest.xml
│   ├── build.gradle
│   └── gradle.properties
│
└── .github/
    ├── pull_request_template.md
    └── workflows/
        └── ci.yml
```

---

## API Design Overview

Base URL (example):
`/api/v1`

### Authentication Endpoints
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

### User Endpoints
- `GET /users/me`
- `PUT /users/me`
- `GET /users/:id`

### Store Endpoints
- `POST /stores`
- `GET /stores`
- `GET /stores/:id`
- `PUT /stores/:id`
- `DELETE /stores/:id`

### Product Endpoints
- `POST /products`
- `GET /products`
- `GET /products/:id`
- `PUT /products/:id`
- `DELETE /products/:id`
- `GET /products/store/:storeId`

### Cart & Order Endpoints
- `GET /cart`
- `POST /cart/items`
- `DELETE /cart/items/:itemId`
- `POST /orders`
- `GET /orders/me`

---

## Database Design Overview

Main collections:
- `users`
- `stores`
- `products`
- `carts`
- `orders`

### High-level relationships
- One user can own one or more stores
- One store can have many products
- One user has one active cart
- One user can have many orders
- One order contains many order items (products + quantity)

---

## Frontend Development Overview

1. Build app navigation and bottom tabs
2. Create authentication screens
3. Implement Home feed and product cards
4. Implement Search + filtering
5. Implement Store list and store details
6. Implement Cart, Checkout, and Purchase history
7. Implement Account/Profile/Settings
8. Connect all screens to backend APIs
9. Handle loading states, errors, and validations
10. Test end-to-end user journeys

---

## Team Workflow (3 Developers)

- We follow a **feature-based collaboration model**
- Weekly sprint planning (1 week sprint)
- Daily short sync (10–15 mins)
- Every task is tracked as a GitHub Issue
- Every code change is submitted through Pull Request
- At least 1 teammate review required before merge

---

## Git Branch Strategy

Main branches:
- `main` → production-ready stable code
- `develop` → integration branch for completed features

Feature branches:
- `feature/auth-flow`
- `feature/home-feed`
- `feature/store-management`
- `feature/cart-orders`
- `fix/search-filter-bug`
- `chore/update-readme`

Release/hotfix:
- `release/v1.0.0`
- `hotfix/login-crash`

Flow:
1. Pull latest `develop`
2. Create feature branch
3. Commit changes
4. Open PR to `develop`
5. Review + merge
6. Periodically merge `develop` into `main`

---

## Development Phases

### Phase 1: Planning & Setup
- Define requirements
- Design wireframes
- Setup backend + mobile project
- Setup GitHub workflow

### Phase 2: Core Backend
- Auth APIs
- User APIs
- Store/Product APIs
- Cart/Order APIs
- Database schema

### Phase 3: Core Frontend
- Authentication UI
- Main tabs implementation
- API integration
- State and session handling

### Phase 4: Testing & Stabilization
- Unit + integration testing
- Bug fixing
- Performance improvements

### Phase 5: Deployment & Demo
- Deploy backend
- Final QA test
- Release APK/demo build
- Project presentation

---

## Task Assignment Plan

### Developer 1 (Backend Lead)
- Setup Express server + MongoDB connection
- Build Auth/User APIs
- Build middleware (auth, validation, errors)
- API documentation

### Developer 2 (Backend + Data)
- Build Store/Product APIs
- Build Cart/Order APIs
- Define DB schema and indexes
- Write API tests

### Developer 3 (Android Lead)
- Build mobile UI screens and navigation
- Integrate APIs into Android app
- Handle sessions, loaders, and errors
- End-to-end mobile testing

> All developers also participate in code review, testing, and documentation.

---

## Deployment Process

### Backend Deployment
1. Setup environment variables
2. Deploy Node.js API to cloud service (e.g., Render/Railway/Heroku)
3. Configure MongoDB Atlas
4. Test live endpoints

### Mobile App Build
1. Update API base URL to production
2. Generate signed APK
3. Perform final testing
4. Share build with testers/users

---

## Contribution Guidelines

1. Create an issue before starting major work
2. Assign the issue to yourself
3. Create a feature branch from `develop`
4. Keep PRs focused and small
5. Write clear commit messages
6. Update documentation when needed
7. Request review from at least one teammate

---

## Pull Request Rules

- PR title format: `[Feature] Add login screen`
- Link PR to issue (e.g., `Closes #12`)
- Include summary of changes
- Include screenshots for UI changes
- Must pass build/test checks
- At least 1 approval required
- No direct push to `main`

---

## Commit Message Convention

Use this format:
`<type>: <short description>`

Types:
- `feat` → new feature
- `fix` → bug fix
- `docs` → documentation
- `refactor` → code cleanup
- `test` → tests
- `chore` → maintenance tasks

Examples:
- `feat: add user signup endpoint`
- `fix: resolve cart total calculation bug`
- `docs: update API endpoint documentation`

---

## How to Run the Project

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Mobile App
1. Open `mobile-app` in Android Studio
2. Sync Gradle
3. Connect emulator/device
4. Run the app

---

## Future Improvements

- In-app notifications
- Ratings and reviews
- Product recommendation engine
- Payment integration
- Delivery tracking
- Admin dashboard

---

## Project Status

Current stage: **Planning / Initial Development**

---

## License

This project is for educational purposes as a student software engineering collaboration project.
