-- Habilitar realtime para a tabela queue_customers
alter table "public"."queue_customers" replica identity full;
alter publication supabase_realtime add table "public"."queue_customers";