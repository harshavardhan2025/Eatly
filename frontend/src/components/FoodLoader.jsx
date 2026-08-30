import React, { useState, useEffect } from "react";

const FOOD_EMOJIS = [
  "🍗", "🍲", "🍖", "🍤", "🍳", "🫓",
  "🥘", "🥣", "🥗", "🥟", "🍢", "🧆", 
  "🍜", "🍝", "🥞", "🍣", "🍱", "🍕", 
  "🍔", "🌮", "🍟", "🍰", "🍩", "🍨", 
  "🍦", "🧋", "🥤", "☕", "🥥", "🍍",
  "🍓", "🥑", "🌶️", "✨"
];

function getRandomIndex(excludeIndex = -1) {
  let nextIndex;
  do {
    nextIndex = Math.floor(Math.random() * FOOD_EMOJIS.length);
  } while (nextIndex === excludeIndex && FOOD_EMOJIS.length > 1);
  return nextIndex;
}

function FoodLoader({ text = "⏳ 🥘 Preparing delicious food..." }) {
  // Start with a random emoji every time
  const [index, setIndex] = useState(() => getRandomIndex());

  useEffect(() => {
    // Dynamic random emoji switcher (1000ms = 1 sec)
    const interval = setInterval(() => {
      setIndex((prev) => getRandomIndex(prev));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="food-loader-container">
      <div className="food-loader-box">
        {/* Outer glowing spinning ring */}
        <div className="food-loader-ring"></div>

        {/* Animated food emoji wrapper */}
        <div className="food-loader-icon-wrapper">
          <span key={index} className="food-loader-icon pop-animation">
            {FOOD_EMOJIS[index]}
          </span>
        </div>
      </div>

      <p className="food-loader-text">{text}</p>

      {/* Animated loading dots */}
      <div className="food-loader-dots">
        <span className="dot dot-1"></span>
        <span className="dot dot-2"></span>
        <span className="dot dot-3"></span>
      </div>
    </div>
  );
}

export default FoodLoader;
