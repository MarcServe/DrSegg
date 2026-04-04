import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { region, condition, caseId } = data;
    
    // Fallback Mock Data
    let treatments = [
      {
        id: '1',
        active_ingredient: 'Penicillin',
        brands: ['BoviCillin XL'],
        region: region || 'Northern Highlands District',
        availability: 'Vet Required',
        dosage: '15ml per 100kg',
        withdrawal_period: '28 Days (Meat) / 7 Days (Milk)',
        warnings: ['Requires intervention within 24 hours']
      },
      {
        id: '2',
        active_ingredient: 'Herbal Supplement',
        brands: ['HerbaGuard Plus'],
        region: region || 'Northern Highlands District',
        availability: 'OTC',
        dosage: '2 Tablets daily / 5 days',
        withdrawal_period: 'None',
        warnings: ['Store below 25°C']
      }
    ];

    if (supabase) {
      // 1. Fetch real treatments from drug_database
      const { data: dbTreatments, error: dbError } = await supabase
        .from('drug_database')
        .select('*')
        .eq('region', region);

      if (!dbError && dbTreatments && dbTreatments.length > 0) {
        // Map the DB rows to our UI format
        treatments = dbTreatments.map((drug) => ({
          id: drug.id,
          active_ingredient: drug.active_ingredient,
          brands: [drug.brand_name],
          region: drug.region,
          availability: drug.requires_prescription ? 'Vet Required' : 'OTC',
          dosage: 'Consult packaging or vet', // Real app would use dosage engine
          withdrawal_period: drug.withdrawal_period || 'None',
          warnings: []
        }));
      }

      // 2. Save the treatment plan to the case
      if (caseId && !caseId.startsWith('mock-case-')) {
        await supabase.from('treatment_plans').insert({
          case_id: caseId,
          region,
          treatments: treatments,
          dosage: { note: "Follow vet instructions" }
        });
      }
    }

    return NextResponse.json({
      treatments,
      message: `Found ${treatments.length} treatments for ${condition} in ${region}.`,
    });
  } catch (error) {
    console.error("Treatment Error:", error);
    return NextResponse.json({ error: 'Failed to fetch treatments' }, { status: 500 });
  }
}
