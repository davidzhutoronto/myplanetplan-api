CREATE EXTENSION "uuid-ossp";

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE domain (
  domain_id  uuid DEFAULT uuid_generate_v4(), 
  d_created  timestamp NOT NULL DEFAULT NOW(), 
  d_modified timestamp DEFAULT NOW(), 
  d_end      timestamp, 
  name       text NOT NULL, 
  value      text NOT NULL, 
  comment    text, 
  sortorder  int4, 
  PRIMARY KEY (domain_id));

CREATE TABLE item (
  item_id     uuid DEFAULT uuid_generate_v4(), 
  d_created   timestamp NOT NULL DEFAULT NOW(), 
  d_modified  timestamp DEFAULT NOW(), 
  owner       uuid, 
  name        text NOT NULL, 
  summary     text NOT NULL, 
  description text NOT NULL, 
  repeatable  uuid NOT NULL, 
  points      int4 NOT NULL, 
  cost_money  uuid NOT NULL, 
  cost_time   uuid NOT NULL, 
  cost_effort uuid NOT NULL, 
  active      bool NOT NULL DEFAULT true, 
  PRIMARY KEY (item_id));

CREATE TABLE mpp_tag (
  tag_id     uuid DEFAULT uuid_generate_v4(), 
  name       text NOT NULL, 
  d_created  timestamp NOT NULL DEFAULT NOW(), 
  d_modified timestamp DEFAULT NOW(), 
  PRIMARY KEY (tag_id));

CREATE TABLE mpp_user (
  user_id    uuid DEFAULT uuid_generate_v4(), 
  d_created  timestamp NOT NULL DEFAULT NOW(), 
  d_modified timestamp DEFAULT NOW(), 
  points     int4 NOT NULL, 
  PRIMARY KEY (user_id));

CREATE TABLE tag_item (
  tag_item_id uuid DEFAULT uuid_generate_v4(), 
  tag_id      uuid NOT NULL, 
  item_id     uuid NOT NULL, 
  d_created   timestamp NOT NULL DEFAULT NOW(), 
  PRIMARY KEY (tag_item_id));

CREATE TABLE task (
  task_id     uuid DEFAULT uuid_generate_v4(), 
  item_id     uuid NOT NULL, 
  d_created   timestamp NOT NULL DEFAULT NOW(), 
  d_modified  timestamp DEFAULT NOW(), 
  name        text NOT NULL, 
  description text NOT NULL, 
  PRIMARY KEY (task_id));

CREATE TABLE template (
  template_id uuid DEFAULT uuid_generate_v4(), 
  d_created   timestamp NOT NULL DEFAULT NOW(), 
  d_modified  timestamp DEFAULT NOW(), 
  name        text NOT NULL, 
  description text NOT NULL, 
  PRIMARY KEY (template_id));

CREATE TABLE template_item (
  template_item_id uuid DEFAULT uuid_generate_v4(), 
  item_id          uuid NOT NULL, 
  template_id      uuid NOT NULL, 
  d_created        timestamp NOT NULL DEFAULT NOW(), 
  PRIMARY KEY (template_item_id));

CREATE TABLE user_item (
  user_item_id uuid DEFAULT uuid_generate_v4(), 
  user_id      uuid NOT NULL, 
  item_id      uuid NOT NULL, 
  d_created    timestamp NOT NULL DEFAULT NOW(), 
  d_completed  timestamp, 
  completed    bool NOT NULL, 
  PRIMARY KEY (user_item_id));

CREATE TABLE user_item_history (
  user_item_history_id uuid DEFAULT uuid_generate_v4(), 
  user_id              uuid NOT NULL, 
  item_id              uuid NOT NULL, 
  d_completed          timestamp NOT NULL, 
  points               int4 NOT NULL, 
  PRIMARY KEY (user_item_history_id));

CREATE TABLE user_item_task (
  user_item_task_id uuid DEFAULT uuid_generate_v4(), 
  user_item_id      uuid NOT NULL, 
  task_id           uuid NOT NULL, 
  d_completed       timestamp, 
  PRIMARY KEY (user_item_task_id));

ALTER TABLE user_item ADD CONSTRAINT FKuser_item_mpp_user FOREIGN KEY (user_id) REFERENCES mpp_user (user_id);
ALTER TABLE template_item ADD CONSTRAINT FK_template_item_item FOREIGN KEY (item_id) REFERENCES item (item_id);
ALTER TABLE template_item ADD CONSTRAINT FKtemplate_item_template FOREIGN KEY (template_id) REFERENCES template (template_id);
ALTER TABLE tag_item ADD CONSTRAINT FKtag_item_mpp_tag FOREIGN KEY (tag_id) REFERENCES mpp_tag (tag_id);
ALTER TABLE tag_item ADD CONSTRAINT FKtag_item_item FOREIGN KEY (item_id) REFERENCES item (item_id);
ALTER TABLE user_item_task ADD CONSTRAINT FKuser_item_task_user_item FOREIGN KEY (user_item_id) REFERENCES user_item (user_item_id);
ALTER TABLE user_item_task ADD CONSTRAINT FKuser_item_task_task FOREIGN KEY (task_id) REFERENCES task (task_id);
ALTER TABLE user_item ADD CONSTRAINT FKuser_item_item FOREIGN KEY (item_id) REFERENCES item (item_id);
ALTER TABLE item ADD CONSTRAINT FKitem_money FOREIGN KEY (cost_money) REFERENCES domain (domain_id);
ALTER TABLE item ADD CONSTRAINT FKitem_time FOREIGN KEY (cost_time) REFERENCES domain (domain_id);
ALTER TABLE item ADD CONSTRAINT FKitem_effort FOREIGN KEY (cost_effort) REFERENCES domain (domain_id);
ALTER TABLE item ADD CONSTRAINT FKitem_repeatable FOREIGN KEY (repeatable) REFERENCES domain (domain_id);
ALTER TABLE item ADD CONSTRAINT FKitem_owner_mpp_user FOREIGN KEY (owner) REFERENCES mpp_user (user_id);
ALTER TABLE task ADD CONSTRAINT FKtask_item FOREIGN KEY (item_id) REFERENCES item (item_id);
ALTER TABLE user_item_history ADD CONSTRAINT FKuser_item_history_mpp_user FOREIGN KEY (user_id) REFERENCES mpp_user (user_id);
ALTER TABLE user_item_history ADD CONSTRAINT FKuser_item_history_item FOREIGN KEY (item_id) REFERENCES item (item_id);

ALTER TABLE user_item_task
ADD CONSTRAINT user_item_task_unique_constraint
UNIQUE (user_item_id, task_id);
