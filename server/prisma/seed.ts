import bcrypt from "bcryptjs";
import { ComicStatus, PrismaClient, TransitionStyle } from "@prisma/client";

const prisma = new PrismaClient();

export type ComicSeed = {
  slug: string;
  title: string;
  summary: string;
  script: string;
  coverImageUrl: string;
  assetDirectory: string;
  hero: string;
  threat: string;
  artifact: string;
  locations: string[];
  visualPrompt?: string;
  pageTitles?: string[];
  pageBodies?: string[];
  finalChoiceLabels?: [string, string, string, string];
};

function buildImageSet(assetDirectory: string) {
  return Array.from(
    { length: 17 },
    (_, index) => `/uploads/seed/comics/${assetDirectory}/page-${String(index + 1).padStart(2, "0")}.jpg`
  );
}

const TRANSITIONS: TransitionStyle[] = [
  TransitionStyle.PAGE_FLIP,
  TransitionStyle.WHIP_PAN,
  TransitionStyle.INK_BLEED,
  TransitionStyle.PARALLAX_SWEEP,
  TransitionStyle.GLITCH_CUT,
  TransitionStyle.ROTATE_IN,
  TransitionStyle.BLUR_DISSOLVE,
  TransitionStyle.SHUTTER,
  TransitionStyle.RIPPLE,
  TransitionStyle.FLASH,
  TransitionStyle.PANEL_STAGGER,
  TransitionStyle.COMIC_BURST,
  TransitionStyle.TILT_DROP,
  TransitionStyle.CURTAIN,
  TransitionStyle.FOCUS_PULL
];

const BATMAN_PAGE_TITLES = [
  "Сигнал без летучей мыши",
  "Три преступления за минуту",
  "След на пристани",
  "Шифр старого метро",
  "Предложение Селины",
  "Архив Wayne Enterprises",
  "Оракул отключена",
  "Часовщик",
  "Гордон под подозрением",
  "Штурм башни",
  "Выбор для Готэма",
  "Правда под маской",
  "Последняя минута",
  "Финал: правда в эфире",
  "Финал: спасённые заложники",
  "Финал: союз с Женщиной-кошкой",
  "Финал: вина Тёмного рыцаря"
];

