#!/bin/bash

output_file="system_usage.txt"

while true; do
    timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    cpu_usage=$(mpstat | awk '$12 ~ /[0-9.]+/ { print 100 - $12 }')
    ram_usage=$(free | awk '/Mem:/ {printf("%.2f%%\n", $3/$2 * 100.0)}')
    
    echo "$timestamp, ${cpu_usage}%, $ram_usage" >> "$output_file"
    sleep 3
done
