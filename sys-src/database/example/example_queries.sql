-- Example spatial queries for reference:
-- Find events within 10km of a point (40.7128, -74.0060)
SELECT e.*, l.name as location_name,
       ST_Distance(l.geo, ST_MakePoint(-74.0060, 40.7128)::geography) as distance
FROM event e
JOIN location l ON e.location_id = l.location_id
WHERE ST_DWithin(l.geo, ST_MakePoint(-74.0060, 40.7128)::geography, 10000)
ORDER BY distance;

-- Create a heatmap by counting events in grid cells
SELECT
  COUNT(*) as event_count,
  ST_SnapToGrid(l.geo::geometry, 0.01) as cell
FROM events e
JOIN location l ON e.location_id = l.location_id
GROUP BY cell