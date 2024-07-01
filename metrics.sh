#!/bin/bash

OUTPUT_FILE="metrics.txt"

# Cabeçalho do arquivo de saída
echo "timestamp,cpu_usage,memory_usage" > $OUTPUT_FILE

# Função para obter métricas
get_metrics() {
  timestamp=$(($(date +%s%N)/1000000))
  cpu_idle=$(vmstat 1 2 | tail -1 | awk '{print $15}')
  cpu_usage=$(echo "100 - $cpu_idle" | bc)
  memory_usage=$(free -m | awk 'NR==2{printf "%.2f", $3*100/$2 }')
  echo "$timestamp,$cpu_usage,$memory_usage" >> $OUTPUT_FILE
}

# Loop para coletar métricas a cada 10 segundos
while true; do
  get_metrics
  sleep 5
done

