-- Sample data for categories
INSERT INTO category (name, description)
VALUES
  ('Music', 'Concerts, festivals, and musical performances'),
  ('Sports', 'Sports events and athletic activities'),
  ('Food', 'Food festivals, tastings, and culinary events'),
  ('Art', 'Art exhibitions, gallery openings, and creative showcases'),
  ('Technology', 'Tech conferences, hackathons, and workshops');

-- Sample location data
INSERT INTO city (country, postal_code, latitude, longitude, geo)
VALUES
  ('DE', 92224, 'Amberg', 40.7128, -74.0060),
