const express = require("express");
const Expense = require("../models/Expense");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find().sort({
      date: -1,
    });

    res.status(200).json(expenses);
  } catch (error) {
    console.error(
      "Get transactions error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch transactions",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      title,
      amount,
      category,
      type,
      date,
      note,
    } = req.body;

    if (
      !title ||
      amount === undefined ||
      !category
    ) {
      return res.status(400).json({
        message:
          "Title, amount and category are required",
      });
    }

    const expense = new Expense({
      title: String(title).trim(),
      amount: Number(amount),
      category,
      type: type || "expense",
      date: date || new Date(),
      note: note || "",
    });

    const savedExpense =
      await expense.save();

    res.status(201).json(savedExpense);
  } catch (error) {
    console.error(
      "Create transaction error:",
      error
    );

    res.status(400).json({
      message: "Failed to create transaction",
      error: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedExpense =
      await Expense.findByIdAndDelete(
        req.params.id
      );

    if (!deletedExpense) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      message:
        "Transaction deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete transaction error:",
      error
    );

    res.status(500).json({
      message: "Failed to delete transaction",
    });
  }
});

module.exports = router;
