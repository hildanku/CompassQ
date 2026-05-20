alter table public.reflections
drop constraint if exists reflections_content_check;

alter table public.reflections
add constraint reflections_content_check
check (char_length(content) between 1 and 280);
