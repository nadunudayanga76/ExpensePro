
  # 💸 ExpensePro - Smart Budget & Expenses Tracker
  
  **A modern, premium, and intelligent financial tracker built with the MERN Stack.** <br>
  *Track your spending, manage your budgets, and achieve your financial goals with smart AI-driven insights.*

  [![React](https://img.shields.io/badge/React-18.x-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Latest-47A248.svg?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
</div>

---

## 🌟 About The Project

**ExpensePro** is not just another expense tracker. It is a full-featured financial management dashboard that provides deep insights into your spending habits. Designed with a sleek **Glassmorphism Dark UI**, it offers a premium user experience while keeping everything lightning fast and secure.

Whether you're managing multiple wallets, tracking monthly budgets, or looking for ways to save money, ExpensePro has got you covered.

---

## ✨ Key Features

* 📊 **Comprehensive Dashboard:** Get a bird's-eye view of your total net worth, monthly income, expenses, and savings.
* 💳 **Multi-Wallet Support:** Manage your cash, bank accounts, and credit cards all in one place.
* 🎯 **Smart Budgeting:** Set spending limits for different categories and track your progress visually.
* 🧠 **Smart Saving Plans:** AI-inspired financial advice based on your historical spending behavior (e.g., 7-Day Aggressive Savings, 30-Day Balanced Plans).
* 🔔 **Dynamic Notifications:** Get real-time alerts whenever you log an expense or income.
* 📈 **Visual Insights:** Beautiful charts and breakdowns of your cash flow.
* 🌙 **Premium Dark UI:** Carefully crafted glassmorphism design with smooth animations.
* 📱 **Fully Responsive:** Works perfectly on both desktop and mobile devices.

---

## 🛠️ Tech Stack

This project is built using the **MERN** stack along with modern tooling:

**Frontend:**
- **React.js** (v18)
- **TypeScript** (Strong typing)
- **Vite** (Lightning-fast build tool)
- **Vanilla CSS** (Custom CSS variables, Glassmorphism, animations)
- **Lucide React** (Beautiful modern icons)

**Backend:**
- **Node.js & Express.js** (REST API)
- **MongoDB & Mongoose** (Database & ODM)
- **CORS & Dotenv** (Security & Environment configuration)

---

## 🚀 Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites
Make sure you have the following installed:
* [Node.js](https://nodejs.org/en/download/) (v16 or higher)
* [MongoDB](https://www.mongodb.com/try/download/community) (Running locally or MongoDB Atlas)
* Git

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/nadunudayanga76/ExpensePro.git
cd ExpensePro
```

**2. Setup Backend**
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory and add your MongoDB URI:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/expense_tracker
JWT_SECRET=your_super_secret_jwt_key
```
Start the backend server:
```bash
npm start
```

**3. Setup Frontend**
Open a new terminal window and navigate to the frontend folder:
```bash
cd frontend
npm install
```
Start the Vite development server:
```bash
npm run dev
```

**4. View the App**
Open your browser and navigate to `http://localhost:5173`. You're all set! 🎉

---

## 📂 Project Structure

```text
ExpensePro/
├── backend/                  # Node.js + Express API
│   ├── models/               # Mongoose schemas (User, Expense, Wallet, etc.)
│   ├── routes/               # API endpoints
│   ├── middleware/           # Authentication & validation
│   └── server.js             # Entry point
│
└── frontend/                 # React + Vite UI
    ├── src/
    │   ├── assets/           # Images and SVGs
    │   ├── components/       # Reusable UI components (GlowCard, Sidebar, etc.)
    │   ├── pages/            # Main views (Dashboard, Budgets, Insights)
    │   ├── utils/            # Helper functions (API calls, formatters)
    │   ├── App.tsx           # App routing
    │   └── index.css         # Global styles & Glassmorphism design
    └── package.json          # Frontend dependencies
```

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/nadunudayanga76/ExpensePro/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License
This project is licensed under the MIT License.

<div align="center">
  <p>Made with ❤️ by Nadun Udayanga</p>
</div>
