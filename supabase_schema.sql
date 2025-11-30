-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Assets Table
-- We use quoted identifiers to match the JSON keys from the frontend application exactly.
create table public.assets (
  "id" uuid default uuid_generate_v4() primary key,
  "user_id" uuid references auth.users(id) on delete cascade not null,
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null,
  "updated_at" timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Asset Data Fields
  "Asset Tag" text not null,
  "Block" text,
  "Floor" text,
  "Dept" text,
  "Brand" text,
  "Service Tag" text,
  "Computer Name" text,
  "Processor Type" text,
  "Processor Generation" text,
  "Processor Speed (GHz)" text,
  "RAM (GB)" text,
  "Hard Drive Type" text,
  "Hard Drive Size" text,
  "Graphics Card" text,
  "Operating System OS" text,
  "Operating System Architecture" text,
  "Operating System Version" text,
  "Windows License Key" text,
  "MS Office Version" text,
  "MS Office License Key" text,
  "Installed Applications" text,
  "Antivirus" text,
  "IP Address" text,
  "Remarks" text,

  -- Constraint to ensure Asset Tag is unique per user (or globally, depending on requirement. Here per user is safer for multi-tenant)
  -- However, the code uses onConflict: 'Asset Tag', so we should probably make it unique globally or add a composite unique constraint.
  -- For simplicity and matching the code's upsert logic:
  constraint assets_asset_tag_key unique ("Asset Tag")
);

-- Create Extraction History Table
create table public.extraction_history (
  "id" uuid default uuid_generate_v4() primary key,
  "user_id" uuid references auth.users(id) on delete cascade not null,
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null,
  "filename" text not null,
  "extracted_json" jsonb not null
);

-- Enable Row Level Security (RLS)
alter table public.assets enable row level security;
alter table public.extraction_history enable row level security;

-- Create Policies for Assets
create policy "Users can view their own assets"
  on public.assets for select
  using (auth.uid() = user_id);

create policy "Users can insert/update their own assets"
  on public.assets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create Policies for Extraction History
create policy "Users can view their own extraction history"
  on public.extraction_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own extraction history"
  on public.extraction_history for insert
  with check (auth.uid() = user_id);

-- Create indexes for better performance
create index assets_user_id_idx on public.assets(user_id);
create index extraction_history_user_id_idx on public.extraction_history(user_id);
