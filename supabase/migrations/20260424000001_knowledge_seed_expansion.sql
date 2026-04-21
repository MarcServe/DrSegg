-- Expanded drugs, conditions, chunks, and condition_treatments for RAG + structured treatment rows.
--
-- CLINICAL / REGULATORY REVIEW CHECKLIST (manual — not automated)
-- [ ] Licensed veterinarian: accuracy of condition names, signs, and treatment row wording.
-- [ ] Competent authority / legal: notifiable disease flags and reporting language for your jurisdiction.
-- [ ] Pharmacovigilance / label review: drug rows match products legally marketed where you operate.
-- Seeded copy remains educational; Dr Segira prompts forbid LLM dosing — DB rows are still vetted references.

-- ---------------------------------------------------------------------------
-- Additional drugs (deterministic IDs for stable FK references)
-- ---------------------------------------------------------------------------
INSERT INTO public.drug_database (
  id, active_ingredient, brand_name, region, form, requires_prescription, withdrawal_period,
  drug_class, species_scope, search_keywords
)
VALUES
  ('33333333-3333-3333-3333-333333333301', 'Enrofloxacin', 'Enrofloxacin (vet-directed example)', 'Northern Highlands District', 'oral', true, 'Per vet and product label', 'fluoroquinolone', ARRAY['poultry', 'pig', 'dog']::TEXT[], 'enrofloxacin antibiotic'),
  ('33333333-3333-3333-3333-333333333302', 'Tylosin', 'Tylosin (vet-directed example)', 'Northern Highlands District', 'oral or water', false, 'Per product label', 'macrolide', ARRAY['poultry', 'pig']::TEXT[], 'tylosin macrolide'),
  ('33333333-3333-3333-3333-333333333303', 'Penicillin G procaine', 'Penicillin G procaine (vet-directed)', 'Northern Highlands District', 'injectable', true, 'Per vet; milk/meat withdrawal', 'beta_lactam', ARRAY['cattle', 'pig', 'goat', 'dog']::TEXT[], 'penicillin injectable'),
  ('33333333-3333-3333-3333-333333333304', 'Sulfadiazine + trimethoprim', 'Sulfadiazine-trimethoprim (vet-directed)', 'Northern Highlands District', 'oral or injectable', true, 'Per vet and label', 'sulphonamide', ARRAY['poultry', 'pig', 'dog', 'cattle']::TEXT[], 'sulfa trimethoprim'),
  ('33333333-3333-3333-3333-333333333305', 'Florfenicol', 'Florfenicol (vet-directed)', 'Northern Highlands District', 'injectable', true, 'Per vet; withdrawal', 'amphenicol', ARRAY['cattle', 'pig', 'poultry']::TEXT[], 'florfenicol'),
  ('33333333-3333-3333-3333-333333333306', 'Tulathromycin', 'Tulathromycin (vet-directed)', 'Northern Highlands District', 'injectable', true, 'Per vet; withdrawal', 'macrolide', ARRAY['cattle', 'pig']::TEXT[], 'tulathromycin resp'),
  ('33333333-3333-3333-3333-333333333307', 'Doxycycline', 'Doxycycline (vet-directed)', 'Northern Highlands District', 'oral', true, 'Per vet and label', 'tetracycline', ARRAY['poultry', 'pig', 'dog', 'cattle', 'goat']::TEXT[], 'doxy tetracycline'),
  ('33333333-3333-3333-3333-333333333308', 'Albendazole', 'Albendazole (vet-directed)', 'Northern Highlands District', 'oral', false, 'Per label; meat/milk withdrawal', 'benzimidazole', ARRAY['cattle', 'goat', 'pig', 'dog', 'poultry']::TEXT[], 'albendazole wormer'),
  ('33333333-3333-3333-3333-333333333309', 'Fenbendazole', 'Fenbendazole (vet-directed)', 'Northern Highlands District', 'oral', false, 'Per label', 'benzimidazole', ARRAY['goat', 'pig', 'dog', 'cattle', 'poultry']::TEXT[], 'fenbendazole wormer'),
  ('33333333-3333-3333-3333-333333333310', 'Ivermectin', 'Ivermectin (vet-directed)', 'Northern Highlands District', 'injectable or pour-on', true, 'Per label; milk withdrawal in dairy', 'avermectin', ARRAY['cattle', 'goat', 'pig', 'dog']::TEXT[], 'ivermectin'),
  ('33333333-3333-3333-3333-333333333311', 'Metronidazole', 'Metronidazole (vet-directed)', 'Northern Highlands District', 'oral', true, 'Per vet', 'nitroimidazole', ARRAY['dog', 'poultry']::TEXT[], 'metronidazole'),
  ('33333333-3333-3333-3333-333333333312', 'Meloxicam', 'Meloxicam (vet-directed)', 'Northern Highlands District', 'injectable or oral', true, 'Per vet; withdrawal', 'nsaid', ARRAY['cattle', 'pig', 'dog', 'goat']::TEXT[], 'meloxicam nsaid'),
  ('33333333-3333-3333-3333-333333333313', 'Flunixin meglumine', 'Flunixin meglumine (vet-directed)', 'Northern Highlands District', 'injectable', true, 'Per vet; withdrawal', 'nsaid', ARRAY['cattle', 'pig', 'dog', 'goat']::TEXT[], 'flunixin'),
  ('33333333-3333-3333-3333-333333333314', 'Maropitant', 'Maropitant (vet-directed)', 'Northern Highlands District', 'injectable or oral', true, 'Per vet', 'antiemetic', ARRAY['dog']::TEXT[], 'maropitant')
