const path = require("path");
const uuid = require("uuid");
const express = require("express");
const Intl = require("intl");
const mysql = require("mysql");
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
  const createdAt = now.toISOString().replace("T", " ").replace('Z', '');
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
  });

  res.redirect("submission-form-success");
});

app.listen(3001);
