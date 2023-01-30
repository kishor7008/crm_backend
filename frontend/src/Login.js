import { useState } from "react"
import { useNavigate } from "react-router"
const Login=()=>{
    const navigate=useNavigate()
    const [email,setEmail]=useState("")
    const [password,setPassword]=useState("")
    const handelSubmit=(e)=>{
e.preventDefault()
console.log(email,password)
fetch("http://localhost:4000/login",{
    method:"POST",
    headers:{
        "Content-Type":"application/json",
        Accept:"application/json",

    },
    body:JSON.stringify({
        email,password
    })
}).then(res=>res.json())
.then(data=>{

localStorage.setItem("token",data.token)
localStorage.setItem("user",data._id)
console.log(data)
navigate("/chat")
})
    }
    return(
        <>
        <form>
  {/* <!-- Email input --> */}
  <div className="form-outline mb-4">
    <input type="email" id="form2Example1" className="form-control"  onChange={(e)=>setEmail(e.target.value)}/>
    <label className="form-label" for="form2Example1">Email address</label>
  </div>

  {/* <!-- Password input --> */}
  <div className="form-outline mb-4">
    <input type="password" id="form2Example2" className="form-control"  onChange={(e)=>setPassword(e.target.value)}/>
    <label className="form-label" for="form2Example2">Password</label>
  </div>

  {/* <!-- 2 column grid layout for inline styling --> */}
  <div className="row mb-4">
    <div className="col d-flex justify-content-center">
      {/* <!-- Checkbox --> */}
      <div className="form-check">
        <input className="form-check-input" type="checkbox" value="" id="form2Example31" checked />
        <label className="form-check-label" for="form2Example31"> Remember me </label>
      </div>
    </div>

    <div className="col">
      {/* <!-- Simple link --> */}
      <a href="#!">Forgot password?</a>
    </div>
  </div>

  {/* <!-- Submit button --> */}
  <button type="button" className="btn btn-primary btn-block mb-4" onClick={handelSubmit}>Sign in</button>

  {/* <!-- Register buttons --> */}
  </form>
        </>
    )
}
export default Login