ON CONFLICT (id) DO NOTHING;

UPDATE public.drug_database SET drug_class = 'anticoccidial', species_scope = ARRAY['poultry', 'all']::TEXT[]
WHERE id = '11111111-1111-1111-1111-111111111101';
UPDATE public.drug_database SET drug_class = 'anticoccidial', species_scope = ARRAY['poultry', 'all']::TEXT[]
WHERE id = '11111111-1111-1111-1111-111111111102';
UPDATE public.drug_database SET drug_class = 'tetracycline', species_scope = ARRAY['poultry', 'pig', 'cattle', 'all']::TEXT[]
WHERE id = '11111111-1111-1111-1111-111111111103';

-- ---------------------------------------------------------------------------
-- New knowledge conditions (24 rows)
-- ---------------------------------------------------------------------------
INSERT INTO public.knowledge_conditions (
  id, condition_code, condition_name, species, common_symptoms, category,
  requires_vet, notifiable, severity_hint
)
VALUES
  ('44444444-4444-4444-4444-444444444401', 'infectious_coryza', 'Infectious coryza', ARRAY['poultry', 'all']::TEXT[], ARRAY['facial swelling', 'nasal discharge', 'sneezing', 'drop in production']::TEXT[], 'bacterial', false, false, 'moderate'),
  ('44444444-4444-4444-4444-444444444402', 'avian_influenza', 'Highly pathogenic avian influenza (differential)', ARRAY['poultry', 'all']::TEXT[], ARRAY['sudden mortality', 'cyanosis', 'respiratory distress', 'drops in production']::TEXT[], 'viral', true, true, 'critical'),
  ('44444444-4444-4444-4444-444444444403', 'infectious_bronchitis', 'Infectious bronchitis', ARRAY['poultry', 'all']::TEXT[], ARRAY['coughing', 'sneezing', 'misshapen eggs', 'respiratory noise']::TEXT[], 'viral', false, false, 'moderate'),
  ('44444444-4444-4444-4444-444444444404', 'ibd_gumboro', 'Infectious bursal disease (Gumboro)', ARRAY['poultry', 'all']::TEXT[], ARRAY['wet droppings', 'depression', 'immunosuppression in young birds']::TEXT[], 'viral', false, false, 'moderate'),
  ('44444444-4444-4444-4444-444444444405', 'mareks_disease', 'Marek''s disease', ARRAY['poultry', 'all']::TEXT[], ARRAY['lameness', 'wing paralysis', 'weight loss', 'iris changes']::TEXT[], 'viral', false, false, 'moderate'),
  ('44444444-4444-4444-4444-444444444406', 'fowl_cholera', 'Fowl cholera (Pasteurella)', ARRAY['poultry', 'all']::TEXT[], ARRAY['sudden death', 'cyanosis', 'fever', 'joint swelling']::TEXT[], 'bacterial', true, false, 'high'),
  ('44444444-4444-4444-4444-444444444407', 'fowl_pox', 'Fowl pox', ARRAY['poultry', 'all']::TEXT[], ARRAY['skin scabs', 'oral plaques', 'reduced production']::TEXT[], 'viral', false, false, 'moderate'),
  ('44444444-4444-4444-4444-444444444408', 'necrotic_enteritis', 'Necrotic enteritis', ARRAY['poultry', 'all']::TEXT[], ARRAY['sudden death', 'bloody/intestinal dysfunction signs', 'ruffled feathers']::TEXT[], 'bacterial', false, false, 'high'),
  ('44444444-4444-4444-4444-444444444409', 'mycoplasmosis_poultry', 'Mycoplasmosis in poultry', ARRAY['poultry', 'all']::TEXT[], ARRAY['coughing', 'nasal discharge', 'air sac changes', 'reduced hatch']::TEXT[], 'bacterial', false, false, 'moderate'),
  ('44444444-4444-4444-4444-444444444410', 'asf_swine', 'African swine fever (differential)', ARRAY['pig', 'all']::TEXT[], ARRAY['fever', 'hemorrhage', 'high mortality', 'weakness']::TEXT[], 'viral', true, true, 'critical'),
  ('44444444-4444-4444-4444-444444444411', 'classical_swine_fever', 'Classical swine fever (differential)', ARRAY['pig', 'all']::TEXT[], ARRAY['fever', 'purple skin', 'diarrhoea', 'neurologic signs']::TEXT[], 'viral', true, true, 'critical'),
  ('44444444-4444-4444-4444-444444444412', 'prrs', 'PRRS', ARRAY['pig', 'all']::TEXT[], ARRAY['respiratory disease', 'reproductive failure', 'fever']::TEXT[], 'viral', true, false, 'high'),
  ('44444444-4444-4444-4444-444444444413', 'swine_erysipelas', 'Swine erysipelas', ARRAY['pig', 'all']::TEXT[], ARRAY['diamond-shaped skin lesions', 'fever', 'lameness']::TEXT[], 'bacterial', true, false, 'high'),
  ('44444444-4444-4444-4444-444444444414', 'ped_swine', 'Porcine epidemic diarrhoea (differential)', ARRAY['pig', 'all']::TEXT[], ARRAY['watery diarrhoea in piglets', 'dehydration']::TEXT[], 'viral', true, false, 'high'),
  ('44444444-4444-4444-4444-444444444415', 'cae_goat', 'CAE in goats', ARRAY['goat', 'all']::TEXT[], ARRAY['chronic lameness', 'mastitis', 'weight loss', 'respiratory signs']::TEXT[], 'viral', true, false, 'moderate'),
  ('44444444-4444-4444-4444-444444444416', 'ccpp', 'Contagious caprine pleuropneumonia', ARRAY['goat', 'all']::TEXT[], ARRAY['severe respiratory distress', 'fever', 'mortality']::TEXT[], 'bacterial', true, true, 'critical'),
  ('44444444-4444-4444-4444-444444444417', 'caseous_lymphadenitis_cla', 'Caseous lymphadenitis', ARRAY['goat', 'all']::TEXT[], ARRAY['external abscesses', 'chronic weight loss']::TEXT[], 'bacterial', false, false, 'moderate'),
  ('44444444-4444-4444-4444-444444444418', 'enterotoxemia_goat', 'Enterotoxemia (overeating disease)', ARRAY['goat', 'all']::TEXT[], ARRAY['sudden death', 'bloating', 'neurologic signs']::TEXT[], 'bacterial', true, false, 'high'),
  ('44444444-4444-4444-4444-444444444419', 'brd_cattle', 'Bovine respiratory disease complex', ARRAY['cattle', 'all']::TEXT[], ARRAY['fever', 'cough', 'nasal discharge', 'depression']::TEXT[], 'mixed', true, false, 'high'),
  ('44444444-4444-4444-4444-444444444420', 'lumpy_skin_disease', 'Lumpy skin disease (differential)', ARRAY['cattle', 'all']::TEXT[], ARRAY['skin nodules', 'fever', 'lymphadenopathy']::TEXT[], 'viral', true, true, 'high'),
  ('44444444-4444-4444-4444-444444444421', 'bovine_tb', 'Bovine tuberculosis (differential)', ARRAY['cattle', 'all']::TEXT[], ARRAY['chronic weight loss', 'intermittent cough', 'enlarged lymph nodes']::TEXT[], 'bacterial', true, true, 'high'),
  ('44444444-4444-4444-4444-444444444422', 'ketosis_acetonemia', 'Ketosis / acetonemia', ARRAY['cattle', 'goat', 'all']::TEXT[], ARRAY['reduced appetite', 'nervous signs', 'milk drop']::TEXT[], 'metabolic', true, false, 'moderate'),
  ('44444444-4444-4444-4444-444444444423', 'milk_fever_hypocalcemia', 'Milk fever (hypocalcemia)', ARRAY['cattle', 'goat', 'all']::TEXT[], ARRAY['recumbency', 'bloat', 'cold extremities', 'agitation then weakness']::TEXT[], 'metabolic', true, false, 'critical'),
  ('44444444-4444-4444-4444-444444444424', 'mastitis_bovine', 'Mastitis', ARRAY['cattle', 'goat', 'all']::TEXT[], ARRAY['swollen udder', 'abnormal milk', 'fever', 'reduced yield']::TEXT[], 'infectious', true, false, 'high')
