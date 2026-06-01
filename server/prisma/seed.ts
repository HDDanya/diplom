import bcrypt from "bcryptjs";
import { PrismaClient, ComicStatus, TransitionStyle } from "@prisma/client";

const prisma = new PrismaClient();

type SeedPage = {
  pageKey: string;
  title: string;
  body: string;
  imageUrl: string;
  panelImageUrls: string[];
  sketchPrompt: string;
  transitionStyle: TransitionStyle;
  position: number;
  isStart?: boolean;
};

async function main() {
  const BATMAN_COMIC_IMAGES = {
    detective27: "https://upload.wikimedia.org/wikipedia/en/b/bc/Detective_Comics_27_%28May_1939%29.png",
    yearOne: "https://upload.wikimedia.org/wikipedia/en/b/b1/Batman_vol._1-404_%28January_1987%29.jpg",
    longHalloween: "https://upload.wikimedia.org/wikipedia/en/5/52/Batman_thelonghalloween.jpg",
    killingJoke: "https://upload.wikimedia.org/wikipedia/en/3/32/Killingjoke.JPG",
    hush: "https://upload.wikimedia.org/wikipedia/en/b/bb/Batman_608_%282002%29.jpg"
  };

  const authorEmail = "author@inkflow.app";
  const readerEmail = "reader@inkflow.app";
  const passwordHash = await bcrypt.hash("password123", 10);

  const [author, reader] = await Promise.all([
    prisma.user.upsert({
      where: { email: authorEmail },
      update: {
        displayName: "Noir Author",
        passwordHash
      },
      create: {
        email: authorEmail,
        passwordHash,
        displayName: "Noir Author",
        bio: "Создаю интерактивные скетч-комиксы в noir стилистике."
      }
    }),
    prisma.user.upsert({
      where: { email: readerEmail },
      update: {
        displayName: "Demo Reader",
        passwordHash
      },
      create: {
        email: readerEmail,
        passwordHash,
        displayName: "Demo Reader"
      }
    })
  ]);

  const comicSlug = "city-of-ink";
  const existingComic = await prisma.comic.findUnique({
    where: { slug: comicSlug },
    include: { pages: true }
  });

  if (existingComic) {
    await prisma.comicChoice.deleteMany({
      where: { pageId: { in: existingComic.pages.map((page) => page.id) } }
    });
    await prisma.comicPage.deleteMany({ where: { comicId: existingComic.id } });
  }

  const comic = await prisma.comic.upsert({
    where: { slug: comicSlug },
    update: {
      title: "Neon Sentinel: Protocol Blackout",
      summary:
        "Полноценный 8-страничный супергеройский выпуск: саботаж энергосети, атака монстров, штурм портала и финальная битва за город.",
      script:
        "Неон-Сити погружается в хаос после запуска «Протокола Блэкаут». Неизвестный культ открывает разлом между измерениями и выпускает монстров в город. Sentinel и союзники проходят восемь ключевых столкновений: от уличного саботажа до финального штурма ядра портала.",
      status: ComicStatus.PUBLISHED,
      coverImageUrl: "/uploads/seed/net-01.jpg",
      authorId: author.id
    },
    create: {
      slug: comicSlug,
      title: "Neon Sentinel: Protocol Blackout",
      summary:
        "Полноценный 8-страничный супергеройский выпуск: саботаж энергосети, атака монстров, штурм портала и финальная битва за город.",
      script:
        "Неон-Сити погружается в хаос после запуска «Протокола Блэкаут». Неизвестный культ открывает разлом между измерениями и выпускает монстров в город. Sentinel и союзники проходят восемь ключевых столкновений: от уличного саботажа до финального штурма ядра портала.",
      status: ComicStatus.PUBLISHED,
      coverImageUrl: "/uploads/seed/net-01.jpg",
      authorId: author.id
    }
  });

  const pagesData: SeedPage[] = [
    {
      pageKey: "start",
      title: "Страница 1: Сигнал тревоги",
      body:
        "Ночной выпуск открывается тревожным кадром: над Неон-Сити рвётся небо и включается протокол аварийного отключения.\n---\nSentinel получает перехват: энергосеть взломана, а в центре города замечены эмиттеры чужой технологии.\n---\nСоюзники требуют эвакуацию граждан, но герой выбирает удар по источнику сигнала.\n---\nТы прыгаешь в пылающий район, где начинается охота на оператора «Блэкаута».",
      imageUrl: "/uploads/seed/net-01.jpg",
      panelImageUrls: [
        "/uploads/seed/net-01.jpg",
        "/uploads/seed/net-01.jpg",
        "/uploads/seed/net-02.jpg",
        "/uploads/seed/net-03.jpg"
      ],
      sketchPrompt: "golden age superhero opening splash page, city-wide emergency, dramatic perspective, print comic style",
      transitionStyle: TransitionStyle.PAGE_FLIP,
      position: 1,
      isStart: true
    },
    {
      pageKey: "theatre",
      title: "Страница 2: Падение над кварталом",
      body:
        "На второй странице враг бьёт по транспорту: грузовик с генераторами падает на перекрёсток, отрезая путь спасателям.\n---\nSentinel врезается в центр схватки и видит, что атака — лишь отвлекающий манёвр.\n---\nВ дыму появляется посланник культа и запускает маяк призыва существ из разлома.\n---\nГерой успевает сорвать маяк, но получает координаты следующей точки: старый док.",
      imageUrl: "/uploads/seed/net-02.jpg",
      panelImageUrls: [
        "/uploads/seed/net-02.jpg",
        "/uploads/seed/net-03.jpg",
        "/uploads/seed/net-04.jpg",
        "/uploads/seed/net-02.jpg"
      ],
      sketchPrompt: "golden age superhero city combat, collapsing vehicle, pulpy action cover composition",
      transitionStyle: TransitionStyle.WHIP_PAN,
      position: 2
    },
    {
      pageKey: "chase",
      title: "Страница 3: Удар в доках",
      body:
        "Доки охвачены дракой: контрабандисты культа пытаются вывезти ядро портала за пределы города.\n---\nSentinel сбивает охрану и в рукопашной вырывает контейнер с энергетической матрицей.\n---\nИз раскрытого контейнера вырывается импульс и на мгновение глушит всю связь.\n---\nНа внутренней панели матрицы найден шифр доступа к катакомбам под мэрией.",
      imageUrl: "/uploads/seed/net-03.jpg",
      panelImageUrls: [
        "/uploads/seed/net-03.jpg",
        "/uploads/seed/net-03.jpg",
        "/uploads/seed/net-04.jpg",
        "/uploads/seed/net-05.jpg"
      ],
      sketchPrompt: "retro superhero dock battle cover, close combat, explosive pulp colors",
      transitionStyle: TransitionStyle.SLIDE_LEFT,
      position: 3
    },
    {
      pageKey: "archive",
      title: "Страница 4: Катакомбы тьмы",
      body:
        "Под мэрией открывается древний зал: культ хранит там ритуальные артефакты и карту разломов.\n---\nНа героя нападают костяные стражи, удерживая его до завершения ритуала призыва.\n---\nSentinel уничтожает алтарный кристалл, но скелетный жрец успевает открыть малый портал.\n---\nИз разлома слышен голос Архонта Бездны — настоящего хозяина операции.",
      imageUrl: "/uploads/seed/net-04.jpg",
      panelImageUrls: [
        "/uploads/seed/net-04.jpg",
        "/uploads/seed/net-05.jpg",
        "/uploads/seed/net-06.jpg",
        "/uploads/seed/net-04.jpg"
      ],
      sketchPrompt: "classic comic catacomb confrontation, skeleton cult, supernatural action",
      transitionStyle: TransitionStyle.INK_BLEED,
      position: 4
    },
    {
      pageKey: "dock",
      title: "Страница 5: Ночь мертвецов",
      body:
        "Пятый разворот превращается в кошмар: по улицам и тоннелям прорываются ожившие воины культа.\n---\nГорожане заперты в укрытиях, и Sentinel ведёт бой на нескольких уровнях сразу.\n---\nСоюзники держат периметр, пока герой пробивается к носителю главной печати.\n---\nПеред уничтожением печать передаёт координаты: центральный реактор и купол над ним.",
      imageUrl: "/uploads/seed/net-05.jpg",
      panelImageUrls: [
        "/uploads/seed/net-05.jpg",
        "/uploads/seed/net-05.jpg",
        "/uploads/seed/net-06.jpg",
        "/uploads/seed/net-07.jpg"
      ],
      sketchPrompt: "golden age horror-superhero crossover page, undead invasion, high contrast pulp inks",
      transitionStyle: TransitionStyle.GLITCH_CUT,
      position: 5
    },
    {
      pageKey: "switchboard",
      title: "Страница 6: Механический шторм",
      body:
        "У реактора появляется боевая платформа: культ активирует механического «Паука-стража».\n---\nSentinel прикрывает раненых и ведёт огонь по узлам машины, пытаясь остановить заряд ядра.\n---\nВ момент перегрузки платформа взрывается, но открывает путь к главному шлюзу портала.\n---\nГород получает шанс, однако Архонт начинает финальный ритуал.",
      imageUrl: "/uploads/seed/net-06.jpg",
      panelImageUrls: [
        "/uploads/seed/net-06.jpg",
        "/uploads/seed/net-06.jpg",
        "/uploads/seed/net-07.jpg",
        "/uploads/seed/net-08.jpg"
      ],
      sketchPrompt: "vintage comic mech battle, giant robot spider, reactor city backdrop",
      transitionStyle: TransitionStyle.PARALLAX_SWEEP,
      position: 6
    },
    {
      pageKey: "lab",
      title: "Страница 7: Штурм купола",
      body:
        "Внутри купола портала начинается космический кошмар: из бездны рвутся новые твари и ударные волны.\n---\nSentinel с командой прорывается к ядру, сдерживая наступление межзвёздных хищников.\n---\nТехнический офицер запускает обратный импульс, но для завершения нужен ручной триггер.\n---\nГерой добровольно остаётся у ядра, чтобы закрыть проход изнутри.",
      imageUrl: "/uploads/seed/net-07.jpg",
      panelImageUrls: [
        "/uploads/seed/net-07.jpg",
        "/uploads/seed/net-08.jpg",
        "/uploads/seed/net-07.jpg",
        "/uploads/seed/net-08.jpg"
      ],
      sketchPrompt: "space-age superhero battle page, alien beasts, reactor core and portal energy",
      transitionStyle: TransitionStyle.ZOOM,
      position: 7
    },
    {
      pageKey: "clocktower",
      title: "Страница 8: Последний импульс",
      body:
        "Финальная страница: Sentinel активирует ручной триггер и запечатывает портал серией импульсных взрывов.\n---\nКульт распадается, а монстры исчезают в collapsing-разломе вместе с их Архонтом.\n---\nГерой успевает выйти из зоны детонации и передаёт в эфир доказательства заговора элит.\n---\nНеон-Сити возвращает свет, а выпуск заканчивается тизером: «Разлом не мёртв — он спит».",
      imageUrl: "/uploads/seed/net-08.jpg",
      panelImageUrls: [
        "/uploads/seed/net-08.jpg",
        "/uploads/seed/net-07.jpg",
        "/uploads/seed/net-06.jpg",
        "/uploads/seed/net-01.jpg"
      ],
      sketchPrompt: "grand finale superhero comic cover, portal collapse, city restored, dramatic epilogue",
      transitionStyle: TransitionStyle.PAGE_FLIP,
      position: 8
    }
  ];

  const createdPages = await Promise.all(
    pagesData.map((page) =>
      prisma.comicPage.create({
        data: {
          comicId: comic.id,
          pageKey: page.pageKey,
          title: page.title,
          body: page.body,
          imageUrl: page.imageUrl,
          panelImageUrls: page.panelImageUrls,
          sketchPrompt: page.sketchPrompt,
          transitionStyle: page.transitionStyle,
          position: page.position,
          isStart: Boolean(page.isStart)
        }
      })
    )
  );

  const pageByKey = new Map(createdPages.map((page) => [page.pageKey, page.id]));

  await prisma.comicChoice.createMany({
    data: [
      { pageId: pageByKey.get("start")!, label: "Ударить по упавшему сектору", targetPageId: pageByKey.get("theatre")! },
      { pageId: pageByKey.get("start")!, label: "Преследовать оператора сигнала", targetPageId: pageByKey.get("chase")! },

      { pageId: pageByKey.get("theatre")!, label: "Искать след культа в катакомбах", targetPageId: pageByKey.get("archive")! },
      { pageId: pageByKey.get("theatre")!, label: "Проверить доки немедленно", targetPageId: pageByKey.get("chase")! },

      { pageId: pageByKey.get("chase")!, label: "Штурмовать главный док", targetPageId: pageByKey.get("dock")! },
      { pageId: pageByKey.get("chase")!, label: "Взломать шифр и идти под мэрию", targetPageId: pageByKey.get("archive")! },

      { pageId: pageByKey.get("archive")!, label: "Гасить вспышку мертвецов", targetPageId: pageByKey.get("switchboard")! },
      { pageId: pageByKey.get("archive")!, label: "Сорвать ритуал в реакторе", targetPageId: pageByKey.get("lab")! },

      { pageId: pageByKey.get("dock")!, label: "Спасти раненых и держать периметр", targetPageId: pageByKey.get("switchboard")! },
      { pageId: pageByKey.get("dock")!, label: "Прорыв прямо к куполу", targetPageId: pageByKey.get("lab")! },

      { pageId: pageByKey.get("switchboard")!, label: "Бить по мех-стражу в лоб", targetPageId: pageByKey.get("clocktower")! },
      { pageId: pageByKey.get("switchboard")!, label: "Обойти через аварийный шлюз", targetPageId: pageByKey.get("clocktower")! },

      { pageId: pageByKey.get("lab")!, label: "Закрыть портал ручным триггером", targetPageId: pageByKey.get("clocktower")! },
      { pageId: pageByKey.get("lab")!, label: "Дать команде время на отход", targetPageId: pageByKey.get("clocktower")! }
    ]
  });

  await prisma.comicBookmark.upsert({
    where: {
      userId_comicId: {
        userId: reader.id,
        comicId: comic.id
      }
    },
    update: {},
    create: {
      userId: reader.id,
      comicId: comic.id
    }
  });

  const batmanSlug = "batman";
  const existingBatmanComic = await prisma.comic.findUnique({
    where: { slug: batmanSlug },
    include: { pages: true }
  });

  if (existingBatmanComic) {
    await prisma.comicChoice.deleteMany({
      where: { pageId: { in: existingBatmanComic.pages.map((page) => page.id) } }
    });
    await prisma.comicPage.deleteMany({ where: { comicId: existingBatmanComic.id } });
  }

  const batmanComic = await prisma.comic.upsert({
    where: { slug: batmanSlug },
    update: {
      title: "Бэтмен: Ночь Часовой Башни",
      summary:
        "8-страничный интерактивный выпуск: серия поджогов в Ист-Энде, охота на лидера банды и финальный выбор в сердце Готэма.",
      script:
        "Готэм захлёбывается в ночи: по городу одновременно вспыхивают пожары, исчезают свидетели и запускается схема шантажа мэрии. Бэтмен и Гордон распутывают цепочку, ведущую к Часовой Башне, где готовится последняя фаза операции.",
      status: ComicStatus.PUBLISHED,
      coverImageUrl: BATMAN_COMIC_IMAGES.detective27,
      authorId: author.id
    },
    create: {
      slug: batmanSlug,
      title: "Бэтмен: Ночь Часовой Башни",
      summary:
        "8-страничный интерактивный выпуск: серия поджогов в Ист-Энде, охота на лидера банды и финальный выбор в сердце Готэма.",
      script:
        "Готэм захлёбывается в ночи: по городу одновременно вспыхивают пожары, исчезают свидетели и запускается схема шантажа мэрии. Бэтмен и Гордон распутывают цепочку, ведущую к Часовой Башне, где готовится последняя фаза операции.",
      status: ComicStatus.PUBLISHED,
      coverImageUrl: BATMAN_COMIC_IMAGES.detective27,
      authorId: author.id
    }
  });

  const batmanPagesData: SeedPage[] = [
    {
      pageKey: "gotham-signal",
      title: "Страница 1: Сигнал над Готэмом",
      body:
        "Над полицейским управлением зажигается прожектор: над городом снова вспыхнул символ летучей мыши.\n---\nГордон передаёт: в Ист-Энде одновременно подожжены три склада, а камеры отключены одним и тем же кодом.\n---\nНа крышах слышны выстрелы и треск рации: неизвестные уводят свидетеля в район старого метро.\n---\nБэтмен стартует с гаргульи собора и выбирает первый маршрут охоты.",
      imageUrl: BATMAN_COMIC_IMAGES.yearOne,
      panelImageUrls: [
        BATMAN_COMIC_IMAGES.yearOne,
        BATMAN_COMIC_IMAGES.detective27,
        BATMAN_COMIC_IMAGES.longHalloween,
        BATMAN_COMIC_IMAGES.hush
      ],
      sketchPrompt: "batman comic opening, rooftop signal, rain and noir city lighting, cinematic comic page",
      transitionStyle: TransitionStyle.PAGE_FLIP,
      position: 1,
      isStart: true
    },
    {
      pageKey: "east-end",
      title: "Страница 2: Пожар в Ист-Энде",
      body:
        "Промзона горит, а пожарные не могут пробиться из-за перекрытых улиц и ложных вызовов.\n---\nБэтмен вытаскивает рабочих из ангара и находит в пепле военный детонатор с меткой «VT-9».\n---\nНа соседней крыше снайпер прикрывает отход поджигателей и сбрасывает дымовые гранаты.\n---\nЧерез тепловизор виден маршрут фургона: он уходит к докам Бристоля.",
      imageUrl: BATMAN_COMIC_IMAGES.longHalloween,
      panelImageUrls: [
        BATMAN_COMIC_IMAGES.longHalloween,
        BATMAN_COMIC_IMAGES.hush,
        BATMAN_COMIC_IMAGES.yearOne,
        BATMAN_COMIC_IMAGES.killingJoke
      ],
      sketchPrompt: "batman comic industrial fire scene, emergency response, gritty inks and dramatic shadows",
      transitionStyle: TransitionStyle.WHIP_PAN,
      position: 2
    },
    {
      pageKey: "subway-trace",
      title: "Страница 3: След в подземке",
      body:
        "В заброшенном метро на стенах нанесены карты вентиляции и тайминг новых поджогов.\n---\nБэтмен перехватывает курьера банды и узнаёт имя связного: инженер по прозвищу Чертёжник.\n---\nС потолка падает ловушка с токопроводящей сетью, отключающей гаджеты на несколько секунд.\n---\nНа терминале остаётся координата тайной мастерской у Часовой Башни.",
      imageUrl: BATMAN_COMIC_IMAGES.hush,
      panelImageUrls: [
        BATMAN_COMIC_IMAGES.hush,
        BATMAN_COMIC_IMAGES.killingJoke,
        BATMAN_COMIC_IMAGES.yearOne,
        BATMAN_COMIC_IMAGES.detective27
      ],
      sketchPrompt: "batman detective sequence in old subway tunnels, noir atmosphere, tactical traps",
      transitionStyle: TransitionStyle.INK_BLEED,
      position: 3
    },
    {
      pageKey: "docks-ambush",
      title: "Страница 4: Засада в доках",
      body:
        "У причалов Бристоля банда перегружает канистры с ускорителем горения в бронированный катер.\n---\nБэтмен срывает прожектор и выходит в ближний бой, пока Кошка крадёт журнал поставок.\n---\nВ журнале указаны платежи чиновникам и дата финальной фазы операции.\n---\nПеред отходом враги запускают дрон-камикадзе в сторону жилого квартала.",
      imageUrl: BATMAN_COMIC_IMAGES.killingJoke,
      panelImageUrls: [
        BATMAN_COMIC_IMAGES.killingJoke,
        BATMAN_COMIC_IMAGES.hush,
        BATMAN_COMIC_IMAGES.longHalloween,
        BATMAN_COMIC_IMAGES.detective27
      ],
      sketchPrompt: "batman comic dock ambush, smoke, close combat, moody city reflections on water",
      transitionStyle: TransitionStyle.SLIDE_LEFT,
      position: 4
    },
    {
      pageKey: "clocktower-files",
      title: "Страница 5: Архив Башни",
      body:
        "Внутри Часовой Башни спрятан архив с чертежами городских магистралей и пожарной автоматики.\n---\nБэтмен взламывает сервер и видит: поджоги должны открыть путь к хранилищу у мэрии.\n---\nПоявляется Чертёжник и предлагает сделку: отдать данные в обмен на защиту от заказчика.\n---\nОт решения зависит, будет ли у тебя прямой доступ к главному пульту атаки.",
      imageUrl: BATMAN_COMIC_IMAGES.detective27,
      panelImageUrls: [
        BATMAN_COMIC_IMAGES.detective27,
        BATMAN_COMIC_IMAGES.yearOne,
        BATMAN_COMIC_IMAGES.hush,
        BATMAN_COMIC_IMAGES.killingJoke
      ],
      sketchPrompt: "batman noir investigation in clocktower control room, terminal glow, dramatic paneling",
      transitionStyle: TransitionStyle.VERTICAL_REVEAL,
      position: 5
    },
    {
      pageKey: "city-blackout",
      title: "Страница 6: Блэкаут Готэма",
      body:
        "В полночь часть города уходит во тьму: подстанции отключаются цепной реакцией.\n---\nБэтмен координирует эвакуацию через Гордона и одновременно отбивает штурм у резервного генератора.\n---\nНа крыше мэрии активируется ретранслятор, который может вырубить связь во всём округе.\n---\nОстаётся один рывок: штурм башни или перехват ретранслятора на высоте.",
      imageUrl: BATMAN_COMIC_IMAGES.hush,
      panelImageUrls: [
        BATMAN_COMIC_IMAGES.hush,
        BATMAN_COMIC_IMAGES.longHalloween,
        BATMAN_COMIC_IMAGES.killingJoke,
        BATMAN_COMIC_IMAGES.yearOne
      ],
      sketchPrompt: "batman citywide blackout sequence, emergency command, rooftop assault, comic noir tone",
      transitionStyle: TransitionStyle.GLITCH_CUT,
      position: 6
    },
    {
      pageKey: "tower-assault",
      title: "Страница 7: Штурм шпиля",
      body:
        "Шпиль башни превращён в крепость: турели, растяжки и дистанционный пульт подрыва.\n---\nБэтмен поднимается по внешним балкам под дождём, избегая перекрёстного огня.\n---\nНа верхней платформе заказчик раскрывается: за операцией стоит советник мэра, управляющий кризисом ради власти.\n---\nПульт уже запущен, и у героя есть секунды до тотального обвала системы.",
      imageUrl: BATMAN_COMIC_IMAGES.yearOne,
      panelImageUrls: [
        BATMAN_COMIC_IMAGES.yearOne,
        BATMAN_COMIC_IMAGES.hush,
        BATMAN_COMIC_IMAGES.detective27,
        BATMAN_COMIC_IMAGES.longHalloween
      ],
      sketchPrompt: "batman rooftop storm assault, mechanical traps, dramatic vertical composition, comic style",
      transitionStyle: TransitionStyle.PARALLAX_SWEEP,
      position: 7
    },
    {
      pageKey: "gotham-dawn",
      title: "Страница 8: Рассвет над Готэмом",
      body:
        "Бэтмен перехватывает сигнал, отключает подрыв и отправляет доказательства в эфир всех новостных каналов.\n---\nСеть постепенно возвращается, а пожарные добивают последние очаги в Ист-Энде.\n---\nГордон получает признания задержанных: операция длилась месяцы и затрагивала верхушку администрации.\n---\nНа последнем кадре Бэтмен исчезает в дымке рассвета, оставляя Готэму шанс на новую ночь без страха.",
      imageUrl: BATMAN_COMIC_IMAGES.detective27,
      panelImageUrls: [
        BATMAN_COMIC_IMAGES.detective27,
        BATMAN_COMIC_IMAGES.yearOne,
        BATMAN_COMIC_IMAGES.longHalloween,
        BATMAN_COMIC_IMAGES.hush
      ],
      sketchPrompt: "batman comic finale at dawn, justice broadcast, noir epilogue, cinematic final page",
      transitionStyle: TransitionStyle.PAGE_FLIP,
      position: 8
    }
  ];

  const createdBatmanPages = await Promise.all(
    batmanPagesData.map((page) =>
      prisma.comicPage.create({
        data: {
          comicId: batmanComic.id,
          pageKey: page.pageKey,
          title: page.title,
          body: page.body,
          imageUrl: page.imageUrl,
          panelImageUrls: page.panelImageUrls,
          sketchPrompt: page.sketchPrompt,
          transitionStyle: page.transitionStyle,
          position: page.position,
          isStart: Boolean(page.isStart)
        }
      })
    )
  );

  const batmanPageByKey = new Map(createdBatmanPages.map((page) => [page.pageKey, page.id]));

  await prisma.comicChoice.createMany({
    data: [
      { pageId: batmanPageByKey.get("gotham-signal")!, label: "Лететь на пожар в Ист-Энд", targetPageId: batmanPageByKey.get("east-end")! },
      { pageId: batmanPageByKey.get("gotham-signal")!, label: "Спуститься в заброшенное метро", targetPageId: batmanPageByKey.get("subway-trace")! },

      { pageId: batmanPageByKey.get("east-end")!, label: "Преследовать фургон к докам", targetPageId: batmanPageByKey.get("docks-ambush")! },
      { pageId: batmanPageByKey.get("east-end")!, label: "Искать центр управления в башне", targetPageId: batmanPageByKey.get("clocktower-files")! },

      { pageId: batmanPageByKey.get("subway-trace")!, label: "Сразу штурмовать башню", targetPageId: batmanPageByKey.get("clocktower-files")! },
      { pageId: batmanPageByKey.get("subway-trace")!, label: "Проверить поставки в доках", targetPageId: batmanPageByKey.get("docks-ambush")! },

      { pageId: batmanPageByKey.get("docks-ambush")!, label: "Передать улики Гордону", targetPageId: batmanPageByKey.get("city-blackout")! },
      { pageId: batmanPageByKey.get("docks-ambush")!, label: "Идти по следу Чертёжника", targetPageId: batmanPageByKey.get("clocktower-files")! },

      { pageId: batmanPageByKey.get("clocktower-files")!, label: "Остановить блэкаут в городе", targetPageId: batmanPageByKey.get("city-blackout")! },
      { pageId: batmanPageByKey.get("clocktower-files")!, label: "Подняться на шпиль немедленно", targetPageId: batmanPageByKey.get("tower-assault")! },

      { pageId: batmanPageByKey.get("city-blackout")!, label: "Штурм через крышу мэрии", targetPageId: batmanPageByKey.get("tower-assault")! },
      { pageId: batmanPageByKey.get("city-blackout")!, label: "Отвлечь турели и обойти снизу", targetPageId: batmanPageByKey.get("tower-assault")! },

      { pageId: batmanPageByKey.get("tower-assault")!, label: "Отключить пульт и дать эфир", targetPageId: batmanPageByKey.get("gotham-dawn")! },
      { pageId: batmanPageByKey.get("tower-assault")!, label: "Спасти городскую сеть любой ценой", targetPageId: batmanPageByKey.get("gotham-dawn")! }
    ]
  });

  await prisma.comicBookmark.upsert({
    where: {
      userId_comicId: {
        userId: reader.id,
        comicId: batmanComic.id
      }
    },
    update: {},
    create: {
      userId: reader.id,
      comicId: batmanComic.id
    }
  });

  console.log("Seed completed", {
    author: author.email,
    reader: reader.email,
    comic: comic.slug,
    pages: pagesData.length,
    batmanComic: batmanComic.slug,
    batmanPages: batmanPagesData.length
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
