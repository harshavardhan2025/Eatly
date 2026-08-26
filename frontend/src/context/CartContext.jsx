import React, { createContext, useContext, useState, useEffect } from 'react';

const defaultValue = {
  cart: [],
  cartTotal: 0,
  cartCount: 0,
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  isCartOpen: false,
  setIsCartOpen: () => {},
  openCart: () => {},
  closeCart: () => {}
};

const CartContext = createContext(defaultValue);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('heritage_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('heritage_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (foodItem) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.food_item_id === foodItem.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prevCart, {
        food_item_id: foodItem.id,
        name: foodItem.name,
        price: foodItem.price,
        image_url: foodItem.image_url || foodItem.image,
        quantity: 1
      }];
    });
  };

  const removeFromCart = (foodItemId) => {
    setCart(prevCart => prevCart.filter(item => item.food_item_id !== foodItemId));
  };

  const updateQuantity = (foodItemId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(foodItemId);
      return;
    }
    setCart(prevCart => prevCart.map(item => 
      item.food_item_id === foodItemId ? { ...item, quantity: newQty } : item
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      isCartOpen,
      setIsCartOpen,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false)
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext) || defaultValue;