const BATMAN_PAGE_BODIES = [
  "Над Готэмом не зажигается привычный сигнал, но Бэтмен получает сообщение на закрытой частоте.\n---\nНеизвестный обещает одновременно раскрыть личности коррумпированных чиновников и уничтожить городскую сеть.\n---\nГордон сообщает о трёх связанных преступлениях.\n---\nПервый выбор определяет, какую улику герой получит раньше остальных.",
  "В Ист-Энде исчезает инженер энергосети, а на мосту находят устройство с символом остановленных часов.\n---\nБэтмен спасает свидетеля и получает координаты пристани.\n---\nВ это же время Оракул фиксирует взлом серверов Wayne Enterprises.\n---\nГерой выбирает между погоней и защитой данных.",
  "На пристани контрабандисты перегружают детали старых городских часов в бронированный фургон.\n---\nБэтмен находит внутри механизма карту подземных коммуникаций.\n---\nЖенщина-кошка забирает один из ключей и предлагает обмен.\n---\nСлед ведёт к метро и закрытому архиву семьи Уэйн.",
  "В заброшенном метро работает передатчик, повторяющий голос пропавшего инженера.\n---\nЗа стеной спрятан пульт, способный остановить транспорт по всему Готэму.\n---\nОракул предупреждает, что сигнал является отвлекающим манёвром.\n---\nБэтмен решает отключить пульт или использовать его для поиска главного узла.",
  "Селина показывает список покупателей технологий Wayne Enterprises.\n---\nСреди имён есть помощник мэра и руководитель городской безопасности.\n---\nОна требует удалить собственное имя из архива в обмен на полный ключ.\n---\nДоверие к ней меняет доступные маршруты расследования.",
  "В корпоративном архиве Брюс находит проект резервного управления Готэмом.\n---\nСистема создавалась для чрезвычайных ситуаций, но её можно превратить в цифровую диктатуру.\n---\nОдин из разработчиков подписывался псевдонимом Часовщик.\n---\nАрхив указывает на старую башню в центре города.",
  "Связь с Оракулом внезапно обрывается, а Бэткомпьютер получает поддельные координаты.\n---\nБэтмен понимает, что враг изучил его методы.\n---\nГордон предлагает полицейский канал, но тот может быть скомпрометирован.\n---\nНужно выбрать между открытым сотрудничеством и одиночной операцией.",
  "Часовщик выходит в эфир и обвиняет элиту Готэма в создании системы тотального контроля.\n---\nОн обещает передать доказательства, если Бэтмен позволит башне завершить отсчёт.\n---\nОднако отключение сети оставит больницы без резервного питания.\n---\nГерой начинает искать третий вариант.",
  "Поддельные документы указывают на Гордона как участника заговора.\n---\nБэтмен замечает несовпадение времени в цифровых подписях.\n---\nНастоящая улика спрятана в полицейском архиве, пока толпа требует ареста комиссара.\n---\nМожно защищать репутацию Гордона или немедленно идти к башне.",
  "Башня закрыта механическими шлюзами и автономными дронами.\n---\nСелина открывает путь через музейный уровень, полиция готовит штурм снизу.\n---\nКаждый маршрут спасает одну группу людей, но оставляет другую без защиты.\n---\nБэтмен распределяет союзников и поднимается к центральному пульту.",
  "Часовщик показывает четыре канала: доказательства коррупции, питание больниц, транспорт и личный архив Бэтмена.\n---\nОтключить всё сразу невозможно.\n---\nГордон, Оракул и Селина предлагают разные решения.\n---\nВыбор определяет не только судьбу города, но и доверие союзников.",
  "В личном архиве лежат записи, способные раскрыть связь Брюса Уэйна с Бэтменом.\n---\nИх публикация отвлечёт Часовщика, но навсегда изменит жизнь героя.\n---\nУничтожение архива сохранит тайну, но сотрёт часть доказательств.\n---\nБэтмен готовит финальный план.",
  "До завершения отсчёта остаётся одна минута.\n---\nБэтмен получает контроль только над двумя из четырёх каналов.\n---\nПоследнее решение зависит от собранных улик и союзников.\n---\nПеред читателем открываются четыре разных исхода.",
  "Оракул перехватывает эфир, а Бэтмен публикует проверенные доказательства коррупции.\n---\nГордон сохраняет контроль над городом и начинает аресты.\n---\nЧасовщик лишается поддержки, не успев отключить больницы.\n---\nГотэм узнаёт правду, а личность Бэтмена остаётся тайной.",
  "Бэтмен направляет всю мощность на спасение больниц и транспорта.\n---\nДоказательства исчезают вместе с сервером, а Часовщик уходит через аварийный тоннель.\n---\nТысячи людей спасены, но заговор остаётся без официального ответа.\n---\nГерой обещает продолжить расследование следующей ночью.",
  "Бэтмен доверяет Селине ключ и вместе с ней разделяет управление каналами.\n---\nОна сохраняет копию компромата, но помогает остановить отключение города.\n---\nЧасовщик арестован, а коррумпированные чиновники теряют влияние.\n---\nМежду Бэтменом и Женщиной-кошкой возникает хрупкий союз.",
  "Бэтмен публикует собственный архив и принимает на себя обвинения в незаконном контроле сети.\n---\nЧасовщик теряет главный рычаг давления, городская система остаётся в работе.\n---\nПолиция объявляет Тёмного рыцаря главным подозреваемым.\n---\nГотэм спасён, но Бэтмен снова становится беглецом."
];

const THE_BOYS_PAGE_TITLES = [
  "Идеальные герои Vought",
  "Посылка Бутчера",
  "Выбор Хьюи",
  "Утечка Старлайт",
  "Свидетель с трассы",
  "Закрытый объект",
  "Подозрение Хоумлендера",
  "План Мэллори",
  "Досье Райана",
  "Башня Семёрки",
  "Прямой эфир",
  "Архив Compound V",
  "Последняя сделка",
  "Финал: Vought разоблачена",
  "Финал: победа Бутчера",
  "Финал: новая Семёрка",
  "Финал: система выжила"
];

