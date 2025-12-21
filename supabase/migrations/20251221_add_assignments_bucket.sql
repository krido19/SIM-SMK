-- Add file_url column to assignments
alter table assignments add column if not exists file_url text;

-- Create 'assignments' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('assignments', 'assignments', true)
on conflict (id) do nothing;

-- Storage Policies (Using unique names to avoid conflict)
create policy "Assignments Read Access"
on storage.objects for select
using ( bucket_id = 'assignments' );

create policy "Assignments Upload Access"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'assignments' );

-- Optional: Delete policy
create policy "Assignments Delete Access"
on storage.objects for delete
to authenticated
using ( bucket_id = 'assignments' and auth.uid() = owner );
