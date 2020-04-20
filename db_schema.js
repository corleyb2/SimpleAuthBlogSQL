require("dotenv").config();
const sql = require("mysql");

console.log(process.env.DB_PWD, process.env.DB_UN, process.env.DB_HOST);

const con = sql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_UN,
  password: process.env.DB_PWD,
});

con.connect((err) => {
  if (err) throw err;
  con.query("CREATE DATABASE IF NOT EXISTS travelblog;");
  con.query("USE travelblog");
  con.query(
    "CREATE TABLE IF NOT EXISTS users (id INT NOT NULL AUTO_INCREMENT UNIQUE, username VARCHAR(30) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL, PRIMARY KEY(id));",
    (err, results, fields) => {
      if (err) throw err;
      console.log(results);
    }
  );
  con.query(
    "CREATE TABLE IF NOT EXISTS blogposts (id INT NOT NULL AUTO_INCREMENT UNIQUE, userId INT NOT NULL, title VARCHAR(75) NOT NULL, blog VARCHAR(4000), blogdate DATE NOT NULL, PRIMARY KEY (id), FOREIGN KEY (userId) REFERENCES users(id));",
    (err, results, fields) => {
      if (err) throw err;
      console.log(results);
    }
  );
  con.end();
});