const THE_BOYS_PAGE_BODIES = [
  "Vought проводит презентацию новой программы безопасности и показывает Семёрку как безупречных защитников.\n---\nХьюи замечает в трансляции монтажный сбой и кадр закрытого лабораторного этажа.\n---\nСтарлайт тайно подтверждает, что компания скрывает новый эксперимент.\n---\nБутчер требует немедленно проникнуть в башню.",
  "Бутчер приносит носитель с частью внутренней переписки Vought.\n---\nДанные доказывают слежку за журналистами, но главный файл повреждён.\n---\nФренчи предлагает восстановить его, а ММ хочет сначала найти живого свидетеля.\n---\nКоманда делится на два маршрута.",
  "Хьюи должен решить, доверять ли плану Бутчера или предупредить Старлайт.\n---\nПервый вариант даёт скорость, второй открывает доступ к башне.\n---\nОба решения ставят отношения внутри команды под угрозу.\n---\nВыбор определяет, кто будет рядом в финале.",
  "Старлайт передаёт расписание закрытого заседания руководства Vought.\n---\nОна также находит список кандидатов для секретной программы Compound V.\n---\nВ списке есть подростки, чьи семьи ничего не знают.\n---\nНужно опубликовать часть данных или сохранить их ради полной операции.",
  "На загородной трассе команда находит бывшего курьера Vought.\n---\nОн видел перевозку контейнера из закрытого объекта и запомнил код доступа.\n---\nАгенты компании уже ищут свидетеля.\n---\nThe Boys выбирают эвакуацию или рискованный перехват груза.",
  "Закрытый объект выглядит как обычный медицинский центр.\n---\nВнутри хранятся записи испытаний и система удалённого контроля супергероев.\n---\nФренчи может скопировать архив, но это активирует тревогу.\n---\nКоманда решает забрать доказательства или вывести людей.",
  "Хоумлендер замечает несоответствие в отчётах и начинает искать источник утечки.\n---\nОн вызывает Старлайт на разговор и проверяет лояльность сотрудников.\n---\nХьюи может отвлечь внимание публичным заявлением.\n---\nБутчер предлагает использовать подозрение против руководства Vought.",
  "Мэллори предлагает передать архив государственному комитету до выхода в эфир.\n---\nБутчер считает комитет частью проблемы.\n---\nММ настаивает на проверке документов независимыми журналистами.\n---\nРешение определит, кому достанется контроль над доказательствами.",
  "В архиве появляется досье Райана и план использовать его как символ новой кампании.\n---\nБутчер воспринимает файл как возможность давления на Хоумлендера.\n---\nХьюи и Старлайт требуют защитить ребёнка от обеих сторон.\n---\nКоманда подходит к границе, после которой союз может распасться.",
  "The Boys входят в башню во время прямой трансляции Vought.\n---\nСтарлайт отключает часть камер, Френчи открывает технический этаж.\n---\nХоумлендер возвращается раньше расписания.\n---\nКоманда должна выбрать скрытый путь или публичное столкновение в эфире.",
  "Прямая трансляция переключается между речью руководства и украденными документами.\n---\nVought пытается объявить материалы подделкой.\n---\nНезависимый журналист готов подтвердить подписи, но требует время.\n---\nКаждый участник команды предлагает собственный способ удержать эфир.",
  "В архиве Compound V находится не только история экспериментов, но и список государственных партнёров.\n---\nПубликация всего массива может вызвать хаос и поставить свидетелей под угрозу.\n---\nЧастичная публикация позволит Vought уничтожить остаток.\n---\nКоманда должна определить допустимую цену правды.",
  "Руководство Vought предлагает сделку: безопасность свидетелей в обмен на молчание о части программы.\n---\nБутчер хочет использовать момент для окончательного удара по Хоумлендеру.\n---\nСтарлайт предлагает публичную реформу, а Хьюи настаивает на независимом расследовании.\n---\nОткрываются четыре финальных исхода.",
  "Хьюи, Старлайт и ММ передают проверенный архив нескольким независимым редакциям одновременно.\n---\nVought не успевает остановить публикацию, начинаются официальные расследования.\n---\nХоумлендер теряет поддержку руководства, но остаётся на свободе.\n---\nThe Boys выигрывают информационную войну и сохраняют команду.",
  "Бутчер использует архив как приманку и добивается личной победы над руководством Vought.\n---\nКомпания теряет главный объект и часть контроля над супергероями.\n---\nОднако Хьюи и ММ уходят, не приняв методы Бутчера.\n---\nВраг ослаблен, но The Boys больше не единая команда.",
  "Старлайт выходит в эфир, признаёт ошибки Семёрки и предлагает независимый надзор.\n---\nЧасть героев поддерживает её, сотрудники Vought передают новые документы.\n---\nКомпания сохраняется, но теряет монополию на правду.\n---\nНачинается медленная реформа, в которой The Boys становятся внешними наблюдателями.",
  "Команда принимает сделку ради безопасности свидетелей и Райана.\n---\nVought меняет руководство, удаляет часть архивов и публично отрицает системные нарушения.\n---\nThe Boys уходят в подполье с единственной сохранённой копией.\n---\nСистема переживает кризис, а новая операция начинается с нуля."
];

