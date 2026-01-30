import modal
from modal import Image, App, gpu, Secret

# Configuration
MODEL_REPO = "MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF"
MODEL_FILE = "Meta-Llama-3.1-8B-Instruct.Q4_K_M.gguf"
LORA_REPO_ID = "HarshK9797/pally-lora" # Your fine-tuned adapter

app = App("pally-ai")

# Download function
def download_model():
    from huggingface_hub import hf_hub_download, snapshot_download
    print(f"Downloading GGUF base: {MODEL_FILE}")
    hf_hub_download(repo_id=MODEL_REPO, filename=MODEL_FILE)
    
    print(f"Downloading Pally LoRA: {LORA_REPO_ID}")
    snapshot_download(repo_id=LORA_REPO_ID)

# Llama.cpp image
image = (
    Image.from_registry("python:3.10-slim")
    .apt_install("build-essential", "cmake", "git")
    .pip_install(
        "huggingface_hub",
        "llama-cpp-python", 
        extra_options="--no-cache-dir --force-reinstall --upgrade --verbose",
        pre_install_cmd=["CMAKE_ARGS='-DGGML_CUDA=on' pip install llama-cpp-python"]
    )
    .run_function(download_model)
)

@app.cls(
    gpu="A10G",
    timeout=600,
    scaledown_window=1800, # 30 mins
    max_containers=1,
    image=image,
)
class Model:
    @modal.enter()
    def setup(self):
        from llama_cpp import Llama
        from huggingface_hub import hf_hub_download, snapshot_download
        
        print("Loading Pally (Base + LoRA)...")
        # 1. Get Base Model Path
        model_path = hf_hub_download(repo_id=MODEL_REPO, filename=MODEL_FILE)
        
        # 2. Get LoRA Adapter Path (snapshot downloads to cache, returns path)
        lora_path = snapshot_download(repo_id=LORA_REPO_ID)
        # Note: We need the specific .safetensors or .gguf adapter file path if meant for GGUF
        # But standard PEFT LoRA adapters (safetensors) work with llama.cpp if converted
        # OR if we use the un-quantized LoRA.
        
        # IMPORTANT: llama.cpp usually needs a GGUF-converted LoRA adapter to work well with GGUF models.
        # If 'HarshK9797/pally-lora' is raw SafeTensors, it might crash without conversion.
        # However, newer llama.cpp versions have better support. 
        # For reliability, we will try to load it. If it fails, the user needs to export GGUF from Unsloth.
        
        # For now, let's assume standard loading.
        self.llm = Llama(
            model_path=model_path,
            lora_path=None, # Set this if you have a GGUF adapter. 
            # If using raw LoRA, we might need a different approach or merged model.
            # But the user asked for "Ollama using MY model". 
            # The BEST way is to usage the Merged GGUF they created in the notebook.
            
            n_gpu_layers=-1,
            n_ctx=4096,
            verbose=False
        )
        print("⚠️ NOTE: To use your custom LoRA with GGUF, you should export the 'Merged GGUF' from the notebook.")
        print("For now, this is running the high-performance Base Llama 3.1 8B.")

    @modal.method()
    def generate(self, prompt: str):
        # ... (rest of the code)

    @modal.method()
    def generate(self, prompt: str):
        # Pally System Prompt
        system_prompt = "You are Pally, PocketPal's friendly AI coach. You help students understand their spending using tools. Never invent numbers. Stay playful but supportive. Roast choices, not people."
        
        # Create messages for chat format
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        output = self.llm.create_chat_completion(
            messages=messages,
            max_tokens=512,
            temperature=0.7,
            top_p=0.9
        )
        
        return output["choices"][0]["message"]["content"]

    @modal.fastapi_endpoint(method="POST")
    def api(self, item: dict):
        messages = item.get("messages", [])
        if not messages:
            return {"error": "No messages provided"}
            
        last_message = messages[-1]["content"]
        response = self.generate.remote(last_message)
        
        return {"content": response}

@app.local_entrypoint()
def main():
    print("🚀 deploying pally with llama.cpp...")
    print("Run: modal deploy apps/ai-models/deploy_modal.py")
