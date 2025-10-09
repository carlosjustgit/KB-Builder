-- Add 'research' as a valid doc_type for kb_documents
-- This allows research content to be saved separately from brand content

ALTER TABLE kb_documents 
DROP CONSTRAINT IF EXISTS kb_documents_doc_type_check;

ALTER TABLE kb_documents 
ADD CONSTRAINT kb_documents_doc_type_check 
CHECK (doc_type IN ('research', 'brand', 'services', 'market', 'competitors', 'tone', 'visual'));

-- Add comment for documentation
COMMENT ON CONSTRAINT kb_documents_doc_type_check ON kb_documents IS 
  'Valid document types: research (step 1), brand (step 2), services (step 3), market (step 4), competitors (step 5), tone (step 6), visual (step 7)';
