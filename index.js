const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
require("dotenv").config();
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

// Contact Schema
const contactSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  company: String,
  subject: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
});

const Contact = mongoose.model("Contact", contactSchema);

// Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Contact Form Route
app.post("/api/contact", async (req, res) => {
  try {
    const { name, phone, email, company, subject, message } = req.body;

    // Save to Database
    const newContact = new Contact({
      name,
      phone,
      email,
      company,
      subject,
      message,
    });
    await newContact.save();

    // Email to admin (you)
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to your inbox
      subject: `New Contact Form Submission: ${subject}`,
      text: `
New contact form submission details:

Name: ${name}
Email: ${email}
Phone: ${phone}
Company: ${company}
Subject: ${subject}
Message: ${message}

Time: ${new Date().toLocaleString()}
      `,
    };

    // Email to user
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Message Received: ${subject}`,
      text: `Hello ${name},\n\nThank you for reaching out!\n\nWe received your message: \n\n${message}\n\nWe will get back to you soon!\n\nBest Regards,\nYour Company Name`,
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions),
    ]);

    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Your PORTFOLIO server is up and running ...",
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
