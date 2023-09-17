INSERT INTO item (owner, name, summary, description, points, active, repeatable, cost_money, cost_time, cost_effort)
VALUES (
  null,
  'Taking public transportation to work',
  'Taking public transportation to work',
  'Taking public transportation to work is a way to reduce ones carbon footprint by reducing the number of cars on the road. This can also save money on gas and parking.',
  700,
  true,
  (SELECT domain_id FROM domain WHERE name = 'Repeatable' AND value = 'Weekly'),
  (SELECT domain_id FROM domain WHERE name = 'Difficulty' AND value = 'Medium'),
  (SELECT domain_id FROM domain WHERE name = 'Difficulty' AND value = 'Medium'),
  (SELECT domain_id FROM domain WHERE name = 'Difficulty' AND value = 'Medium')
);

INSERT INTO item (owner, name, summary, description, points, active, repeatable, cost_money, cost_time, cost_effort)
VALUES (
  null,
  'Eating a vegetarian diet one day a week',
  'Eating a vegetarian diet one day a week',
  'Eating a vegetarian diet one day a week is a way to reduce the environmental impact of meat production. This can also have health benefits as a vegetarian diet can be high in vitamins and minerals.',
  600,
  true,
  (SELECT domain_id FROM domain WHERE name='Repeatable' AND value='Weekly'),
  (SELECT domain_id FROM domain WHERE name='Difficulty' AND value='Medium'),
  (SELECT domain_id FROM domain WHERE name='Difficulty' AND value='Medium'),
  (SELECT domain_id FROM domain WHERE name='Difficulty' AND value='Medium')
);

INSERT INTO item (owner, name, summary, description, points, active, repeatable, cost_money, cost_time, cost_effort)
VALUES (
  null,
  'Using reusable straws at home and not using straws', 
  'Using reusable straws at home and not using straws',
  'Using reusable straws at home and not using straws when out can help to reduce plastic waste. Plastic straws are a common form of litter and can harm marine life if they end up in the ocean.',
  400,
  true,
  (SELECT domain_id FROM domain WHERE name = 'Repeatable' AND value = 'None'),
  (SELECT domain_id FROM domain WHERE name = 'Difficulty' AND value = 'Easy'),
  (SELECT domain_id FROM domain WHERE name = 'Difficulty' AND value = 'Easy'),
  (SELECT domain_id FROM domain WHERE name = 'Difficulty' AND value = 'Easy')
);

INSERT INTO item (owner, name, summary, description, points, active, repeatable, cost_money, cost_time, cost_effort)
VALUES (
  null,
  'Going three months without buying fast fashion.',
  'Going three months without buying fast fashion.',
  'Going three months without buying fast fashion or clothes made with cheap unsustainable materials can help to reduce the environmental impact of the fashion industry. This can also encourage people to invest in higher quality longer lasting clothing.',
  700,
  true,
  (SELECT domain_id FROM domain WHERE name = 'Repeatable' AND value = 'Monthly'),
  (SELECT domain_id FROM domain WHERE name = 'Difficulty' AND value = 'Easy'),
  (SELECT domain_id FROM domain WHERE name = 'Difficulty' AND value = 'Easy'),
  (SELECT domain_id FROM domain WHERE name = 'Difficulty' AND value = 'Hard')
);

INSERT INTO item (owner, name, summary, description, points, active, repeatable, cost_money, cost_time, cost_effort)
VALUES (
  null,
  'Using an energy saving lamp is a way to save energy',
  'Using an energy saving lamp is a way to save energy',
  'Using an energy saving lamp is a way to save energy and reduce greenhouse gas emissions. Energy saving lamps use less electricity than traditional incandescent bulbs and can last longer reducing the need for frequent replacements.',
  900,
  true,
  (SELECT domain_id FROM domain WHERE name = 'Repeatable' AND value = 'Daily'),
  (SELECT domain_id FROM domain WHERE name = 'Difficulty' AND value = 'Hard'),
  (SELECT domain_id FROM domain WHERE name = 'Difficulty' AND value = 'Easy'),
  (SELECT domain_id FROM domain WHERE name = 'Difficulty' AND value = 'Hard')
  );
