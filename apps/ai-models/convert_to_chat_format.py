#!/usr/bin/env python3
"""
Convert MLX format (prompt/completion) to HuggingFace chat format (messages).

MLX format: {"prompt": "...", "completion": "..."}
Chat format: {"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
"""

import json
import re
from pathlib import Path

# Default system prompt - includes tool definitions
DEFAULT_SYSTEM_PROMPT = """You are Pally, PocketPal's friendly AI coach for Indian students. You help users understand their spending, stay motivated, and make saving fun!

## Your Personality
- Friendly, supportive, and never judgmental
- Use casual language, mix Hindi/Hinglish when appropriate
- Roast spending choices playfully, never shame the person
- Keep responses concise and engaging
- ALWAYS respond conversationally, even when using tools

## Available Tools
You have access to these tools. Call them when you need real user data.

- `getWalletBalance()` - Get user's current wallet balance
- `getSpendingSummary(period: "day"|"week"|"month")` - Get spending summary for a period
- `getCategoryBreakdown(period: "week"|"month")` - Get spending breakdown by category
- `getRecentTransactions(limit: number)` - Get recent transactions (default 5)
- `findLargeTransactions()` - Find unusually large transactions
- `compareSpending(period1, period2)` - Compare spending between two periods
- `getGoals()` - Get user's savings goals and progress
- `getStreakStatus()` - Get current streak information
- `getBadges()` - Get earned badges and achievements
- `getActiveQuests()` - Get active quests/challenges
- `getLeaderboard()` - Get friend leaderboard rankings
- `getFriendStats()` - Get friend comparison data
- `getSubscriptions()` - Get recurring subscriptions
- `getTopSpendingDays(days: number)` - Get highest spending days
- `explainChart()` - Explain the currently displayed chart

## Response Style
ALWAYS be conversational! When using tools, add a friendly message explaining what you're doing.

Example with tool:
User: "What's my balance?"
You: "Let me check your wallet for you! 💰
<tool_call>
{"name": "getWalletBalance", "arguments": {}}
</tool_call>"

Example without tool:
User: "I feel bad about spending"
You: "Hey, don't be too hard on yourself! Everyone has those moments. The fact that you're aware means you're already doing better than you think. 💪"

## Tool Call Format
<tool_call>
{"name": "toolName", "arguments": {...}}
</tool_call>"""


# Conversational prefixes for tool calls - makes responses more natural
TOOL_PREFIXES = {
    "getWalletBalance": ["Let me check your wallet! 💰", "Checking your balance real quick! 💵", "Let's see what you've got! 💰"],
    "getSpendingSummary": ["Let me pull up your spending summary! 📊", "Checking your spending stats! 📈", "Let's see how you've been spending! 💸"],
    "getCategoryBreakdown": ["Let me break down your spending by category! 📊", "Checking where your money went! 🔍", "Let's see the category breakdown! 📈"],
    "getRecentTransactions": ["Let me show you your recent transactions! 📝", "Pulling up your latest spending! 💳", "Here's what you've been up to! 📋"],
    "findLargeTransactions": ["Let me find those big spends! 👀", "Checking for any major expenses! 💸", "Let's see the big ones! 🔍"],
    "compareSpending": ["Let me compare your spending! 📊", "Checking how you're doing vs before! 📈", "Let's see the comparison! 🔄"],
    "getGoals": ["Let me check your goals! 🎯", "Pulling up your savings targets! 💪", "Let's see your goal progress! 🏆"],
    "getStreakStatus": ["Let me check your streak! 🔥", "Checking your streak status! ⚡", "Let's see that streak! 🎯"],
    "getBadges": ["Let me show your badges! 🏅", "Checking your achievements! 🏆", "Let's see what you've earned! 🎖️"],
    "getActiveQuests": ["Let me show your quests! ⚔️", "Checking your active challenges! 🎮", "Here are your current quests! 🗡️"],
    "getLeaderboard": ["Let me check the leaderboard! 🏆", "Pulling up the rankings! 📊", "Let's see where you stand! 🥇"],
    "getFriendStats": ["Let me check your friend stats! 👥", "Comparing with your friends! 🤝", "Let's see how you stack up! 📊"],
    "getSubscriptions": ["Let me check your subscriptions! 📋", "Pulling up your recurring payments! 💳", "Let's see your subs! 🔄"],
    "getTopSpendingDays": ["Let me find your spendy days! 📅", "Checking your peak spending days! 📊", "Let's see when you spent most! 💸"],
    "explainChart": ["Let me explain this chart! 📊", "Breaking down the chart for you! 📈", "Here's what this shows! 🔍"],
}

