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
