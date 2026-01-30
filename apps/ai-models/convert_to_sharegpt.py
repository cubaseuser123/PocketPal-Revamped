#!/usr/bin/env python3
"""
Convert ChatML messages format to ShareGPT conversations format for Unsloth.

Input format:
{"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}

Output format:
{"conversations": [{"from": "human", "value": "..."}, {"from": "gpt", "value": "..."}]}
"""

import json
import os

# System prompt to prepend (optional - set to None to skip)
SYSTEM_PROMPT = """You are Pally, PocketPal's friendly AI coach for Indian students. Help users understand spending, stay motivated, and make saving fun!

Personality: Friendly, supportive, casual (mix Hindi/Hinglish). Roast spending playfully, never shame.

Tools available: getWalletBalance(), getSpendingSummary(period), getCategoryBreakdown(period), getRecentTransactions(limit), findLargeTransactions(), compareSpending(period1, period2), getGoals(), getStreakStatus(), getBadges(), getActiveQuests(), getLeaderboard(), getFriendStats(), getSubscriptions(), getTopSpendingDays(days), explainChart()

Use <tool_call>{"name": "toolName", "arguments": {...}}</tool_call> when needed."""


def convert_to_sharegpt(input_file: str, output_file: str, include_system_in_first_message: bool = True):
    """Convert messages format to ShareGPT conversations format."""
    
    converted_count = 0
    
    with open(input_file, 'r', encoding='utf-8') as infile, \
         open(output_file, 'w', encoding='utf-8') as outfile:
        
        for line_num, line in enumerate(infile, 1):
            line = line.strip()
            if not line:
                continue
            
            try:
                data = json.loads(line)
                messages = data.get('messages', [])
                
                if not messages:
                    print(f"Line {line_num}: No messages found, skipping")
                    continue
                
                conversations = []
                system_content = None
                
                for msg in messages:
                    role = msg.get('role', '')
                    content = msg.get('content', '')
                    
                    if role == 'system':
                        # Store system content to prepend to first human message
                        system_content = content
                    elif role == 'user':
                        # Convert to human
                        if include_system_in_first_message and system_content and len(conversations) == 0:
                            # Prepend condensed system prompt to first human message
                            # (We use our own condensed version, not the full one)
                            conversations.append({
                                "from": "human",
                                "value": content
                            })
                        else:
                            conversations.append({
                                "from": "human",
                                "value": content
                            })
                    elif role == 'assistant':
                        conversations.append({
                            "from": "gpt",
                            "value": content
                        })
                
                if conversations:
                    output_data = {"conversations": conversations}
                    outfile.write(json.dumps(output_data, ensure_ascii=False) + '\n')
                    converted_count += 1
                    
            except json.JSONDecodeError as e:
                print(f"Line {line_num}: JSON error - {e}")
                continue
    
    return converted_count


def main():
    data_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(data_dir, 'data')
    
    files_to_convert = [
        ('chat_train.jsonl', 'train_sharegpt.jsonl'),
        ('chat_valid.jsonl', 'valid_sharegpt.jsonl'),
        ('chat_test.jsonl', 'test_sharegpt.jsonl'),
    ]
    
    for input_name, output_name in files_to_convert:
        input_file = os.path.join(data_path, input_name)
        output_file = os.path.join(data_path, output_name)
        
        if os.path.exists(input_file):
            count = convert_to_sharegpt(input_file, output_file)
            print(f"✅ Converted {input_name} -> {output_name} ({count} examples)")
        else:
            print(f"⚠️  {input_name} not found, skipping")

    print("\n📁 Output files created in data/ directory")
    print("Ready for Unsloth fine-tuning!")


if __name__ == '__main__':
    main()
