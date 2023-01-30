import { useEffect, useRef, useState } from "react";
import Coversation from "./Conversation";
import axios from "axios"
import { io } from "socket.io-client"
import Message from "./Message";
const Chat = () => {
    const [conversation, setConversation] = useState([])
    const [currentChat, setCurrentChat] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState("")
    const user = localStorage.getItem("user")
    const[arrivalMessage,setArrivalMessage]=useState(null)
    const [socket,setSocket]= useState(io("ws://localhost:8900"))
    useEffect(()=>{
        // socket.current=
        socket.on("getMessage",data=>{
setArrivalMessage({
    sender:data.senderId,
    text:data.text,
    createdAt:Date.now()
})
        })
    },[])


    useEffect(()=>{
       arrivalMessage&& currentChat?.members.includes(arrivalMessage.sender) &&
       setMessages((prev)=>[...prev,arrivalMessage]) 
    },[arrivalMessage,currentChat])





    useEffect(() => {
       socket.emit("addUser",user)
       socket.on("getUsers",users=>{
        console.log(users)
       })
    }, [user])
    

    const token = localStorage.getItem("token")
    useEffect(() => {
        fetch("http://localhost:4000/conversation/list", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`
            }
        }).then(res => res.json())
            .then(data => {
                setConversation(data)
                // console.log("set conversation-", data)
            }
            )
    }, [user])

    const getMessages = async () => {
        try {
            const res = await axios.get(`http://localhost:4000/${currentChat._id}`)
            setMessages(res.data)
            // console.log("message--------", res.data)

        } catch (err) {
            // console.log(err)
        }
    }
    useEffect(() => {

        getMessages()
    }, [currentChat])
    // console.log(currentChat._id)



    const handelSubmit = async (e) => {
        // console.log(newMessage)
        e.preventDefault()
        const message = {
            sender: user,
            text: newMessage,
            conversationId: currentChat._id
        };
        const receiverId=currentChat.members.find(member=>member!=user)
        socket.emit("sendMessage",{
            senderId:user,
            receiverId,
            text:newMessage
        })
        try {
            fetch("http://localhost:4000/message", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",

                },
                body: JSON.stringify(message)
            }).then(res => res.json())
                .then(data => {
                    setMessages([...messages, data])
                    setNewMessage("")
                })
        } catch (error) {
            console.log(error)
        }
    }


    return (
        <>
            {conversation.map((c,index) => {
                return (
                    <>
                        <div onClick={() => setCurrentChat(c)} key={index}>
                            <Coversation conversation={c} currentUser={user} />
                        </div>
                    </>
                )
            })}
            <h1>CHAT</h1>
            {currentChat ? <>
                {messages.map((m,index) => {
                    return (
                        <>
                        <div key={index}>
                            <Message message={m} own={m.sender === user} />
                            </div>
                        </>
                    )
                })}
                <input type="textarea" onChange={(e) => setNewMessage(e.target.value)} value={newMessage} />
                <button onClick={handelSubmit}>submit</button>

            </> : <span>Open a conversation to start</span>

            }


        </>
    )
}
export default Chat;