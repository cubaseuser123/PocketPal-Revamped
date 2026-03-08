# Pally Fine-Tuned Model — Deployment Guide

Your fine-tuned `mistral-finetuned.gguf` is ready. This guide covers two deployment approaches and how to wire each one into PocketPal through the Vercel AI Gateway.

---

## Approach A: Colab + Ollama + ngrok (Demo Day)

Best for: quick demos, temporary usage, no cloud account needed.

> [!WARNING]
> Free Colab sessions time out after ~90 minutes of inactivity. This isn't suitable for production.

### Step 1 — Install & Start Ollama in Colab

Run in a new Colab cell (with GPU runtime):

```python
%%capture
!curl -fsSL https://ollama.com/install.sh | sh

import subprocess, time
subprocess.Popen(["ollama", "serve"])
time.sleep(3)
print("Ollama server running ✅")
```

### Step 2 — Register Your GGUF

If the GGUF is in **Google Drive** (from the training session):

```python
from google.colab import drive
drive.mount('/content/drive')

!echo 'FROM /content/drive/My Drive/Colab Models/mistral-finetuned.gguf' > Modelfile
!ollama create pally -f Modelfile
```

Or if it's still in the **Colab runtime** from the training run:

```python
!echo 'FROM ./mistral_lora_gguf_gguf/mistral-7b-v0.3.Q4_K_M.gguf' > Modelfile
!ollama create pally -f Modelfile
```

### Step 3 — Quick Test

```python
!ollama run pally "What's my balance?"
```

Expected: a `<tool_call>` response calling `getWalletBalance`.

### Step 4 — Expose via ngrok

1. Get a free auth token at [ngrok.com](https://dashboard.ngrok.com/signup)

2. Run in Colab:

```python
!pip install pyngrok
from pyngrok import ngrok

ngrok.set_auth_token("YOUR_NGROK_AUTH_TOKEN")
public_url = ngrok.connect(11434)
print(f"🚀 Pally URL: {public_url}")
# Example output: https://abc123.ngrok-free.app
```

3. **Keep this notebook running** — closing it kills the tunnel.

### What You Get

A public URL like `https://abc123.ngrok-free.app` that proxies to Ollama on port 11434. This is an OpenAI-compatible API endpoint.

---

## Approach B: Hugging Face Hub (Long-Term / Free)

Best for: persistent hosting, no Colab session needed, free serverless inference.

### Step 1 — Push Model to Hugging Face (from Colab)

Run in a new Colab cell after training completes:

```python
# Push the merged 16-bit model (not the GGUF)
model.push_to_hub_merged(
    "YOUR_HF_USERNAME/pally-mistral-finetuned",
    tokenizer,
    save_method="merged_16bit",
    token="YOUR_HF_WRITE_TOKEN",
)
print("✅ Model pushed to Hugging Face!")
```

> [!TIP]
> Get your HF write token from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) → New Token → Write access.

### Step 2 — Verify on Hugging Face

1. Go to `https://huggingface.co/YOUR_HF_USERNAME/pally-mistral-finetuned`
2. You should see the model card and files
3. Hugging Face automatically provides a **free Serverless Inference API** for supported models

### Step 3 — Test the API

```bash
curl https://router.huggingface.co/hf-inference/models/YOUR_HF_USERNAME/pally-mistral-finetuned/v1/chat/completions \
  -H "Authorization: Bearer YOUR_HF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "YOUR_HF_USERNAME/pally-mistral-finetuned",
    "messages": [{"role": "user", "content": "How do streaks work?"}],
    "max_tokens": 100
  }'
```

### What You Get

A persistent API at `https://router.huggingface.co/hf-inference/models/YOUR_HF_USERNAME/pally-mistral-finetuned/v1` — OpenAI-compatible, free tier, always available.

> [!NOTE]
> Free tier has rate limits and cold starts (~30s first request). For production, consider a paid Inference Endpoint.

---

## Wiring Into PocketPal via AI Gateway

The current setup in `chatController.js` uses:

```javascript
import { gateway } from "@ai-sdk/gateway";
model: gateway("mistral/devstral-2")
```

Here's how to swap it for each approach:

---

### Option A: Colab + Ollama + ngrok

Use `@ai-sdk/openai` with a custom `baseURL` pointing to your ngrok tunnel.

**1. Install the provider:**

```bash
npm install @ai-sdk/openai
```

**2. Update `chatController.js`:**