export const COMICS: ComicSeed[] = [
  {
    slug: "planet-comics-signal",
    title: "Planet Comics: Сигнал с мёртвой орбиты",
    summary: "Экспедиция ловит запрещённый сигнал и выбирает между спасением колонии, погоней за пиратами и тайной древнего маяка.",
    script: "Оригинальная интерактивная адаптация мотивов public-domain выпуска Planet Comics #1. 17 сцен, 9 ветвящихся узлов и 4 финала.",
    coverImageUrl: "/uploads/seed/comics/planet-01/page-01.jpg",
    assetDirectory: "planet-01",
    hero: "капитан разведывательного корабля Лира Вейн",
    threat: "рой автономных пиратских дронов",
    artifact: "кристалл звёздного маяка",
    locations: ["орбитальная станция", "мёртвая луна", "пиратский док", "древний маяк"]
  },
  {
    slug: "planet-comics-lunar",
    title: "Planet Comics: Луна без сигнала",
    summary: "Связь с лунной шахтой обрывается перед солнечной бурей, а спасательная команда обнаруживает под поверхностью чужой город.",
    script: "Оригинальная интерактивная адаптация визуальной темы Planet Comics. 17 сцен, 9 ветвящихся узлов и 4 финала.",
    coverImageUrl: "/uploads/seed/comics/planet-06/page-01.jpg",
    assetDirectory: "planet-06",
    hero: "инженер связи Марк Эллис",
    threat: "проснувшийся подземный механизм",
    artifact: "лунный резонатор",
    locations: ["лунная шахта", "ледяной тоннель", "подземный город", "аварийный шаттл"]
  },
  {
    slug: "planet-comics-orbit",
    title: "Planet Comics: Мятеж на орбите",
    summary: "На транспортном кольце начинается мятеж, и пилоту приходится решить, кому доверить управление защитой планеты.",
    script: "Оригинальная интерактивная история по мотивам public-domain обложки Planet Comics #3. 17 сцен и четыре финальных исхода.",
    coverImageUrl: "/uploads/seed/comics/planet-03/page-01.jpg",
    assetDirectory: "planet-03",
    hero: "пилот-перехватчик Джен Арк",
    threat: "заговор офицеров транспортного кольца",
    artifact: "ключ орбитальной обороны",
    locations: ["транспортное кольцо", "ангар перехватчиков", "командный мостик", "внешняя ферма"]
  },
  {
    slug: "planet-comics-dome",
    title: "Planet Comics: Город под куполом",
    summary: "Купол марсианского города теряет давление, пока два противоборствующих совета скрывают настоящую причину аварии.",
    script: "Интерактивная научно-фантастическая история, вдохновлённая public-domain выпуском Planet Comics #5.",
    coverImageUrl: "/uploads/seed/comics/planet-05/page-01.jpg",
    assetDirectory: "planet-05",
    hero: "следователь колонии Сая Норд",
    threat: "саботаж системы жизнеобеспечения",
    artifact: "архив климатического ядра",
    locations: ["городской купол", "красные каньоны", "климатический реактор", "совет колонии"]
  },
  {
    slug: "planet-comics-saturn",
    title: "Planet Comics: Пираты Сатурна",
    summary: "Конвой с лекарствами исчезает в кольцах Сатурна, оставляя капитану выбор между скрытностью и открытым боем.",
    script: "Оригинальная ветвящаяся история по мотивам public-domain обложки Planet Comics #11.",
    coverImageUrl: "/uploads/seed/comics/planet-11/page-01.jpg",
    assetDirectory: "planet-11",
    hero: "капитан конвоя Роу Кесс",
    threat: "флот ледяных пиратов",
    artifact: "контейнер с вакциной",
    locations: ["кольца Сатурна", "медицинский транспорт", "ледяная база", "грузовой шлюз"]
  },
  {
    slug: "planet-comics-colony",
    title: "Planet Comics: Последняя колония",
    summary: "Последняя земная колония принимает загадочных беженцев, за которыми следует оружие давно исчезнувшей цивилизации.",
    script: "Интерактивная история о доверии и выживании, вдохновлённая public-domain выпуском Planet Comics #12.",
    coverImageUrl: "/uploads/seed/comics/planet-12/page-01.jpg",
    assetDirectory: "planet-12",
    hero: "командир колонии Итан Рэй",
    threat: "автоматический крейсер древней цивилизации",
    artifact: "карта безопасных миров",
    locations: ["последняя колония", "пустынный космодром", "убежище беженцев", "древний крейсер"]
  },
  {
    slug: "planet-comics-nebula",
    title: "Planet Comics: Туман Андромеды",
    summary: "Научный корабль входит в туманность, где мысли экипажа превращаются в реальные угрозы и ложные маршруты.",
    script: "Психологическая космическая история по мотивам public-domain обложки Planet Comics #57.",
    coverImageUrl: "/uploads/seed/comics/planet-57/page-01.jpg",
    assetDirectory: "planet-57",
    hero: "астрофизик Мира Клайн",
    threat: "разумная туманность",
    artifact: "нейтринный компас",
    locations: ["край туманности", "научная палуба", "зеркальная планета", "центр облака"]
  },
  {
    slug: "planet-comics-archive",
    title: "Planet Comics: Архив звёзд",
    summary: "Археологи находят архив, способный переписать историю нескольких миров, но каждая открытая запись меняет настоящее.",
    script: "Интерактивное космическое приключение, вдохновлённое public-domain выпуском Planet Comics #69.",
    coverImageUrl: "/uploads/seed/comics/planet-69/page-01.jpg",
    assetDirectory: "planet-69",
    hero: "археолог Нора Сай",
    threat: "хранитель изменённой истории",
    artifact: "архив звёзд",
    locations: ["планета-архив", "зал хронологии", "обсерватория", "разрушенный портал"]
  },
  {
    slug: "planet-comics-first-expedition",
    title: "Planet Comics: Первая экспедиция",
    summary: "Первый межзвёздный экипаж обнаруживает, что точка назначения уже посещалась людьми за столетие до старта миссии.",
    script: "Оригинальная ветвящаяся история на основе high-resolution public-domain обложки Planet Comics #1.",
    coverImageUrl: "/uploads/seed/comics/planet-37/page-01.jpg",
    assetDirectory: "planet-37",
    hero: "штурман первой экспедиции Алекс Рид",
    threat: "двойник человеческой экспедиции",
    artifact: "капсула с земным гербом",
    locations: ["корабль первопроходцев", "чужая орбита", "заброшенный лагерь", "временной портал"]
  },
  {
    slug: "blue-beetle-midnight-code",
    title: "Blue Beetle: Код полуночи",
    summary: "Радиостанция мегаполиса передаёт код, подчиняющий городскую автоматику, и детективу нужно найти источник до полуночи.",
    script: "Самостоятельная интерактивная детективная история с public-domain обложкой Blue Beetle #1.",
    coverImageUrl: "/uploads/seed/comics/blue-beetle-21/page-01.jpg",
    assetDirectory: "blue-beetle-21",
    hero: "детектив в синей маске Дэн Гаррет",
    threat: "сеть радиоуправляемых автоматов",
    artifact: "полуночный шифратор",
    locations: ["ночной мегаполис", "радиобашня", "подземная мастерская", "городской мост"]
  },
  {
    slug: "batman",
    title: "Бэтмен: Четыре минуты до полуночи",
    summary:
      "Фанатская интерактивная история: Часовщик получает контроль над инфраструктурой Готэма, а Бэтмен выбирает между правдой, спасением людей, союзом и собственной тайной.",
    script:
      "Неофициальная трансформативная фанатская история по мотивам персонажей DC. 17 сцен, 24 перехода, 9 ветвящихся узлов и 4 отдельных финала.",
    coverImageUrl: "/uploads/seed/comics/batman/page-01.jpg",
    assetDirectory: "batman",
    hero: "Бэтмен",
    threat: "Часовщик и захваченная им городская сеть",
    artifact: "архив управления Готэмом",
    locations: ["крыши Готэма", "старое метро", "Wayne Enterprises", "часовая башня"],
    visualPrompt:
      "original noir comic about an adult masked city vigilante detective, black cape silhouette, gothic fictional metropolis, no logos, no existing named characters",
    pageTitles: BATMAN_PAGE_TITLES,
    pageBodies: BATMAN_PAGE_BODIES,
    finalChoiceLabels: [
      "Передать доказательства Оракулу и открыть эфир",
      "Спасти больницы и заложников",
      "Доверить второй ключ Селине",
      "Раскрыть личный архив и принять вину"
    ]
  },
  {
    slug: "the-boys-vought-files",
    title: "Пацаны: Архив Vought",
    summary:
      "Фанатская интерактивная история по мотивам сериала Amazon: Бутчер, Хьюи и Старлайт получают архив Compound V и выбирают один из четырёх способов изменить систему.",
    script:
      "Неофициальная трансформативная фанатская история по мотивам сериала The Boys. 17 сцен, 24 перехода, 9 ветвящихся узлов и 4 самостоятельных финала.",
    coverImageUrl: "/uploads/seed/comics/the-boys/page-01.jpg",
    assetDirectory: "the-boys",
    hero: "команда Бутчера, Хьюи и Старлайт",
    threat: "Vought и неконтролируемая власть Семёрки",
    artifact: "полный архив Compound V",
    locations: ["башня Vought", "подпольная база The Boys", "закрытый объект", "студия прямого эфира"],
    visualPrompt:
      "original satirical superhero conspiracy comic with adult investigators, a corporate superhero tower, television studio and secret laboratory, fully clothed characters, no logos, no existing named characters",
    pageTitles: THE_BOYS_PAGE_TITLES,
    pageBodies: THE_BOYS_PAGE_BODIES,
    finalChoiceLabels: [
      "Передать архив независимым редакциям",
      "Поддержать удар Бутчера",
      "Вывести Старлайт в прямой эфир",
      "Принять сделку ради свидетелей"
    ]
  }
];

