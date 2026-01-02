import './App.css'
import {FloatingVideo} from "./content/FloatingVideo.tsx";
import {useState} from "react";

function App() {
const [counter, setCounter] = useState<number>(0);

  return (
    <>
      <div>
          <h1 className="text-3xl font-bold underline border-2 border-dashed p-10 m-20">Touchless Control App</h1>
          <FloatingVideo/>
          <button className="border-red text-center border-2 p-5 mt-10" onClick={() => setCounter(counter+1)}>Click me + {counter}</button>
      </div>
    </>
  )
}

export default App
