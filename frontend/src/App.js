import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/App.css";
import Editor from "@/pages/Editor";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Editor />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
