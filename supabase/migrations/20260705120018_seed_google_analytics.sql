insert into public.site_settings (setting_key, setting_value)
values (
  'google_analytics',
  jsonb_build_object(
    'enabled', true,
    'measurement_id', 'G-JVFN8M2DXT',
    'stream_name', '淞品土雞 - GA4',
    'stream_url', 'http://www.sonpin.tw/',
    'stream_id', '5044756741'
  )
)
on conflict (setting_key)
do update set setting_value = excluded.setting_value;