ON CONFLICT (condition_code) DO NOTHING;

INSERT INTO public.knowledge_conditions (
  id, condition_code, condition_name, species, common_symptoms, category,
  requires_vet, notifiable, severity_hint
)
VALUES
  ('44444444-4444-4444-4444-444444444425', 'canine_distemper', 'Canine distemper', ARRAY['dog', 'all']::TEXT[], ARRAY['respiratory signs', 'neurologic signs', 'ocular discharge', 'fever']::TEXT[], 'viral', true, false, 'high'),
  ('44444444-4444-4444-4444-444444444426', 'kennel_cough_complex', 'Canine infectious respiratory disease complex', ARRAY['dog', 'all']::TEXT[], ARRAY['dry cough', 'retching', 'mild nasal discharge']::TEXT[], 'mixed', false, false, 'low'),
  ('44444444-4444-4444-4444-444444444427', 'leptospirosis_canine', 'Leptospirosis (canine)', ARRAY['dog', 'all']::TEXT[], ARRAY['fever', 'vomiting', 'jaundice', 'renal signs']::TEXT[], 'bacterial', true, false, 'high'),
  ('44444444-4444-4444-4444-444444444428', 'heartworm_dirofilariasis', 'Heartworm', ARRAY['dog', 'all']::TEXT[], ARRAY['exercise intolerance', 'cough', 'weight loss']::TEXT[], 'parasitic', true, false, 'high'),
  ('44444444-4444-4444-4444-444444444429', 'rabies', 'Rabies (differential)', ARRAY['dog', 'goat', 'cattle', 'pig', 'all']::TEXT[], ARRAY['behaviour change', 'paralysis', 'hypersalivation', 'aggression']::TEXT[], 'viral', true, true, 'critical'),
  ('44444444-4444-4444-4444-444444444430', 'dermatophytosis_ringworm', 'Dermatophytosis (ringworm)', ARRAY['dog', 'cattle', 'goat', 'pig', 'all']::TEXT[], ARRAY['circular hair loss', 'crusting', 'itching']::TEXT[], 'fungal', false, false, 'low')
