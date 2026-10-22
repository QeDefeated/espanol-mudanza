// Диалоги-ситуации для переезда. В репликах: [кто, испанский, русский].
// "me" — ваша роль, остальные — собеседник (имя роли в other).
window.ES_DIALOGS = [
  {
    id: "airport", title: "Паспортный контроль", place: "Aeropuerto", other: "Agente",
    role: "сотрудник паспортного контроля в аэропорту",
    lines: [
      ["other", "Buenas tardes. Su pasaporte, por favor.", "Добрый день. Ваш паспорт, пожалуйста."],
      ["me", "Buenas tardes. Aquí tiene.", "Добрый день. Вот, пожалуйста."],
      ["other", "¿Cuál es el motivo de su viaje?", "Какова цель вашей поездки?"],
      ["me", "Vengo a vivir aquí. Tengo visa de residente temporal.", "Я приехал жить сюда. У меня виза временного резидента."],
      ["other", "¿Me muestra la visa y su domicilio en México?", "Покажете визу и ваш адрес в Мексике?"],
      ["me", "Sí, claro. Por ahora me quedo en un hotel en la colonia Condesa.", "Да, конечно. Пока я остановлюсь в отеле в районе Кондеса."],
      ["other", "Tiene treinta días para canjear la visa por la tarjeta de residente en migración.", "У вас тридцать дней, чтобы обменять визу на карту резидента в миграционной службе."],
      ["me", "¿Treinta días naturales o hábiles?", "Тридцать календарных или рабочих дней?"],
      ["other", "Hábiles. Aquí está su sello. Bienvenido a México.", "Рабочих. Вот ваш штамп. Добро пожаловать в Мексику."],
      ["me", "Muchas gracias.", "Большое спасибо."]
    ],
    vocab: [["el motivo", "причина, цель"], ["el domicilio", "адрес проживания"], ["canjear", "обменять"], ["los días hábiles", "рабочие дни"], ["los días naturales", "календарные дни"]]
  },
  {
    id: "taxi", title: "Такси из аэропорта", place: "Taxi", other: "Taxista",
    role: "таксист, который везёт новичка из аэропорта",
    lines: [
      ["me", "Buenas noches. ¿Me lleva a la colonia Roma?", "Добрый вечер. Отвезёте меня в район Рома?"],
      ["other", "Claro. ¿Qué calle?", "Конечно. Какая улица?"],
      ["me", "Calle Durango, número ciento veinte. Aquí está en el mapa.", "Улица Дуранго, дом сто двадцать. Вот на карте."],
      ["other", "Muy bien. ¿Las maletas van en la cajuela?", "Хорошо. Чемоданы положим в багажник?"],
      ["me", "Sí, por favor. ¿Cuánto tiempo tardamos?", "Да, пожалуйста. Сколько времени ехать?"],
      ["other", "Con este tráfico, unos cuarenta minutos.", "С такими пробками — минут сорок."],
      ["me", "¿Acepta tarjeta o solo efectivo?", "Принимаете карту или только наличные?"],
      ["other", "Solo efectivo, joven. Son trescientos cincuenta.", "Только наличные. Триста пятьдесят."],
      ["me", "Está bien. Bájeme en la esquina, por favor.", "Хорошо. Высадите меня на углу, пожалуйста."],
      ["other", "Aquí tiene su cambio. ¡Que le vaya bien!", "Вот ваша сдача. Всего доброго!"]
    ],
    vocab: [["la cajuela", "багажник (Мексика); Аргентина: el baúl"], ["tardar", "занимать (о времени)"], ["joven", "обращение к молодому человеку, «молодой человек»"], ["bájeme", "высадите меня"]]
  },
  {
    id: "sim", title: "Покупка SIM-карты", place: "Tienda de celulares", other: "Vendedora",
    role: "продавщица в салоне связи",
    lines: [
      ["me", "Hola, quiero comprar un chip para mi celular.", "Здравствуйте, я хочу купить SIM-карту для телефона."],
      ["other", "Claro. ¿Quiere plan de renta mensual o de prepago?", "Конечно. Вам тариф с абонентской платой или предоплату?"],
      ["me", "Prepago, por ahora. ¿Qué incluye el paquete de doscientos?", "Пока предоплату. Что входит в пакет за двести?"],
      ["other", "Incluye diez gigas, llamadas ilimitadas y WhatsApp gratis por treinta días.", "Десять гигабайт, безлимитные звонки и бесплатный WhatsApp на тридцать дней."],
      ["me", "Perfecto. ¿Necesitan algún documento?", "Отлично. Нужны какие-то документы?"],
      ["other", "Sí, para registrar la línea necesito una identificación. Su pasaporte sirve.", "Да, для регистрации номера нужен документ. Паспорт подойдёт."],
      ["me", "Aquí está. ¿Me ayuda a ponerlo en el teléfono?", "Вот. Поможете вставить её в телефон?"],
      ["other", "Sí. Listo, ya tiene señal. Su número está en este papel.", "Да. Готово, связь есть. Ваш номер на этой бумажке."],
      ["me", "¿Y cómo hago la recarga el próximo mes?", "А как пополнить счёт в следующем месяце?"],
      ["other", "En cualquier OXXO o en la aplicación. Le llega un mensaje cuando se acaben los datos.", "В любом OXXO или в приложении. Когда интернет закончится, придёт сообщение."]
    ],
    vocab: [["el prepago", "предоплата"], ["ilimitado", "безлимитный"], ["la línea", "номер (телефонная линия)"], ["la identificación", "удостоверение личности"], ["OXXO", "сеть магазинов у дома в Мексике, там же платят за услуги"]]
  },
  {
    id: "viewing", title: "Осмотр квартиры", place: "Departamento", other: "Dueña",
    role: "хозяйка квартиры, которую сдают в аренду",
    lines: [
      ["me", "Buenos días. Vengo por el departamento del anuncio.", "Доброе утро. Я по поводу квартиры из объявления."],
      ["other", "Sí, pase. Son dos recámaras, un baño y medio, sala, comedor y cocina.", "Да, проходите. Две спальни, полторы ванной, гостиная, столовая и кухня."],
      ["me", "Tiene mucha luz. ¿Está amueblado?", "Тут много света. Квартира с мебелью?"],
      ["other", "Semiamueblado: tiene refri, estufa y clósets. Las camas no.", "Частично: есть холодильник, плита и шкафы. Кроватей нет."],
      ["me", "¿Cuánto es la renta?", "Сколько стоит аренда?"],
      ["other", "Catorce mil al mes, más mantenimiento de ochocientos.", "Четырнадцать тысяч в месяц плюс восемьсот за обслуживание дома."],
      ["me", "¿Los servicios están incluidos?", "Коммунальные услуги включены?"],
      ["other", "El agua sí. La luz, el gas y el internet los paga usted.", "Вода да. Свет, газ и интернет оплачиваете вы."],
      ["me", "¿Se aceptan mascotas? Tengo un gato.", "Можно с животными? У меня кот."],
      ["other", "Un gato no hay problema. ¿Cuándo se quiere mudar?", "Кот — не проблема. Когда хотите въехать?"],
      ["me", "El primero de mes, si es posible.", "Первого числа, если можно."]
    ],
    vocab: [["el baño y medio", "полторы ванной (вторая — только туалет)"], ["el comedor", "столовая (зона)"], ["la estufa", "кухонная плита (Мексика)"], ["el clóset", "встроенный шкаф"], ["el mantenimiento", "плата за обслуживание дома"]]
  },
  {
    id: "lease", title: "Договор аренды", place: "Contrato", other: "Agente inmobiliario",
    role: "риелтор, который обсуждает условия договора аренды",
    lines: [
      ["other", "Para el contrato le pido un mes de depósito y un mes de renta adelantado.", "Для договора нужен залог за месяц и оплата первого месяца вперёд."],
      ["me", "Entiendo. El dueño pide aval, pero no tengo propiedades aquí.", "Понимаю. Хозяин просит поручителя, но у меня здесь нет недвижимости."],
      ["other", "En ese caso puede contratar una póliza jurídica. Cuesta más o menos media renta.", "Тогда можно оформить юридическую страховку. Стоит примерно половину месячной аренды."],
      ["me", "Está bien. ¿El contrato es por un año?", "Хорошо. Договор на год?"],
      ["other", "Sí, por doce meses. Si se va antes, pierde el depósito.", "Да, на двенадцать месяцев. Если съедете раньше, залог не вернут."],
      ["me", "¿Y si hay una reparación grande, quién la paga?", "А если нужен серьёзный ремонт, кто платит?"],
      ["other", "Las reparaciones mayores las paga el dueño; las menores, el inquilino.", "Крупный ремонт оплачивает хозяин, мелкий — жилец."],
      ["me", "¿Me puede mandar el contrato antes para leerlo con calma?", "Можете прислать договор заранее, чтобы я спокойно его прочитал?"],
      ["other", "Claro, se lo mando hoy por correo.", "Конечно, отправлю вам сегодня по почте."]
    ],
    vocab: [["adelantado", "вперёд, авансом"], ["la póliza jurídica", "юридическая страховка вместо поручителя (Мексика)"], ["la reparación", "ремонт, починка"], ["mayor / menor", "крупный / мелкий"], ["con calma", "спокойно, не торопясь"]]
  },
  {
    id: "bank", title: "Открытие счёта в банке", place: "Banco", other: "Ejecutivo",
    role: "сотрудник банка, открывающий счёт иностранцу",
    lines: [
      ["other", "Buenos días, ¿en qué le puedo ayudar?", "Доброе утро, чем могу помочь?"],
      ["me", "Quisiera abrir una cuenta de débito. Soy residente temporal.", "Я хотел бы открыть дебетовый счёт. Я временный резидент."],
      ["other", "Con gusto. Necesito su tarjeta de residente, su pasaporte y un comprobante de domicilio.", "С удовольствием. Мне нужны ваша карта резидента, паспорт и подтверждение адреса."],
      ["me", "¿Sirve el contrato de renta como comprobante?", "Договор аренды подойдёт как подтверждение?"],
      ["other", "Necesitamos un recibo de luz o de agua de los últimos tres meses.", "Нам нужен счёт за свет или воду за последние три месяца."],
      ["me", "Está a nombre del dueño. ¿Hay problema?", "Он оформлен на хозяина. Это проблема?"],
      ["other", "No, si lo acompaña con su contrato. ¿También necesita su RFC?", "Нет, если приложите договор. Вам также нужен RFC?"],
      ["me", "Todavía no lo tengo. ¿Es obligatorio?", "У меня его ещё нет. Это обязательно?"],
      ["other", "Para esta cuenta no. Su tarjeta llega en cinco días hábiles.", "Для этого счёта нет. Карта придёт через пять рабочих дней."],
      ["me", "¿Cobran comisión por manejo de cuenta?", "Есть комиссия за обслуживание счёта?"],
      ["other", "No, si mantiene un saldo mínimo de tres mil pesos.", "Нет, если на счету остаётся не меньше трёх тысяч песо."]
    ],
    vocab: [["con gusto", "с удовольствием"], ["a nombre de", "на имя"], ["el saldo", "остаток на счёте, баланс"], ["obligatorio", "обязательный"], ["el manejo de cuenta", "обслуживание счёта"]]
  },
  {
    id: "migration", title: "Миграционная служба", place: "Migración", other: "Funcionaria",
    role: "сотрудница миграционной службы, принимающая документы",
    lines: [
      ["other", "Buenos días. ¿Tiene cita?", "Доброе утро. У вас есть запись?"],
      ["me", "Sí, a las diez. Vengo a canjear mi visa por la tarjeta de residente.", "Да, на десять. Я пришёл обменять визу на карту резидента."],
      ["other", "¿Trae el formato lleno y el pago de derechos?", "Вы принесли заполненную форму и квитанцию об оплате пошлины?"],
      ["me", "Traigo el formato. El pago lo hice en línea, aquí está el comprobante.", "Форму принёс. Пошлину я оплатил онлайн, вот квитанция."],
      ["other", "Le falta una fotografía tamaño infantil de frente.", "Не хватает фотографии на документы анфас."],
      ["me", "¿Dónde puedo tomarme una foto cerca de aquí?", "Где здесь рядом можно сфотографироваться?"],
      ["other", "Enfrente hay un local. Regrese con la foto y no pierde su turno.", "Напротив есть фотоателье. Возвращайтесь с фото, ваша очередь сохранится."],
      ["me", "Muchas gracias. ¿Cuánto tarda la tarjeta?", "Большое спасибо. Сколько делается карта?"],
      ["other", "Le llega un correo para recogerla en unas dos semanas.", "Примерно через две недели придёт письмо, что её можно забрать."]
    ],
    vocab: [["el formato", "бланк, форма (Мексика)"], ["el pago de derechos", "оплата госпошлины"], ["en línea", "онлайн"], ["tamaño infantil", "маленький формат фото на документы (Мексика)"], ["de frente", "анфас"], ["recoger", "забирать"]]
  },
  {
    id: "market", title: "На рынке", place: "Mercado", other: "Marchanta",
    role: "продавщица фруктов и овощей на рынке",
    lines: [
      ["other", "¿Qué le damos, güerito?", "Что вам дать, светленький?"],
      ["me", "Buenas. ¿A cómo está el aguacate?", "Здравствуйте. Почём авокадо?"],
      ["other", "A sesenta el kilo. Están bien buenos, para hoy.", "Шестьдесят за кило. Очень хорошие, на сегодня."],
      ["me", "Deme medio kilo, pero para mañana, por favor.", "Дайте полкило, но на завтра, пожалуйста."],
      ["other", "¿Algo más?", "Что-нибудь ещё?"],
      ["me", "Un kilo de jitomate y cuatro limones.", "Килограмм помидоров и четыре лайма."],
      ["other", "Los limones van por kilo. ¿Le pongo un cuarto?", "Лаймы продаются на вес. Положить четверть кило?"],
      ["me", "Sí, está bien. ¿Cuánto es todo?", "Да, хорошо. Сколько всего?"],
      ["other", "Son ochenta y cinco. Le regalo unos chiles.", "Восемьдесят пять. Дам вам в подарок немного чили."],
      ["me", "¡Qué amable! Aquí tiene cien.", "Как мило! Вот сто."]
    ],
    vocab: [["güerito / güerita", "«светленький» — обычное дружелюбное обращение к светлокожим (Мексика)"], ["¿A cómo está…?", "почём…?"], ["para hoy / para mañana", "(спелый) на сегодня / на завтра"], ["la marchanta", "продавщица на рынке; постоянный покупатель (Мексика)"]]
  },
  {
    id: "cafe", title: "В кафе", place: "Cafetería", other: "Mesero",
    role: "официант в кафе",
    lines: [
      ["other", "Bienvenido. ¿Mesa para cuántos?", "Добро пожаловать. Столик на сколько человек?"],
      ["me", "Para uno. ¿Puedo sentarme junto a la ventana?", "На одного. Можно сесть у окна?"],
      ["other", "Claro. Aquí está el menú. ¿Le traigo algo de tomar?", "Конечно. Вот меню. Принести что-нибудь попить?"],
      ["me", "Un café americano y un agua natural, por favor.", "Американо и воду без газа, пожалуйста."],
      ["other", "¿Ya sabe qué va a comer?", "Уже знаете, что будете есть?"],
      ["me", "¿Qué me recomienda? No como mucho picante.", "Что посоветуете? Я не ем слишком острое."],
      ["other", "Los chilaquiles verdes con pollo. Se los puedo pedir con la salsa aparte.", "Зелёные чилакилес с курицей. Могу попросить подать соус отдельно."],
      ["me", "Perfecto, eso quiero.", "Отлично, это и возьму."],
      ["me", "Disculpe, ¿me trae la cuenta, por favor?", "Извините, принесите счёт, пожалуйста."],
      ["other", "Aquí tiene. ¿Va a pagar con tarjeta? Le traigo la terminal.", "Вот, пожалуйста. Будете платить картой? Принесу терминал."]
    ],
    vocab: [["junto a", "рядом с"], ["algo de tomar", "что-нибудь попить"], ["aparte", "отдельно"], ["la terminal", "платёжный терминал"]]
  },
  {
    id: "pharmacy", title: "В аптеке", place: "Farmacia", other: "Farmacéutico",
    role: "фармацевт в аптеке",
    lines: [
      ["me", "Buenas tardes. Tengo gripa y me duele mucho la garganta.", "Добрый день. Я простыл, и у меня сильно болит горло."],
      ["other", "¿Tiene fiebre?", "У вас есть температура?"],
      ["me", "Un poco, desde anoche.", "Небольшая, со вчерашнего вечера."],
      ["other", "Le puedo dar paracetamol para la fiebre y unas pastillas para la garganta.", "Могу дать парацетамол от температуры и таблетки для горла."],
      ["me", "¿Cada cuánto las tomo?", "Как часто их принимать?"],
      ["other", "El paracetamol cada ocho horas. Las pastillas, una cada cuatro horas.", "Парацетамол каждые восемь часов. Таблетки — по одной каждые четыре часа."],
      ["me", "¿Necesito receta para un antibiótico?", "Для антибиотика нужен рецепт?"],
      ["other", "Sí, los antibióticos solo con receta. Aquí al lado hay consultorio, la consulta cuesta cincuenta pesos.", "Да, антибиотики только по рецепту. Рядом есть кабинет врача, приём стоит пятьдесят песо."],
      ["me", "Muy bien, gracias.", "Хорошо, спасибо."],
      ["other", "Que se mejore.", "Поправляйтесь."]
    ],
    vocab: [["¿Cada cuánto?", "как часто?"], ["el consultorio", "врачебный кабинет"], ["la consulta", "приём (у врача)"], ["al lado", "рядом"]]
  },
  {
    id: "doctor", title: "У врача", place: "Consultorio", other: "Doctora",
    role: "терапевт на приёме",
    lines: [
      ["other", "Pase, siéntese. ¿Qué le pasa?", "Проходите, садитесь. Что вас беспокоит?"],
      ["me", "Desde hace tres días me duele el estómago y no tengo hambre.", "Уже три дня болит живот и нет аппетита."],
      ["other", "¿Comió algo en la calle?", "Вы ели что-нибудь на улице?"],
      ["me", "Sí, unos tacos el sábado.", "Да, тако в субботу."],
      ["other", "¿Es alérgico a algún medicamento?", "У вас есть аллергия на какие-нибудь лекарства?"],
      ["me", "No, que yo sepa.", "Насколько я знаю, нет."],
      ["other", "Acuéstese aquí, por favor. ¿Le duele si aprieto?", "Лягте здесь, пожалуйста. Больно, если нажимаю?"],
      ["me", "Sí, un poco, aquí abajo.", "Да, немного, вот здесь внизу."],
      ["other", "Parece una infección leve. Le voy a dar una receta y unos análisis.", "Похоже на лёгкую инфекцию. Выпишу вам рецепт и анализы."],
      ["other", "Tome mucha agua y coma ligero. Si no mejora en tres días, regrese.", "Пейте много воды и ешьте лёгкое. Если за три дня не станет лучше, приходите снова."]
    ],
    vocab: [["¿Qué le pasa?", "что с вами? что беспокоит?"], ["desde hace…", "уже … (столько-то времени)"], ["que yo sepa", "насколько я знаю"], ["apretar", "нажимать"], ["leve", "лёгкий (о болезни)"], ["comer ligero", "есть лёгкую пищу"]]
  },
  {
    id: "neighbor", title: "Знакомство с соседкой", place: "Edificio", other: "Vecina",
    role: "дружелюбная соседка по дому",
    lines: [
      ["other", "Hola, ¿tú eres el nuevo del cuatro?", "Привет, ты новенький из четвёртой?"],
      ["me", "Sí, me acabo de mudar. Me llamo Iván.", "Да, я только что переехал. Меня зовут Иван."],
      ["other", "Mucho gusto, yo soy Mariana. ¿De dónde eres?", "Очень приятно, я Мариана. Откуда ты?"],
      ["me", "Soy de Rusia. Estoy aprendiendo español, perdón por los errores.", "Я из России. Я учу испанский, извини за ошибки."],
      ["other", "¡No, hablas muy bien! ¿Y qué te parece el barrio?", "Да ты отлично говоришь! И как тебе район?"],
      ["me", "Me encanta. Hay muchos cafés y el parque está muy cerca.", "Очень нравится. Много кафе, и парк совсем рядом."],
      ["other", "Si necesitas algo, toca. Ah, el camión de la basura pasa los martes y viernes temprano.", "Если что-то нужно — стучи. А, мусоровоз приезжает по вторникам и пятницам рано утром."],
      ["me", "¡Qué bueno saberlo! ¿Y dónde compras las tortillas?", "Хорошо, что знаю! А где ты покупаешь тортильи?"],
      ["other", "En la tortillería de la esquina, son las mejores.", "В тортильерии на углу, они самые лучшие."],
      ["me", "Gracias, Mariana. Nos vemos.", "Спасибо, Мариана. Увидимся."]
    ],
    vocab: [["el nuevo / la nueva", "новенький / новенькая"], ["¿Qué te parece…?", "как тебе…?"], ["tocar", "стучать, звонить в дверь"], ["el camión de la basura", "мусоровоз"], ["la tortillería", "лавка, где делают тортильи"]]
  },
  {
    id: "plumber", title: "Поломка в квартире", place: "Llamada", other: "Dueño",
    role: "хозяин квартиры, которому жилец звонит о поломке",
    lines: [
      ["other", "¿Bueno?", "Алло?"],
      ["me", "Hola, don Jorge, le habla Iván, del departamento de Durango.", "Здравствуйте, дон Хорхе, это Иван из квартиры на Дуранго."],
      ["other", "Ah, hola, Iván. ¿Todo bien?", "А, привет, Иван. Всё в порядке?"],
      ["me", "Más o menos. Hay una fuga debajo del fregadero y no sale agua caliente en la regadera.", "Не совсем. Под раковиной течёт, и в душе нет горячей воды."],
      ["other", "Uy, ¿ya revisaste el boiler? A veces se apaga el piloto.", "Ой, ты проверил бойлер? Иногда гаснет запальник."],
      ["me", "Sí, lo revisé, pero no prende.", "Да, проверил, но он не зажигается."],
      ["other", "Está bien, mando al plomero mañana en la mañana. ¿Vas a estar en casa?", "Ладно, пришлю сантехника завтра утром. Ты будешь дома?"],
      ["me", "Sí, trabajo desde casa. ¿A qué hora más o menos?", "Да, я работаю из дома. Примерно во сколько?"],
      ["other", "Entre nueve y once. Mándame fotos de la fuga, por favor.", "Между девятью и одиннадцатью. Скинь мне фото протечки, пожалуйста."],
      ["me", "Ahorita se las mando. Gracias.", "Сейчас отправлю. Спасибо."]
    ],
    vocab: [["le habla…", "вас беспокоит…, это … (по телефону)"], ["debajo de", "под"], ["el boiler", "бойлер, водонагреватель (Мексика)"], ["el piloto", "запальник (огонёк газового нагревателя)"], ["prender", "зажигаться, включать (Мексика)"]]
  },
  {
    id: "interview", title: "Собеседование", place: "Entrevista", other: "Reclutadora",
    role: "рекрутер, проводящая собеседование на позицию разработчика",
    lines: [
      ["other", "Cuéntame un poco de ti y de tu experiencia.", "Расскажи немного о себе и своём опыте."],
      ["me", "Soy desarrollador backend. Tengo seis años de experiencia, sobre todo con Python.", "Я бэкенд-разработчик. У меня шесть лет опыта, в основном с Python."],
      ["other", "¿Por qué te interesa trabajar con nosotros?", "Почему тебе интересно работать у нас?"],
      ["me", "Me gusta el producto y quiero trabajar en un equipo local ahora que vivo aquí.", "Мне нравится продукт, и я хочу работать в местной команде, раз уж теперь живу здесь."],
      ["other", "¿Tienes permiso para trabajar en el país?", "У тебя есть разрешение на работу в стране?"],
      ["me", "Sí, mi residencia temporal me permite trabajar.", "Да, временное резидентство позволяет мне работать."],
      ["other", "¿Cuáles son tus expectativas salariales?", "Каковы твои ожидания по зарплате?"],
      ["me", "Busco entre cincuenta y sesenta mil pesos netos al mes, pero es negociable.", "Ищу от пятидесяти до шестидесяти тысяч песо на руки в месяц, но это обсуждается."],
      ["other", "Perfecto. El siguiente paso es una prueba técnica. Te mando los detalles por correo.", "Отлично. Следующий шаг — техническое задание. Пришлю подробности по почте."],
      ["me", "Muchas gracias por su tiempo. Quedo atento.", "Большое спасибо за ваше время. Жду вашего письма."]
    ],
    vocab: [["cuéntame", "расскажи мне"], ["el desarrollador", "разработчик"], ["el equipo", "команда"], ["las expectativas salariales", "зарплатные ожидания"], ["neto", "чистыми, на руки"], ["Quedo atento", "жду ответа (вежливая формула в письмах)"]]
  },
  {
    id: "package", title: "Посылка и доставка", place: "Paquetería", other: "Empleado",
    role: "сотрудник пункта выдачи посылок",
    lines: [
      ["me", "Buenas tardes. Vengo a recoger un paquete. Me dejaron este aviso.", "Добрый день. Я пришёл забрать посылку. Мне оставили это извещение."],
      ["other", "¿Me da su número de guía y una identificación?", "Дайте номер отслеживания и документ."],
      ["me", "Aquí está la guía. ¿Sirve la tarjeta de residente?", "Вот номер. Карта резидента подойдёт?"],
      ["other", "Sí. Un momento… Su paquete tiene un cargo por impuestos de importación.", "Да. Минутку… На вашу посылку начислена таможенная пошлина."],
      ["me", "¿Cuánto es?", "Сколько?"],
      ["other", "Trescientos veinte pesos. Puede pagar con tarjeta.", "Триста двадцать песо. Можно картой."],
      ["me", "Está bien. ¿Y si la próxima vez no estoy en casa?", "Хорошо. А если в следующий раз меня не будет дома?"],
      ["other", "Puede autorizar a otra persona o cambiar la entrega a una sucursal en la página.", "Можно указать доверенное лицо или перенаправить доставку в отделение на сайте."],
      ["me", "Perfecto, gracias.", "Отлично, спасибо."]
    ],
    vocab: [["el aviso", "извещение, уведомление"], ["la guía", "номер отслеживания, накладная (Мексика)"], ["el cargo", "начисление, сбор"], ["los impuestos de importación", "ввозная пошлина"], ["autorizar", "уполномочить, разрешить"]]
  },
  {
    id: "directions", title: "Как добраться", place: "En la calle", other: "Señor",
    role: "прохожий, которого спрашивают дорогу",
    lines: [
      ["me", "Disculpe, ¿cómo llego a la estación de metro Insurgentes?", "Извините, как дойти до станции метро «Инсурхентес»?"],
      ["other", "Está cerca. Siga derecho por esta calle tres cuadras.", "Это близко. Идите прямо по этой улице три квартала."],
      ["other", "En el semáforo dé vuelta a la derecha y la va a ver enfrente.", "На светофоре поверните направо, и она будет прямо перед вами."],
      ["me", "¿Tres cuadras y a la derecha?", "Три квартала и направо?"],
      ["other", "Eso. Son como diez minutos caminando.", "Именно. Минут десять пешком."],
      ["me", "¿Y para ir al aeropuerto desde ahí?", "А оттуда до аэропорта как добраться?"],
      ["other", "Tome la línea uno hacia Pantitlán y luego la cinco. Pero con maletas mejor pida un taxi.", "Садитесь на первую линию в сторону «Пантитлан», потом пересядьте на пятую. Но с чемоданами лучше возьмите такси."],
      ["me", "Muchas gracias, muy amable.", "Большое спасибо, вы очень любезны."],
      ["other", "De nada, que le vaya bien.", "Не за что, всего доброго."]
    ],
    vocab: [["dar vuelta", "поворачивать"], ["enfrente", "напротив, впереди"], ["caminando", "пешком"], ["hacia", "в сторону, по направлению к"], ["la línea", "линия (метро)"]]
  }
];