const PAGE_TITLES = [
  "Тревожный сигнал",
  "Первый маршрут",
  "Опасная альтернатива",
  "След в темноте",
  "Цена спасения",
  "Погоня за ответом",
  "Скрытый союзник",
  "Ложный след",
  "Точка разлома",
  "Штурм рубежа",
  "Раскрытая правда",
  "Последний выбор",
  "Сердце угрозы",
  "Финал: спасённый мир",
  "Финал: трудный компромисс",
  "Финал: цена победы",
  "Финал: путь в неизвестность"
];

export const CHOICES: Record<string, Array<{ label: string; target: string }>> = {
  p01: [
    { label: "Следовать аварийному протоколу", target: "p02" },
    { label: "Пойти по неофициальному сигналу", target: "p03" }
  ],
  p02: [
    { label: "Спасти людей на маршруте", target: "p04" },
    { label: "Сохранить время и преследовать цель", target: "p05" }
  ],
  p03: [
    { label: "Довериться найденной записи", target: "p05" },
    { label: "Проверить опасную альтернативу", target: "p06" }
  ],
  p04: [
    { label: "Принять помощь союзника", target: "p07" },
    { label: "Продолжить расследование в одиночку", target: "p08" }
  ],
  p05: [
    { label: "Идти по прямому следу", target: "p08" },
    { label: "Устроить перехват", target: "p09" }
  ],
  p06: [
    { label: "Отключить систему", target: "p09" },
    { label: "Использовать систему против врага", target: "p10" }
  ],
  p07: [{ label: "Передать союзнику часть плана", target: "p11" }],
  p08: [
    { label: "Раскрыть правду команде", target: "p11" },
    { label: "Скрыть находку до финала", target: "p12" }
  ],
  p09: [
    { label: "Защитить артефакт", target: "p12" },
    { label: "Пожертвовать артефактом ради людей", target: "p13" }
  ],
  p10: [{ label: "Начать финальный штурм", target: "p13" }],
  p11: [{ label: "Собрать союзников перед решающим выбором", target: "p13" }],
  p12: [{ label: "Вскрыть последнюю улику и перейти к развязке", target: "p13" }],
  p13: [
    { label: "Открыть правду и спасти мир", target: "p14" },
    { label: "Заключить трудный союз", target: "p15" },
    { label: "Завершить миссию любой ценой", target: "p16" },
    { label: "Открыть неизвестный путь", target: "p17" }
  ]
};

