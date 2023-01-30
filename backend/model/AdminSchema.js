const mongoose=require("mongoose")
const adminSchema=mongoose.Schema({
    name:{
        type:String
    },
    email:{
        type:String
    },mobile:{
        type:String
    },password:{
        type:String
    }


})

const Admin=mongoose.model("Admin",adminSchema)
module.export=Admin;