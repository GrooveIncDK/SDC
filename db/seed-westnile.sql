-- Seeds the West Nile project record from the real content currently
-- hardcoded in westnile/index.html (exact wording, not paraphrased) —
-- run after db/schema.sql. This record isn't rendered dynamically yet;
-- westnile/index.html still serves static HTML until that page is wired
-- to GET /api/projects/west-nile.

INSERT INTO projects (
  slug, name, country, status, tagline, summary,
  partners, sdgs, open_questions, photos, broader_partners
)
VALUES (
  'west-nile',
  'West Nile',
  'Uganda',
  'defining',
  'Partnerships confirmed',
  'Three relationships are in place before the project''s scope is finalised — the Ugandan government, a local NGO already working on the ground, and an academic partner.',
  '[
    {
      "name": "Ministry of Agriculture, Animal Industry and Fisheries",
      "kicker": null,
      "description": "The Ugandan government ministry responsible for agricultural policy and rural development nationally, partnering with SDC on this project''s agricultural component.",
      "logo": "images/partner-maaif.png"
    },
    {
      "name": "Navoda",
      "kicker": null,
      "description": "A Ugandan non-governmental organisation, confirmed to have presence and staff in the West Nile region for this project. Navoda is our local implementing partner on the ground.",
      "logo": "images/partner-navoda.png"
    },
    {
      "name": "Makerere University",
      "kicker": "Academic Partner",
      "description": "Uganda''s oldest and largest public university, confirmed as an academic partner on this project. The specific nature of that involvement is still being defined.",
      "logo": "images/partner-makerere.png"
    }
  ]'::jsonb,
  '[
    {"number": 3,  "title": "Good Health and Well-Being",         "caption": "Promoting maternal health, child nutrition, and medical programmes."},
    {"number": 4,  "title": "Quality Education",                  "caption": "Supporting access to education, vocational training, and digital literacy."},
    {"number": 6,  "title": "Clean Water and Sanitation",         "caption": "Expanding access to clean drinking water and sanitation facilities."},
    {"number": 8,  "title": "Decent Work and Economic Growth",    "caption": "Empowering local entrepreneurs and job-creation initiatives."},
    {"number": 13, "title": "Climate Action",                     "caption": "Scalable carbon sequestration through land use and agroforestry design."},
    {"number": 15, "title": "Life on Land",                       "caption": "Restoring degraded lands and protecting terrestrial biodiversity."},
    {"number": 17, "title": "Partnerships for the Goals",         "caption": "Multi-stakeholder collaboration across NGOs, local government, academia and the private sector."}
  ]'::jsonb,
  '[
    {"number": 1, "text": "The specific communities and districts within West Nile the project will serve"},
    {"number": 2, "text": "Programme scope and activities — the exact interventions have not yet been finalised"},
    {"number": 3, "text": "Timeline and phasing"},
    {"number": 4, "text": "Funding structure and budget"}
  ]'::jsonb,
  '[
    {"src": "images/uganda-6.jpg", "alt": "Community gathering with harvested produce", "caption": "Community distribution day"},
    {"src": "images/uganda-4.jpg", "alt": "Community training session", "caption": "Community training session"},
    {"src": "images/uganda-5.jpg", "alt": "Drip irrigation installation", "caption": "Irrigation line installation"}
  ]'::jsonb,
  '[
    {"name": "Your Footprint",     "url": "https://www.yourfootprint.uk", "logo": "images/partner-yfp.png"},
    {"name": "Stålbækgård", "url": "https://www.staalbaek.dk", "logo": "images/partner-staalbaek.png"},
    {"name": "The Global Academy", "url": "https://theglobalacademy.ac/", "logo": "images/partner-global-academy.png"}
  ]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
