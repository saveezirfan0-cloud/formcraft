-- Create the DEAL form. Replace <YOUR_USER_ID> with your auth user id
-- (Supabase -> Authentication -> Users -> copy the UUID of your account).
insert into public.forms (owner_id, name, description, schema, published)
values (
  '<YOUR_USER_ID>',
  'DEAL',
  '',
  '[{"id":"month","type":"select","label":"MONTH","required":false,"options":["JAN","FEB","MAR","APR","MAY","JUNE","JULY","AUG","SEP","OCT","NOV","DEC"]},{"id":"date_created","type":"date","label":"DATE CREATED","required":false},{"id":"collection_location","type":"checkbox","label":"COLLECTION LOCATION","required":false,"options":["JHB","DUR","CPT"]},{"id":"quote_no","type":"text","label":"QUOTE NO","required":false},{"id":"sales_rep","type":"select","label":"SALES REP","required":false,"options":["MELINDA","RICUS"]},{"id":"pop","type":"file","label":"POP","required":false},{"id":"part_no_1","type":"text","label":"PART NO 1","required":false},{"id":"line_1","type":"text","label":"LINE 1","required":false},{"id":"part_no_2","type":"text","label":"PART NO 2","required":false},{"id":"line_2","type":"text","label":"LINE 2","required":false},{"id":"part_no_3","type":"text","label":"PART NO 3","required":false},{"id":"line_3","type":"text","label":"LINE 3","required":false},{"id":"part_no_4","type":"text","label":"PART NO 4","required":false},{"id":"line_4","type":"text","label":"LINE 4","required":false},{"id":"part_no_5","type":"text","label":"PART NO 5","required":false},{"id":"line_5","type":"text","label":"LINE 5","required":false},{"id":"part_no_6","type":"text","label":"PART NO 6","required":false},{"id":"line_6","type":"text","label":"LINE 6","required":false},{"id":"part_no_7","type":"text","label":"PART NO 7","required":false},{"id":"line_7","type":"text","label":"LINE 7","required":false},{"id":"part_no_8","type":"text","label":"PART NO 8","required":false},{"id":"line_8","type":"text","label":"LINE 8","required":false},{"id":"total","type":"number","label":"Total","required":false}]'::jsonb,
  true
)
returning id;
-- ^ copy the returned id; you'll need it to import entries.
