export class WordGenerator {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
    this.baseUrl = this.baseUrl.replace(/\/$/, "");
  }

  async generateWords(count: number = 5): Promise<string[]> {
    const prompt = `Generate ${count} random single words that could be used in a word guessing game. The words should be common nouns, not too easy and not too difficult. Format the output as a comma-separated list.`;

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tinyllama",
          prompt: prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Ollama API error (${response.status}): ${await response.text()}`
        );
      }

      const data = await response.json();
      const words = data.response
        .split(",")
        .map((word: string) => word.trim())
        .filter((word: string) => word.length > 0)
        .slice(0, count);

      return words;
    } catch (error: any) {
      console.error("Error generating words:", error);
      return [`Error: ${error.message || "Unknown error"}`].slice(0, count);
    }
  }
}
