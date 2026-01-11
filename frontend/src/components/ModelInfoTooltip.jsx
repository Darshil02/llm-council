export default function ModelInfoTooltip({ model }) {
  const descriptions = {
    llama3: "Meta Llama 3 — 8B local model via Ollama",
    mistral: "Mistral 7B — fast, concise, good reasoning",
    qwen2: "Qwen 2 — strong balance of quality and speed",
  };

  return (
    <div className="model-tooltip">
      {descriptions[model] || "LLM model"}
    </div>
  );
}