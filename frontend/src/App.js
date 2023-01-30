import { BrowserRouter, Routes, Route } from "react-router-dom";
import Chat from "./Chat";
import Login from "./Login";

function App() {
  return (
    
    <>
    <BrowserRouter>
    <Routes>
    <Route path="/" element={<Login/>}/>
    <Route path="/chat" element={<Chat/>}/>
    </Routes></BrowserRouter>
    </>
  );
}

export default App;
