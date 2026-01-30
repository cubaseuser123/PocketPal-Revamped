import os
os.chdir('data')
for f in ['train.jsonl', 'valid.jsonl', 'test.jsonl']:
    with open(f, 'r') as infile:
        content = infile.read()
    # Split concatenated JSON objects
    fixed = content.replace('}{', '}\n{')
    with open(f, 'w') as outfile:
        outfile.write(fixed)
    print(f"Fixed {f}")
