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
    "select * from comments join users on comments.user_id = users.id where rec_id = $1;",
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
  if (recRes.rowCount === 0 || tagRes.rowCount === 0) {
    res
      .status(400)
      .json({ status: "failed", message: "one of the responses were empty" });
  } else {
    res.status(200).json({ status: "success", data: response });
  }
});

app.get("/recentrecs", async (req, res) => {
  const dbres = await client.query(
    "select id, user_id, title, author, type, summary, link, submit_time from recs order by submit_time desc limit 10;"
  );
  if (dbres.rowCount === 0) {
    res
      .status(400)
      .json({ status: "failed", message: "one of the responses were empty" });
  } else {
    res.status(200).json({ status: "success", data: dbres.rows });
  }
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
  res.status(200).json({ status: "success", data: types });
});

app.get("/users", async (req, res) => {
  const dbres = await client.query("select * from users");
  if (dbres.rowCount === 0) {
    res.status(400).json({ status: "failed", message: "response is empty" });
  } else {
    res.status(200).json({ status: "success", data: dbres.rows });
  }
});

app.get<{ type: string }>("/recs/:type", async (req, res) => {
  const dbres = await client.query("select * from recs join users on recs.user_id = users.id where type = $1 order by submit_time desc limit 50;", [
    req.params.type,
  ]);
  if (dbres.rowCount === 0) {
    res
      .status(400)
      .json({ status: "failed", message: "one of the responses were empty" });
  } else {
    res.status(200).json({ status: "success", data: dbres.rows });
  }
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
  res.status(200).json({ status: "success", data: tags });
});

app.get<{ user_id: number }>("/studylist/:user_id", async (req, res) => {
  const dbres = await client.query(
    "select id, title, author, type, summary, link, submit_time from study_list join recs on study_list.rec_id = recs.id where study_list.user_id = $1",
    [req.params.user_id]
  );
  if (dbres.rowCount === 0) {
    res
      .status(400)
      .json({ status: "failed", message: "one of the responses were empty", data:[] });
  } else {
    res.status(200).json({ status: "success", data: dbres.rows });
  }
});

app.get<{ user_id: number }>("/user/:user_id", async (req, res) => {
  const dbres = await client.query("select * from users where id = $1;", [
    req.params.user_id,
  ]);
  if (dbres.rowCount === 0) {
    res
      .status(400)
      .json({ status: "failed", message: "one of the responses were empty" });
  } else {
    res.status(200).json({ status: "success", data: dbres.rows });
  }
});

//post new recommendation
app.post("/rec", async (req, res) => {
  try {
    let { title, type, link, author, status, reason, summary, tags, user_id } =
      req.body;
    const dbres = await client.query(
      "insert into recs (user_id, title, author, type, link, summary, status, reason) values ($1, $2, $3, $4, $5, $6, $7, $8) returning *;",
      [user_id, title, author, type, link, summary, status, reason]
    );

    const recentRecID = await client.query(
      "select id from recs order by submit_time desc limit 1;"
    );

    tags.forEach(async (tag: string) => {
      await client.query("insert into tags (rec_id, tag) values ($1, $2);", [
        recentRecID.rows[0].id,
        tag,
      ]);
    });
    // console.log(recentRecID.rows[0].id)
    res.status(200).json({ status: "success", data: dbres.rows });
  } catch (error) {
    console.error(error);
  } finally {
  }
});

//post new comment
app.post("/comment", async (req, res) => {
  try {
    let { user_id, rec_id, comment } = req.body;
    const dbres = await client.query(
      "insert into comments (user_id, rec_id, comment) values ($1, $2, $3) returning *;",
      [user_id, rec_id, comment]
    );
    if (comment.length === 0) {
      res
        .status(400)
        .json({ status: "failure", message: "comment body is empty" });
    } else {
      res.status(200).json({ status: "success", data: dbres.rows });
    }
  } catch (error) {
    console.error(error);
  } finally {
  }
});

//add 1 like
app.put("/like/:rec_id", async (req, res) => {
  try {
    let { rec_id } = req.params;
    const dbres = await client.query(
      "update recs set likes = likes + 1 where recs.id = $1",
      [rec_id]
    );
    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error(error);
  } finally {
  }
});

//add 1 dilike
app.put("/dislike/:rec_id", async (req, res) => {
  try {
    let { rec_id } = req.params;
    const dbres = await client.query(
      "update recs set dislikes = dislikes + 1 where recs.id = $1",
      [rec_id]
    );
    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error(error);
  } finally {
  }
});

//Add rec to user's study list
app.post("/study-list/:user_id/:rec_id", async (req, res) => {
  try {
    let { user_id, rec_id } = req.params;
    const dbres = await client.query(
      "insert into study_list (user_id, rec_id) values ($1, $2) returning *;",
      [user_id, rec_id]
    );

    res.status(200).json({ status: "success", data: dbres.rows });
  } catch (error) {
    console.error(error);
  } finally {
  }
});

app.delete("/study-list/:user_id/:rec_id", async (req, res) => {
  try {
    let { user_id, rec_id } = req.params;
    const dbres = await client.query(
      "DELETE FROM study_list WHERE rec_id = $1 AND user_id = $2",
      [rec_id, user_id]
    );
    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error(error);
  } finally {
  }
});

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw "Missing PORT environment variable.  Set it in .env file.";
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});

export default app;
