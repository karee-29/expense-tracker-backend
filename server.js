const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Expense = require("./models/Expense");
const User = require("./models/User");
const auth = require("./middleware/auth");

const app = express();

app.use(cors());
app.use(express.json());

// =========================
// MONGODB CONNECTION
// =========================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.log(err);
  });

// =========================
// HOME ROUTE
// =========================

app.get("/", (req, res) => {
  res.send("Backend Working!");
});

// =========================
// SIGNUP
// =========================

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } =
      req.body;

    const existingUser =
      await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({
      message:
        "User registered successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// =========================
// LOGIN
// =========================

app.post("/login", async (req, res) => {
  try {
    const { email, password } =
      req.body;

    const user =
      await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// =========================
// GET USER EXPENSES
// =========================

app.get(
  "/expenses",
  auth,
  async (req, res) => {
    try {
      const expenses =
        await Expense.find({
          userId: req.user.id,
        }).sort({
          createdAt: -1,
        });

      res.json(expenses);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

// =========================
// ADD EXPENSE
// =========================

app.post(
  "/expenses",
  auth,
  async (req, res) => {
    try {
      const expense = new Expense({
        name: req.body.name,
        amount: req.body.amount,
        category: req.body.category,
        userId: req.user.id,
      });

      const savedExpense =
        await expense.save();

      res.json(savedExpense);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

// =========================
// UPDATE EXPENSE
// =========================

app.put(
  "/expenses/:id",
  auth,
  async (req, res) => {
    try {
      const updatedExpense =
        await Expense.findOneAndUpdate(
          {
            _id: req.params.id,
            userId: req.user.id,
          },
          {
            name: req.body.name,
            amount: req.body.amount,
            category:
              req.body.category,
          },
          {
            new: true,
          }
        );

      res.json(updatedExpense);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

// =========================
// DELETE EXPENSE
// =========================

app.delete(
  "/expenses/:id",
  auth,
  async (req, res) => {
    try {
      await Expense.findOneAndDelete({
        _id: req.params.id,
        userId: req.user.id,
      });

      res.json({
        message:
          "Expense Deleted",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

// =========================
// START SERVER
// =========================

app.listen(5000, () => {
  console.log(
    "Server Running on Port 5000"
  );
});