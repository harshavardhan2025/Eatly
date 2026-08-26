import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";

import AdminLogin from "./admin/AdminLogin";
import Dashboard from "./admin/Dashboard";
import MenuManagement from "./admin/MenuManagement";
import Footer from "./components/Footer";

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <AuthProvider>
          <CartProvider>
            <Navbar />

            <div style={{ flex: 1 }}>
              <Routes>
                {/* Customer */}
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetails />} />

                {/* Admin */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/menu" element={<MenuManagement />} />
              </Routes>
            </div>
            
            <Footer />
          </CartProvider>
        </AuthProvider>
      </div>
    </BrowserRouter>
  );
}

export default App;
