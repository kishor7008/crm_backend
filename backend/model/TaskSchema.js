const mongoose=require("mongoose")
const taskSchema=mongoose.Schema({
    name:{
        type:String
    },
    description:{
        type:String,
    },
    file:{
        type:String
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User"
    },
    status:{
        type:String
    },
    taskId:{
        type:String
    },
    update:[]
})

const Task=mongoose.model("Task",taskSchema)
module.exports=Task