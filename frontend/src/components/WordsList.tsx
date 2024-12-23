interface WordsListProps {
  words: string[];
}

export function WordsList({ words }: WordsListProps) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>Words:</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {words.map((word, index) => (
          <li key={index}>{word}</li>
        ))}
      </ul>
    </div>
  );
}