ON CONFLICT (condition_code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Knowledge chunks (keyword + future embedding targets)
-- ---------------------------------------------------------------------------
INSERT INTO public.knowledge_condition_chunks (condition_id, source_title, chunk_text)
VALUES
  ('44444444-4444-4444-4444-444444444401', 'Overview', 'Infectious coryza in chickens causes facial swelling and nasal discharge often affecting multiple birds; veterinary sampling may be needed to rule out other respiratory diseases.'),
  ('44444444-4444-4444-4444-444444444402', 'Overview', 'Avian influenza can present with sudden deaths and severe respiratory signs; suspected outbreaks typically require immediate veterinary involvement and reporting per local rules.'),
  ('44444444-4444-4444-4444-444444444403', 'Overview', 'Infectious bronchitis is a coronavirus affecting mainly the respiratory tract and egg quality; control is centred on vaccination programmes and biosecurity where used.'),
  ('44444444-4444-4444-4444-444444444404', 'Overview', 'IBD targets the bursa in young chickens and can cause immunosuppression; signs vary with age and strain exposure.'),
  ('44444444-4444-4444-4444-444444444405', 'Overview', 'Mareks is a herpesvirus tumour complex causing lameness and nerve signs; vaccination timing is key on many farms.'),
  ('44444444-4444-4444-4444-444444444406', 'Overview', 'Fowl cholera is a bacterial septicaemia with acute death or chronic joint and wattles swellings; diagnosis needs laboratory confirmation.'),
  ('44444444-4444-4444-4444-444444444407', 'Overview', 'Fowl pox has dry (skin) or wet (mucosal) forms; spread is often slow within a flock.'),
  ('44444444-4444-4444-4444-444444444408', 'Overview', 'Necrotic enteritis associates with Clostridium overgrowth after intestinal disruption; acute mortality can occur in broilers.'),
  ('44444444-4444-4444-4444-444444444409', 'Overview', 'Avian mycoplasma infections often cause chronic respiratory noise and poor performance; many herds/flocks are managed with veterinary plans.'),
  ('44444444-4444-4444-4444-444444444410', 'Overview', 'African swine fever is a reportable haemorrhagic viral disease of pigs with very high mortality in acute forms; strict biosecurity and official response apply.'),
  ('44444444-4444-4444-4444-444444444411', 'Overview', 'Classical swine fever is reportable in many countries; acute fever and hemorrhages prompt official veterinary action.'),
  ('44444444-4444-4444-4444-444444444412', 'Overview', 'PRRS impacts respiratory disease and reproduction in pigs; herd management involves veterinary diagnostics and vaccination strategy where applied.'),
  ('44444444-4444-4444-4444-444444444413', 'Overview', 'Swine erysipelas can cause classic diamond-shaped skin lesions and lameness; acute cases benefit from veterinary care.'),
  ('44444444-4444-4444-4444-444444444414', 'Overview', 'PED causes severe watery diarrhoea mainly in suckling piglets; differential from other enteric pathogens needs lab tests.'),
  ('44444444-4444-4444-4444-444444444415', 'Overview', 'CAE is a lentivirus leading to chronic arthritis, mastitis, and respiratory issues in goats; control relies on testing and management.'),
  ('44444444-4444-4444-4444-444444444416', 'Overview', 'CCPP is a severe contagious pneumonia of goats, often reportable; rapid vet involvement is typical.'),
  ('44444444-4444-4444-4444-444444444417', 'Overview', 'Caseous lymphadenitis presents as abscesses around lymph nodes; culling and hygiene policies vary by farm.'),
  ('44444444-4444-4444-4444-444444444418', 'Overview', 'Enterotoxemia associates with abrupt feed changes in ruminants; acute deaths may occur without obvious bloat.'),
  ('44444444-4444-4444-4444-444444444419', 'Overview', 'BRD encompasses viral and bacterial components in cattle after stress; fever and lung signs are common prompts for veterinary treatment plans.'),
  ('44444444-4444-4444-4444-444444444420', 'Overview', 'Lumpy skin disease spreads by insect vectors and nodular skin disease in cattle; reporting and vector control vary by region.'),
  ('44444444-4444-4444-4444-444444444421', 'Overview', 'Bovine TB is a chronic zoonotic differential in herds under test-and-cull programmes; diagnosis is regulatory.'),
  ('44444444-4444-4444-4444-444444444422', 'Overview', 'Ketosis commonly follows negative energy balance in fresh dairy cattle; nervous and digestive signs can overlap.'),
  ('44444444-4444-4444-4444-444444444423', 'Overview', 'Hypocalcaemia classically affects high-yielding fresh cows with recumbency; IV calcium is prescription-level treatment.'),
  ('44444444-4444-4444-4444-444444444424', 'Overview', 'Mastitis presents with udder swelling and abnormal milk; severity ranges from subclinical to gangrenous; milk quality and public health matter.');

INSERT INTO public.knowledge_condition_chunks (condition_id, source_title, chunk_text)
VALUES
  ('44444444-4444-4444-4444-444444444425', 'Overview', 'Canine distemper is a systemic paramyxovirus with respiratory, GI, and neurologic phases; vaccination is core prevention.'),
  ('44444444-4444-4444-4444-444444444426', 'Overview', 'Kennel cough is a syndrome from multiple pathogens; typically a harsh cough with mild systemic signs in healthy dogs.'),
  ('44444444-4444-4444-4444-444444444427', 'Overview', 'Leptospirosis can damage kidneys and liver; zoonotic risk exists where rodents and water contamination occur.'),
  ('44444444-4444-4444-4444-444444444428', 'Overview', 'Heartworm is mosquito-transmitted; prevention programmes are standard in endemic zones.'),
  ('44444444-4444-4444-4444-444444444429', 'Overview', 'Rabies is almost invariably fatal once clinical; any bite exposure in a rabies area requires public-health protocols.'),
  ('44444444-4444-4444-4444-444444444430', 'Overview', 'Dermatophytes cause focal alopecia and scaling; zoonotic transmission to people is possible from some species.');

-- Extra chunks for originally sparse seeded conditions (improves keyword RAG coverage)
INSERT INTO public.knowledge_condition_chunks (condition_id, source_title, chunk_text)
SELECT '22222222-2222-2222-2222-222222222204', 'Overview', 'PPR is a morbillivirus of sheep and goats with fever, mucosal necrosis, and pneumonia; suspicion often triggers veterinary reporting and diagnostics.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.knowledge_condition_chunks c WHERE c.condition_id = '22222222-2222-2222-2222-222222222204' AND c.source_title = 'Overview'
);

