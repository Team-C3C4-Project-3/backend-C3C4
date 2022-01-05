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

interface TagResObject {
  tag: string;
}

app.get<{ rec_id: number }>("/rec/:rec_id", async (req, res) => {
  const recRes = await client.query(
    "select * from recs join users on recs.user_id = users.id where recs.id = $1",
    [req.params.rec_id]
  );
  const commentRes = await client.query(
    "select * from comments where rec_id = $1",
    [req.params.rec_id]
  );
  const tagRes = await client.query("select tag from tags where rec_id = $1", [
    req.params.rec_id,
  ]);
  // const tags = tagRes.map((element: TagResObject) => element.tag);
  const response = {
    recInfo: recRes.rows,
    comments: commentRes.rows,
    tags: tagRes.rows,
  };
  console.log(response);
  res.json(response);
});

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
  res.json(types);
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

app.get("/tags", async (req, res) => {
  const tags = [
    "creative coding",
    "JavaScript",
    "HTML/CSS",
    "React",
    "TypeScript",
    "people skills",
    "Git",
    "CI/CD",
    "SQL",
    "workflows",
    "Heroku",
    "server",
    "database",
    "promise",
    "API",
  ];
  res.json(tags);
});

app.get<{ user_id: number }>("/studylist/:user_id", async (req, res) => {
  const dbres = await client.query(
    "select id, title, author, type, summary, link, submit_time from study_list join recs on study_list.rec_id = recs.id where study_list.user_id = $1",
    [req.params.user_id]
  );
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