```javascript
import { createOpenAI } from "@ai-sdk/openai";

// Point to your ngrok URL (update each session)
const pally = createOpenAI({
  baseURL: "https://abc123.ngrok-free.app/v1", // your ngrok URL + /v1
  apiKey: "ollama",                              // Ollama doesn't need a real key
});

// Then use it wherever you had gateway("mistral/devstral-2"):
const { text, steps } = await generateText({
  model: pally("pally"),   // "pally" = the model name from `ollama create pally`
  system: SYSTEM_PROMPT,
  messages,
  tools: { ... },
  stopWhen: stepCountIs(8),
});
```

> [!IMPORTANT]
> The ngrok URL changes every time you restart the tunnel. You'd need to update `baseURL` each session, or use a paid ngrok plan for a static subdomain.

---

### Option B: Hugging Face Inference API

Use `@ai-sdk/openai` with HF's OpenAI-compatible endpoint.

**1. Install the provider (same package):**

```bash
npm install @ai-sdk/openai
```

**2. Add your HF token to `.env`:**

```env
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**3. Update `chatController.js`:**

```javascript
import { createOpenAI } from "@ai-sdk/openai";

const pally = createOpenAI({
  baseURL: "https://router.huggingface.co/hf-inference/models/YOUR_HF_USERNAME/pally-mistral-finetuned/v1",
  apiKey: process.env.HUGGINGFACE_API_KEY,
});

// Then use it:
const { text, steps } = await generateText({
  model: pally("tgi"),   // HF Inference uses "tgi" as the model ID
  system: SYSTEM_PROMPT,
  messages,
  tools: { ... },
  stopWhen: stepCountIs(8),
});
```

---

## Approach C: Together.ai (Fastest Serverless)

If Hugging Face is too slow (cold starts) and Colab + ngrok is too manual, Together.ai is the absolute best approach for a hackathon or demo. 

Because Together.ai's custom model hosting is native to their training platform, the easiest and fastest way is to **re-train the model directly on Together.ai** using the exact same `train.jsonl` we already generated. It costs about $1 of your free $5 credit.

### Step 1 — Train on Together.ai
1. Go to [Together.ai](https://api.together.ai/signup), create an account, and add a card to unlock your $5 free credit.
2. Go to the **Fine-tuning** tab on the left.
3. Upload your `datasets/output/train.jsonl` file.
4. Select `mistralai/Mistral-7B-Instruct-v0.2` (or v0.3) as the Base Model.
5. Set Epochs to **2** (no need to overcomplicate it).
6. Click **Start Training**. It will take about 15-20 minutes.

### Step 2 — Get Your Model ID
Once training is complete, Together.ai will give you a custom Model ID that looks like:
`your-username/Mistral-7B-Instruct-v0.2-finetune-2026-xxyy`

### Step 3 — Wire it into PocketPal
Because Together.ai is 100% OpenAI-compatible, you just swap the `baseURL` and `apiKey`.

**1. Update `.env`:**
```env
TOGETHER_API_KEY=your_together_api_key
```

**2. Update `chatController.js`:**
```javascript
import { createOpenAI } from "@ai-sdk/openai";

const pally = createOpenAI({
  baseURL: "https://api.together.xyz/v1",
  apiKey: process.env.TOGETHER_API_KEY,
});

// Then use it:
const { text, steps } = await generateText({
  model: pally("your-username/Mistral-7B-Instruct-v0.2-finetune-2026-xxyy"),
  system: SYSTEM_PROMPT,
  messages,
  tools: { ... },
  stopWhen: stepCountIs(8),
});
```

### What You Get
Blazing fast response times (like ChatGPT), zero 30-second cold starts, and a permanent cloud endpoint using your remaining free credits.

---

> [!NOTE]
> The fine-tuned Pally model replaces `gateway("mistral/devstral-2")` entirely — it handles both personality **and** tool calls since both were included in the training data.

---

## Quick Comparison

| | **Colab + Ollama + ngrok** | **Hugging Face** |
|---|---|---|
| **Cost** | Free | Free (with limits) |
| **Always available** | ❌ Session-based | ✅ Persistent |
| **Cold start** | None (if session alive) | ~30s first request |
| **Good for** | Demo day | Production |
| **URL stability** | Changes each session | Permanent |
| **Setup effort** | Low | Medium |

---

## Files Reference

| File | Purpose |
|---|---|
| `datasets/merge_to_sharegpt.py` | Script that merged training data |
| `datasets/output/train.jsonl` | 1,515 training examples |
| `datasets/output/valid.jsonl` | 240 validation examples |
| `datasets/output/test.jsonl` | 240 test examples |
| `apps/backend/controllers/chatController.js` | Where the model is invoked |
| `Google Drive > Colab Models > mistral-finetuned.gguf` | Exported GGUF file |