export function buildChoices(seed: ComicSeed): Record<string, Array<{ label: string; target: string }>> {
  if (!seed.finalChoiceLabels) {
    return CHOICES;
  }

  return {
    ...CHOICES,
    p13: seed.finalChoiceLabels.map((label, index) => ({
      label,
      target: `p${14 + index}`
    }))
  };
}

function buildBody(seed: ComicSeed, index: number) {
  const location = seed.locations[index % seed.locations.length];
  const nextLocation = seed.locations[(index + 1) % seed.locations.length];
  const stage = index + 1;

  if (stage === 14) {
    return `${seed.hero} объединяет найденные улики и останавливает ${seed.threat}.\n---\n${seed.artifact} возвращается под защиту экспедиции.\n---\n${location} переживает кризис, а команда спасает тех, кто оказался в ловушке.\n---\nПервый финал завершает историю открытой победой и восстановлением доверия.`;
  }

  if (stage === 15) {
    return `${seed.hero} заключает временный союз с частью противников, чтобы остановить ${seed.threat}.\n---\n${seed.artifact} остаётся под совместным контролем и становится гарантией перемирия.\n---\n${location} спасена, но обе стороны вынуждены отказаться от части своих целей.\n---\nВторой финал показывает победу через компромисс и хрупкий мир.`;
  }

  if (stage === 16) {
    return `${seed.hero} принимает на себя последствия финального решения и лишается доступа к объекту «${seed.artifact}».\n---\n${seed.threat} остановлена, однако команда распадается из-за цены операции.\n---\nЖители ${location} спасены, а правда о событиях остаётся известна лишь немногим.\n---\nТретий финал завершает конфликт победой с личной потерей.`;
  }

  if (stage === 17) {
    return `${seed.hero} выбирает неизвестный маршрут и выпускает силу, которую скрывал ${seed.artifact}.\n---\n${seed.threat} отступает, меняя правила конфликта.\n---\nПуть через ${location} закрывается, зато открывается дорога к ${nextLocation}.\n---\nЧетвёртый финал оставляет новый вопрос и основу для продолжения истории.`;
  }

  if (stage === 13) {
    return `${seed.hero} добирается до центра конфликта в локации «${location}» и получает контроль над объектом «${seed.artifact}».\n---\n${seed.threat} можно остановить четырьмя способами, но каждый меняет судьбу команды и окружающего мира.\n---\nСобранные улики позволяют выбрать открытую победу, компромисс, личную жертву или неизвестный путь.\n---\nНа этой странице читатель одновременно видит четыре самостоятельных варианта финала.`;
  }

  return `${seed.hero} прибывает в ${location}, где обнаруживает новый след угрозы: ${seed.threat}.\n---\nКоманда находит важную деталь, связанную с объектом «${seed.artifact}», но данные противоречат официальной версии.\n---\nПуть к ${nextLocation} перекрыт, время ограничено, а союзники предлагают разные способы продолжить миссию.\n---\nРешение на этой странице меняет маршрут расследования и приближает один из четырёх финалов.`;
}

