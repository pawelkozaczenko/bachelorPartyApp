const express = require("express");
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
require("dotenv").config();
const app = express();

const PORT = process.env.PORT || 4000;

const initializePassport = require("./passportConfig");

initializePassport(passport);

// Middleware

// Parses details from a form
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");

app.use(
  session({
    // Key we want to keep secret which will encrypt all of our information
    secret: process.env.SESSION_SECRET,
    // Should we resave our session variables if nothing has changes which we dont
    resave: false,
    // Save empty value if there is no vaue which we do not want to do
    saveUninitialized: false
  })
);
// Funtion inside passport which initializes passport
app.use(passport.initialize());
// Store our variables to be persisted across the whole session. Works with app.use(Session) above
app.use(passport.session());
app.use(flash());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/resetdb", (req, res) => {
  pool.query(`DROP TABLE users`);
  pool.query(`DROP TABLE challenges`);
  /*pool.query(
    `CREATE TABLE users
    (id BIGSERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    password VARCHAR(200) NOT NULL,
    UNIQUE(email))`);
pool.query(
        `CREATE TABLE challenges
        (id BIGSERIAL PRIMARY KEY NOT NULL,
        name VARCHAR(200) NOT NULL,
        email VARCHAR(200) NOT NULL,
        success BOOLEAN NOT NULL,
        displayed BOOLEAN NOT NULL,
        content VARCHAR(600) NOT NULL);`);
  console.log("All required tables created successfully :)!");
  res.redirect("/");*/
});

app.get("/users/all", (req, res) => {
  console.log('Sekect * fron users');
  pool.query(
    `SELECT * FROM users WHERE email <> 'mikolajhalas@bachelor'`,
    (err, results) => {
      if (err) {
        console.log(err);
      }
      console.log(results.rows);
      res.render("users", { user: req.user.name, email: req.user.email, users: results.rows});
    }
  );
});


app.get("/users/register", checkAuthenticated, (req, res) => {
  res.render("register");
});

app.get("/users/login", checkAuthenticated, (req, res) => {
  // flash sets a messages variable. passport sets the error message
  //console.log(req.session.flash.error);
  res.render("login");
});

app.get("/users/board", checkNotAuthenticated, (req, res) => {
  console.log(req.isAuthenticated());
  console.log(JSON.stringify(req.user));
  //redirect for bachelor so he can take challege
  if (req.user.email == "mikolajhalas@bachelor") {
    pool.query(
      `SELECT * FROM challenges WHERE displayed = FALSE ORDER BY id`,
      (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results.rows);
        res.render("readboard", { user: req.user.name, email: req.user.email, challenge: results.rows[0]});
      }
    );
  }
  else {
    pool.query(
      `SELECT * FROM challenges ORDER BY id`,
      (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results.rows);
        res.render("board", { user: req.user.name, email: req.user.email, challenges: results.rows});
      }
    );
  }
});

app.get("/users/logout", checkNotAuthenticated, (req, res) => {
  req.logout(function(err) {
    if (err) { 
      req.flash("error_msg", err);
      res.redirect('/');
    }
    else {
      req.flash("success_msg", "You have logged out");
      res.redirect("/users/login");
    }
  })
});

app.get('/challenges/take', (req, res) => {
  // Access query string variables using req.query
  const id = req.query.id;
  console.log("Taking challenge #" + id);
  pool.query(
    `UPDATE challenges SET displayed = TRUE
        WHERE id = $1`,
    [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      res.redirect("/users/board");
    }
  );
});

app.get('/challenges/accept', (req, res) => {
  // Access query string variables using req.query
  const id = req.query.id;
  console.log("Accepting challenge #" + id);
  pool.query(
    `UPDATE challenges SET success = TRUE
        WHERE id = $1`,
    [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      res.redirect("/users/board");
    }
  );
});



app.post("/challenges/register", async (req, res) => {
  let {name, email, content} = req.body;

  let errors = [];

  console.log({
    email,
    content
  });

  if ( !content ) {
    errors.push({ message: "Please enter content field" });
  }

  if (content.length < 20) {
    errors.push({ message: "Content must be a least 20 characters long" });
  }

  if (content.length > 200) {
    errors.push({ message: "Content must be maximum 200 characters long" });
  }

  if (errors.length > 0) {
    pool.query(
      `SELECT * FROM challenges ORDER BY id`,
      (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log('retrieving all challenges');
        console.log(results.rows);
        res.render("board", { user: name, email: email, errors: errors, challenges: results.rows});
      }
    );
  } else {
    console.log("inserting content of lenth " +  content.length);
    // Validation passed
    pool.query(
      `INSERT INTO challenges (name, email, displayed, success, content)
          VALUES ($1, $2, FALSE, FALSE, $3)`,
      [name, email, content],
      (err, results) => {
        if (err) {
          throw err;
        }
        pool.query(
          `SELECT * FROM challenges ORDER BY id`,
          (err, results) => {
            if (err) {
              console.log(err);
            }
            console.log('retrieving all challenges');
            console.log(results.rows);
            req.flash("success_msg", "Challenge Added");
            res.redirect("/users/board");
          }
        );
      }
    );
  }
});

app.post("/users/register", async (req, res) => {
  let { name, email, password, password2 } = req.body;

  let errors = [];

  console.log({
    name,
    email,
    password,
    password2
  });

  if (!name || !email || !password || !password2) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ message: "Password must be a least 6 characters long" });
  }

  if (password !== password2) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("register", { errors, name, email, password, password2 });
  } else {
    hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    // Validation passed
    pool.query(
      `SELECT * FROM users
        WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results.rows);

        if (results.rows.length > 0) {
          return res.render("register", {
            message: "Email already registered"
          });
        } else {
          pool.query(
            `INSERT INTO users (name, email, password)
                VALUES ($1, $2, $3)
                RETURNING id, password`,
            [name, email, hashedPassword],
            (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              req.flash("success_msg", "You are now registered. Please log in");
              res.redirect("/users/login");
            }
          );
        }
      }
    );
  }
});

app.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: "/users/board",
    failureRedirect: "/users/login",
    failureFlash: true
  })
);

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/users/board");
  }
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});