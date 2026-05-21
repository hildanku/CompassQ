insert into public.quran_references (
    source,
    surah_number,
    ayah_number,
    ayah_key
)
values
    ('qf', 2, 286, '2:286'),
    ('qf', 13, 28, '13:28'),
    ('qf', 14, 7, '14:7'),
    ('qf', 55, 13, '55:13'),
    ('qf', 2, 153, '2:153'),
    ('qf', 94, 5, '94:5'),
    ('qf', 1, 6, '1:6'),
    ('qf', 2, 2, '2:2'),
    ('qf', 39, 53, '39:53'),
    ('qf', 65, 3, '65:3'),
    ('qf', 59, 18, '59:18'),
    ('qf', 91, 9, '91:9'),
    ('qf', 57, 16, '57:16'),
    ('qf', 2, 186, '2:186'),
    ('qf', 93, 3, '93:3'),
    ('qf', 93, 5, '93:5')
on conflict (ayah_key) do nothing;

insert into public.recommendation_catalog (category, ayah_key, priority)
values
    ('anxiety', '2:286', 10),
    ('anxiety', '13:28', 20),
    ('gratitude', '14:7', 10),
    ('gratitude', '55:13', 20),
    ('patience', '2:153', 10),
    ('patience', '94:5', 20),
    ('guidance', '1:6', 10),
    ('guidance', '2:2', 20),
    ('hope', '39:53', 10),
    ('hope', '65:3', 20),
    ('discipline', '59:18', 10),
    ('discipline', '91:9', 20),
    ('feeling_distant', '57:16', 10),
    ('feeling_distant', '2:186', 20),
    ('need_comfort', '93:3', 10),
    ('need_comfort', '93:5', 20)
on conflict (category, ayah_key) do update
set priority = excluded.priority,
    is_active = true;
