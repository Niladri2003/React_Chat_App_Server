const app = require("./app");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: "./config.env" });
process.on("uncaughtException", (err) => {
  console.log(err);
  process.exit(1);
});

const http = require("http");

const server = http.createServer(app);
const DB = process.env.MOGODB_URL.replace(
  "<PASSWORD>",
  process.env.DB_PASSWORD
);

// Connect Database
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log("Db connnection is succesful");
  })
  .catch((e) => {
    console.log(e);
  });

//server initiated
const port = process.env.PORT || 8000;
server.listen(port, () => {
  console.log(`Server is running on ${port}`);
});

//handling some error
process.on("unhandledRejection", (err) => {
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
