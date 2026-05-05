// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router";
import Sidebar from "./components/Sidebar";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import ResearchPage from "./pages/ResearchPage";
import WritePage from "./pages/WritePage";

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />

        <main className="workspace">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/write" element={<WritePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
