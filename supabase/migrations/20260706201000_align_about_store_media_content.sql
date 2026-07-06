/* Align public content with sonpin.tw */

update public.static_pages
set
  title = '關於淞品',
  meta_description = '認識淞品土雞專賣店的品牌起點、經營理念與堅持。',
  sections = '[
    {
      "type": "intro",
      "title": "品牌緣起",
      "content": "艋舺（現萬華），曾經是最繁華的地方，淞品雞肉在艋舺傳香了10幾年，是來過艋舺的人都不會錯過的美味。\n\n淞品商行位在萬華廟口三水市場內，每天不絕於耳用菜刀剁雞的聲音，從破曉的五六點一直到傍晚五六點都沒停過。\n\n淞品門口的排隊人潮也從來不曾間斷過，最出名的煙燻雞及鹹水雞是老闆的家傳秘方。\n\n我們堅持使用自養的台灣土雞，遵循家傳的料理法，淞品的味道10幾年沒變過，將來也不會變。\n\n我們傳承的不只是好口味，更是一份對美食精神的堅持。"
    },
    {
      "type": "section",
      "title": "匯款資訊",
      "content": "匯款帳號：02-2338-0018\n銀行名稱：台灣土地銀行華江分行\n銀行代號：005\n帳號：1470014900-4\n戶名：淞品商行\n統一編號：75228113\n匯款後請於客服時間 09:00~17:00 私訊或來電告知"
    }
  ]'::jsonb
where slug = 'about';

delete from public.stores;

insert into public.stores (name, city, address, phone, email, opening_hours, location, is_active)
values
  (
    '淞品永和門市',
    '永和',
    '新北市永和區中和路509號',
    '02-8021-1072',
    null,
    '{"weekday":"每天","hours":"09:00~19:00","note":"建議先電話確認"}'::jsonb,
    null,
    true
  ),
  (
    '淞品萬華門市',
    '萬華',
    '台北市萬華區三水街84號',
    '02-2336-5382',
    null,
    '{"weekday":"每天","hours":"08:00-18:00","note":"建議先電話確認"}'::jsonb,
    null,
    true
  ),
  (
    '淞品士林門市',
    '士林',
    '台北市士林區文林路503號',
    '02-2833-0336',
    null,
    '{"weekday":"每天","hours":"08:00-18:00","note":"建議先電話確認"}'::jsonb,
    null,
    true
  ),
  (
    '淞品民生門市',
    '民生',
    '台北市松山區新東街41-6號',
    '02-2761-0766',
    null,
    '{"weekday":"每天","hours":"08:00~18:00","note":"建議先電話確認"}'::jsonb,
    null,
    true
  ),
  (
    '淞品新埔門市',
    '新埔',
    '新北市板橋區民生路三段11號',
    '02-2258-7755',
    null,
    '{"weekday":"每天","hours":"08:00~18:00","note":"建議先電話確認"}'::jsonb,
    null,
    true
  ),
  (
    '淞品新店門市',
    '新店',
    '新北市新店區中正路246號',
    '02-29111398',
    null,
    '{"weekday":"每天","hours":"08:00-18:00","note":"建議先電話確認"}'::jsonb,
    null,
    true
  ),
  (
    '淞品中央工廠',
    'factory',
    '嘉義縣溪口鄉',
    '02-2338-0018',
    'service@sonpin.tw',
    '{"weekday":"客服時間","hours":"09:00 - 18:00"}'::jsonb,
    null,
    true
  );

update public.articles
set status = 'draft'
where slug in ('78-80', '78-88', '79-40', '79-66');
