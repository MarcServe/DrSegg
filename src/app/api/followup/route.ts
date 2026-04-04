import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { caseId, notes, status } = data;
    
    // Mocking the Followup Progress Engine
    const progressStatus = status || 'improving'; // improving, unchanged, worsening

    if (supabase && caseId && !caseId.startsWith('mock-case-')) {
      const { error } = await supabase
        .from('followups')
        .insert({
          case_id: caseId,
          notes: notes || 'Daily check-in',
          status: progressStatus
        });

      if (error) throw error;
    }

    return NextResponse.json({
      success: true,
      status: progressStatus,
      message: `Follow-up recorded. Status: ${progressStatus}`,
    });
  } catch (error) {
    console.error("Followup Error:", error);
    return NextResponse.json({ error: 'Failed to record follow-up' }, { status: 500 });
  }
}
