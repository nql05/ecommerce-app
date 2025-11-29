import { Minus, Plus } from "lucide-react";
import { useState, useEffect } from "react";

interface QuantityCounterProps {
  quantity: number;
  maxStock: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onChange?: (value: number) => void;
  size?: "small" | "medium";
}

export default function QuantityCounter({
  quantity,
  maxStock,
  onIncrement,
  onDecrement,
  onChange,
  size,
}: QuantityCounterProps) {
  const [inputValue, setInputValue] = useState(quantity.toString());

  useEffect(() => {
    setInputValue(quantity.toString());
  }, [quantity]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue);
    if (isNaN(numValue) || numValue < 1) {
      setInputValue("1");
      if (onChange) onChange(1);
    } else if (numValue > maxStock) {
      setInputValue(maxStock.toString());
      if (onChange) onChange(maxStock);
    } else {
      setInputValue(numValue.toString());
      if (onChange) onChange(numValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  const sizeClasses = {
    small: {
      button: "p-2",
      icon: "w-3 h-3",
      input: "w-12 px-2 text-sm text-center",
      border: "border",
    },
    medium: {
      button: "p-3",
      icon: "w-4 h-4",
      input: "w-16 px-3 font-semibold text-center",
      border: "border-2",
    },
  };

  const styles = sizeClasses[size];

  return (
    <div
      className={`flex items-center ${styles.border} border-gray-300 rounded-full`}
    >
      <button
        onClick={onDecrement}
        disabled={quantity <= 1}
        className={`${styles.button} hover:bg-gray-100 transition rounded-l-full disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label="Decrease quantity"
      >
        <Minus className={styles.icon} />
      </button>
      {onChange ? (
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className={`${styles.input} border-none outline-none bg-transparent`}
        />
      ) : (
        <span className={styles.input}>{quantity}</span>
      )}
      <button
        onClick={onIncrement}
        disabled={quantity >= maxStock}
        className={`${styles.button} hover:bg-gray-100 transition rounded-r-full disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label="Increase quantity"
      >
        <Plus className={styles.icon} />
      </button>
    </div>
  );
}