export function buildPages(seed: ComicSeed) {
  const titles = seed.pageTitles ?? PAGE_TITLES;
  const bodies = seed.pageBodies;
  const imageSet = buildImageSet(seed.assetDirectory);

  if (titles.length !== 17 || (bodies && bodies.length !== 17)) {
    throw new Error(`Комикс ${seed.slug} должен содержать ровно 17 заголовков и текстов страниц`);
  }

  return titles.map((title, index) => {
    const position = index + 1;
    const pageKey = `p${String(position).padStart(2, "0")}`;
    const pageImage = imageSet[index];
    const panelImageUrls = [0, 4, 8, 12].map((offset) => imageSet[(index + offset) % imageSet.length]);

    return {
      pageKey,
      title: `Страница ${position}: ${title}`,
      body: bodies?.[index] ?? buildBody(seed, index),
      imageUrl: pageImage,
      panelImageUrls,
      sketchPrompt: `${seed.visualPrompt ?? `${seed.title}, ${seed.hero}`}, ${seed.locations[index % seed.locations.length]}, ${title}, vintage comic art`,
      transitionStyle: TRANSITIONS[index % TRANSITIONS.length],
      position,
      isStart: index === 0
    };
  });
}

async function replaceComicPages(comicId: string, seed: ComicSeed) {
  const existingPages = await prisma.comicPage.findMany({
    where: { comicId },
    select: { id: true }
  });

  if (existingPages.length > 0) {
    const pageIds = existingPages.map((page) => page.id);
    await prisma.comicChoice.deleteMany({
      where: {
        OR: [{ pageId: { in: pageIds } }, { targetPageId: { in: pageIds } }]
      }
    });
    await prisma.readProgress.deleteMany({ where: { comicId } });
    await prisma.comicPage.deleteMany({ where: { comicId } });
  }

  const pages = buildPages(seed);
  const createdPages = [];
  for (const page of pages) {
    createdPages.push(
      await prisma.comicPage.create({
        data: {
          comicId,
          ...page
        }
      })
    );
  }

  const pageIdByKey = new Map(createdPages.map((page) => [page.pageKey, page.id]));
  const comicChoices = buildChoices(seed);
  const choices = Object.entries(comicChoices).flatMap(([pageKey, entries]) =>
    entries.map((choice) => ({
      pageId: pageIdByKey.get(pageKey)!,
      label: choice.label,
      targetPageId: pageIdByKey.get(choice.target)!
    }))
  );
  await prisma.comicChoice.createMany({ data: choices });

  return {
    pages: createdPages.length,
    choices: choices.length,
    branchingPages: Object.values(comicChoices).filter((entries) => entries.length > 1).length,
    endings: pages.filter((page) => !comicChoices[page.pageKey]).length
  };
}

