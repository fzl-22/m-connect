const path = require("path");
const uuid = require("uuid");
const express = require("express");
const mysql = require("mysql");
const session = require("express-session");
const { google } = require("googleapis");
const fs = require("fs");
require("dotenv").config();

const app = express();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: "my-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

app.get("/", function (req, res) {
  res.render("index");
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.get("/submission-form", function (req, res) {
  res.render("submission-form");
});

app.post("/submission-form", function (req, res) {
  const id = uuid.v4();
  const now = new Date();
  const createdAt = now.toISOString().replace("T", " ").replace("Z", "");
  const editedAt = createdAt;

  const requestBody = req.body;

  const submission = {
    id: id,
    ...requestBody,
    created_at: createdAt,
    edited_at: editedAt,
  };

  const insertQuery = `INSERT INTO data_pengajuan (id, nama, nama_PT, alamat_PT, email, no_telp_wa, jenis_pengajuan, deskripsi, status, tanggal_dibuat, tanggal_diedit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    submission.id,
    submission.nama,
    submission.nama_PT,
    submission.alamat_PT,
    submission.email,
    submission.no_telp_wa,
    submission.jenis_pengajuan,
    submission.deskripsi,
    submission.status,
    submission.created_at,
    submission.edited_at,
  ];

  connection.query(insertQuery, values, (error, results) => {
    if (error) {
      console.error("Error inserting data:", error);
      res.status(500).send("Error inserting data");
    } else {
      console.log("Data inserted successfully");
    }
    connection.end();
  });

  res.redirect("submission-form-success");
});

app.get("/admin/login", function (req, res) {
  res.render("admin-login");
});

app.post("/admin/login", function (req, res) {
  const username = req.body.username;
  const password = req.body.password;

  const selectQuery =
    "SELECT * FROM admin_users WHERE username = ? AND password = ?";
  const values = [username, password];

  connection.query(selectQuery, values, (error, results) => {
    if (error) {
      console.error("Error validating admin credentials:", error);
      res.status(500).send("Error validating admin credentials");
    } else {
      if (results.length > 0) {
        // Admin credentials are valid
        req.session.isAdminAuthenticated = true; // Set a session flag to indicate admin authentication
        res.redirect("/dashboard"); // Redirect to the admin dashboard
      } else {
        // Admin credentials are invalid
        res.render("admin-login", { error: "Invalid username or password" });
      }
    }
  });
});

app.get("/dashboard", function (req, res) {
  if (req.session.isAdminAuthenticated) {
    const selectQuery = "SELECT * FROM data_pengajuan";

    connection.query(selectQuery, (error, results) => {
      if (error) {
        console.error("Error retrieving data:", error);
        res.status(500).send("Error retrieving data");
      } else {
        res.render("dashboard", { submissions: results });
      }
    });
  } else {
    res.redirect("/admin/login"); // Redirect to the admin login page if not authenticated
  }
});

app.get("/dashboard/:id", function (req, res) {
  if (req.session.isAdminAuthenticated) {
    const id = req.params.id;
    const selectQuery = "SELECT * FROM data_pengajuan WHERE id = ?";

    const values = [id];

    connection.query(selectQuery, values, (error, results) => {
      if (error) {
        console.error("Error retrieving data:", error);
        res.status(500).send("Error retrieving data");
      } else {
        const submission = results[0]; // Access the first row of results

        if (submission) {
          res.render("submission-detail", { submission: submission });
        } else {
          res.status(404).send("Submission not found");
        }
      }
    });
  } else {
    res.redirect("/admin/login"); // Redirect to the admin login page if not authenticated
  }
});

app.get("/schedules", function (req, res) {
  if (req.session.isAdminAuthenticated) {
    const selectQuery = "SELECT * FROM schedules";

    connection.query(selectQuery, (error, results) => {
      if (error) {
        console.error("Error retrieving data:", error);
        res.status(500).send("Error retrieving data");
      } else {
        res.render("schedules", { schedules: results });
      }
    });
  } else {
    res.redirect("/admin/login"); // Redirect to the admin login page if not authenticated
  }
});

app.post("/schedules", function (req, res) {
  const id = uuid.v4();
  const requestBody = req.body;

  const schedule = {
    id: id,
    ...requestBody,
  };

  const insertQuery = `INSERT INTO schedules (id, nama_PT, time) VALUES (?, ?, ?)`;

  const values = [
    schedule.id,
    schedule.nama_PT,
    schedule.time
  ];

  connection.query(insertQuery, values, (error, results) => {
    if (error) {
      console.error("Error inserting data:", error);
      res.status(500).send("Error inserting data");
    } else {
      console.log("Data inserted successfully");
      res.redirect("/schedules"); // Redirect to the "/schedules" page on successful data insertion
    }
  });
});

app.delete("/schedules/:id", function (req, res) {
  const id = req.params.id;

  const deleteQuery = `DELETE FROM schedules WHERE id = ?`;

  connection.query(deleteQuery, [id], (error, results) => {
    if (error) {
      console.error("Error deleting schedule:", error);
      res.status(500).send("Error deleting schedule");
    } else {
      console.log("Schedule deleted successfully");
      res.sendStatus(204); // Send a success status code (204 No Content) indicating successful deletion
    }
  });
});

app.use(function (req, res) {
  res.send("<h1>404 Not Found!</h1>");
});

app.listen(3001);
