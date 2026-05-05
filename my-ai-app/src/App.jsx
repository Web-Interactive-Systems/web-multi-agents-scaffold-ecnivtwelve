// src/App.jsx
import Sidebar from "./components/Sidebar";
import Workspace from "./components/Workspace";

function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <Workspace />
    </div>
  );
}

export default App;