INSERT INTO public.knowledge_condition_chunks (condition_id, source_title, chunk_text)
SELECT '22222222-2222-2222-2222-222222222205', 'Overview', 'Canine parvovirus causes severe enteritis in unvaccinated young dogs with bloody diarrhoea and dehydration; intensive care improves survival.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.knowledge_condition_chunks c WHERE c.condition_id = '22222222-2222-2222-2222-222222222205' AND c.source_title = 'Overview'
);

-- ---------------------------------------------------------------------------
-- condition_treatments: conservative references (vet-directed language)
-- ---------------------------------------------------------------------------
INSERT INTO public.condition_treatments (
  condition_id, drug_id, species, region, treatment_level, dosage_text, supportive_care,
  prescription_required, isolation_required, source_reference
)
VALUES
  ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333302', 'poultry', 'Northern Highlands District', 'first_line', 'Antibiotics only as directed by a veterinarian; follow label and withdrawal.',
   'Improve ventilation; cull severely affected; all-in/all-out where feasible.', true, true, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444402', NULL, 'poultry', NULL, 'supportive', 'Notifiable disease — official veterinary and regulatory response; do not rely on lay treatment advice.',
   'Stop movements; heightened biosecurity; report suspicion immediately.', true, true, 'Regulatory — follow local authority'),

  ('44444444-4444-4444-4444-444444444403', NULL, 'poultry', NULL, 'supportive', 'Management via vaccination programmes where used; prescription products only per veterinarian.',
   'Supportive care; reduce stress; review hatchery/chick source policies.', false, true, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444404', NULL, 'poultry', NULL, 'supportive', 'Vaccination timing is species/strain specific — veterinary plan typically required on affected sites.',
   'Supportive fluids/electrolytes only per product label; optimize brooding.', false, true, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444405', NULL, 'poultry', NULL, 'supportive', 'Marek''s control centers on hatchery vaccination; no reliable flock cure once clinical.',
   'Cull severely affected; improve hygiene.', false, false, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444406', '33333333-3333-3333-3333-333333333303', 'poultry', 'Northern Highlands District', 'first_line', 'Antibiotics and dosage only as prescribed; observe withdrawal.',
   'Remove carcasses promptly; reduce pecking injuries.', true, true, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444407', NULL, 'poultry', NULL, 'supportive', 'Often self-limiting; secondary infections managed per veterinarian.',
   'Mosquito reduction for wet pox considerations; reduce dust irritants.', false, true, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444408', '11111111-1111-1111-1111-111111111103', 'poultry', 'Northern Highlands District', 'supportive', 'Prescription antimicrobials only per vet; concurrent C. perfringens management.',
   'Review diet changes and coccidia control; litter management.', true, false, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444409', '33333333-3333-3333-3333-333333333302', 'poultry', 'Northern Highlands District', 'first_line', 'Macrolide class use only per veterinarian and label.',
   'Depopulation/endemic strategies vary; improve air quality.', true, true, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444410', NULL, 'pig', NULL, 'supportive', 'Notifiable — standstill and official slaughter/testing protocols apply.',
   'No approved home treatment; strict perimeter biosecurity.', true, true, 'Regulatory — follow local authority'),

  ('44444444-4444-4444-4444-444444444411', NULL, 'pig', NULL, 'supportive', 'Notifiable virus — official veterinary response only.',
   'Isolation of premises; movement bans.', true, true, 'Regulatory — follow local authority'),

  ('44444444-4444-4444-4444-444444444412', '33333333-3333-3333-3333-333333333306', 'pig', 'Northern Highlands District', 'supportive', 'Herd health planning including vaccines/antibiotics per veterinarian only.',
   'Improve air; batch management; diagnostic follow-up.', true, true, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444413', '33333333-3333-3333-3333-333333333303', 'pig', 'Northern Highlands District', 'first_line', 'Penicillin-class products per prescription and label; finish withdrawals.',
   'Isolate affected pens; clean boots between rooms.', true, false, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444414', NULL, 'pig', NULL, 'supportive', 'Fluid support and biosecurity are flock-level; specific antivirals are not standard for PED in many regions.',
   'Ensure electrolytes/nursing piglets per vet; strict cleaning between batches.', true, true, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444415', NULL, 'goat', NULL, 'supportive', 'No cure — control via testing, segregation, and veterinary health plans.',
   'Supportive nursing; avoid introducing infected stock.', true, false, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444416', '33333333-3333-3333-3333-333333333307', 'goat', 'Northern Highlands District', 'first_line', 'Often reportable — antimicrobial choice and legality per official vet.',
   'Strict isolation; vector/transport control as directed.', true, true, 'Regulatory — verify locally'),

  ('44444444-4444-4444-4444-444444444417', '33333333-3333-3333-3333-333333333303', 'goat', 'Northern Highlands District', 'supportive', 'Abscess management and antibiotics per veterinarian; chronic herds need policy.',
   'Clean needles; cull chronic shedders per vet advice.', true, false, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444418', '33333333-3333-3333-3333-333333333303', 'goat', 'Northern Highlands District', 'first_line', 'Acute cases need emergency veterinary care; vaccination schedules where used.',
   'Gradual feed transitions; adequate roughage.', true, false, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444419', '33333333-3333-3333-3333-333333333306', 'cattle', 'Northern Highlands District', 'first_line', 'BRD protocols are prescription-led with culture/sensitivity where available.',
   'Reduce mixing stress; provide clean water and shade.', true, true, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444420', NULL, 'cattle', NULL, 'supportive', 'Vector-borne reportable disease in many regions — veterinary and vector programmes.',
   'Isolate; insect control per official guidance.', true, true, 'Regulatory — verify locally'),

  ('44444444-4444-4444-4444-444444444421', NULL, 'cattle', NULL, 'supportive', 'Testing and removal under government programmes; not a lay DIY condition.',
   'Zoonosis awareness for handlers.', true, true, 'Regulatory — verify locally'),

  ('44444444-4444-4444-4444-444444444422', '33333333-3333-3333-3333-333333333312', 'cattle', 'Northern Highlands District', 'supportive', 'Propylene glycol / IV dextrose / steroids only per vet prescription where indicated.',
   'Increase energy intake; rumen transfaunation per vet.', true, false, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444423', NULL, 'cattle', NULL, 'supportive', 'IV calcium is prescription-only; downer cow needs vet assessment for complications.',
   'Prop calf positioning; protect from bloat; oral calcium only if vet-directed.', true, false, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444424', '33333333-3333-3333-3333-333333333303', 'cattle', 'Northern Highlands District', 'first_line', 'Intramammary and systemic therapy per culture and vet; milk withhold essential.',
   'Milking hygiene; segregate chronic cases.', true, false, 'General reference — verify locally');

