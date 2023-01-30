import { useEffect, useState,createContext } from "react"
import Message from "./Message"
const UserContext = createContext()

const Coversation=({conversation,currentUser})=>{
    const[user,setUser]=useState(null)
    // console.log(currentUser)
    // console.log("conversation-",conversation)
    const api=async()=>{
        const friendId=conversation.members.find(m=>m!==currentUser)
        
        // console.log(friendId)
        fetch(`http://localhost:4000/?userId=${friendId}`,{
            method:"GET",
            headers:{
                "content-type":"application/json",
                Accept:"application/json"
            }
        })
        .then(res=>res.json())
        .then(data=>{setUser(data.name);
    
        })
    }
    // console.log(user)
    
    useEffect(()=>{
        api()
    },[])

    return(
        <>
        
        {user}
        {/* <Message/> */}
        
        </>
    )
}
export default Coversation