const express = require("express");
const app = express()
const cors = require("cors");
const bcrypt = require("bcryptjs")
const User = require("./model/UserSchema")
const Task = require("./model/TaskSchema")
const multer = require("multer");
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

app.get("/", (req, res) => {
  res.json("kewjcsnkwe")
})

//register api
app.post("/register", async (req, res) => {
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
    await response.save()
    res.json(response)
  }
})


//login api
app.post("/login", async (req, res) => {
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
})
//admin send task to user through user _id
app.post("/assign/:id", upload.single("file"), async (req, res) => {
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
})


//user update the task status

app.post('/accept/:id', protect, async (req, res) => {
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
  res.json(update)
})

// showing all user task pdf


app.get("/user/:id", protect, async (req, res) => {

  let response = await User.find({ "_id": req.user._id })
  let task = response[0].task
  var index = task.map(object => object._id.valueOf()).indexOf(req.params.id)
  console.log(index)
  bucket.openDownloadStreamByName(response[0].task[index].file)
    .pipe(res);
})

// api for single user information
app.get("/userinfo", protect, async (req, res) => {
  let response = await User.findOne({ "_id": req.user._id })
  res.json({
    _id: response._id,
    name: response.name,
    email: response.email,
    mobile: response.mobile,
    task: response.task
  })
})


//all user details 
app.get("/allusers", async (req, res) => {
  let allUser = await User.find()
  res.json(allUser)
})

// admin cheek the task staus and assign employee input the name of the task
app.get('/task/:id',async(req,res)=>{

  let response=await Task.findOne({"_id":req.params.id}).populate("user")
  res.json(response)
})





app.listen(4000, () => {
  console.log("server started")
})