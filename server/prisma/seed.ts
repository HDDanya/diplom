import bcrypt from "bcryptjs";
import { PrismaClient, ComicStatus, TransitionStyle } from "@prisma/client";

const prisma = new PrismaClient();

type SeedPage = {
  pageKey: string;
  title: string;
  body: string;
  imageUrl: string;
  sketchPrompt: string;
  transitionStyle: TransitionStyle;
  position: number;
  isStart?: boolean;
};

async function main() {
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
      title: "City Of Ink",
      summary:
        "Масштабный интерактивный нуар о заговоре в мегаполисе: подпольные лаборатории, радиошифры, речной порт и финал на башне часов.",
      script:
        "Серия исчезновений в городе приводит героя к тайной организации Black Vellum. Через театр, архив, порт и лабораторию читатель выбирает, кого спасать, кого преследовать и какое доказательство раскрыть в финале.",
      status: ComicStatus.PUBLISHED,
      coverImageUrl: "/uploads/seed/city-cover.svg",
      authorId: author.id
    },
    create: {
      slug: comicSlug,
      title: "City Of Ink",
      summary:
        "Масштабный интерактивный нуар о заговоре в мегаполисе: подпольные лаборатории, радиошифры, речной порт и финал на башне часов.",
      script:
        "Серия исчезновений в городе приводит героя к тайной организации Black Vellum. Через театр, архив, порт и лабораторию читатель выбирает, кого спасать, кого преследовать и какое доказательство раскрыть в финале.",
      status: ComicStatus.PUBLISHED,
      coverImageUrl: "/uploads/seed/city-cover.svg",
      authorId: author.id
    }
  });

  const pagesData: SeedPage[] = [
    {
      pageKey: "start",
      title: "Ночной переулок",
      body:
        "Ты выходишь из тумана и видишь на стене символ Black Vellum.\n---\nПод ногами — мокрая записка с адресом старого театра и временем встречи.\n---\nНа крыше мелькает силуэт наблюдателя.\n---\nДежурный на рации шепчет: 'Выбирай быстро, за тобой уже идут'.",
      imageUrl: "/uploads/seed/page-01.svg",
      sketchPrompt: "Noir city alley, heavy rain, black and white comic line art",
      transitionStyle: TransitionStyle.SLIDE_LEFT,
      position: 1,
      isStart: true
    },
    {
      pageKey: "theatre",
      title: "Старый театр",
      body:
        "Сцена покрыта пылью, но проектор включается сам и показывает лица пропавших.\n---\nВ ложах сидят манекены в масках, направленные в центр сцены.\n---\nЗа кулисами найден чемодан с шифрами радиоперехвата.\n---\nОдин из кодов совпадает с меткой из переулка.",
      imageUrl: "/uploads/seed/page-02.svg",
      sketchPrompt: "abandoned theatre interior, noir composition",
      transitionStyle: TransitionStyle.FADE,
      position: 2
    },
    {
      pageKey: "chase",
      title: "Погоня по кварталам",
      body:
        "Ты бросаешься за неизвестным через пожарные лестницы и мокрые крыши.\n---\nНа повороте он роняет жетон с номером дока и эмблемой якоря.\n---\nСирены приближаются, а переулки закрываются патрулями.\n---\nТы можешь сорваться в порт или вернуться с уликами в театр.",
      imageUrl: "/uploads/seed/page-03.svg",
      sketchPrompt: "rain chase sequence, dynamic perspective, comic panels",
      transitionStyle: TransitionStyle.SLIDE_RIGHT,
      position: 3
    },
    {
      pageKey: "archive",
      title: "Городской архив",
      body:
        "В архиве находишь дела о закрытых экспериментах Black Vellum тридцатилетней давности.\n---\nНа схемах отмечены: речной док, башня часов и подземная лаборатория.\n---\nСреди бумаг — фото твоего наставника, считавшегося погибшим.\n---\nКто-то вырвал последние страницы прямо перед твоим приходом.",
      imageUrl: "/uploads/seed/page-04.svg",
      sketchPrompt: "investigation archive room, dense noir hatching",
      transitionStyle: TransitionStyle.ZOOM,
      position: 4
    },
    {
      pageKey: "dock",
      title: "Речной порт",
      body:
        "В тумане видны контейнеры с маркировкой медицинского оборудования.\n---\nВ одном контейнере — камеры для удержания людей и журналы поставок.\n---\nКонтрабандисты готовят отправку по ночному каналу.\n---\nУ тебя есть шанс сорвать операцию или проследить до главного заказчика.",
      imageUrl: "/uploads/seed/page-05.svg",
      sketchPrompt: "noir harbor docks, sharp shadows, gritty linework",
      transitionStyle: TransitionStyle.SLIDE_LEFT,
      position: 5
    },
    {
      pageKey: "switchboard",
      title: "Комната коммутатора",
      body:
        "Старый телефонный щит оживает, когда ты подаёшь питание от аварийной линии.\n---\nКаждый кабель подписан именами чиновников и крупных инвесторов.\n---\nТы слышишь в наушниках приказ: 'Активировать башню в 23:40'.\n---\nУ тебя есть доказательство заговора, но времени мало.",
      imageUrl: "/uploads/seed/page-06.svg",
      sketchPrompt: "retro switchboard room, detective noir texture",
      transitionStyle: TransitionStyle.FADE,
      position: 6
    },
    {
      pageKey: "lab",
      title: "Подземная лаборатория",
      body:
        "Под старой электростанцией скрыта лаборатория по подавлению памяти свидетелей.\n---\nВ капсулах — люди, которых ты считал исчезнувшими без следа.\n---\nЗапуск протокола можно остановить, но это выдаст твоё присутствие.\n---\nИли можно скопировать архив и уйти незамеченным.",
      imageUrl: "/uploads/seed/page-07.svg",
      sketchPrompt: "secret underground lab, monochrome sci-noir",
      transitionStyle: TransitionStyle.SLIDE_RIGHT,
      position: 7
    },
    {
      pageKey: "clocktower",
      title: "Башня часов",
      body:
        "На вершине башни лидер Black Vellum ждёт тебя с пультом аварийной передачи.\n---\nСигнал может стереть улики по всему городу, если ты опоздаешь на минуту.\n---\nВыбор финала: публично разоблачить сеть или обменять доказательства на освобождение заложников.\n---\nОт твоего решения зависит, кем город запомнит героя этой ночи.",
      imageUrl: "/uploads/seed/page-08.svg",
      sketchPrompt: "clock tower showdown, epic noir finale",
      transitionStyle: TransitionStyle.ZOOM,
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
      { pageId: pageByKey.get("start")!, label: "Идти в театр", targetPageId: pageByKey.get("theatre")! },
      { pageId: pageByKey.get("start")!, label: "Погнаться за силуэтом", targetPageId: pageByKey.get("chase")! },

      { pageId: pageByKey.get("theatre")!, label: "Расшифровать чемодан", targetPageId: pageByKey.get("archive")! },
      { pageId: pageByKey.get("theatre")!, label: "Срезать путь через кварталы", targetPageId: pageByKey.get("chase")! },

      { pageId: pageByKey.get("chase")!, label: "Следовать к речному доку", targetPageId: pageByKey.get("dock")! },
      { pageId: pageByKey.get("chase")!, label: "Вернуться с жетоном в архив", targetPageId: pageByKey.get("archive")! },

      { pageId: pageByKey.get("archive")!, label: "Проверить коммутатор", targetPageId: pageByKey.get("switchboard")! },
      { pageId: pageByKey.get("archive")!, label: "Спуститься в лабораторию", targetPageId: pageByKey.get("lab")! },

      { pageId: pageByKey.get("dock")!, label: "Захватить журнал поставок", targetPageId: pageByKey.get("switchboard")! },
      { pageId: pageByKey.get("dock")!, label: "Проследить маршрут контейнеров", targetPageId: pageByKey.get("lab")! },

      { pageId: pageByKey.get("switchboard")!, label: "Передать данные в прессу", targetPageId: pageByKey.get("clocktower")! },
      { pageId: pageByKey.get("switchboard")!, label: "Отключить сеть вручную", targetPageId: pageByKey.get("clocktower")! },

      { pageId: pageByKey.get("lab")!, label: "Освободить заложников сразу", targetPageId: pageByKey.get("clocktower")! },
      { pageId: pageByKey.get("lab")!, label: "Скопировать архив экспериментов", targetPageId: pageByKey.get("clocktower")! }
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

  console.log("Seed completed", {
    author: author.email,
    reader: reader.email,
    comic: comic.slug,
    pages: pagesData.length
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
