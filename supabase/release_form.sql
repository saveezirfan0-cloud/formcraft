-- RELEASE FORM. Replace <YOUR_USER_ID> with your auth user UUID.
insert into public.forms (owner_id, name, description, schema, published)
values ('<YOUR_USER_ID>', "RELEASE FORM", '', '[{"id":"vin_no","type":"text","label":"VIN NO","required":false},{"id":"inv_no","type":"text","label":"INV NO","required":false},{"id":"customer_details","type":"text","label":"CUSTOMER DETAILS","required":false}]'::jsonb, true)
returning id;
