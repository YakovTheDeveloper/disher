import { useState } from 'react';
import { Button } from '@/components/ui/atoms/Button';

const FoodShowCost = () => {
  const [showCost, setShowCost] = useState(false);

  const toggleShowCost = () => setShowCost((prev) => !prev);

  return (
    <Button variant="ghost" onClick={toggleShowCost} style={{ opacity: showCost ? 1 : 0.4 }}>
      ₽
    </Button>
  );
};

export default FoodShowCost;
