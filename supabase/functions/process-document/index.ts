import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();
    console.log('Processing document:', filePath);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error('Failed to download document');
    }

    // Convert to base64 for AI processing
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = fileData.type;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log('Calling Lovable AI for OCR extraction...');

    // Call Lovable AI for OCR and document classification
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this identity document and extract the following information:
1. Document type (Aadhaar/Passport/Driver's License/Unknown)
2. Full name
3. ID number
4. Date of birth (format: YYYY-MM-DD)
5. Address
6. Confidence level (0-100) for the extraction
7. If there's a person's photo in the document, describe its approximate location (e.g., "top-right", "left-side")

Return a JSON object with this structure:
{
  "documentType": "string",
  "name": "string",
  "idNumber": "string",
  "dob": "string",
  "address": "string",
  "confidence": number,
  "hasPhoto": boolean,
  "photoLocation": "string"
}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI processing failed: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    console.log('AI response received');

    let extractedData;
    try {
      const content = aiResult.choices[0].message.content;
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n?(.*?)\n?```/s) || content.match(/\{.*\}/s);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      extractedData = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      throw new Error('Failed to parse document data');
    }

    // Use the original document image as the photo reference
    // In production, you could use AI to crop just the face region
    const photoUrl = extractedData.hasPhoto ? dataUrl : null;

    // Store document record
    const { data: docRecord, error: insertError } = await supabase
      .from('documents')
      .insert({
        file_path: filePath,
        document_type: extractedData.documentType,
        extracted_data: {
          name: extractedData.name,
          idNumber: extractedData.idNumber,
          dob: extractedData.dob,
          address: extractedData.address,
        },
        photo_url: photoUrl,
        confidence: extractedData.confidence,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to store document record');
    }

    console.log('Document processed successfully');

    return new Response(
      JSON.stringify({
        documentId: docRecord.id,
        documentType: extractedData.documentType,
        extractedData: {
          name: extractedData.name,
          idNumber: extractedData.idNumber,
          dob: extractedData.dob,
          address: extractedData.address,
        },
        photoUrl,
        confidence: extractedData.confidence,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in process-document:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
