#!/usr/bin/env bash
# Sample curl request to ClimateTrust dMRV micro-service (port 8001)

curl -X POST "http://localhost:8001/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "proj_ain_draham_demo",
    "geojson": {
      "type": "Polygon",
      "coordinates": [
        [
          [8.6650, 36.7620],
          [8.6920, 36.7620],
          [8.6920, 36.7810],
          [8.6650, 36.7810],
          [8.6650, 36.7620]
        ]
      ]
    },
    "date_from": "2026-03-01",
    "date_to": "2026-09-15"
  }'
