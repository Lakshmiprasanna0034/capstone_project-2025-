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
    const { documentData, filePath, livePhoto } = await req.json();
    console.log('Verifying document and liveness...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download original document for face comparison
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error('Failed to download document');
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = fileData.type;
    const docImageUrl = `data:${mimeType};base64,${base64}`;

    console.log('Performing liveness and face match verification...');

    // Call Lovable AI for liveness detection and face matching using structured output
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
                text: `You are an EXPERT facial biometric verification system. Your job is to ACCURATELY determine if two photos show the SAME PERSON.

IMAGE 1: Identity document containing a person's photo
IMAGE 2: Live selfie photo of a person

CRITICAL INSTRUCTIONS:

1. IMAGE QUALITY CHECK - Reject immediately if:
   - IMAGE 2 (selfie) is blurred, out of focus, or has low resolution
   - Face is not clearly visible or partially obscured
   - Lighting is too dark or overexposed
   - Image has motion blur or is pixelated
   If IMAGE 2 has ANY of these quality issues, set livenessScore to 0-30

2. LIVENESS SCORE (0-100) - Is IMAGE 2 a real, live person?
   - REJECT (0-30): Blurred, unclear, too dark, motion blur, poor quality
   - REJECT (0-40): Photo of a photo, screen display, printed image, flat appearance
   - REJECT (0-40): Mask, 3D model, artificial features
   - PASS (70-100): Clear, sharp image with natural skin texture, proper lighting, real person
   
3. FACE MATCH SCORE (0-100) - Are these the SAME person?
   CRITICAL: You must CAREFULLY analyze if this is the SAME PERSON or DIFFERENT PEOPLE.
   
   Core biometric features to compare (these should MATCH for same person):
   - Eye shape, size, spacing between eyes, eye-to-nose distance
   - Nose bridge width, nose length, nostril shape
   - Mouth width, lip shape, philtrum (area between nose and lips)
   - Jawline shape, chin shape, face width-to-height ratio
   - Ear shape and position (if visible)
   - Facial bone structure and proportions
   
   Natural variations (OK for same person):
   - Facial hair (beard, mustache) - can be added/removed
   - Glasses, makeup, accessories
   - Hair style, hair color
   - Age differences (some aging is normal)
   - Different angles, lighting, photo quality
   - Different expressions (smile vs. neutral)
   
   SCORING:
   - DIFFERENT PEOPLE (0-45): Core facial structure does NOT match - eye spacing different, nose shape different, jaw shape different, face proportions different
   - UNCERTAIN (46-69): Some similarities but significant differences in core features
   - SAME PERSON (70-100): Core facial structure MATCHES - bone structure, eye placement, nose structure, face proportions are consistent
   
   ⚠️ IMPORTANT: If the core bone structure and facial proportions look DIFFERENT, score LOW (0-45) even if there are superficial similarities. Different people are COMMON in fraud attempts.

4. DOCUMENT VALIDATION SCORE (0-100):
   - Does IMAGE 1 look like a genuine government ID photo?
   - Check for tampering, photoshop edits, manipulation
   - Be lenient with older IDs (wear, fading is OK)
   - REJECT (0-40): Obviously fake, manipulated, or photoshopped
   - PASS (70-100): Appears authentic

FINAL REMINDER: Your primary job is to catch FRAUD. If the two faces look like DIFFERENT PEOPLE, you MUST score face match LOW (0-45). Be strict on identity matching while being reasonable about natural variations for the SAME person.`
              },
              {
                type: 'image_url',
                image_url: { url: docImageUrl }
              },
              {
                type: 'image_url',
                image_url: { url: livePhoto }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'verify_identity',
              description: 'Return verification scores for liveness detection and face matching',
              parameters: {
                type: 'object',
                properties: {
                  livenessScore: {
                    type: 'number',
                    description: 'Liveness score from 0-100'
                  },
                  faceMatchScore: {
                    type: 'number',
                    description: 'Face match score from 0-100'
                  },
                  documentValidation: {
                    type: 'number',
                    description: 'Document validation score from 0-100'
                  },
                  notes: {
                    type: 'string',
                    description: 'Brief explanation of the verification'
                  }
                },
                required: ['livenessScore', 'faceMatchScore', 'documentValidation', 'notes']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'verify_identity' } },
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI verification failed: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    console.log('AI verification response received');

    // Extract structured output from tool call
    let verificationScores;
    try {
      const toolCalls = aiResult.choices[0].message.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        console.error('No tool calls in response:', JSON.stringify(aiResult));
        throw new Error('No verification data returned');
      }
      
      const functionArgs = toolCalls[0].function.arguments;
      verificationScores = typeof functionArgs === 'string' 
        ? JSON.parse(functionArgs) 
        : functionArgs;
      
      console.log('Parsed scores:', verificationScores);
      
      // Validate all required fields are present
      if (!verificationScores.livenessScore || 
          !verificationScores.faceMatchScore || 
          !verificationScores.documentValidation) {
        throw new Error('Missing required verification scores');
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      console.error('Full response:', JSON.stringify(aiResult));
      throw new Error('Failed to parse verification results');
    }

    // Calculate overall verification
    const ocrConfidence = documentData.confidence || 85;
    const { livenessScore, faceMatchScore, documentValidation } = verificationScores;

    // Verification thresholds - strict for security
    const verified = 
      ocrConfidence >= 75 &&           // OCR must be good quality
      documentValidation >= 70 &&      // Document must appear authentic (lenient for older IDs)
      livenessScore >= 70 &&           // Must be clear, sharp image of a real person
      faceMatchScore >= 70;            // STRICT: Core facial biometrics must match (same person)

    // Generate verification token (simple JWT-like structure)
    const timestamp = new Date().toISOString();
    const tokenData = {
      verified,
      timestamp,
      documentType: documentData.documentType,
      scores: {
        ocrConfidence,
        documentValidation,
        livenessScore,
        faceMatchScore,
      }
    };
    const token = verified 
      ? btoa(JSON.stringify(tokenData))
      : null;

    // Store verification log
    const { error: logError } = await supabase
      .from('verification_logs')
      .insert({
        document_id: documentData.documentId,
        verified,
        ocr_confidence: ocrConfidence,
        document_validation: documentValidation,
        liveness_score: livenessScore,
        face_match_score: faceMatchScore,
        verification_token: token,
      });

    if (logError) {
      console.error('Failed to log verification:', logError);
    }

    console.log('Verification complete:', verified ? 'PASSED' : 'FAILED');

    return new Response(
      JSON.stringify({
        verified,
        scores: {
          ocrConfidence,
          documentValidation,
          livenessScore,
          faceMatchScore,
        },
        token,
        timestamp,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in verify-document:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
