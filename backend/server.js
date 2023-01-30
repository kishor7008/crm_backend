const express = require("express");
const app = express()
const cors = require("cors");
const bcrypt = require("bcryptjs")
const User = require("./model/UserSchema")
const Task = require("./model/TaskSchema")
const multer = require("multer");
const Conversation=require("./model/Conversation")
const Message=require("./model/Message")
const { protect } = require('./middlewares/authMiddware')
const geterateToken = require("./utils/generateToken")
const {
  GridFsStorage
} = require("multer-gridfs-storage");

const { default: mongoose } = require("mongoose");
app.use(cors());
app.use(express.json())

// mongoose.connect("mongodb+srv://kishor7008:kishor7008@cluster0.lemjlsf.mongodb.net/?retryWrites=true&w=majority",()=>{
//     console.log("mongodb connected")
// })



const mongouri = 'mongodb+srv://kishor7008:kishor7008@cluster0.lemjlsf.mongodb.net/?retryWrites=true&w=majority';
try {
  mongoose.connect(mongouri, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  });
} catch (error) {
  handleError(error);
}
process.on('unhandledRejection', error => {
  console.log('unhandledRejection', error.message);
});

//creating bucket
let bucket;
mongoose.connection.on("connected", () => {
  var client = mongoose.connections[0].client;
  var db = mongoose.connections[0].db;
  bucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: "newBucket"
  });
  console.log(bucket);
});

app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));

const storage = new GridFsStorage({
  url: mongouri,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = file.originalname;
      const fileInfo = {
        filename: filename,
        bucketName: "newBucket"
      };
      resolve(fileInfo);
    });
  }
});

const upload = multer({
  storage
});

// app.get("/", (req, res) => {
//   res.json("kewjcsnkwe")
// })

//register api
app.post("/register", async (req, res) => {
  try{
  let userExist = await User.findOne({ "email": req.body.email });
  console.log(userExist)
  if (userExist) {

    res.status(401).json("already exist");
    return;
  } else {
    let hashPassword = await bcrypt.hash(req.body.password, 10);

    let response = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      password: hashPassword,

    })
    console.log(response)
    await response.save()
    res.json(response)
  }
}catch(err){
  res.status(500).json(err);
}
})


//login api
app.post("/login", async (req, res) => {
  try{
  const { email, password } = req.body;
  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(400).json("user not found")
  } else {
    if (user && await bcrypt.compare(req.body.password, user.password)) {
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        token: geterateToken(user._id)
      })
    } else {
      return res.status(400).json("credential mismatch")
    }
  }
}catch(err){
  res.status(500).json(err);
  
}
})
//admin send task to user through user _id
app.post("/assign/:id", upload.single("file"), async (req, res) => {
  try{
  const id = req.params.id
  const response = new Task({
    name: req.body.name,
    description: req.body.description,
    file: req.file.filename,
    user: id,
    status: req.body.status
  })
  await response.save();

  const userAssign = await User.findOne({ "_id": id })
  const taskList = [...userAssign.task, response]
  console.log(taskList)
  await User.updateOne({ "_id": id }, { $set: { "task": taskList } })
  res.json(response)
}catch(err){
  res.status(500).json(err);

}
})


//user update the task status

app.post('/accept/:id', protect, async (req, res) => {
  try{
  let message = req.body.message;
  console.log(message)
  let id = req.params.id
  const user = await User.findOne({ "_id": req.user._id })

  let task = user.task

  var index = task.map(object => object._id.valueOf()).indexOf(id)
  console.log(index)
  var j = task[index].status
  console.log(j)
  let update = await User.findByIdAndUpdate({ "_id": req.user._id }, { $set: { [`task.${index}.status`]: `${message}` } })
  await Task.updateOne({ "_id": id }, { $set: { "status": `${message}` } })
  res.json(message)
  }catch(err){
  res.status(500).json(err);

  }
})

// showing all user task pdf


app.get("/user/:id", protect, async (req, res) => {
try{
  let response = await User.find({ "_id": req.user._id })
  let task = response[0].task
  var index = task.map(object => object._id.valueOf()).indexOf(req.params.id)
  console.log(index)
  bucket.openDownloadStreamByName(response[0].task[index].file)
    .pipe(res);
  // res.read(response[0].task[index].file)
}catch(err){
  res.status(500).json(err);

}
})

// api for single user information
app.get("/userinfo", protect, async (req, res) => {
  try{
  let response = await User.findOne({ "_id": req.user._id }).select({"password":0})
  res.json(response)
}catch(err){
  res.status(500).json(err);

}
})


//all user details 
app.get("/allusers", async (req, res) => {
  try{
  let allUser = await User.find().select({"password":0})
  res.json(allUser)
  }catch(err){
  res.status(500).json(err);

  }
})

// admin cheek the task staus and assign employee input the name of the task
app.get('/task/:id',async(req,res)=>{
try{
  let response=await Task.findOne({"_id":req.params.id}).populate("user")
  res.json(response)
}catch(err){
  res.status(500).json(err);

}
})



// connection with 2person
app.post("/conversation", async (req, res) => {
  const newConversation = new Conversation({
    members: [req.body.senderId, req.body.receiverId],
  });

  try {
    const savedConversation = await newConversation.save();
    res.status(200).json(savedConversation);
  } catch (err) {
    res.status(500).json(err);
  }
});

// list of connection of current user
app.get("/conversation/list",protect, async (req, res) => {
  console.log(req.user)
  try {
    const conversation = await Conversation.find({
      members: { $in: [req.user._id.valueOf()] },
    });
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
});

// particular 2 person connection
app.get("/find/:firstUserId/:secondUserId", async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      members: { $all: [req.params.firstUserId, req.params.secondUserId] },
    });
    res.status(200).json(conversation)
  } catch (err) {
    res.status(500).json(err);
  }
});


//sending message 
app.post("/message", async (req, res) => {
  const newMessage = new Message(req.body);

  try {
    const savedMessage = await newMessage.save();
    res.status(200).json(savedMessage);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get sms between two person taking conversation id
app.get("/:conversationId", async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    });
    console.log(messages[messages.length-1].text)
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
});

app.get("/lastmessage/:conversationId",async(req,res)=>{
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    });
    // console.log(messages[messages.length-1].text)
    let lastMessage={
      sender:messages[messages.length-1].sender,
      text:messages[messages.length-1].text

    }
    res.status(200).json(lastMessage);
  } catch (err) {
    res.status(500).json(err);
  }
})


// to find connection person details
app.get("/", async (req, res) => {
  const userId = req.query.userId;
  const username = req.query.username;
  try {
    const user = userId
      ? await User.findById(userId)
      : await User.findOne({ username: username });
   console.log(user)
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});




app.listen(4000, () => {
  console.log("server started")
})