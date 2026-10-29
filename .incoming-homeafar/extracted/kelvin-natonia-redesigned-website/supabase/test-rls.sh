set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
P="su postgres -c"
$P "psql -q -c 'drop database if exists hf_test'" ; $P "psql -q -c 'create database hf_test'"
run(){ su postgres -c "psql -d hf_test -q -v ON_ERROR_STOP=1 -f $1" 2>&1 | grep -v NOTICE; }
cat > /tmp/stub.sql <<'S'
do $$ begin
 if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
 if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end $$;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
grant usage on schema public, auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
insert into auth.users values ('11111111-1111-1111-1111-111111111111'),('22222222-2222-2222-2222-222222222222');
S
chmod 644 /tmp/stub.sql $HERE/schema.sql
run /tmp/stub.sql; run $HERE/schema.sql
su postgres -c "psql -d hf_test -q -c \"insert into public.admins values ('11111111-1111-1111-1111-111111111111')\""
pass=0; fail=0
t(){ # name role sub expect(ok|deny|N rows) sql
  local name="$1" role="$2" sub="$3" exp="$4" sql="$5"
  out=$(su postgres -c "psql -d hf_test -qAt -v ON_ERROR_STOP=1" 2>&1 <<S
set role $role; select set_config('request.jwt.claim.sub','$sub',false);
$sql
S
)
  out=$(echo "$out" | grep -v '^$' | grep -v '^set_config' | grep -vE '^[0-9a-f-]{36}$|^$' | tail -1)
  if echo "$out" | grep -qiE 'ERROR'; then got=deny; else got="$out"; fi
  [ -z "$got" ] && got=ok
  if [ "$got" = "$exp" ]; then pass=$((pass+1)); echo "PASS  $name"; else fail=$((fail+1)); echo "FAIL  $name (expected '$exp', got '$got')"; fi
}
A=11111111-1111-1111-1111-111111111111; U=22222222-2222-2222-2222-222222222222
LONG=$(printf 'x%.0s' $(seq 1 120))
GOODSTORY="insert into public.stories(title,display_name,email,country,category,body,consent) values ('My title','Ada','a@b.co','Romania','Belonging','$LONG',true)"
t "anon can submit valid contact message"      anon "" ok   "insert into public.contact_messages(full_name,email,subject,message) values ('Ada Obi','a@b.co','Hello','Hello there friends')"
t "anon cannot read contact messages"          anon "" deny "select count(*) from public.contact_messages"
t "anon invalid email rejected"                anon "" deny "insert into public.contact_messages(full_name,email,subject,message) values ('Ada Obi','nope','Hello','Hello there friends')"
t "anon cannot pre-set message status=read"    anon "" deny "insert into public.contact_messages(full_name,email,subject,message,status) values ('Ada Obi','a@b.co','Hello','Hello there friends','read')"
t "anon story saved as pending"                anon "" ok   "$GOODSTORY"
t "anon cannot submit approved story"          anon "" deny "insert into public.stories(title,display_name,email,country,category,body,consent,status) values ('My title','Ada','a@b.co','Romania','Belonging','$LONG',true,'approved')"
t "anon story without consent rejected"        anon "" deny "insert into public.stories(title,display_name,email,country,category,body,consent) values ('My title','Ada','a@b.co','Romania','Belonging','$LONG',false)"
t "anon story too short rejected"              anon "" deny "insert into public.stories(title,display_name,email,country,category,body,consent) values ('My title','Ada','a@b.co','Romania','Belonging','short',true)"
t "anon cannot set arbitrary image URL"        anon "" deny "insert into public.stories(title,display_name,email,country,category,body,consent,image_path) values ('My title','Ada','a@b.co','Romania','Belonging','$LONG',true,'https://evil.example/x.png')"
t "anon cannot read stories table"             anon "" deny "select count(*) from public.stories"
t "pending story hidden from public view"      anon "" 0    "select count(*) from public.public_stories"
t "anon cannot update stories"                 anon "" deny "update public.stories set status='approved'"
t "anon cannot delete stories"                 anon "" deny "delete from public.stories"
t "anon cannot read admins"                    anon "" deny "select * from public.admins"
t "anon can register interest"                 anon "" ok   "insert into public.member_interests(full_name,email,interests,consent) values ('Ada Obi','a@b.co','{Volunteering}',true)"
t "anon interest bad option rejected"          anon "" deny "insert into public.member_interests(full_name,email,interests,consent) values ('Ada Obi','a@b.co','{Hacking}',true)"
t "anon cannot read interests"                 anon "" deny "select count(*) from public.member_interests"
t "non-admin user sees 0 stories"              authenticated $U 0 "select count(*) from public.stories"
t "non-admin cannot approve story"             authenticated $U 0 "with u as (update public.stories set status='approved' returning 1) select count(*) from u"
t "non-admin cannot delete story"              authenticated $U 0 "with d as (delete from public.stories returning 1) select count(*) from d"
t "non-admin sees 0 messages"                  authenticated $U 0 "select count(*) from public.contact_messages"
t "admin sees pending story"                   authenticated $A 1 "select count(*) from public.stories"
t "admin approves story"                       authenticated $A 1 "with u as (update public.stories set status='approved' returning 1) select count(*) from u"
t "approved story now public"                  anon "" 1    "select count(*) from public.public_stories"
t "public view exposes no email column"        anon "" 0    "select count(*) from information_schema.columns where table_name='public_stories' and column_name in ('email','status','consent')"
t "admin rejects story -> hidden again"        authenticated $A 1 "with u as (update public.stories set status='rejected' returning 1) select count(*) from u"
t "rejected story hidden from public"          anon "" 0    "select count(*) from public.public_stories"
t "admin reads contact messages"               authenticated $A 1 "select count(*) from public.contact_messages"
t "admin marks message read"                   authenticated $A 1 "with u as (update public.contact_messages set status='read' returning 1) select count(*) from u"
t "admin deletes story"                        authenticated $A 1 "with d as (delete from public.stories returning 1) select count(*) from d"
t "admin reads interests"                      authenticated $A 1 "select count(*) from public.member_interests"
echo "TOTAL pass=$pass fail=$fail"
