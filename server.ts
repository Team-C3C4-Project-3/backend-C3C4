import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config();

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false };
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting;
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()); //add CORS support to each following route handler

const client = new Client(dbConfig);
// console.log(client);

client.connect();

app.get("/recentrecs", async (req, res) => {
  const dbres = await client.query(
    "select id, title, author, type, summary, link from recs order by submit_time desc limit 10;"
  );
  res.json(dbres.rows);
});

app.get("/types", async (req, res) => {
  const types = [
    "podcast",
    "article",
    "webpage",
    "video",
    "interactive-course",
    "eBook",
    "exercise",
    "tool",
    "other",
  ];
  res.json({ types: types });
});

app.get("/users", async (req, res) => {
  const dbres = await client.query("select * from users");
  res.json(dbres.rows);
});

app.get<{ type: string }>("/rec/:type", async (req, res) => {
  const dbres = await client.query("select * from recs where type=$1", [
    req.params.type,
  ]);
  res.json(dbres.rows);
});

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw "Missing PORT environment variable.  Set it in .env file.";
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
