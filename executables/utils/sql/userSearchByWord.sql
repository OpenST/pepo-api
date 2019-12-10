-- Queries for fetching users who mentioned a particular word in text or links

select u.id as user_id, u.user_name, tw.email, tw.handle, 'video description' as found_in, t.text
from pepo_api_user_staging.users u, video_details v,
pepo_api_twitter_staging.twitter_users tw,
( select id, text from texts where (instr(text, ' test ') > 0 or instr(text, ' #test ') > 0 or instr(text, '.test ') > 0 or instr(text, '.test.') > 0) ) as t
where v.creator_user_id = u.id
and tw.user_id = u.id
and v.description_id = t.id;


select  u.id as user_id, u.user_name,tw.email, tw.handle, 'bio', t.text
from pepo_api_user_staging.user_profile_elements up, pepo_api_user_staging.users u,
pepo_api_twitter_staging.twitter_users tw,
( select id, text from texts where (instr(text, ' test ') > 0 or instr(text, ' #test ') > 0 or instr(text, '.test ') > 0 or instr(text, '.test.') > 0) ) as t
where u.id = up.user_id
and tw.user_id = u.id
and up.data_kind = 3
and up.data = t.id;


select u.id as user_id, u.user_name, tw.email, tw.handle, 'bio-link', ur.url
from pepo_api_user_staging.users u, pepo_api_user_staging.user_profile_elements up,
pepo_api_twitter_staging.twitter_users tw,
(select id, url from urls where instr(url, '.google.') > 0) ur
where u.id = up.user_id
and tw.user_id = u.id
and up.data_kind = 4
and up.data = ur.id;


select u.id as user_id, u.user_name, tw.email, tw.handle, 'video-link', ur.url
from pepo_api_user_staging.users u,
pepo_api_twitter_staging.twitter_users tw,
(select creator_user_id, description_id, link_ids from video_details where link_ids is not null) as v,
(select id, url from urls where instr(url, '.google.') > 0) as ur
where v.creator_user_id = u.id
and tw.user_id = u.id
and (v.link_ids like CONCAT('%',ur.id,',%') or v.link_ids like CONCAT('%',ur.id,']') or v.link_ids like CONCAT('[',ur.id,'%'));
