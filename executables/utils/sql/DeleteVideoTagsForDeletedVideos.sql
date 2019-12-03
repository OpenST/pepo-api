-- Delete from video tags
delete vt.* from
video_details vd inner join video_tags vt join videos v
on vd.video_id = vt.video_id
and v.id = vt.video_id
where vd.status = 2
and v.status = 2;


-- Verification query
select * from (select a.id,a.video_weight,count(*) as total from tags a inner join
(select vt.video_id,vt.tag_id from
video_details vd inner join video_tags vt join videos v
on vd.video_id = vt.video_id
and v.id = vt.video_id
where vd.status != 2) as b
on a.id = b.tag_id
group by 1,2) as c
where c.video_weight != c.total
