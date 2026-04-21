-- Narrow heat_stress retrieval symptoms so generic signs (lethargy, off feed) do not outrank infectious differentials.
UPDATE public.knowledge_conditions
SET
  common_symptoms = ARRAY[
    'panting',
    'wings drooped',
    'open mouth breathing in hot weather',
    'seeking shade',
    'clustered around drinkers in heat',
    'reduced activity during midday heat'
  ]::TEXT[]
WHERE condition_code = 'heat_stress';
