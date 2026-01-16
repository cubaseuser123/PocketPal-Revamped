// Badge definitions - static list of all available badges
export const BADGES = [
  // Savings badges
  {
    id: "first_saver",
    name: "First Saver",
    emoji: "🌱",
    description: "Create your first goal",
    category: "savings",
  },
  {
    id: "goal_crusher",
    name: "Goal Crusher",
    emoji: "💪",
    description: "Complete your first goal",
    category: "savings",
  },
  {
    id: "super_saver",
    name: "Super Saver",
    emoji: "🔥",
    description: "Complete 5 goals",
    category: "savings",
  },
  {
    id: "savings_king",
    name: "Savings King",
    emoji: "👑",
    description: "Complete 10 goals",
    category: "savings",
  },
  
  // Social badges
  {
    id: "first_friend",
    name: "First Friend",
    emoji: "🤝",
    description: "Add your first friend",
    category: "social",
  },
  {
    id: "social_butterfly",
    name: "Social Butterfly",
    emoji: "🎉",
    description: "Have 5 friends",
    category: "social",
  },
  
  // Streak badges
  {
    id: "streak_starter",
    name: "Streak Starter",
    emoji: "⭐",
    description: "Achieve a 3-day streak",
    category: "streaks",
  },
  {
    id: "week_warrior",
    name: "Week Warrior",
    emoji: "🏆",
    description: "Achieve a 7-day streak",
    category: "streaks",
  },
  
  // Coins badges
  {
    id: "coin_collector",
    name: "Coin Collector",
    emoji: "💰",
    description: "Earn 100 coins",
    category: "coins",
  },
  {
    id: "coin_master",
    name: "Coin Master",
    emoji: "🏅",
    description: "Earn 1000 coins",
    category: "coins",
  },
];

// Helper to get badge by ID
export const getBadgeById = (id) => BADGES.find((b) => b.id === id);

// Get all badges grouped by category
export const getBadgesByCategory = () => {
  return BADGES.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }
    acc[badge.category].push(badge);
    return acc;
  }, {});
};
