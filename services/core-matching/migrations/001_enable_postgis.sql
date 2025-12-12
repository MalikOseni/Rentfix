-- Migration: 001_enable_postgis.sql
-- Description: Enable PostGIS extension for geospatial queries
-- Author: Senior Engineering Team
-- Date: 2025-12-12

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verify PostGIS installation
SELECT PostGIS_version();

-- Create spatial reference system if not exists (WGS 84 - GPS coordinates)
-- SRID 4326 is the standard for latitude/longitude
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM spatial_ref_sys WHERE srid = 4326
    ) THEN
        -- This should already exist, but adding for safety
        INSERT INTO spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text)
        VALUES (
            4326,
            'EPSG',
            4326,
            'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]',
            '+proj=longlat +datum=WGS84 +no_defs'
        );
    END IF;
END $$;

-- Add location_point column to contractors table
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS location_point geography(Point, 4326);

-- Create function to update location_point from lat/lng
CREATE OR REPLACE FUNCTION update_contractor_location_point()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location_point = ST_SetSRID(
            ST_MakePoint(NEW.longitude, NEW.latitude),
            4326
        )::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update location_point
DROP TRIGGER IF EXISTS trigger_update_contractor_location_point ON contractors;
CREATE TRIGGER trigger_update_contractor_location_point
    BEFORE INSERT OR UPDATE OF latitude, longitude ON contractors
    FOR EACH ROW
    EXECUTE FUNCTION update_contractor_location_point();

-- Backfill existing contractors with location_point
UPDATE contractors
SET location_point = ST_SetSRID(
    ST_MakePoint(longitude, latitude),
    4326
)::geography
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND location_point IS NULL;

-- Create spatial index for high-performance geospatial queries
-- This is critical for Uber-style location-based searches
CREATE INDEX IF NOT EXISTS idx_contractors_location_point
    ON contractors USING GIST (location_point);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_contractors_location_specialty_status
    ON contractors USING GIST (location_point)
    WHERE deleted_at IS NULL
      AND status = 'verified'
      AND availability_status = 'available';

-- Create GIN index for JSONB specialty searches
CREATE INDEX IF NOT EXISTS idx_contractors_specialties_gin
    ON contractors USING GIN (specialties);

-- Create performance analysis function
CREATE OR REPLACE FUNCTION analyze_contractor_spatial_distribution()
RETURNS TABLE (
    specialty TEXT,
    total_count BIGINT,
    avg_distance_km NUMERIC,
    max_service_radius NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.specialty,
        COUNT(*) as total_count,
        ROUND(AVG(
            ST_Distance(
                c.location_point,
                ST_SetSRID(ST_MakePoint(-74.006, 40.7128), 4326)::geography -- NYC center
            ) / 1000
        )::numeric, 2) as avg_distance_km,
        MAX(c.service_radius) as max_service_radius
    FROM contractors c
    CROSS JOIN LATERAL jsonb_array_elements_text(c.specialties) as s(specialty)
    WHERE c.deleted_at IS NULL
      AND c.status = 'verified'
    GROUP BY s.specialty
    ORDER BY total_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON COLUMN contractors.location_point IS 'PostGIS geography point (lat/lng) for geospatial queries. Auto-updated from latitude/longitude.';
COMMENT ON INDEX idx_contractors_location_point IS 'GIST spatial index for fast radius-based contractor searches';
COMMENT ON FUNCTION update_contractor_location_point IS 'Trigger function to automatically sync location_point with lat/lng changes';
COMMENT ON FUNCTION analyze_contractor_spatial_distribution IS 'Analyze contractor distribution by specialty and location';

-- Verification queries (run manually to verify setup)
DO $$
DECLARE
    postgis_ver TEXT;
    index_count INT;
BEGIN
    -- Check PostGIS version
    SELECT PostGIS_version() INTO postgis_ver;
    RAISE NOTICE 'PostGIS Version: %', postgis_ver;

    -- Check spatial indexes
    SELECT COUNT(*)
    INTO index_count
    FROM pg_indexes
    WHERE tablename = 'contractors'
      AND indexname LIKE '%location%';

    RAISE NOTICE 'Spatial indexes created: %', index_count;

    -- Test spatial query
    RAISE NOTICE 'Testing spatial query...';
    PERFORM *
    FROM contractors
    WHERE ST_DWithin(
        location_point,
        ST_SetSRID(ST_MakePoint(-74.006, 40.7128), 4326)::geography,
        5000 -- 5km
    )
    LIMIT 1;

    RAISE NOTICE '✓ PostGIS migration completed successfully';
END $$;
