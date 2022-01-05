--table creation
create table users (
  id serial primary key,
  name varchar(50)
);
  
create table recs (
  id serial primary key,
  user_id serial references users(id),
  title varchar(255) not null,
  type varchar(50),
  author varchar(50) default null,
  link varchar(255) not null,
  submit_time timestamp default current_timestamp,
  summary text,
  status varchar(100) not null, 
  reason text,
  likes integer default 0,
  dislikes integer default 0
);
-- status options: recommended, not recommended, looks promising

create table tags (
  rec_id serial references recs(id),
  tag varchar(50) not null,
  primary key (rec_id, tag)
);

create table comments (
  id serial primary key,
  user_id serial references users(id),
  rec_id serial references recs(id),
  submit_time timestamp default current_timestamp,
  comment text not null
);

create table study_list (
  user_id serial references users(id),
  rec_id serial references recs(id),
  primary key (user_id, rec_id)
);

--inserting values
insert into users (name) 
values ('Jenna'), ('Hanna'), ('Truman'), ('Nico');

insert into recs (user_id, title, type, link, summary, status, reason)
values (1, 'What even is yarn', 'webpage', 'https://yarnpkg.com/', 'Package manager',
        'recommended', 'I did not know what yarn was, but now I do');

insert into comments (user_id, rec_id, comment)
values (2, 2, 'I hated this, never reading this again');

insert into tags (rec_id, tag)
values (2, 'yarn'), (2, 'package-management');

insert into study_list (user_id, rec_id)
values (3, 2)