async function main() {
  const authorEmail = "author@inkflow.app";
  const readerEmail = "reader@inkflow.app";
  const passwordHash = await bcrypt.hash("password123", 10);

  const [author, reader] = await Promise.all([
    prisma.user.upsert({
      where: { email: authorEmail },
      update: { displayName: "InkFlow Studio", passwordHash },
      create: {
        email: authorEmail,
        passwordHash,
        displayName: "InkFlow Studio",
        bio: "Демонстрационный автор интерактивных комиксов с ветвящимся сюжетом."
      }
    }),
    prisma.user.upsert({
      where: { email: readerEmail },
      update: { displayName: "Demo Reader", passwordHash },
      create: {
        email: readerEmail,
        passwordHash,
        displayName: "Demo Reader"
      }
    })
  ]);

  await prisma.comic.deleteMany({
    where: {
      authorId: author.id,
      slug: "city-of-ink"
    }
  });

  const report = [];
  for (const [index, seed] of COMICS.entries()) {
    const comic = await prisma.comic.upsert({
      where: { slug: seed.slug },
      update: {
        title: seed.title,
        summary: seed.summary,
        script: seed.script,
        coverImageUrl: seed.coverImageUrl,
        status: ComicStatus.PUBLISHED,
        authorId: author.id
      },
      create: {
        slug: seed.slug,
        title: seed.title,
        summary: seed.summary,
        script: seed.script,
        coverImageUrl: seed.coverImageUrl,
        status: ComicStatus.PUBLISHED,
        authorId: author.id
      }
    });

    const graph = await replaceComicPages(comic.id, seed);
    report.push({ slug: seed.slug, ...graph });

    await prisma.comicReview.upsert({
      where: {
        userId_comicId: {
          userId: reader.id,
          comicId: comic.id
        }
      },
      update: {
        rating: 4 + (index % 2),
        body: "Демонстрационная рецензия: понятные развилки, выразительные переходы и четыре разных финала."
      },
      create: {
        userId: reader.id,
        comicId: comic.id,
        rating: 4 + (index % 2),
        body: "Демонстрационная рецензия: понятные развилки, выразительные переходы и четыре разных финала."
      }
    });

    if (index < 3) {
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
    }
  }

  console.log("Seed completed", {
    author: author.email,
    reader: reader.email,
    comics: report.length,
    report
  });
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
