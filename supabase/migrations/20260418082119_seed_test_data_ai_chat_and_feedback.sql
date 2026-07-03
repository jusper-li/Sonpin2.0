/*
  # Seed AI Chat Logs & Chat Feedback Test Data
*/

INSERT INTO ai_chat_logs (session_id, member_id, message, response, tokens_used, created_at)
VALUES
  (gen_random_uuid(), 'cc000001-0000-4000-c000-000000000001', '請問你們有哪些招牌商品？', '我們目前提供滴雞精、煙燻雞、鹹水雞與多款禮盒組合，您可以前往商品介紹頁查看完整列表！', 248, now() - interval '5 days'),
  (gen_random_uuid(), 'cc000001-0000-4000-c000-000000000002', '訂單什麼時候會出貨？', '一般訂單在確認付款後 1-2 個工作天內出貨，宅配通常 2-3 天內送達。若您有急件需求，也可以聯繫我們的客服團隊。', 189, now() - interval '4 days'),
  (gen_random_uuid(), 'cc000001-0000-4000-c000-000000000003', '鹹水雞和煙燻雞有什麼差別？', '鹹水雞口感清爽、保留原味；煙燻雞則帶有更明顯的煙燻香氣，兩者都是店內人氣品項。', 312, now() - interval '3 days'),
  (gen_random_uuid(), NULL, '你們有提供企業送禮嗎？', '目前我們提供多款禮盒與團購服務，歡迎直接聯繫客服中心了解。', 201, now() - interval '3 days'),
  (gen_random_uuid(), 'cc000001-0000-4000-c000-000000000004', '如何保存滴雞精？', '滴雞精請依包裝標示冷藏或常溫保存，開封後請盡快飲用，以確保最佳風味與品質。', 356, now() - interval '2 days'),
  (gen_random_uuid(), NULL, '請問退換貨政策是什麼？', '若商品有品質問題，請在收到後 7 天內聯繫我們，我們會安排換貨或退款。詳細說明請參閱購物須知頁面。', 278, now() - interval '1 day'),
  (gen_random_uuid(), 'cc000001-0000-4000-c000-000000000005', '有沒有適合新手的商品推薦？', '如果是第一次接觸淞品，建議先從滴雞精或半隻雞禮盒開始，方便嘗試不同吃法。', 334, now() - interval '6 hours'),
  (gen_random_uuid(), 'cc000001-0000-4000-c000-000000000001', '你們的雞肉來源透明嗎？', '我們重視食材來源與製程把關，門市也會持續維持可追溯與安心的採購標準。', 267, now() - interval '2 hours');

INSERT INTO chat_feedback (session_id, message_id, rating, feedback_text, created_at)
SELECT
  cs.id as session_id,
  cm.id as message_id,
  4 as rating,
  '回答很清楚，很有幫助！' as feedback_text,
  now() - interval '3 days'
FROM chat_sessions cs
JOIN chat_messages cm ON cm.session_id = cs.id
LIMIT 1;

INSERT INTO chat_feedback (session_id, message_id, rating, feedback_text, created_at)
SELECT
  cs.id as session_id,
  cm.id as message_id,
  5 as rating,
  '非常快速解決我的問題，服務很棒！' as feedback_text,
  now() - interval '2 days'
FROM chat_sessions cs
JOIN chat_messages cm ON cm.session_id = cs.id
OFFSET 1
LIMIT 1;

INSERT INTO chat_feedback (session_id, message_id, rating, feedback_text, created_at)
SELECT
  cs.id as session_id,
  cm.id as message_id,
  3 as rating,
  '回答有點模糊，希望能更詳細說明配送時間。' as feedback_text,
  now() - interval '1 day'
FROM chat_sessions cs
JOIN chat_messages cm ON cm.session_id = cs.id
OFFSET 2
LIMIT 1;

INSERT INTO chat_feedback (session_id, message_id, rating, feedback_text, created_at)
SELECT
  cs.id as session_id,
  cm.id as message_id,
  5 as rating,
  '很專業，推薦給朋友了！' as feedback_text,
  now() - interval '5 hours'
FROM chat_sessions cs
JOIN chat_messages cm ON cm.session_id = cs.id
OFFSET 3
LIMIT 1;
