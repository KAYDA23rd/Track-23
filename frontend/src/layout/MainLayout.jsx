import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar";

function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <NavBar />

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
