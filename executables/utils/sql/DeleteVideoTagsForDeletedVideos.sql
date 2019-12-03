delete vt.* from
video_details vd inner join video_tags vt join videos v
on vd.video_id = vt.video_id
and v.id = vt.video_id
where vd.status = 2
and v.status = 2;
