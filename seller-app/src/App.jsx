import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import AddItem from "./pages/AddItem";
import EditItem from "./pages/EditItem";
import ManageOrders from "./pages/ManageOrders";

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      {user ? (
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/add-item" element={<AddItem user={user} />} />
          <Route path="/edit-item/:id" element={<EditItem />} />

          <Route path="/manage-orders" element={<ManageOrders />} />
        </Routes>
      ) : (
        <LoginPage setLoggedIn={setUser} />
      )}
    </Router>
  );
}
