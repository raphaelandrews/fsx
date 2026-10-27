EXPLAIN QUERY PLAN
SELECT id FROM players
WHERE active = 1
ORDER BY rapid DESC, id ASC
LIMIT 20;

EXPLAIN QUERY PLAN
SELECT id FROM players
WHERE active = 1 AND normalized_name LIKE '%sergipe%'
ORDER BY rapid DESC, id ASC
LIMIT 20;

EXPLAIN QUERY PLAN
SELECT id, title, slug, created_at
FROM posts
WHERE published = 1
ORDER BY created_at DESC, id DESC
LIMIT 12 OFFSET 240;

EXPLAIN QUERY PLAN
SELECT id, name, type
FROM circuits
ORDER BY name ASC, id ASC
LIMIT 100;

EXPLAIN QUERY PLAN
SELECT club_id, sum(points)
FROM tv_sergipe
WHERE age_group = '12' AND sex = 'female' AND modality = 'team'
GROUP BY club_id
ORDER BY sum(points) DESC, club_id ASC
LIMIT 500;

-- Player index audit: run each block, drop a candidate index, run again, and compare plans and rows read.
-- Result (4,000 players, with and without ANALYZE): players_sex_idx, players_classic_idx and players_blitz_idx
-- changed no plan and no rows read, so they were removed. players_active_idx, players_active_birth_year_idx and
-- players_rapid_idx each change a public query (sitemap/API ordering, age-group filter, unfiltered rapid sorts).
EXPLAIN QUERY PLAN SELECT id FROM players WHERE active = 1 ORDER BY classic DESC, id ASC LIMIT 20;
EXPLAIN QUERY PLAN SELECT id FROM players WHERE active = 1 ORDER BY blitz DESC, id ASC LIMIT 20;
EXPLAIN QUERY PLAN SELECT count(*) FROM players WHERE active = 1 AND sex = 'female';
EXPLAIN QUERY PLAN SELECT id FROM players WHERE active = 1 AND birth_year >= 2010 AND birth_year <= 2011 ORDER BY rapid DESC, id ASC LIMIT 20;
EXPLAIN QUERY PLAN SELECT id FROM players ORDER BY rapid DESC, id ASC LIMIT 20000;
EXPLAIN QUERY PLAN SELECT id FROM players WHERE active = 1 ORDER BY id ASC LIMIT 10000;
