const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
app.use(express.json());
let db = null;

const dbPath = path.join(__dirname, "userData.db");
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("SERVER IS RUNNING AT http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// APL 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `select * from user where username = '${username}';`;
  const dbResponse = await db.get(selectUserQuery);

  if (dbResponse === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createRegisterQuery = `
        INSERT INTO
            user(username ,name, password, gender, location)
        VALUES(
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}');`;

      const Register = await db.run(createRegisterQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// APL 2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `select * from user where username = '${username}';`;
  const dbResponse = await db.get(selectUserQuery);

  if (dbResponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    /*const createRegisterQuery = `
        INSERT INTO
            user(username ,password)
        VALUES(
            '${username}',
            '${password}');`;

    await db.run(createRegisterQuery); */
    const isPasswordMatched = await bcrypt.compare(
      password,
      dbResponse.password
    );
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// APL 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `select * from user where username = '${username}';`;
  const dbResponse = await db.get(selectUserQuery);

  if (dbResponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      dbResponse.password
    );
    if (isPasswordMatch === true) { 
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updateUserQuery = `
          UPDATE
            user
          SET
            password = '${hashedPassword}'
          where
            username = '${username}';`;
        const updateQuery = await db.run(updateUserQuery);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
