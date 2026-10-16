
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import AIAssistant from "./Ai/AIAssistant";

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-wrapper">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="main-content">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Chatbot */}
      <AIAssistant />
    </div>
  );
};

export default AppLayout;