def parse_mlx_prompt(prompt: str) -> tuple[str | None, str]:
    """
    Parse MLX prompt to extract system prompt and user message.
    
    Some prompts have embedded system prompts like:
    ### System:\n...\n\n### User:\n...\n\n### Assistant:
    
    Returns: (system_prompt, user_message)
    """
    # Check if prompt contains embedded system/user format
    if "### System:" in prompt and "### User:" in prompt:
        # Extract system prompt
        system_match = re.search(r"### System:\n(.*?)\n\n### User:", prompt, re.DOTALL)
        user_match = re.search(r"### User:\n(.*?)\n\n### Assistant:", prompt, re.DOTALL)
        
        if system_match and user_match:
            return system_match.group(1).strip(), user_match.group(1).strip()
    
    # Simple prompt without embedded format
    return None, prompt.strip()


import random

def add_conversational_prefix(completion: str) -> str:
    """Add a conversational prefix to tool calls to make them more natural."""
    # Check if this is a tool call
    if "<tool_call>" not in completion:
        return completion
    
    # Try to extract the tool name
    tool_match = re.search(r'"name"\s*:\s*"(\w+)"', completion)
    if not tool_match:
        return completion
    
    tool_name = tool_match.group(1)
    
    # Get a random prefix for this tool
    if tool_name in TOOL_PREFIXES:
        prefix = random.choice(TOOL_PREFIXES[tool_name])
        return f"{prefix}\n{completion}"
    
    # Default prefix if tool not found
    return f"Let me check that for you! 🔍\n{completion}"


def convert_entry(entry: dict) -> dict:
    """Convert a single MLX format entry to chat format."""
    prompt = entry.get("prompt", "")
    completion = entry.get("completion", "")
    
    _, user_message = parse_mlx_prompt(prompt)
    
    # Always use the default system prompt with tool definitions
    system_prompt = DEFAULT_SYSTEM_PROMPT
    
    # Add conversational prefix to tool calls
    enhanced_completion = add_conversational_prefix(completion)
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
        {"role": "assistant", "content": enhanced_completion}
    ]
    
    return {"messages": messages}


def convert_file(input_path: Path, output_path: Path):
    """Convert an entire JSONL file from MLX to chat format."""
    converted_count = 0
    
    with open(input_path, 'r', encoding='utf-8') as infile, \
         open(output_path, 'w', encoding='utf-8') as outfile:
        
        for line_num, line in enumerate(infile, 1):
            line = line.strip()
            if not line:
                continue
            
            try:
                entry = json.loads(line)
                converted = convert_entry(entry)
                outfile.write(json.dumps(converted, ensure_ascii=False) + '\n')
                converted_count += 1
            except json.JSONDecodeError as e:
                print(f"Warning: Skipping invalid JSON at line {line_num}: {e}")
            except Exception as e:
                print(f"Warning: Error processing line {line_num}: {e}")
    
    return converted_count


def main():
    data_dir = Path(__file__).parent / "data"
    
    files_to_convert = ["train.jsonl", "test.jsonl", "valid.jsonl"]
    
    for filename in files_to_convert:
        input_path = data_dir / filename
        output_path = data_dir / f"chat_{filename}"
        
        if not input_path.exists():
            print(f"⚠️  Skipping {filename}: file not found")
            continue
        
        print(f"📄 Converting {filename}...")
        count = convert_file(input_path, output_path)
        print(f"   ✅ Converted {count} entries -> {output_path.name}")
    
    print("\n🎉 Conversion complete!")
    print("\nNew files created in data/:")
    print("  - chat_train.jsonl")
    print("  - chat_test.jsonl")
    print("  - chat_valid.jsonl")
    print("\nThese files are ready for HuggingFace/Google Colab fine-tuning!")


if __name__ == "__main__":
    main()
