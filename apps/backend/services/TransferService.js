export default class TransferService {
    /**
     * Distributes a withdrawal amount across multiple goals.
     * @param {number} amount - The amount to withdraw.
     * @param {Array<Object>} goals - List of goal objects.
     * @returns {Object} - { goalsToUpdate: [{ goal, amount }], remaining: number }
     */
    static calculateGoalDistribution(amount, goals) {
      if (!goals || goals.length === 0) {
        return { goalsToUpdate: [], remaining: amount };
      }
  
      let remainingToDeduct = amount;
      let goalsToUpdate = [];
  
      // Strategy: Equal distribution first
      const share = amount / goals.length;
  
      for (const goal of goals) {
        const deduction = Math.min(goal.currentAmount, share);
        if (deduction > 0) {
          goalsToUpdate.push({
            goal: goal,
            deduction: deduction,
          });
          remainingToDeduct -= deduction;
        }
      }

      // If there's still remainder (because some goals had less than 'share'),
      // we need to take it from the ones that still have funds.
      if (remainingToDeduct > 0.01) { // Floating point safety
         for (const item of goalsToUpdate) {
             if (remainingToDeduct <= 0) break;
             const goal = item.goal;
             // How much more can we take?
             // note: item.deduction is already slated to be taken.
             const available = goal.currentAmount - item.deduction;
             const taking = Math.min(available, remainingToDeduct);
             
             if (taking > 0) {
                 item.deduction += taking;
                 remainingToDeduct -= taking;
             }
         }
      }
      
      // Filter out any temp zero deductions if logical weirdness occurred
      goalsToUpdate = goalsToUpdate.filter(i => i.deduction > 0);

      return { goalsToUpdate, remaining: remainingToDeduct };
    }
  
    /**
     * Checks if a coin penalty applies for early withdrawal.
     * @param {Array<Object>} goals - The goals involved in withdrawal.
     * @returns {boolean} - True if penalty applies.
     */
    static shouldApplyPenalty(goals) {
      return goals.some(g => !g.isCompleted);
    }
  }
