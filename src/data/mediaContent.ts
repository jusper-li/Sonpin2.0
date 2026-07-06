export type MediaArticleKind = 'article' | 'video';

export interface MediaArticle {
  groupSlug: string;
  articleSlug: string;
  title: string;
  date: string;
  excerpt: string;
  bodyParagraphs: string[];
  htmlContent?: string;
  featuredImage: string;
  galleryImages: string[];
  iframeUrl: string;
  sourceUrl: string;
  kind: MediaArticleKind;
  videoPlacement?: 'top' | 'bottom';
  videoMode?: 'embed' | 'external';
}

export const MEDIA_ARTICLES: MediaArticle[] = [
  {
    "groupSlug": "79",
    "articleSlug": "231",
    "title": "為廟慶添光彩造福嘉義縣民 高浚泓慨捐「靈安尊王2號」救護車",
    "date": "2021-11-17",
    "excerpt": "淞品生技公司董事長高浚泓，為廟慶添加光彩，並藉以幫助更多嘉義縣民，即以「靈安尊王2號」為名，花費新台幣265萬元購置一部全新的救護車捐贈給嘉義縣消防局，運用記者會時同時辦理捐贈儀式。",
    "bodyParagraphs": [],
    "htmlContent": "<a href=\"https://www.watchmedia01.com/fnews-20211118003107.html\" target=\"_blank\">原文網址</a><br>\r\n【記者 惲 朋 ／嘉義報導】<br>\r\n<br>\r\n嘉義縣溪口鄉的淞品生技有限公司董事長，同時也是台北艋舺青山宮委員的高浚泓先生，事業有成後即默默行善，深覺幫助他人是快樂的事，所以決定運用青山宮慶時，捐贈一部全新救護車給嘉義縣消防局造福嘉義縣民，藉以幫助更多需要救護的民眾。嘉義縣長翁章梁、消防局長呂清海特別親往台北代表受贈。 台北艋舺青山宮今天舉行「靈安尊王祭典活動記者會」，篤信靈安尊王的淞品生技公司董事長高浚泓，為廟慶添加光彩，並藉以幫助更多嘉義縣民，即以「靈安尊王2號」為名，花費新台幣265萬元購置一部全新的救護車捐贈給嘉義縣消防局，運用記者會時同時辦理捐贈儀式。<br>\r\n<br>\r\n嘉義縣長翁章梁、消防局長呂清海、縣議員劉雅文等人深受高董事長愛心與美意所感動，今天都特別撥冗前往台北青山宮出席記者會，並代表嘉義縣受贈。翁章梁縣長表示，因事業有成而懂得分享、貢獻的，都是最好的生意人。 從事養雞業的高浚泓董事長笑稱，別人是日理萬機，他是日理萬「雞」，首創產、製、銷一條龍作業，成功的將事業推向另一波高峰，事業有成後即一直默默行善，覺得幫助他人是快樂的事，所以決定捐贈救護車造福鄉里，幫助更多需要救護的民眾。<br>\r\n<br>\r\n青山宮指出，靈安尊王2號捐給嘉義縣，是因高浚泓出身艋舺，而青山王是驅疫之神，數年前他向尊王請求自家養殖雞禽免受疫情肆虐，讓生意得以興隆，青山王神威顯赫，高浚泓得償所願，遂還願捐贈救護車，其養雞場所在地正是嘉義縣溪口鄉，因此回饋地方，翁縣長說，高浚泓的肉品加工廠品質很好，人民吃得很安心，也感謝他發願捐贈救護車給嘉義，未來這輛救護車將服務溪口，造福鄉里，更向靈安尊王致敬，願祂繼續保佑台灣。<br>\r\n<br>\r\n捐贈記者會現場，由青山宮主任委員黃清源代表，傳遞靈安尊王2號鑰匙給翁章梁縣長，象徵救護車正式上路值勤。捐贈儀式後，翁縣長與來賓再進入青山宮，向靈安尊王誠心一拜，祈求疫情快點過去，讓台灣順利渡過難關，翁章梁縣長也贈送Q嘉義交趾陶、茶杯給青山宮，致上最大的謝意。<br>\r\n \r\n<div style=\"text-align: center;\"><img alt=\"\" src=\"/upload/images/20211120131631.jpg\" style=\"width: 80%;\"><br>\r\n淞品生技高浚泓董事長捐贈嘉縣消防局「靈安尊王2號」救護車合影。<br>\r\n(圖／嘉義縣消防局提供)</div>",
    "featuredImage": "/upload/media/163738515057.jpg",
    "galleryImages": [],
    "iframeUrl": "",
    "sourceUrl": "https://sonpin.tw/media/79/231",
    "kind": "article"
  },
  {
    "groupSlug": "79",
    "articleSlug": "93",
    "title": "艋舺 土雞王",
    "date": "2014-02-20",
    "excerpt": "高浚泓專注土雞生意，衝鋒陷陣，走出菜市場小攤，剁出新格局。",
    "bodyParagraphs": [],
    "htmlContent": "<p><span style=\"font-size:14px;\"><span style=\"font-family: 'lucida grande', tahoma, verdana, arial, sans-serif; line-height: 18px;\">發表時間：2013-10-18 21:14 作者：taiwan 【記者鍾翠蓮台北報導】</span></span></p>\r\n\r\n<p><span style=\"font-size:14px;\"><span style=\"font-family: 'lucida grande', tahoma, verdana, arial, sans-serif; line-height: 18px;\">據 統計，臺灣每年土雞產量約一億兩千萬隻，以每隻土雞500元計算，消費總額高達新台幣600億元！為使消費者能夠買到最新鮮、安全及肉質Q彈多汁的國產土 雞，淞品商行與農委會、中央畜產會，昨(18)日假淞品民生店舉辦「鮮流土雞 新鮮有夠證」記者會，要將新典範國產土雞專賣店介紹給國人。</span></span></p>\r\n\r\n<p><span style=\"font-size:14px;\"><span style=\"font-family: 'lucida grande', tahoma, verdana, arial, sans-serif; line-height: 18px;\">淞品商行表示，該商行透過農業產業價值鏈延伸與整合，加上由政府輔導產業以加</span><span class=\"text_exposed_show\" style=\"display: inline; font-family: 'lucida grande', tahoma, verdana, arial, sans-serif; line-height: 18px;\">值方式朝精緻化及特色化發展，創造出全台第一家條龍經營的國產土雞專賣店，不僅為國內市場立下新標竿，也提供民眾除了傳統消費通路外的另一新選擇。</span></span></p>\r\n\r\n<p><span style=\"font-size:14px;\"><span class=\"text_exposed_show\" style=\"display: inline; font-family: 'lucida grande', tahoma, verdana, arial, sans-serif; line-height: 18px;\">中央畜產會指出，目前全臺第一家產、製、銷一條龍經營之國產土雞專賣店所代表著產業將邁入嶄新的消費型態，呼籲消費者應多選用具有「在地」、「新鮮」、「健康」、「安全」、「美味」等五大優點的國產土雞。</span></span></p>\r\n\r\n<p><span style=\"font-size:14px;\"><span class=\"text_exposed_show\" style=\"display: inline; font-family: 'lucida grande', tahoma, verdana, arial, sans-serif; line-height: 18px;\">國 產土雞專賣店，由農委會所輔導以計畫性生產採契養生產、合格屠宰、分切加工、運輸販售、品牌獨樹一格等等條件，提供最優質的土雞給國人。目前成功輔導的全 臺第一個案例，即是由原銷售端店家建立自有的土雞飼養畜牧場，並建構與擴大契養生產規模，同時新建小型屠宰場與加工分切工廠，創造出產、製、銷一條龍的經 營模式。流程之中，更有產銷履歷、合法屠宰場、獸醫師把關及合格工廠登記等多項保證。</span></span></p>",
    "featuredImage": "/upload/media/153268076835.png",
    "galleryImages": [],
    "iframeUrl": "",
    "sourceUrl": "https://sonpin.tw/media/79/93",
    "kind": "article"
  },
  {
    "groupSlug": "79",
    "articleSlug": "92",
    "title": "為廟慶添光彩造福嘉義縣民 高浚泓慨捐「靈安尊王2號」救護車",
    "date": "2021-11-17",
    "excerpt": "淞品生技公司董事長高浚泓，為廟慶添加光彩，並藉以幫助更多嘉義縣民，即以「靈安尊王2號」為名，花費新台幣265萬元購置一部全新的救護車捐贈給嘉義縣消防局，運用記者會時同時辦理捐贈儀式。",
    "bodyParagraphs": [],
    "htmlContent": "<p><img alt=\"\" src=\"/upload/images/20180730144608.jpg\" style=\"width: 100%;\"><br>\r\n自由時報週末生活版<br>\r\n<br>\r\n位於萬華龍山寺附近巷弄內，只賣煙燻雞肉及鹹水雞兩種，卻時常不到關店時間，雞肉就已全數賣完。<br>\r\n<br>\r\n「瘋神無雙」的小瑋說店家堅持使用自家飼養的放山雞，味道鮮美、肉質有彈性，煙燻雞肉不只多汁夠味，連雞皮都很香Q<br>\r\n<br>\r\n雞骨頭亦有入味，單吃原味不蘸調味料就很過癮；而鹹水雞則較為爽口，滑嫩中還兼具嚼勁，鹹水湯汁鹹香適中。<br>\r\n<br>\r\n<br>\r\n自由時報週末生活版<br>\r\n    <br>\r\nDATA<br>\r\n電話： （02）2336-5382<br>\r\n地址： 台北市萬華區三水街84號 週報地圖<br>\r\n營業時間： 08：00∼17：00，週一休。<br>\r\n＊不提供外送</p>",
    "featuredImage": "/upload/media/163738515057.jpg",
    "galleryImages": [],
    "iframeUrl": "",
    "sourceUrl": "https://sonpin.tw/media/79/92",
    "kind": "article"
  },
  {
    "groupSlug": "79",
    "articleSlug": "91",
    "title": "為廟慶添光彩造福嘉義縣民 高浚泓慨捐「靈安尊王2號」救護車",
    "date": "2021-11-17",
    "excerpt": "淞品生技公司董事長高浚泓，為廟慶添加光彩，並藉以幫助更多嘉義縣民，即以「靈安尊王2號」為名，花費新台幣265萬元購置一部全新的救護車捐贈給嘉義縣消防局，運用記者會時同時辦理捐贈儀式。",
    "bodyParagraphs": [],
    "htmlContent": "<p><strong><em><u><a href=\"http://www.appledaily.com.tw/appledaily/article/finance/20140220/35651863/\" target=\"_blank\">原文網址</a></u></em></strong><br>\r\n<br>\r\n<img alt=\"\" src=\"/upload/images/20180730143542.jpg\" style=\"width: 100%;\"><br>\r\n高浚泓專注土雞生意，衝鋒陷陣，走出菜市場小攤，剁出新格局。</p>\r\n\r\n<p> </p>\r\n\r\n<p id=\"introid\" style=\"font-size: 18px;\">65年次的他有超熟齡賣雞經，14年來從萬華三水市場1坪小攤，晉級土雞專賣店，跳過批發市場、自己找雞農契作，因應禁宰活禽政策、自建加工廠，成為去年政策實施以來，第1家由傳統市場成功轉型，做到土雞產製銷一條龍。<br>\r\n採訪╱潘怡靜 攝影╱董孟航、受訪者提供、資料照片</p>\r\n\r\n<figure class=\"lbimg sgimg sglft\"><span class=\"cpt\" id=\"caption\"><img alt=\"\" src=\"/upload/images/20180730143609.jpg\" style=\"width: 100%;\"><br>\r\n招牌雞<br>\r\n鹹水雞（上）、煙燻雞（下）銷量平分秋色，僅加鹽、水、糖等調味料，並無其他製作秘訣，高浚泓認為控制好雞隻品質、雞肉自然好吃。</span></figure>\r\n\r\n<p id=\"bcontent\" style=\"font-size: 18px;\"><br>\r\n生意仔歹生，他是道地生意仔。人稱「阿龍」、從小萬華三水街市場長大的高浚泓，父母是菜市場雞販，小學開始就要與血淋淋的殺雞為伍，從小心底最不想就是在市場賣雞，於是他15歲當水電工、18歲自立門戶當承包商，一次工程慘遭倒債300萬元，他嚇得只好跑回市場學賣雞。<br>\r\n但是，他不想與父母一樣賣生雞，遠赴高雄旗山路邊鐵皮屋賣烤雞，不到幾個月遇上921地震，隔年重返萬華三水市場，租下1坪小攤開賣熟食土雞。<br>\r\n初始全年無休，跟太太倆一負責剁、一負責賣，煮雞煮到汗淋漓、剁雞剁到掌心關節長骨刺，終於剁出人生一桶金，但他不以此為滿。</p>\r\n\r\n<hr class=\"clearman\">\r\n<div id=\"div-inread-ad\">\r\n<center>\r\n<div>\r\n<div class=\"inread\" id=\"ONEAD_inread_wrapper\" style=\"text-align: center; margin-left: auto; margin-right: auto;\"> </div>\r\n</div>\r\n</center>\r\n</div>\r\n\r\n<hr class=\"clearman\">\r\n<figure class=\"lbimg sgimg sglft\"><span class=\"cpt\" id=\"caption\"><img alt=\"\" src=\"/upload/images/20180730143635.jpg\" style=\"width: 100%;\"><br>\r\n滴雞精<br>\r\n公土雞、大型壓力鍋悶10小時滴製，每包100ml、5包500元，日售千包。</span></figure>\r\n\r\n<h2 id=\"bhead\" style=\"font-size: 18px;\">控制品質 投身養雞</h2>\r\n\r\n<p id=\"bcontent\" style=\"font-size: 18px;\">「跟批發市場拿雞，品質不穩定。」他發現市場價格愈貴與愈便宜時、肉質愈差，因市場短缺價格好、未成熟雞抓來賣，市場供過於求價格差、雞過熟也出籠。<br>\r\n市場賣土雞5年後，他決定自己養、控制雞肉品質，一度親自南下住在養雞場，了解飼養通風、保溫等環境條件。<br>\r\n捨棄飼養期35~36天的肉雞、他專注飼養期100天的土雞，「選擇體型大隻的紅羽公雞、配產蛋量高的黑羽母雞，肉質最好吃是接近性成熟期、周齡未產蛋的雞。」<br>\r\n2008年卡玫基風災來襲，他半夜為巡視飼料廠，連車帶人險被大水衝走，最後卡在樹幹上被救難協會救起；2009年莫拉克風災，雞隻全被大水衝走，一夕之間慘賠3000萬元。</p>\r\n\r\n<hr class=\"clearman\">\r\n<h2 id=\"bhead\" style=\"font-size: 18px;\">改採契作 降低風險</h2>\r\n\r\n<p id=\"bcontent\" style=\"font-size: 18px;\">「養雞，看天吃飯。」原想自己養雞，卻發現「放同一籃子」禁不起一次風災慘賠，他轉與雲嘉南地區20~30名雞農合作，以代養、契作降低飼養風險。<br>\r\n「我如果不要傻到自己跑去養雞，現在都能退休了。」他坦言，2010年有連續10個月，因市場供過於求，每養1隻雞賠50元（產地價每台斤31元、飼養成本41元，以每隻雞5台斤計），他以1年倒貼1000萬元苦撐3年，以店面賣熟食土雞利潤、填補批發毛雞虧損。<br>\r\n特別是遇上H7N9禽流感疫情期間，消費者恐慌，熟雞營業額對半砍、毛雞養好沒人買，都是他兼顧毛雞批發、熟雞零售的潛在風險。<br>\r\n過去10年禁宰活禽政策，因國人採買雞隻民情，一向將菜市場排除在外，但隨禽流感疫情升溫，去年傳統市場禁宰活禽政策上路前，高浚泓已做好通盤準備。</p>\r\n\r\n<h2 id=\"bhead\" style=\"font-size: 18px;\">產能提升 加速拓點</h2>\r\n\r\n<p id=\"bcontent\" style=\"font-size: 18px;\">2011年他在嘉義溪口購地、2013年4月投下7000~8000萬元建置食品加工廠，自控雞隻屠宰、熟食加工等流程，店裡販售土雞，做到飼養、宰殺到銷售產製銷一條龍。<br>\r\n萬華總店每到年節土雞需求量大，店門口常是排隊人潮，「現在小家庭多，只有拜拜才會買全雞，很多小家庭只會切一小盤1/6隻雞。」他順應市場需求，不論買多買少、價格一致，半雞餐盒可微波加熱、有禮盒可當伴手禮。<br>\r\n高浚泓為了雞事業衝鋒陷陣，常常在「頭洗下去沒辦法」中轉型，因有了加工廠的產能，去年底他的土雞店在台北市開起分店、今年將往新北市拓點。<br>\r\n1坪菜市場雞攤變身土雞王，他寫下傳奇。</p>\r\n\r\n<h2 id=\"bhead\" style=\"font-size: 18px;\">頭家小檔案</h2>\r\n\r\n<p id=\"bcontent\" style=\"font-size: 18px;\">高浚泓，1976年出生（38歲）龍山國中畢業<br>\r\n經歷︰<br>\r\n15歲 建築工地水電學徒、工程承包商<br>\r\n22歲 退伍後承包工程被倒債<br>\r\n23歲 高雄旗山賣烤雞<br>\r\n24歲 台北萬華三水市場1坪攤賣熟食土雞<br>\r\n28歲 遷店現址經營萬華總店<br>\r\n29歲 與雞農合作契作代養<br>\r\n37歲 嘉義溪口加工廠開始運作、開台北民生分店</p>\r\n\r\n<hr class=\"clearman\">\r\n<figure class=\"lbimg sgimg sglft\"><img alt=\"\" src=\"/upload/images/20180730143716.jpg\" style=\"width: 100%;\"></figure>\r\n\r\n<h2 id=\"bhead\" style=\"font-size: 18px;\">【殺出菜市場】迎合需求</h2>\r\n\r\n<p id=\"bcontent\" style=\"font-size: 18px;\">熟雞從1/6隻（視部位80~120元）、半隻（250~280元）、全隻（500~550元），滿足食用、拜拜等需求，不論量大量小價格一致，餐盒可微波加熱、方便食用。</p>\r\n\r\n<hr class=\"clearman\">\r\n<hr class=\"clearman\">\r\n<figure class=\"lbimg sgimg sglft\"><img alt=\"\" src=\"/upload/images/20180730143734.jpg\" style=\"width: 100%;\"></figure>\r\n\r\n<h2 id=\"bhead\" style=\"font-size: 18px;\">建加工廠</h2>\r\n\r\n<p id=\"bcontent\" style=\"font-size: 18px;\">嘉義溪口自建加工廠，將雲嘉南地區農民契作代養雞隻，集中此地宰殺、烹製，再運送至台北店內銷售。</p>\r\n\r\n<hr class=\"clearman\">\r\n<hr class=\"clearman\">\r\n<figure class=\"lbimg sgimg sglft\"><img alt=\"\" src=\"/upload/images/20180730143753.jpg\" style=\"width: 100%;\"></figure>\r\n\r\n<h2 id=\"bhead\" style=\"font-size: 18px;\">專賣土雞</h2>\r\n\r\n<p id=\"bcontent\" style=\"font-size: 18px;\">黑羽母雞專做土雞肉，公雞由於口感較濕，專做滴雞精。</p>\r\n\r\n<hr class=\"clearman\">\r\n<hr class=\"clearman\">\r\n<figure class=\"lbimg sgimg sglft\"><img alt=\"\" src=\"/upload/images/20180730143813.jpg\" style=\"width: 100%;\"></figure>\r\n\r\n<h2 id=\"bhead\" style=\"font-size: 18px;\">口碑效應</h2>\r\n\r\n<p id=\"bcontent\" style=\"font-size: 18px;\">老饕藝人邰智源曾推薦，老闆看到媒體報導才知道名人光顧，多數客人靠口碑發酵。</p>\r\n\r\n<hr class=\"clearman\">\r\n<hr class=\"clearman\">\r\n<figure class=\"lbimg sgimg sglft\"><img alt=\"\" src=\"/upload/images/20180730143833.jpg\" style=\"width: 100%;\"></figure>\r\n\r\n<h2 id=\"bhead\" style=\"font-size: 18px;\">【店家資料】</h2>\r\n\r\n<p id=\"bcontent\" style=\"font-size: 18px;\">網址：<a href=\"http://www.%E6%B7%9E%E5%93%81.tw\" target=\"_blank\">http://www.淞品.tw</a><br>\r\n總店地址：台北市萬華區三水街84號<br>\r\n電話：</p>",
    "featuredImage": "/upload/media/163738515057.jpg",
    "galleryImages": [],
    "iframeUrl": "",
    "sourceUrl": "https://sonpin.tw/media/79/91",
    "kind": "article"
  },
  {
    "groupSlug": "79",
    "articleSlug": "90",
    "title": "為廟慶添光彩造福嘉義縣民 高浚泓慨捐「靈安尊王2號」救護車",
    "date": "2021-11-17",
    "excerpt": "淞品生技公司董事長高浚泓，為廟慶添加光彩，並藉以幫助更多嘉義縣民，即以「靈安尊王2號」為名，花費新台幣265萬元購置一部全新的救護車捐贈給嘉義縣消防局，運用記者會時同時辦理捐贈儀式。",
    "bodyParagraphs": [],
    "htmlContent": "<p><img alt=\"淞品土雞肉專賣店\" src=\"/upload/images/20180730144118.jpg\" style=\"width: 100%;\"></p>",
    "featuredImage": "/upload/media/163738515057.jpg",
    "galleryImages": [],
    "iframeUrl": "",
    "sourceUrl": "https://sonpin.tw/media/79/90",
    "kind": "article"
  },
  {
    "groupSlug": "79",
    "articleSlug": "83",
    "title": "淞品畜產 煙燻放山雞",
    "date": "2013-12-13",
    "excerpt": "位於萬華龍山寺附近巷弄內，只賣煙燻雞肉及鹹水雞兩種，卻時常不到關店時間，雞肉就已全數賣完。「瘋神無雙」的小瑋說店家堅持使用自家飼養的放山雞，味道鮮美、肉質有彈性...",
    "bodyParagraphs": [],
    "htmlContent": "<figure class=\"wrapper-media story-top-media\" style=\"box-sizing: border-box; margin: 0px; font-family: 'Microsoft JhengHei', 'Microsoft YaHei', a?Re?¯e?…e?‘a?“, SimHei, e?‘a?“, STXihei, 'STHeiti Light', a??a–?c??e?‘, sans-serif; font-size: 16px; line-height: 29.6px;\"><a href=\"http://www.nextmag.com.tw/magazine/eat_travel/20160122/33302647\">原文網址http://www.nextmag.com.tw/magazine/eat_travel/20160122/33302647</a><br>\r\n<img alt=\"\" class=\"adapt\" src=\"/upload/images/20180730144951.jpg\" style=\"box-sizing: border-box; border: 0px; vertical-align: middle; display: block; margin: 0px auto; max-width: 100%; width: 100%;\">\r\n<figcaption style=\"box-sizing: border-box; font-size: 15px;\"> </figcaption>\r\n</figure>\r\n\r\n<div id=\"content_story_page\" style=\"box-sizing: border-box; margin: 0px; padding: 0px; font-family: 'Microsoft JhengHei', 'Microsoft YaHei', a?Re?¯e?…e?‘a?“, SimHei, e?‘a?“, STXihei, 'STHeiti Light', a??a–?c??e?‘, sans-serif; font-size: 16px; line-height: 29.6px;\">\r\n<p itemprop=\"articleBody\" style=\"box-sizing: border-box; margin: 0px 0px 20px; padding: 0px;\">辦年菜，一定要來一道雞肉，吃出全家（雞）、起家（雞）的好彩頭。從台北萬華三水街市場發跡的「淞品土雞專賣店」，年輕老闆高浚泓是雞販之子，「生意囝仔」不怕養雞賠錢，「食材決定一切，雞一定要自己養。」他點出美味關鍵，「黑羽母雞肉質細緻，紅羽公雞纖維長、體型大，交配出來的土雞口感好。」高浚泓甚至自己設置屠宰廠和食品加工廠，全台找不到第2家。</p>\r\n\r\n<section class=\"row-container cms-full-width portlet-layout\" style=\"box-sizing: border-box; margin: 0px auto; max-width: 990px; padding-right: 10px; padding-left: 10px;\">\r\n<div id=\"div-inread-ad\" style=\"box-sizing: border-box; margin: 0px; padding: 0px;\">\r\n<center style=\"box-sizing: border-box;\">\r\n<div style=\"box-sizing: border-box; margin: 0px; padding: 0px;\">\r\n<div class=\"inread\" id=\"ONEAD_inread_wrapper\" style=\"box-sizing: border-box; margin: 0px auto; padding: 0px;\"> </div>\r\n</div>\r\n</center>\r\n</div>\r\n\r\n<div id=\"div-mobile-inread\" style=\"box-sizing: border-box; margin: 0px; padding: 0px;\"> </div>\r\n</section>\r\n \r\n\r\n<figure class=\"wrapper-media\" style=\"box-sizing: border-box; margin: 0px;\"><img alt=\"▲「鹹水雞」入口肉凍爆汁，全憑老經驗和火侯功力。（550元／隻）\" class=\"adapt\" src=\"/upload/images/20180730145008.jpg\" style=\"box-sizing: border-box; border: 0px; vertical-align: middle; display: block; margin: 0px auto; max-width: 100%; width: 100%;\">\r\n<figcaption style=\"box-sizing: border-box; font-size: 15px;\">▲「鹹水雞」入口肉凍爆汁，全憑老經驗和火侯功力。（550元／隻）</figcaption>\r\n</figure>\r\n \r\n\r\n<figure class=\"wrapper-media\" style=\"box-sizing: border-box; margin: 0px;\"><img alt=\"▲「煙燻雞」有迷人焦糖香氣，惹味好吃。（550元／隻）\" class=\"adapt\" src=\"/upload/images/20180730145025.jpg\" style=\"box-sizing: border-box; border: 0px; vertical-align: middle; display: block; margin: 0px auto; max-width: 100%; width: 100%;\">\r\n<figcaption style=\"box-sizing: border-box; font-size: 15px;\">▲「煙燻雞」有迷人焦糖香氣，惹味好吃。（550元／隻）</figcaption>\r\n</figure>\r\n \r\n\r\n<figure class=\"wrapper-media\" style=\"box-sizing: border-box; margin: 0px;\"><img alt=\"▲高浚泓夫妻聯手傳承40多年好味道。\" class=\"adapt\" src=\"/upload/images/20180730145040.jpg\" style=\"box-sizing: border-box; border: 0px; vertical-align: middle; display: block; margin: 0px auto; max-width: 100%; width: 100%;\">\r\n<figcaption style=\"box-sizing: border-box; font-size: 15px;\">▲高浚泓夫妻聯手傳承40多年好味道。</figcaption>\r\n</figure>\r\n \r\n\r\n<figure class=\"wrapper-media\" style=\"box-sizing: border-box; margin: 0px;\"><img alt=\"▲「淞品土雞專賣店」民生店設有熟食與生肉區。\" class=\"adapt\" src=\"/upload/images/20180730145100.jpg\" style=\"box-sizing: border-box; border: 0px; vertical-align: middle; display: block; margin: 0px auto; max-width: 100%; width: 100%;\">\r\n<figcaption style=\"box-sizing: border-box; font-size: 15px;\">▲「淞品土雞專賣店」民生店設有熟食與生肉區。</figcaption>\r\n</figure>\r\n<br style=\"box-sizing: border-box;\">\r\n<br style=\"box-sizing: border-box;\">\r\n這兒只有「鹹水雞」和「煙燻雞」，火候拿捏得好，皮肉間煮出剔透肉凍，煙燻滲出蔗糖甜香，只挑油脂多、肉細嫩的母雞，那公雞怎麼辦？「反正自己養，拿來做滴雞精啊！」他把好吃擺第一，難怪4家店逢年過節總是大排長龍。<br style=\"box-sizing: border-box;\">\r\n<br style=\"box-sizing: border-box;\">\r\n「阿雪真甕雞」有30多年歷史，如今加入第3代醫科美女生力軍，挑選3斤半的放山土雞，以獨門手法燜煮煙燻，再淋上燻雞時流出的雞汁，肉質扎實入味，冰涼入口，過年當主菜或零嘴都不錯。<br style=\"box-sizing: border-box;\">\r\n \r\n<figure class=\"wrapper-media\" style=\"box-sizing: border-box; margin: 0px;\"><img alt=\"▲「真甕雞」澆淋雞汁，雞肉入味鮮美。（1/24前，550元／隻，1/25～2/22， 600元／隻）\" class=\"adapt\" src=\"/upload/images/20180730145114.jpg\" style=\"box-sizing: border-box; border: 0px; vertical-align: middle; display: block; margin: 0px auto; max-width: 100%; width: 100%;\">\r\n<figcaption style=\"box-sizing: border-box; font-size: 15px;\">▲「真甕雞」澆淋雞汁，雞肉入味鮮美。（1/24前，550元／隻，1/25～2/22， 600元／隻）</figcaption>\r\n</figure>\r\n \r\n\r\n<figure class=\"wrapper-media\" style=\"box-sizing: border-box; margin: 0px;\"><img alt=\"▲「阿雪真甕雞」由兩代母女齊力打理，年節沒預約吃不到。\" class=\"adapt\" src=\"/upload/images/20180730145127.jpg\" style=\"box-sizing: border-box; border: 0px; vertical-align: middle; display: block; margin: 0px auto; max-width: 100%; width: 100%;\">\r\n<figcaption style=\"box-sizing: border-box; font-size: 15px;\">▲「阿雪真甕雞」由兩代母女齊力打理，年節沒預約吃不到。</figcaption>\r\n</figure>\r\n<br style=\"box-sizing: border-box;\">\r\n<br style=\"box-sizing: border-box;\">\r\n「小英媽媽廚房」由好手藝的客家媽媽詹玉英打理，她本著做菜給家人吃的用心，每天親自到市場挑仿土雞，「花雕醉雞」用上重達1斤多的雞腿肉，細心剃毛清洗，抓鹽按摩、蒸煮後，泡浸花雕、紅棗、枸杞、當歸4天，酒香滲入肌理，用雞酒凍拌麵吃也不錯。<br style=\"box-sizing: border-box;\">\r\n \r\n<figure class=\"wrapper-media\" style=\"box-sizing: border-box; margin: 0px;\"><img alt=\"▲「小英媽媽廚房」的「花雕醉雞」選料講究，酒香濃郁。（400元／600g）\" class=\"adapt\" src=\"/upload/images/20180730145139.jpg\" style=\"box-sizing: border-box; border: 0px; vertical-align: middle; display: block; margin: 0px auto; max-width: 100%; width: 100%;\">\r\n<figcaption style=\"box-sizing: border-box; font-size: 15px;\">▲「小英媽媽廚房」的「花雕醉雞」選料講究，酒香濃郁。（400元／600g）</figcaption>\r\n</figure>\r\n<br style=\"box-sizing: border-box;\">\r\n<br style=\"box-sizing: border-box;\">\r\n<br style=\"box-sizing: border-box;\">\r\n<strong style=\"box-sizing: border-box;\">淞品土雞專賣店（民生店）</strong><br style=\"box-sizing: border-box;\">\r\n地址：台北市松山區新東街41-6號<br style=\"box-sizing: border-box;\">\r\n電話：02-2761-0766<br style=\"box-sizing: border-box;\">\r\n網址：www.sonpin.tw<br style=\"box-sizing: border-box;\">\r\n營業時間：08：00～17：00，週一公休。<br style=\"box-sizing: border-box;\">\r\n訂購資訊：僅提供不分切的鹹水雞全雞宅配，即日起開放訂購，最後收單日為2月2日中午12：00，運費自付，12隻以上免運費。除夕店面由凌晨起開賣，約中午前賣完。<br style=\"box-sizing: border-box;\">\r\n<br style=\"box-sizing: border-box;\">\r\n<br style=\"box-sizing: border-box;\">\r\n<strong style=\"box-sizing: border-box;\">阿雪真甕雞</strong><br style=\"box-sizing: border-box;\">\r\n地址：台北市中山區松江路518號<br style=\"box-sizing: border-box;\">\r\n電話：02-2598-9518<br style=\"box-sizing: border-box;\">\r\n營業時間：08：30～18：00，週日及2月5至12</div>",
    "featuredImage": "/upload/media/153268070958.png",
    "galleryImages": [],
    "iframeUrl": "",
    "sourceUrl": "https://sonpin.tw/media/79/83",
    "kind": "article"
  },
  {
    "groupSlug": "79",
    "articleSlug": "66",
    "title": "??????????@??",
    "date": "2014-03-27",
    "excerpt": "?????????????",
    "bodyParagraphs": [],
    "htmlContent": "",
    "featuredImage": "",
    "galleryImages": [],
    "iframeUrl": "",
    "sourceUrl": "https://sonpin.tw/media/79/66",
    "kind": "article"
  },
  {
    "groupSlug": "79",
    "articleSlug": "40",
    "title": "????---?????? \"??? & ??\"",
    "date": "2010-01-01",
    "excerpt": "淞品商行---令人噴口水的 \"白斬雞 & 燻雞\"",
    "bodyParagraphs": [],
    "htmlContent": "<div class=\"article-content\">\r\n<div class=\"article-content-inner\">\r\n<p><em><strong><u><a href=\"http://valery.pixnet.net/blog/post/28333900-%E6%B7%9E%E5%93%81%E5%95%86%E8%A1%8C---%E4%BB%A4%E4%BA%BA%E5%99%B4%E5%8F%A3%E6%B0%B4%E7%9A%84-%22%E7%99%BD%E6%96%AC%E9%9B%9E-%26-%E7%87%BB%E9%9B%9E%22\" target=\"_blank\">原文網址</a></u></strong></em></p>\r\n\r\n<p><span style=\"font-size: 12pt;\">如果曾經按圖索驥去參訪過\"艋舺\"這部電影的人</span></p>\r\n\r\n<p><span style=\"font-size: 12pt;\">大多人一定錯過一家超好吃的 \"白斬雞 & 燻雞\"</span></p>\r\n\r\n<p><span style=\"font-size: 12pt;\">因為觀光手冊沒介紹....<img alt=\"samwoo1.gif\" border=\"0\" src=\"http://pic.pimg.tw/valery/32a9932f978c49ce23ca3106b03b36e9.gif\" title=\"samwoo1.gif\">  </span></p>\r\n\r\n<p><span style=\"font-size: 12pt;\">俺也是按圖索驥去玩的人 但是 這家漏網之魚還是給美食嗅覺靈敏的俺給發現了! <img alt=\"HAPPY GO.gif\" border=\"0\" src=\"http://pic.pimg.tw/valery/d166cc7c8b62d145103f974a3b87a1ed.gif\" title=\"HAPPY GO.gif\">  </span></p>\r\n\r\n<p><span style=\"font-size: 12pt;\">掙扎很久才願意介紹給大家~~因為..............我怕大家去排隊佔據掉我的時間  <img alt=\"奸笑2.gif\" border=\"0\" src=\"http://pic.pimg.tw/valery/ea3441b4bca710c463c0b07bd7f53b9b.gif\" title=\"奸笑2.gif\">  </span></p>\r\n\r\n<p><span style=\"font-size: 12pt;\">夭壽好吃oh~~~<img alt=\"爽歪歪.gif\" border=\"0\" src=\"http://pic.pimg.tw/valery/1363dba49818f3c7594d315d3f2d71d8.gif\" title=\"爽歪歪.gif\">  </span></p>\r\n\r\n<p><span style=\"font-size: 12pt;\"><span style=\"font-size: 12pt;\"><img alt=\"CIMG1876.JPG\" src=\"/upload/images/20180730135144.jpg\" style=\"width: 100%; border-width: 0px; border-style: solid;\" title=\"CIMG1876.JPG\"></span></span></p>\r\n\r\n<p><span style=\"font-size: 12pt;\"><span style=\"font-size: 12pt;\"><img alt=\"CIMG1877.JPG\" src=\"/upload/images/20180730135200.jpg\" style=\"width: 100%; border-width: 0px; border-style: solid;\" title=\"CIMG1877.JPG\"></span></span></p>\r\n\r\n<p><span style=\"font-size: 12pt;\"><span style=\"font-size: 12pt;\"><img alt=\"CIMG1878.JPG\" src=\"/upload/images/20180730135222.jpg\" style=\"width: 100%; border-width: 0px; border-style: solid;\" title=\"CIMG1878.JPG\"></span></span></p>\r\n\r\n<p><span style=\"font-size: 12pt;\"> </span></p>\r\n\r\n<p><span style=\"font-size: 12pt;\"><img alt=\"CIMG1879.JPG\" class=\"\" src=\"/upload/images/20180730135241.jpg\" style=\"width: 100%; border-width: 0px; border-style: solid;\" title=\"CIMG1879.JPG\">  </span></p>\r\n\r\n<p><span style=\"font-size: 12pt;\"> </span></p>\r\n\r\n<p><span style=\"font-size: 12pt;\"><span style=\"color: #ff0000;\"><span style=\"background-color: #888888;\"><span style=\"color: #808000;\"><span style=\"background-color: #ffffff;\"><strong>淞品商行</strong></span></span></span></span></span></p>\r\n\r\n<p><span style=\"font-size: 12pt;\"><span style=\"color: #ff0000;\"><span style=\"background-color: #888888;\"><span style=\"color: #808000;\"><span style=\"background-color: #ffffff;\"><strong>台北市萬華區三水街84號</strong></span></span></span></span></span></p>\r\n\r\n<div class=\"article-keyword\" style=\"word-wrap: break-word; word-break: break-all; margin-top:20px; clear:both;\"> </div>\r\n</div>\r\n</div>",
    "featuredImage": "",
    "galleryImages": [],
    "iframeUrl": "",
    "sourceUrl": "https://sonpin.tw/media/79/40",
    "kind": "article"
  },
  {
    "groupSlug": "78",
    "articleSlug": "115",
    "title": "一坪店起家 艋舺土雞王",
    "date": "2018-10-20",
    "excerpt": "您能想像光是賣鹽水雞跟甘蔗雞，就能年營收上億嗎？在萬華靠一坪攤位起家的高浚泓，從小在市場幫家裡賣雞，他極度討厭這樣的生活，逃家去當水電包商，不料卻被倒債；改到山區賣烤雞，偏偏又遇到九二一；他只好認命回到市場改賣鹹水雞燻雞，還自己養起雞來，沒想到卡枚基跟莫拉克兩次颱風，讓他連人帶車被水沖走，不但差點沒命、還重創他的養雞場，來看看高浚泓是如何從三次天災中重新站起，成為艋舺土雞王。",
    "bodyParagraphs": [],
    "htmlContent": "<iframe allow=\"autoplay; encrypted-media\" allowfullscreen=\"\" frameborder=\"0\" height=\"450\" scrolling=\"no\" src=\"https://www.youtube.com/embed/U-jVtVyH93M\" width=\"100%\"></iframe>",
    "featuredImage": "/upload/media/154020592695.jpg",
    "galleryImages": [],
    "iframeUrl": "",
    "sourceUrl": "https://sonpin.tw/media/78/115",
    "kind": "article"
  },
  {
    "groupSlug": "78",
    "articleSlug": "86",
    "title": "一坪店起家 艋舺土雞王",
    "date": "2018-10-20",
    "excerpt": "您能想像光是賣鹽水雞跟甘蔗雞，就能年營收上億嗎？在萬華靠一坪攤位起家的高浚泓，從小在市場幫家裡賣雞，他極度討厭這樣的生活，逃家去當水電包商，不料卻被倒債；改到山區賣烤雞，偏偏又遇到九二一；他只好認命回到市場改賣鹹水雞燻雞，還自己養起雞來，沒想到卡枚基跟莫拉克兩次颱風，讓他連人帶車被水沖走，不但差點沒命、還重創他的養雞場，來看看高浚泓是如何從三次天災中重新站起，成為艋舺土雞王。",
    "bodyParagraphs": [],
    "htmlContent": "<p><object height=\"480\" width=\"100%\"><param name=\"quality\" value=\"high\"><param name=\"allowScriptAccess\" value=\"always\"><param name=\"movie\" value=\"//www.youtube.com/v/4nKAZSMfDoE?hl=zh_TW&version=3\"><param name=\"allowFullScreen\" value=\"true\"><param name=\"allowscriptaccess\" value=\"always\"><embed allowfullscreen=\"true\" allowscriptaccess=\"always\" height=\"480\" quality=\"high\" src=\"//www.youtube.com/v/4nKAZSMfDoE?hl=zh_TW&version=3\" type=\"application/x-shockwave-flash\" width=\"100%\"></embed></object></p>\r\n\r\n<p id=\"summary\" style=\"word-wrap: break-word; font-size: 18px;\">父母是菜市場雞販，小學就要幫忙殺雞，從小他心底最不想就是留在市場賣雞，15歲當水電工、18歲自立門戶當承包商，一次慘遭倒債，嚇得只好回市場賣雞。<br>\r\n<br>\r\n65年次淞品畜產老闆高浚泓，不想與父母相同賣生雞，改賣熟食土雞。賣出口碑，不只常排長龍，藝人邰智源、市議員林瑞圖也常光顧。<br>\r\n<br>\r\n14年來從萬華三水市場1坪小攤起家，賣土雞5年，他決定自己養控制肉質，一度親自南下養雞，遇風災險丟性命、雞隻全被大水衝走，一夕慘賠3000萬元。為了養土雞，曾以1年倒貼1000萬元苦撐3年，以店面賣熟食土雞利潤、填補批發毛雞虧損。<br>\r\n <br>\r\n他的土雞策略︰跳過批發市場、找雞農契作，嘉義自建加工廠，賣進台北自有通路，年銷5000~6000萬元。去年禁宰活禽政策實施以來，成為第1家由傳統市場成功轉型，做到產製銷一條龍的菜市場土雞業者。（潘怡靜／台北報導）<br>\r\n <br>\r\n<strong>想看更多有趣訊息，快上「</strong><strong><a href=\"https://www.facebook.com/appledailytree\" title=\"https://www.facebook.com/appledailytree\">蘋果搖錢樹</a></strong><strong>」粉絲團</strong><br>\r\n </p>\r\n\r\n<figure class=\"lbimg sgimg sglft\"><a href=\"http://twimg.edgesuite.net/images/ReNews/20140219/640_0a075c3f3203dbaddf02fbc1107872fa.jpg\" title=\"高浚泓專注土雞生意，衝鋒陷陣，走出菜市場小攤，剁出新格局。董孟航攝\"><img alt=\"淞品土雞肉專賣店\" src=\"/upload/images/20180730145541.jpg\" style=\"width: 100%;\"></a>\r\n\r\n<div class=\"textbox\">\r\n<p id=\"caption0\" style=\"font-size: 18px;\">高浚泓專注土雞生意，衝鋒陷陣，走出菜市場小攤，剁出新格局。董孟航攝</p>\r\n</div>\r\n</figure>\r\n\r\n<figure class=\"lbimg sgimg sglft\"><a href=\"http://twimg.edgesuite.net/images/ReNews/20140219/640_127395027065d547b3ffa1f1d1a87c8f.jpg\" title=\"鹹水雞、煙燻雞2大熱銷品，僅加鹽、水、糖等常見調味料，高浚泓認為控制好雞隻品質、雞肉自然好吃。董孟航攝\"><img alt=\"淞品土雞肉專賣店\" src=\"/upload/images/20180730145553.jpg\" style=\"width: 100%;\"></a>\r\n\r\n<div class=\"textbox\">\r\n<p id=\"caption1\" style=\"font-size: 18px;\">鹹水雞、煙燻雞2大熱銷品，僅加鹽、水、糖等常見調味料，高浚泓認為控制好雞隻品質、雞肉自然好吃。董孟航攝</p>\r\n\r\n<p style=\"font-size: 18px;\"> </p>\r\n\r\n<p style=\"font-size: 18px;\"><img alt=\"淞品土雞肉專賣店\" class=\"\" src=\"/upload/images/20180730145614.jpg\" style=\"width: 100%;\"></p>\r\n</div>\r\n</figure>",
    "featuredImage": "/upload/media/154020592695.jpg",
    "galleryImages": [],
    "iframeUrl": "",
    "sourceUrl": "https://sonpin.tw/media/78/86",
    "kind": "article"
  },
  {
    "groupSlug": "78",
    "articleSlug": "80",
    "title": "一坪店起家 艋舺土雞王",
    "date": "2018-10-20",
    "excerpt": "您能想像光是賣鹽水雞跟甘蔗雞，就能年營收上億嗎？在萬華靠一坪攤位起家的高浚泓，從小在市場幫家裡賣雞，他極度討厭這樣的生活，逃家去當水電包商，不料卻被倒債；改到山區賣烤雞，偏偏又遇到九二一；他只好認命回到市場改賣鹹水雞燻雞，還自己養起雞來，沒想到卡枚基跟莫拉克兩次颱風，讓他連人帶車被水沖走，不但差點沒命、還重創他的養雞場，來看看高浚泓是如何從三次天災中重新站起，成為艋舺土雞王。",
    "bodyParagraphs": [],
    "htmlContent": "<p><iframe allowfullscreen=\"\" frameborder=\"0\" height=\"480\" scrolling=\"no\" src=\"https://www.youtube.com/embed/8wXdCJ5hSF8\" width=\"100%\"></iframe></p>\r\n\r\n<p><span style=\"color: rgb(64, 64, 64); font-family: 微軟正黑體, Arial, Helvetica, sans-serif; font-size: 17px;\">前陣子受到禽流感影響，土雞產地價格飆漲，當然影響最大的，就是末端的店面。為了提高買氣，店家根本不敢隨便喊漲，但偏偏產地價格不斷波動，近期土雞的產地價，每台斤最高還飆到48元，這些成本店家都只能默默吸收。</span></p>",
    "featuredImage": "/upload/media/154020592695.jpg",
    "galleryImages": [],
    "iframeUrl": "",
    "sourceUrl": "https://sonpin.tw/media/78/80",
    "kind": "article"
  },
  {
    "groupSlug": "78",
    "articleSlug": "87",
    "title": "萬華土雞王 邰智源就愛這味 (蘋果日報)",
    "date": "2018-10-20",
    "excerpt": "父母是菜市場雞販，小學就要幫忙殺雞，從小他心底最不想就是留在市場賣雞，15歲當水電工、18歲自立門戶當承包商，一次慘遭倒債，嚇得只好回市場賣雞。",
    "bodyParagraphs": [],
    "htmlContent": "<p><object height=\"480\" width=\"100%\"><param name=\"quality\" value=\"high\"><param name=\"allowScriptAccess\" value=\"always\"><param name=\"movie\" value=\"//www.youtube.com/v/Yw_EQ2v86-M?version=3&hl=zh_TW\"><param name=\"allowFullScreen\" value=\"true\"><param name=\"allowscriptaccess\" value=\"always\"><embed allowfullscreen=\"true\" allowscriptaccess=\"always\" height=\"480\" quality=\"high\" src=\"//www.youtube.com/v/Yw_EQ2v86-M?version=3&hl=zh_TW\" type=\"application/x-shockwave-flash\" width=\"100%\"></embed></object></p>",
    "featuredImage": "/upload/media/153268011775.png",
    "galleryImages": [],
    "iframeUrl": "",
    "sourceUrl": "https://sonpin.tw/media/78/87",
    "kind": "article"
  },
  {
    "groupSlug": "78",
    "articleSlug": "88",
    "title": "萬華土雞王 邰智源就愛這味 (蘋果日報)",
    "date": "2014-02-19",
    "excerpt": "父母是菜市場雞販，小學就要幫忙殺雞，從小他心底最不想就是留在市場賣雞，15歲當水電工、18歲自立門戶當承包商，一次慘遭倒債，嚇得只好回市場賣雞。",
    "bodyParagraphs": [],
    "htmlContent": "<p><object height=\"480\" width=\"100%\"><param name=\"quality\" value=\"high\"><param name=\"allowScriptAccess\" value=\"always\"><param name=\"movie\" value=\"//www.youtube.com/v/Q3LtK9hH1Ko?hl=zh_TW&version=3\"><param name=\"allowFullScreen\" value=\"true\"><param name=\"allowscriptaccess\" value=\"always\"><embed allowfullscreen=\"true\" allowscriptaccess=\"always\" height=\"480\" quality=\"high\" src=\"//www.youtube.com/v/Q3LtK9hH1Ko?hl=zh_TW&version=3\" type=\"application/x-shockwave-flash\" width=\"100%\"></embed></object></p>",
    "featuredImage": "/upload/media/153284322595.jpg",
    "galleryImages": [],
    "iframeUrl": "",
    "sourceUrl": "https://sonpin.tw/media/78/88",
    "kind": "article"
  },
  {
    "groupSlug": "78",
    "articleSlug": "85",
    "title": "產地每斤飆到48元 土雞店苦撐搶買氣",
    "date": "2017-05-18",
    "excerpt": "前陣子受到禽流感影響，土雞產地價格飆漲，當然影響最大的，就是末端的店面。為了提高買氣，店家根本不敢隨便喊漲，但偏偏產地價格不斷波動，近期土雞的產地價，每台斤最高還飆到48元，這些成本店家都只能默默吸收。",
    "bodyParagraphs": [],
    "htmlContent": "<p><object height=\"480\" width=\"100%\"><param name=\"quality\" value=\"high\"><param name=\"allowScriptAccess\" value=\"always\"><param name=\"movie\" value=\"//www.youtube.com/v/xJyJpzDpTlA?hl=zh_TW&version=3\"><param name=\"allowFullScreen\" value=\"true\"><param name=\"allowscriptaccess\" value=\"always\"><embed allowfullscreen=\"true\" allowscriptaccess=\"always\" height=\"480\" quality=\"high\" src=\"//www.youtube.com/v/xJyJpzDpTlA?hl=zh_TW&version=3\" type=\"application/x-shockwave-flash\" width=\"100%\"></embed></object></p>",
    "featuredImage": "/upload/media/153284322595.jpg",
    "galleryImages": [],
    "iframeUrl": "",
    "sourceUrl": "https://sonpin.tw/media/78/85",
    "kind": "article"
  },
  {
    "groupSlug": "78",
    "articleSlug": "77",
    "title": "發現新台灣-淞品商行",
    "date": "2014-01-30",
    "excerpt": "【被倒債300萬】這家土雞店從1坪攤翻身",
    "bodyParagraphs": [],
    "htmlContent": "<p><a href=\"http://m.appledaily.com.tw/realtimenews/article/new/20160807/921875/?utm_source=Line&utm_medium=MWeb_Share&utm_campaign=http%3A%2F%2Fwww.appledaily.com.tw%2Frealtimenews%2Farticle%2Fnew%2F20160807%2F921875%2F\">原文網址</a></p>\r\n\r\n<p><iframe allowfullscreen=\"\" frameborder=\"0\" height=\"480\" scrolling=\"no\" src=\"https://www.youtube.com/embed/Vx30fW4dLx0\" width=\"100%\"></iframe></p>\r\n\r\n<p><span style=\"line-height: 1.6em;\">時序進入農曆7月中元普渡拜拜旺季，全年用雞量最高月份，這家老闆賣雞的方法，很不一樣。</span></p>\r\n\r\n<p> <br>\r\n淞品土雞老闆高浚泓從小看父母在菜市場賣雞，看好民生產業需求，不只延續雞業，還把雞業搞大，成為農委會輔導第1家產製銷流程一條龍業者，把過去只能存在於傳統菜市場的雞販、變身土雞品牌店。<br>\r\n <br>\r\n他的店裡，從生雞、鹹水雞、煙燻甘蔗雞到滴雞精、滷鳳爪、雞胗、雞油，所有雞製品全銷售，可說「把雞全包了」。<br>\r\n <br>\r\n「從第1天做生意，我就問自己：『殘值』有多少？」高浚泓24歲在台北萬華三水街市場起家、當時還被倒債300萬，租下1坪攤位起家賣熟食土雞。<br>\r\n <br>\r\n當天沒賣完，隔天還有價值嗎？消費者根本不會買單。<br>\r\n <br>\r\n因為想到「殘值」，讓他提早一步做準備。<br>\r\n <br>\r\n2013年傳統市場禁宰活禽政策上路前，他在嘉義溪口投入8000萬元購地設廠，做好雞隻電宰、熟食加工準備，為產製銷一條龍做足準備，目前在台北拓展萬華店、士林店、民生店、新埔店4家直營店。<br>\r\n <br>\r\n「雖然我這樣做，無法把規模做很大、很辛苦，但我可以從頭到尾顧品質。」<br>\r\n <br>\r\n常客許媽媽說：「我不知道這家店有名，有一次朋友買給我吃，實在是太好吃了，後來我都大老遠開車跑來買，最喜歡吃土雞肉中間有一層凍，價格很公道，初一、十五拜拜我一定來買1隻，農曆七月十五需要買2隻。」<br>\r\n <br>\r\n為掌握雞肉品質，高浚泓曾試過自己養雞，2009年莫拉克風災把雞全沖走，一夕間慘賠3000萬元，後轉為與20餘家雲嘉南地區雞農，以契作、代養2種方式合作，專飼養紅羽、黑羽土雞，放養結合圈養，兼顧分散風險及控制雞肉品質。<br>\r\n <br>\r\n「因拜拜習慣改變，就算是農曆7月，很多社區、上班族選擇周六周日集體普渡，雞的需求量有時集中在周末，平時因年輕人較少拜拜，也會設法開發上班族團購、企業送禮需求。」店內員工高綎栴表示。<br>\r\n <br>\r\n「員工難請，來10個大概只會留下2個。」「店面承租不易，很多房東不租給賣吃的、殺生的。」「禽流感來襲時，消費信心崩盤。」從生產端管到消費端，他挑戰經營難度，「考量品質，堅持自己直營，不開放加盟，供應量少時可調節營業時間、賣完就提早打烊，同時可從末端銷售量控制養殖量。」<br>\r\n <br>\r\n產製銷一條龍的固定成本高，因此近年以1年增1直營店方式，有助彈性調節產銷量、商品型態，同時讓產銷達到經濟規模，目前4店合計年賣7000萬元。<br>\r\n <br>\r\n淞品土雞有2項熱銷商品，一是熟雞、一是滴雞精。8成客人進店買鹹水雞、甘蔗雞，好吃涮嘴人流不斷，雞精是近年人氣養生商品、月銷3萬包。<br>\r\n <br>\r\n但此2品項差異大，「坦白講，熟雞這生意多不好做，從飼養、製作到販售，當天賣不完就要凍起來，捐給孤兒院等慈養機構。」相對雞精可冷凍保存，販售期拉長，刺激他今年入夏開始建置食品加工二廠，預計年底加入蛤蜊雞湯、香菇雞湯等料理便利湯商品，延伸銷售版圖。<br>\r\n <br>\r\n從末端銷售量控制養殖量、從熟雞到雞製品全線經營，高浚泓1坪起家，開展月斬萬雞傳奇。（潘怡靜／台北報導）</p>\r\n\r\n<p> </p>\r\n\r\n<center style=\"font-family: Helvetica, Arial, sans-serif; font-size: 20px; line-height: 30px;\">\r\n<div class=\"news-img\" style=\"max-width: 400px;\"><img src=\"/upload/images/20180730150202.jpg\" style=\"display: block; width: 100%;\">\r\n<p class=\"video-caption\" style=\"margin: 5px 10px 1.5em; padding: 0px; font-size: 18px; color: rgb(45, 89, 104); text-align: left;\">淞品土雞老闆高浚泓，從傳統雞販升級，直營品牌店面。李柏毅攝</p>\r\n</div>\r\n</center>\r\n\r\n<div class=\"text\" style=\"padding: 0px 5px 10px 10px; font-family: Helvetica, Arial, sans-serif; font-size: 20px; line-height: 30px;\"> </div>\r\n\r\n<center style=\"font-family: Helvetica, Arial, sans-serif; font-size: 20px; line-height: 30px;\">\r\n<div class=\"news-img\" style=\"max-width: 400px;\"><img src=\"/upload/images/20180730150231.jpg\" style=\"display: block; width: 100%;\">\r\n<p class=\"video-caption\" style=\"margin: 5px 10px 1.5em; padding: 0px; font-size: 18px; color: rgb(45, 89, 104); text-align: left;\">中元普渡商機旺，月賣上萬隻雞，全雞550元起跳。李柏毅攝</p>\r\n</div>\r\n</center>\r\n\r\n<div class=\"text\" style=\"padding: 0px 5px 10px 10px; font-family: Helvetica, Arial, sans-serif; font-size: 20px; line-height: 30px;\"> </div>\r\n\r\n<center style=\"font-family: Helvetica, Arial, sans-serif; font-size: 20px; line-height: 30px;\">\r\n<div class=\"news-img\" style=\"max-width: 400px;\"><img src=\"/upload/images/20180730150248.jpg\" style=\"display: block; width: 100%;\">\r\n<p class=\"video-caption\" style=\"margin: 5px 10px 1.5em; padding: 0px; font-size: 18px; color: rgb(45, 89, 104); text-align: left;\">剁雞不是人人都會，員工聘請不易，是店面升級的難處。李柏毅攝</p>\r\n</div>\r\n</center>\r\n\r\n<div class=\"text\" style=\"padding: 0px 5px 10px 10px; font-family: Helvetica, Arial, sans-serif; font-size: 20px; line-height: 30px;\"> </div>\r\n\r\n<center style=\"font-family: Helvetica, Arial, sans-serif; font-size: 20px; line-height: 30px;\">\r\n<div class=\"news-img\" style=\"max-width: 400px;\"><img src=\"/upload/images/20180730150305.jpg\" style=\"display: block; width: 100%;\">\r\n<p class=\"video-caption\" style=\"margin: 5px 10px 1.5em; padding: 0px; font-size: 18px; color: rgb(45, 89, 104); text-align: left;\">把傳統雞攤現代化，選點傳統市場、捷運站附近設直營店面。李柏毅攝</p>\r\n</div>\r\n</center>\r\n\r\n<div class=\"text\" style=\"padding: 0px 5px 10px 10px; font-family: Helvetica, Arial, sans-serif; font-size: 20px; line-height: 30px;\"> </div>\r\n\r\n<center style=\"font-family: Helvetica, Arial, sans-serif; font-size: 20px; line-height: 30px;\">\r\n<div class=\"news-img\" style=\"max-width: 400px;\"><img class=\"\" src=\"/upload/images/20180730150321.jpg\" style=\"display: block; width: 100%;\">\r\n<p class=\"video-caption\" style=\"margin: 5px 10px 1.5em; padding: 0px; font-size: 18px; color: rgb(45, 89, 104); text-align: left;\">滴雞精，以公土雞滴製，月賣3萬包。</p>\r\n</div>\r\n</center>",
    "featuredImage": "/upload/media/153268058258.png",
    "galleryImages": [],
    "iframeUrl": "",
    "sourceUrl": "https://sonpin.tw/media/78/77",
    "kind": "article"
  },
  {
    "groupSlug": "78",
    "articleSlug": "84",
    "title": "產製銷一條龍，鮮流土雞新鮮有夠證 記者會",
    "date": "2013-11-19",
    "excerpt": "一坪肉攤起家 14年翻身雞販變土雞王 (東森新聞)",
    "bodyParagraphs": [],
    "htmlContent": "<p><object height=\"480\" width=\"100%\"><param name=\"quality\" value=\"high\"><param name=\"allowScriptAccess\" value=\"always\"><param name=\"movie\" value=\"//www.youtube.com/v/rkNMHRhfMNc?hl=zh_TW&version=3\"><param name=\"allowFullScreen\" value=\"true\"><param name=\"allowscriptaccess\" value=\"always\"><embed allowfullscreen=\"true\" allowscriptaccess=\"always\" height=\"480\" quality=\"high\" src=\"//www.youtube.com/v/rkNMHRhfMNc?hl=zh_TW&version=3\" type=\"application/x-shockwave-flash\" width=\"100%\"></embed></object></p>",
    "featuredImage": "/upload/media/153268006254.png",
    "galleryImages": [],
    "iframeUrl": "",
    "sourceUrl": "https://sonpin.tw/media/78/84",
    "kind": "article"
  },
  {
    "groupSlug": "78",
    "articleSlug": "82",
    "title": "年代台灣向錢衝-日斬萬雞年賣上億",
    "date": "2017-08-19",
    "excerpt": "忙翻天！ 拜拜必需品 雞肉名店「半夜也排隊」",
    "bodyParagraphs": [],
    "htmlContent": "<p><iframe allowfullscreen=\"\" frameborder=\"0\" height=\"480\" scrolling=\"no\" src=\"https://www.youtube.com/embed/9NzROZW-VCQ\" width=\"100%\"></iframe></p>\r\n\r\n<p>今年受到禽流感疫情的影響，雞隻銷售狀況並不好，但是過年要用全雞拜拜，有信譽的老店就變成民眾的最愛，在台北市萬華地區的知名老店，白天排隊買雞，至少要1小時以上，店家乾脆除夕前三天，24小時不打烊，許多民眾趁著半夜排隊買雞。</p>",
    "featuredImage": "/upload/media/153284313010.jpg",
    "galleryImages": [],
    "iframeUrl": "",
    "sourceUrl": "https://sonpin.tw/media/78/82",
    "kind": "article"
  },
  {
    "groupSlug": "78",
    "articleSlug": "81",
    "title": "???????-????????",
    "date": "2017-08-19",
    "excerpt": "????????????",
    "bodyParagraphs": [],
    "htmlContent": "<p style=\"text-align: center;\"><iframe allowfullscreen=\"\" frameborder=\"0\" height=\"480\" scrolling=\"no\" src=\"https://www.youtube.com/embed/HCTmM1PKLUU\" width=\"100%\"></iframe>​</p>",
    "featuredImage": "",
    "galleryImages": [],
    "iframeUrl": "",
    "sourceUrl": "https://sonpin.tw/media/78/81",
    "kind": "article"
  }
];

export const MEDIA_GROUPS = {
  '79': {
    slug: '79',
    title: '報章雜誌',
    label: '報章雜誌',
  },
  '78': {
    slug: '78',
    title: '影音報導',
    label: '影音報導',
  },
} as const;

export const getMediaGroup = (slug: string) => {
  if (slug === '79') {
    return {
      slug: '79',
      title: '報章雜誌',
      label: '報章雜誌',
    };
  }

  if (slug === '78') {
    return {
      slug: '78',
      title: '影音報導',
      label: '影音報導',
    };
  }

  return MEDIA_GROUPS[slug as keyof typeof MEDIA_GROUPS] || null;
};

export const getMediaArticlesByGroup = (groupSlug: string) =>
  MEDIA_ARTICLES.filter((article) => article.groupSlug === groupSlug);

export const getMediaArticle = (groupSlug: string, articleSlug: string) =>
  MEDIA_ARTICLES.find((article) => article.groupSlug === groupSlug && article.articleSlug === articleSlug) || null;
