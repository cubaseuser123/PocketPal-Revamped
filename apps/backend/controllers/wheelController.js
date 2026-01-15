import User from "../models/User.js";

// Wheel segments with rewards
const WHEEL_SEGMENTS = [
  { id: 1, label: "5 Coins", reward: 5, color: "#FF8C32" },
  { id: 2, label: "10 Coins", reward: 10, color: "#FFD166" },
  { id: 3, label: "20 Coins", reward: 20, color: "#3DDC97" },
  { id: 4, label: "50 Coins", reward: 50, color: "#5D5FEF" },
  { id: 5, label: "1 Coin", reward: 1, color: "#EF5DA8" },
  { id: 6, label: "15 Coins", reward: 15, color: "#FF8C32" },
];

// Check if user can spin today
const canSpinToday = (lastSpinDate) => {
  if (!lastSpinDate) return true;
  
  const today = new Date();
  const lastSpin = new Date(lastSpinDate);
  
  // Check if it's a different day
  return today.toDateString() !== lastSpin.toDateString();
};

// Get wheel status
export const getWheelStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      canSpin: canSpinToday(user.lastSpinDate),
      lastSpinDate: user.lastSpinDate,
      segments: WHEEL_SEGMENTS,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Spin the wheel
export const spinWheel = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check daily limit
    if (!canSpinToday(user.lastSpinDate)) {
      return res.status(400).json({ 
        message: "You've already spun the wheel today! Come back tomorrow.",
        canSpin: false,
      });
    }
    
    // Random segment
    const randomIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const result = WHEEL_SEGMENTS[randomIndex];
    
    // Award coins
    user.coins += result.reward;
    user.lastSpinDate = new Date();
    await user.save();
    
    res.json({
      segment: result,
      coinsWon: result.reward,
      totalCoins: user.coins,
      canSpin: false,
      message: `You won ${result.reward} coins!`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
