FROM ollama/ollama:latest

RUN apt-get update && apt-get install -y curl

COPY <<EOF /entrypoint.sh
#!/bin/sh
ollama serve &
sleep 5
ollama pull tinyllama
tail -f /dev/null  # Keep container running
EOF

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
