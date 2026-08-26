drop policy if exists "Users can update their own affirmations" on public.affirmations;
create policy "Users can update their own affirmations"
  on public.affirmations for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own affirmations" on public.affirmations;
create policy "Users can delete their own affirmations"
  on public.affirmations for delete
  using (auth.uid() = user_id);
