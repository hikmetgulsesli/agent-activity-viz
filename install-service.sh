#!/bin/bash
# Script to install agent-activity-viz systemd service

set -e

SERVICE_NAME="agent-activity-viz.service"
SERVICE_FILE="$(dirname "$0")/$SERVICE_NAME"
SYSTEMD_DIR="/etc/systemd/system"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Error: This script must be run as root (use sudo)"
  exit 1
fi

# Check if service file exists
if [ ! -f "$SERVICE_FILE" ]; then
  echo "Error: Service file not found at $SERVICE_FILE"
  exit 1
fi

echo "Installing $SERVICE_NAME..."

# Copy service file to systemd directory
cp "$SERVICE_FILE" "$SYSTEMD_DIR/$SERVICE_NAME"
echo "✓ Copied service file to $SYSTEMD_DIR/$SERVICE_NAME"

# Reload systemd daemon
systemctl daemon-reload
echo "✓ Reloaded systemd daemon"

# Enable service for auto-start on boot
systemctl enable "$SERVICE_NAME"
echo "✓ Enabled service for auto-start on boot"

# Start the service
systemctl start "$SERVICE_NAME"
echo "✓ Started service"

# Show service status
echo ""
echo "Service status:"
systemctl status "$SERVICE_NAME" --no-pager

echo ""
echo "Installation complete!"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status $SERVICE_NAME   # Check status"
echo "  sudo systemctl stop $SERVICE_NAME     # Stop service"
echo "  sudo systemctl start $SERVICE_NAME    # Start service"
echo "  sudo systemctl restart $SERVICE_NAME  # Restart service"
echo "  sudo journalctl -u $SERVICE_NAME -f   # View logs (live)"
echo "  sudo journalctl -u $SERVICE_NAME -n 50 # View last 50 log lines"
