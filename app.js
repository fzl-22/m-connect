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



// client_secret_109198904198-jheuh9u5t3khinslqbqng1tr6gme4nf4.apps.googleusercontent.com.json

// app.get("/dashboard/spreadsheet", function (req, res) {
//   if (req.session.isAdminAuthenticated) {
//     // Load the credentials from a JSON file (generated from Google Cloud Console)
//     const credentials = require("./client_secret_109198904198-jheuh9u5t3khinslqbqng1tr6gme4nf4.apps.googleusercontent.com.json");

//     // Define the required scopes
//     const SCOPES = ["https://www.googleapis.com/auth/drive"];

//     // Create a new OAuth2 client
//     const { client_secret, client_id, redirect_uris } = credentials.installed;
//     const oAuth2Client = new google.auth.OAuth2(
//       client_id,
//       client_secret,
//       redirect_uris[0]
//     );

//     // Generate the URL for user authorization
//     const authUrl = oAuth2Client.generateAuthUrl({
//       access_type: "offline",
//       scope: SCOPES,
//     });

//     res.redirect(authUrl);
//   } else {
//     res.redirect("/admin/login"); // Redirect to the admin login page if not authenticated
//   }
// });

// app.get("/dashboard/spreadsheet/callback", function (req, res) {
//   if (req.session.isAdminAuthenticated) {
//     // Load the credentials from a JSON file (generated from Google Cloud Console)
//     const credentials = require('./client_secret_109198904198-jheuh9u5t3khinslqbqng1tr6gme4nf4.apps.googleusercontent.com.json');

//     // Create a new OAuth2 client
//     const { client_secret, client_id, redirect_uris } = credentials.installed;
//     const oAuth2Client = new google.auth.OAuth2(
//       client_id, client_secret, redirect_uris[0]
//     );

//     // Get the authorization code from the query parameters
//     const code = req.query.code;

//     // Exchange the authorization code for access and refresh tokens
//     oAuth2Client.getToken(code, (err, token) => {
//       if (err) {
//         console.error('Error retrieving access token', err);
//         res.status(500).send('Error retrieving access token');
//         return;
//       }

//       // Store the tokens for later use (e.g., refresh token)
//       fs.writeFileSync('./token.json', JSON.stringify(token));

//       // Set the credentials for future API requests
//       oAuth2Client.setCredentials(token);

//       // Create a new spreadsheet using the Google Sheets API
//       const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

//       sheets.spreadsheets.create({
//         resource: {
//           properties: {
//             title: 'New Spreadsheet'
//           }
//         }
//       }, (err, response) => {
//         if (err) {
//           console.error('Error creating spreadsheet', err);
//           res.status(500).send('Error creating spreadsheet');
//           return;
//         }

//         const spreadsheetId = response.data.spreadsheetId;

//         // Fetch the data from MySQL database
//         const selectQuery = 'SELECT id, nama, nama_PT, email FROM data_pengajuan';
//         connection.query(selectQuery, (error, results) => {
//           if (error) {
//             console.error('Error retrieving data from MySQL:', error);
//             res.status(500).send('Error retrieving data from MySQL');
//             return;
//           }

//           const values = results.map((result) => [
//             result.id,
//             result.nama,
//             result.nama_PT,
//             result.email,
//           ]);

//           // Write the data to the spreadsheet
//           sheets.spreadsheets.values.update({
//             spreadsheetId: spreadsheetId,
//             range: 'Sheet1!A1:D',
//             valueInputOption: 'USER_ENTERED',
//             resource: {
//               values: values,
//             },
//           }, (err, response) => {
//             if (err) {
//               console.error('Error populating spreadsheet', err);
//               res.status(500).send('Error populating spreadsheet');
//               return;
//             }

//             const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

//             res.redirect(spreadsheetUrl);
//           });
//         });
//       });
//     });
//   } else {
//     res.redirect("/admin/login"); // Redirect to the admin login page if not authenticated
//   }
// });


app.listen(3001);
