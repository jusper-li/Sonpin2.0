/*
  Add editable theme color settings.
*/

insert into public.site_settings (setting_key, setting_value)
values (
  'theme_colors',
  '{
    "global": {
      "primary": "#351e0d",
      "primaryStrong": "#211208",
      "primarySoft": "#6d4f3d",
      "primaryMuted": "#9f8a7b",
      "primaryWarm": "#8e6448",
      "primaryBorder": "#d8c8b6",
      "surface": "#fffaf2",
      "background": "#fbf6ee",
      "ink": "#2b221d",
      "muted": "#6f5b4f"
    },
    "pages": {
      "home": {
        "primary": "#351e0d",
        "primaryWarm": "#8e6448",
        "surface": "#fffaf2",
        "background": "#fbf6ee"
      },
      "shop": {
        "primary": "#351e0d",
        "primaryWarm": "#8e6448",
        "surface": "#fffaf2",
        "background": "#fbf6ee"
      },
      "product": {
        "primary": "#351e0d",
        "primaryWarm": "#8e6448",
        "surface": "#fffaf2",
        "background": "#fbf6ee"
      },
      "blog": {
        "primary": "#351e0d",
        "primaryWarm": "#8e6448",
        "surface": "#fffaf2",
        "background": "#fbf6ee"
      },
      "media": {
        "primary": "#351e0d",
        "primaryWarm": "#8e6448",
        "surface": "#fffaf2",
        "background": "#fbf6ee"
      },
      "content": {
        "primary": "#351e0d",
        "primaryWarm": "#8e6448",
        "surface": "#fffaf2",
        "background": "#fbf6ee"
      }
    }
  }'::jsonb
)
on conflict (setting_key) do update
set setting_value = excluded.setting_value,
    updated_at = now();

notify pgrst, 'reload schema';
