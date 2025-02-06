#!/bin/bash

# Number of concurrent requests per batch
CONCURRENT_REQUESTS=10
# Total test duration in seconds
DURATION=100
# Endpoint URL
URL="http://localhost:3000/log"
# Start time
START_TIME=$(date +%s)
# Log file for response times
LOG_FILE="stress_test_results.log"

# Clean old logs
> "$LOG_FILE"

echo "Starting stress test for $DURATION seconds..."
echo "Sending $CONCURRENT_REQUESTS requests every 50ms..."

# Function to send a request and log response time
send_request() {
  local start=$(date +%s%3N)  # Capture start time in milliseconds
  response=$(curl -s -o /dev/null -w "%{http_code} %{time_total}" --request POST \
    --url "$URL" \
    --header 'content-type: application/json' \
    --data '{
      "message": "User login successful",
      "source": "frontend",
      "level": "info",
      "metadata": {
        "userId": "123",
        "browser": "Chrome",
        "timestamp": "2025-02-05T14:12:52Z"
      }
    }')
  local end=$(date +%s%3N)  # Capture end time
  local duration=$((end - start))  # Calculate request duration in ms

  # Log response time and status code
  echo "$response $duration" >> "$LOG_FILE"
}

# Run the stress test
while [ $(($(date +%s) - START_TIME)) -lt "$DURATION" ]; do
  for i in $(seq 1 $CONCURRENT_REQUESTS); do
    send_request &
  done
  sleep 0.05  # 50ms delay
done

wait  # Ensure all requests finish
echo "Test completed. Generating report..."

# Generate report
TOTAL_REQUESTS=$(wc -l < "$LOG_FILE")
SUCCESSFUL_REQUESTS=$(grep -c "201" "$LOG_FILE")
FAILED_REQUESTS=$((TOTAL_REQUESTS - SUCCESSFUL_REQUESTS))
AVG_RESPONSE_TIME=$(awk '{sum+=$3} END {if (NR>0) print sum/NR; else print 0}' "$LOG_FILE")
MAX_RESPONSE_TIME=$(awk '{print $3}' "$LOG_FILE" | sort -nr | head -n1)
PERCENTILE_90=$(awk '{print $3}' "$LOG_FILE" | sort -n | awk 'NR==int(NR*0.90)')

echo "================ Stress Test Summary ================"
echo "Total Requests:        $TOTAL_REQUESTS"
echo "Successful Requests:   $SUCCESSFUL_REQUESTS"
echo "Failed Requests:       $FAILED_REQUESTS"
echo "Average Response Time: ${AVG_RESPONSE_TIME}ms"
echo "Max Response Time:     ${MAX_RESPONSE_TIME}ms"
echo "90th Percentile Time:  ${PERCENTILE_90}ms"
echo "====================================================="