-- Second batch: canines + ringworm
INSERT INTO public.condition_treatments (
  condition_id, drug_id, species, region, treatment_level, dosage_text, supportive_care,
  prescription_required, isolation_required, source_reference
)
VALUES
  ('44444444-4444-4444-4444-444444444425', NULL, 'dog', NULL, 'supportive', 'Supportive intensive care; no home cure — veterinary hospitalization often required.',
   'Isolate from other dogs; disinfect premises.', true, true, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444426', '33333333-3333-3333-3333-333333333307', 'dog', 'Northern Highlands District', 'supportive', 'Antibiotics only if bacterial component suspected — vet to decide.',
   'Rest; harness instead of collar; humidify air if advised.', true, false, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444427', '33333333-3333-3333-3333-333333333307', 'dog', 'Northern Highlands District', 'first_line', 'Fluid therapy and antimicrobials per hospital protocols; zoonosis counseling.',
   'Rodent control; limit standing water exposure.', true, false, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444428', '33333333-3333-3333-3333-333333333310', 'dog', 'Northern Highlands District', 'supportive', 'Adulticide and preventives are prescription; follow local testing.',
   'Exercise restriction if clinically ill.', true, false, 'General reference — verify locally'),

  ('44444444-4444-4444-4444-444444444429', NULL, 'dog', NULL, 'supportive', 'Notifiable — public health rules override animal therapy; post-exposure protocols for people.',
   'Do not handle saliva; secure animal for officials.', true, true, 'Regulatory — follow public health'),

  ('44444444-4444-4444-4444-444444444430', '33333333-3333-3333-3333-333333333309', 'dog', 'Northern Highlands District', 'first_line', 'Systemic antifungals only when prescribed; topical care per vet.',
   'Decontaminate environment; treat in-contact animals.', true, false, 'General reference — verify locally');
