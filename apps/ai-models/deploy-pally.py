import modal
from pathlib import Path

# Create Modal app
app = modal.App("pally-mistral-api")

# Define the image with llama-cpp-python and FastAPI (CUDA enabled for T4 GPU)
# Using pre-built CUDA 12.4 wheels to avoid complex build issues
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "llama-cpp-python",
        extra_options="--extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cu124",
    )
    .pip_install("fastapi[standard]")
)

# Mount your local model file to Modal
MODEL_PATH = "/model/pally-model-q5.gguf"
model_volume = modal.Volume.from_name("pally-model", create_if_missing=True)


@app.cls(
    image=image,
    gpu="t4",  # T4 GPU - cheapest option for fast inference
    cpu=2.0,  # 2 CPU cores (GPU handles inference)
    memory=8192,  # 8GB RAM
    scaledown_window=60,  # Keep warm for 5 mins (updated from container_idle_timeout)
    volumes={"/model": model_volume},
    timeout=300,
)
class PallyModel:
    @modal.enter()
    def load_model(self):
        """Load the model when container starts"""
        from llama_cpp import Llama

        print(f"Loading model from {MODEL_PATH}...")
        self.llm = Llama(
            model_path=MODEL_PATH,
            n_ctx=2048,  # Context window
            n_threads=2,  # Match CPU cores
            n_gpu_layers=-1,  # -1 = offload ALL layers to GPU
            verbose=False,
        )
        print("Model loaded successfully!")

    @modal.method()
    def generate(
        self, prompt: str, max_tokens: int = 512, temperature: float = 0.7
    ) -> dict:
        """Generate text from prompt"""
        response = self.llm(
            prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=0.9,
            stop=["</s>", "[/INST]"],  # Adjust based on your model's format
            echo=False,
        )

        return {
            "text": response["choices"][0]["text"],
            "tokens_used": response["usage"]["total_tokens"],
        }

    @modal.fastapi_endpoint(method="POST")
    def api(self, item: dict) -> dict:
        """REST API endpoint for your app"""
        prompt = item.get("prompt", "")
        max_tokens = item.get("max_tokens", 512)
        temperature = item.get("temperature", 0.7)

        if not prompt:
            return {"error": "No prompt provided"}

        result = self.generate.local(prompt, max_tokens, temperature)
        return result


# Function to upload your model file (run once)
@app.local_entrypoint()
def upload_model_to_volume():
    """Upload your local model file to Modal volume - run this first!"""
    from pathlib import Path

    local_model_path = Path("models/pally-model-q5.gguf")

    if not local_model_path.exists():
        print(f"Error: Model file not found at {local_model_path}")
        return

    print(
        f"Uploading {local_model_path} ({local_model_path.stat().st_size / 1e9:.2f} GB)..."
    )
    print("This may take a few minutes...")

    # Get or create the volume
    volume = modal.Volume.from_name("pally-model", create_if_missing=True)

    # Upload file to volume using batch_upload context manager
    with volume.batch_upload() as batch:
        batch.put_file(str(local_model_path), MODEL_PATH)

    print(f"✓ Model uploaded successfully to {MODEL_PATH}")
    print("Now you can deploy with: modal deploy deploy-pally.py")


# Test function
@app.local_entrypoint()
def test():
    """Test the model"""
    model = PallyModel()
    result = model.generate.remote("Hello, how are you?")
    print(result)
