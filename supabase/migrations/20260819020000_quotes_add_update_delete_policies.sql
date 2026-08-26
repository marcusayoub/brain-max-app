drop policy if exists "Users can update their own quotes" on public.quotes;
create policy "Users can update their own quotes"
  on public.quotes for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own quotes" on public.quotes;
create policy "Users can delete their own quotes"
  on public.quotes for delete
  using (auth.uid() = user_id);
