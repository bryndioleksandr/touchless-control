import './App.css'
import {FloatingVideo} from "./content/FloatingVideo.tsx";

function App() {

  return (
    <>
      <div>
          <h1 className="text-3xl font-bold underline border-2 border-dashed p-10 m-20">Touchless Control App</h1>
          <FloatingVideo/>
      </div>
    </>
  )
}

export default App
