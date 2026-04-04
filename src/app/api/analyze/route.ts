import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { animal, symptoms } = data;
    
    // Mocking the AI Health Baseline Engine
    // In production, this would call an LLM or Vision model
    const hasCriticalSigns = symptoms?.includes('cannot stand') || symptoms?.includes('bleeding');
    const hasWeakSignals = symptoms?.includes('lethargy');
    
    let healthStatus = 'healthy';
    let confidence = 98;
    let requiresMoreData = false;
    let possibleConditions: string[] = [];
    let severity = 'low';

    if (hasCriticalSigns) {
      healthStatus = 'critical';
      confidence = 95;
      possibleConditions = ['Severe Trauma', 'Acute Infection'];
      severity = 'RED (CRITICAL)';
    } else if (hasWeakSignals) {
      healthStatus = 'mild_concern';
      confidence = 70;
      requiresMoreData = true;
      possibleConditions = ['Early Stress', 'Mild Infection'];
      severity = 'YELLOW (MONITOR)';
    } else if (symptoms?.length > 0) {
      healthStatus = 'likely_sick';
      confidence = 88;
      
      // Mock conditions based on animal
      if (animal === 'poultry') {
        possibleConditions = ['Newcastle Disease'];
        severity = 'RED (CRITICAL)';
      } else if (animal === 'goat') {
        possibleConditions = ['Peste des Petits Ruminants (PPR)'];
        severity = 'ORANGE (HIGH)';
      } else {
        possibleConditions = ['Swine Erysipelas'];
        severity = 'ORANGE (HIGH)';
      }
    }

    let caseId = `mock-case-${Date.now()}`;

    // If Supabase is configured, insert the real data
    if (supabase) {
      // 1. Create the case
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .insert({
          animal_type: animal,
          health_status: healthStatus,
          confidence: confidence.toString(),
          mode: healthStatus === 'healthy' ? 'observation' : 'diagnosis'
        })
        .select('id')
        .single();

      if (caseError) throw caseError;
      caseId = caseData.id;

      // 2. Insert the symptoms as text inputs
      if (symptoms && symptoms.length > 0) {
        const inputs = symptoms.map((sym: string) => ({
          case_id: caseId,
          type: 'text',
          transcription: sym
        }));
        
        await supabase.from('case_inputs').insert(inputs);
      }

      // 3. Insert the analysis
      if (healthStatus !== 'healthy') {
        await supabase.from('case_analysis').insert({
          case_id: caseId,
          possible_conditions: possibleConditions,
          severity: severity,
          recommendations: ['Isolate animal', 'Contact vet if worsens']
        });
      }
    }

    return NextResponse.json({
      case_id: caseId,
      health_status: healthStatus,
      confidence,
      requires_more_data: requiresMoreData,
      possible_conditions: possibleConditions,
      severity,
      message: healthStatus === 'healthy' ? 'No strong signs of illness detected.' : 'Potential issues found.',
    });
  } catch (error) {
    console.error("Analyze Error:", error);
    return NextResponse.json({ error: 'Failed to analyze case' }, { status: 500 });
  }
}
