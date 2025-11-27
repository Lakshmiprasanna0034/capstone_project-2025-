-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for documents bucket
CREATE POLICY "Anyone can upload documents"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Users can view their uploaded documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Create documents table for verification records
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT NOT NULL,
  document_type TEXT,
  extracted_data JSONB,
  photo_url TEXT,
  confidence INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert documents
CREATE POLICY "Anyone can create documents"
ON public.documents FOR INSERT
TO public
WITH CHECK (true);

-- Create policy to allow anyone to read documents
CREATE POLICY "Anyone can read documents"
ON public.documents FOR SELECT
TO public
USING (true);

-- Create verification_logs table for audit trail
CREATE TABLE public.verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  verified BOOLEAN NOT NULL,
  ocr_confidence INTEGER,
  document_validation INTEGER,
  liveness_score INTEGER,
  face_match_score INTEGER,
  verification_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on verification_logs table
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert verification logs
CREATE POLICY "Anyone can create verification logs"
ON public.verification_logs FOR INSERT
TO public
WITH CHECK (true);

-- Create policy to allow anyone to read verification logs
CREATE POLICY "Anyone can read verification logs"
ON public.verification_logs FOR SELECT
TO public
USING (true);

-- Create index for faster queries
CREATE INDEX idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX idx_verification_logs_created_at ON public.verification_logs(created_at DESC);
CREATE INDEX idx_verification_logs_document_id ON public.verification_logs(document_id);