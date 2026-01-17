-- Add email column to clients table if it doesn't exist
-- This migration ensures the clients table has an email column

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for email lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);

-- Add comment to the column
COMMENT ON COLUMN public.clients.email IS 'Email address of the client, can be used for login';
