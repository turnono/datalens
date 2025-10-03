FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install datacommons-mcp
RUN pip install datacommons-mcp

# Create app directory
WORKDIR /app

# Create a startup script that uses Cloud Run's PORT environment variable
RUN echo '#!/bin/bash\necho "Starting MCP server..."\necho "DC_API_KEY is set: ${DC_API_KEY:0:10}..."\necho "PORT is: ${PORT:-8077}"\ndatacommons-mcp serve http --host 0.0.0.0 --port ${PORT:-8077}' > start.sh
RUN chmod +x start.sh

# Set environment variables
ENV DC_API_KEY=${DC_API_KEY}

# Run the MCP server
CMD ["./start.sh"]