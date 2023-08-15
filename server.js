const app = require("./app");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
//importing socket
const { Server } = require("socket.io");

dotenv.config({ path: "./config.env" });
process.on("uncaughtException", (err) => {
  console.log(err);
  process.exit(1);
});

const http = require("http");
const User = require("./models/User");
const FriendRequest = require("./models/friendRequest");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const DB = process.env.MOGODB_URL.replace(
  "<PASSWORD>",
  process.env.DB_PASSWORD
);

// Connect Database
mongoose
  .connect(DB, {
    useNewUrlParser: true,
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

// initiating socket server
io.on("connection", async (socket) => {
  console.log(socket);
  console.log(JSON.stringify(socket.handshake.query));

  const user_id = socket.handshake.query["user_id"];

  const socket_id = socket.id;
  console.log("USer connected", socket_id);

  if (Boolean(user_id)) {
    await User.findByIdAndUpdate(user_id, { socket_id, status: "online" });
  }
  //we can write socket event listeners here..
  socket.on("friend_request", async (data) => {
    console.log(data.to);
    //data=>{to,from}

    const to_user = await User.findById(data.to).select("socket_id");
    const from_user = await User.findById(data.to).select("socket_id");

    //create friend request

    await FriendRequest.create({
      sender: data.from,
      recipent: data.to,
    });
    //emit event => new_friend requets
    io.to(to_user.socket_id).emit("new_friend_request", {
      //
      message: "New Friend Requtest Recived",
    });

    //emit event => new_friend sent
    io.to(from_user.socket_id).emit("request_Sent", {
      message: "Request sent succesfully",
    });
  });
  socket.on("accept_requets", async (data) => {
    console.log(data);
    const request_doc = await FriendRequest.findById(data.request_id);
    console.log(request_doc);

    const sender = await User.findById(request_doc.sender);
    const reciver = await User.findById(request_doc.recipent);

    sender.friends.push(request_doc.recipent);
    reciver.friends.push(request_doc.sender);

    await reciver.save({ new: true, validateModifiedOnly: true });
    await sender.save({ new: true, validateModifiedOnly: true });

    await FriendRequest.findByIdAndDelete(data.request_id);

    io.to(sender.socket_id).emit("request_accepted", {
      message: "Friend Request Accepted",
    });
    io.to(reciver.socket_id).emit("request_accepted", {
      message: "Friend Request Accepted",
    });
  });
  // Handle text and link messages

  socket.on("text_message", (data) => {
    console.log("Recived message", data);

    //data:{to, from, text}

    //create a new conversation if it doesn't exist yet or add new message to the message list

    //save to db

    //emit incoming_message -> to user

    //emit outgoing_message -> from user
  });

  // Handle media and link messages

  socket.on("file_message", (data) => {
    console.log("Recived message", data);

    //data:{to , from, text, file}

    // get the file extension
    const fileExtension = path.extname(data.file.name);

    // generate a unique file name

    const fileName = `${Date.now()}_${Math.floor(
      Math.random() * 10000
    )}${fileExtension}`;

    // upload file to AWS s3

    // create a new conversation if its dosent exists yet or add a new message to existing conversation

    // save to db

    // emit incoming_message -> to user

    // emit outgoing_message -> from user
  });

  socket.on("end", async (data) => {
    // Find user by _id and set the status to offline

    if (data.user_id) {
      await User.findByIdAndUpdate(data.user_id, { status: "Offline" });
    }
    //TODO broadcast user disconnected

    console.log("Closign connection");
    socket.disconnect(0);
  });
});

app.get("/", (req, res) => {
  return res.status(200).json({
    status: "Success",
    message: "Server running",
  });
});
//handling some error
process.on("unhandledRejection", (err) => {
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
