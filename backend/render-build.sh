#!/bin/bash
# Render.com Build Script for Backend

echo "🚀 Starting Hey Potu Backend Build..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Run database initialization (if needed)
echo "🗄️ Database will be initialized automatically on first connection"

echo "✅ Build complete!"
