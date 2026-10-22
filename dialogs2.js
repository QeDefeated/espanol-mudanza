// Ещё 8 сцен: жизнь после переезда. Формат как в dialogs.js.
window.ES_DIALOGS = (window.ES_DIALOGS || []).concat([
  {
    id: "school", title: "Запись ребёнка в школу", place: "Escuela", other: "Directora",
    role: "директор частной школы, к которой пришёл родитель-иностранец",
    lines: [
      ["me", "Buenos días. Quisiera información para inscribir a mi hija.", "Доброе утро. Я хотел бы узнать, как записать дочь."],
      ["other", "Con gusto. ¿Qué edad tiene y a qué grado entraría?", "С удовольствием. Сколько ей лет и в какой класс она пойдёт?"],
      ["me", "Tiene ocho años. En Rusia terminó segundo de primaria.", "Ей восемь. В России она окончила второй класс."],
      ["other", "Entonces entraría a tercero. ¿Ya habla español?", "Тогда она пойдёт в третий. Она уже говорит по-испански?"],
      ["me", "Un poco. Está tomando clases, pero todavía le cuesta.", "Немного. Она ходит на занятия, но ей пока тяжело."],
      ["other", "No se preocupe, los niños aprenden muy rápido. Tenemos apoyo para alumnos extranjeros.", "Не волнуйтесь, дети учатся очень быстро. У нас есть поддержка для иностранных учеников."],
      ["me", "¡Qué bueno! ¿Qué documentos necesito?", "Как хорошо! Какие документы нужны?"],
      ["other", "El acta de nacimiento apostillada, las boletas del año anterior y la CURP de la niña.", "Свидетельство о рождении с апостилем, табели за прошлый год и CURP девочки."],
      ["me", "¿Y cuánto es la colegiatura?", "А сколько стоит обучение?"],
      ["other", "Son seis mil al mes, más la inscripción y el uniforme. Le doy un folleto con todo.", "Шесть тысяч в месяц плюс вступительный взнос и форма. Я дам вам буклет со всеми деталями."]
    ],
    vocab: [["inscribir", "записать, зачислить"], ["el grado", "класс (год обучения)"], ["la primaria", "начальная школа"], ["las boletas", "табели успеваемости (Мексика)"], ["la colegiatura", "плата за обучение (Мексика)"], ["el uniforme", "школьная форма"]]
  },
  {
    id: "gym", title: "Абонемент в спортзал", place: "Gimnasio", other: "Recepcionista",
    role: "администратор спортзала",
    lines: [
      ["other", "¡Hola! ¿Te puedo ayudar en algo?", "Привет! Чем могу помочь?"],
      ["me", "Hola. Quiero saber cuánto cuesta la mensualidad.", "Привет. Хочу узнать, сколько стоит месячный абонемент."],
      ["other", "Son ochocientos al mes, o siete mil por todo el año.", "Восемьсот в месяц или семь тысяч за весь год."],
      ["me", "¿Incluye las clases de grupo?", "Групповые занятия входят?"],
      ["other", "Sí, yoga, spinning y funcional. La alberca se paga aparte.", "Да: йога, сайкл и функциональный тренинг. Бассейн оплачивается отдельно."],
      ["me", "¿Hay que pagar inscripción?", "Нужно платить вступительный взнос?"],
      ["other", "Normalmente sí, pero este mes no cobramos inscripción.", "Обычно да, но в этом месяце мы его не берём."],
      ["me", "Perfecto. ¿Puedo probar un día antes de pagar?", "Отлично. Можно попробовать один день до оплаты?"],
      ["other", "Claro, el primer día es gratis. Solo déjame una identificación.", "Конечно, первый день бесплатный. Оставь только удостоверение."],
      ["me", "Muy bien. ¿Hasta qué hora abren?", "Хорошо. До скольки вы открыты?"],
      ["other", "De lunes a viernes, de seis de la mañana a once de la noche.", "С понедельника по пятницу, с шести утра до одиннадцати вечера."]
    ],
    vocab: [["la mensualidad", "ежемесячная плата"], ["la alberca", "бассейн (Мексика); в других странах — la piscina"], ["aparte", "отдельно"], ["la inscripción", "вступительный взнос; запись"]]
  },
  {
    id: "haircut", title: "В парикмахерской", place: "Estética", other: "Estilista",
    role: "парикмахер в салоне",
    lines: [
      ["other", "Pásale. ¿Qué te vas a hacer hoy?", "Проходи. Что будем делать сегодня?"],
      ["me", "Solo un corte. Quiero mantener el largo, pero más arreglado.", "Только стрижку. Хочу оставить длину, но чтобы было аккуратнее."],
      ["other", "¿Cuánto le quito? ¿Un dedo?", "Сколько убрать? На палец?"],
      ["me", "Sí, más o menos. Y de los lados un poco más corto.", "Да, примерно. И по бокам чуть короче."],
      ["other", "¿Con máquina o con tijera?", "Машинкой или ножницами?"],
      ["me", "Con tijera, por favor. No muy corto.", "Ножницами, пожалуйста. Не очень коротко."],
      ["other", "¿Te lavo el pelo antes?", "Помыть голову перед стрижкой?"],
      ["me", "Sí, gracias. ¿Cuánto cuesta con lavado?", "Да, спасибо. Сколько это стоит с мытьём?"],
      ["other", "Son doscientos cincuenta. A ver, mírate en el espejo. ¿Así está bien?", "Двести пятьдесят. Ну-ка, посмотри в зеркало. Так нормально?"],
      ["me", "Quedó muy bien. Muchas gracias.", "Получилось отлично. Большое спасибо."]
    ],
    vocab: [["pásale", "проходи (Мексика)"], ["el corte", "стрижка"], ["el largo", "длина"], ["la máquina", "машинка (для стрижки)"], ["las tijeras", "ножницы"], ["quedar bien", "хорошо получиться, хорошо сидеть"]]
  },
  {
    id: "bankcard", title: "Карту заблокировали", place: "Llamada al banco", other: "Ejecutivo",
    role: "оператор горячей линии банка",
    lines: [
      ["other", "Gracias por llamar. Le atiende Ricardo. ¿En qué le puedo ayudar?", "Спасибо за звонок. Вас слушает Рикардо. Чем могу помочь?"],
      ["me", "Hola. Mi tarjeta no pasa desde ayer. Creo que está bloqueada.", "Здравствуйте. Моя карта не проходит со вчерашнего дня. Кажется, её заблокировали."],
      ["other", "Le ayudo a revisar. ¿Me proporciona su número de cliente?", "Помогу проверить. Назовёте номер клиента?"],
      ["me", "Sí, es el que aparece en la aplicación. Se lo dicto.", "Да, тот, что в приложении. Сейчас продиктую."],
      ["other", "Veo un bloqueo preventivo. Hubo una compra en el extranjero que el sistema marcó como sospechosa.", "Вижу превентивную блокировку. Была покупка за границей, которую система отметила как подозрительную."],
      ["me", "Sí, fui yo. Pagué una suscripción con mi tarjeta.", "Да, это был я. Я оплатил подписку картой."],
      ["other", "Perfecto. Para desbloquearla le voy a enviar un código por mensaje. Por seguridad, no me lo diga a mí: ingréselo en la aplicación.", "Отлично. Чтобы разблокировать карту, я пришлю код в сообщении. В целях безопасности не называйте его мне — введите в приложении."],
      ["me", "Listo, ya lo ingresé.", "Готово, я его ввёл."],
      ["other", "Ya quedó desbloqueada. ¿Le puedo ayudar en algo más?", "Карта разблокирована. Могу ещё чем-то помочь?"],
      ["me", "No, eso es todo. Muchas gracias.", "Нет, это всё. Большое спасибо."]
    ],
    vocab: [["la tarjeta no pasa", "карта не проходит"], ["bloquear / desbloquear", "заблокировать / разблокировать"], ["proporcionar", "предоставить (данные)"], ["sospechoso", "подозрительный"], ["ingresar", "ввести (данные)"], ["la suscripción", "подписка"]]
  },
  {
    id: "vet", title: "У ветеринара", place: "Veterinaria", other: "Veterinaria",
    role: "ветеринарный врач",
    lines: [
      ["other", "Buenas tardes. ¿Cómo se llama el paciente?", "Добрый день. Как зовут пациента?"],
      ["me", "Se llama Barsik. Es un gato de cinco años.", "Его зовут Барсик. Это кот, ему пять лет."],
      ["other", "Hola, Barsik. ¿Qué le pasa?", "Привет, Барсик. Что случилось?"],
      ["me", "Desde hace dos días casi no come y vomitó un par de veces.", "Уже два дня почти не ест, и его пару раз вырвало."],
      ["other", "¿Cambiaron su comida o se mudaron hace poco?", "Вы меняли корм или недавно переезжали?"],
      ["me", "Sí, llegamos de Rusia hace una semana. Y la comida es otra marca.", "Да, мы приехали из России неделю назад. И корм другой марки."],
      ["other", "Puede ser estrés por el viaje y el cambio de comida. Lo voy a revisar.", "Это может быть стресс от поездки и смены корма. Я его осмотрю."],
      ["other", "Tiene un poco de fiebre. Le voy a poner una inyección y le doy un medicamento para tres días.", "У него небольшая температура. Я сделаю укол и дам лекарство на три дня."],
      ["me", "¿Tiene las vacunas en orden para estar aquí?", "У него в порядке прививки, чтобы жить здесь?"],
      ["other", "Traiga su cartilla y la revisamos. Si mañana no come, regrese, por favor.", "Принесите его ветпаспорт, мы проверим. Если завтра не поест, приходите снова."]
    ],
    vocab: [["vomitar", "рвать (о рвоте)"], ["un par de veces", "пару раз"], ["la marca", "марка, бренд"], ["la inyección", "укол"], ["la vacuna", "прививка"], ["la cartilla", "ветпаспорт, карточка прививок"]]
  },
  {
    id: "dentist", title: "У стоматолога", place: "Consultorio dental", other: "Dentista",
    role: "стоматолог",
    lines: [
      ["other", "Siéntese, por favor. ¿Qué lo trae por aquí?", "Садитесь, пожалуйста. Что вас привело?"],
      ["me", "Me duele una muela cuando como algo frío.", "У меня болит зуб, когда я ем холодное."],
      ["other", "Abra la boca. ¿Es esta de aquí?", "Откройте рот. Вот этот?"],
      ["me", "Sí, esa. Me duele desde hace una semana.", "Да, этот. Болит уже неделю."],
      ["other", "Tiene una caries. No es grave, pero hay que hacer una resina.", "У вас кариес. Ничего серьёзного, но нужно поставить пломбу."],
      ["me", "¿Me va a doler?", "Будет больно?"],
      ["other", "No, le pongo anestesia. También le recomiendo una limpieza.", "Нет, я сделаю анестезию. Ещё рекомендую профессиональную чистку."],
      ["me", "¿Cuánto cuesta todo?", "Сколько всё стоит?"],
      ["other", "La resina, ochocientos, y la limpieza, seiscientos. ¿Lo hacemos hoy?", "Пломба — восемьсот, чистка — шестьсот. Сделаем сегодня?"],
      ["me", "Hoy la resina, y la limpieza la próxima semana, por favor.", "Сегодня пломбу, а чистку — на следующей неделе, пожалуйста."]
    ],
    vocab: [["¿Qué lo trae por aquí?", "что вас привело?"], ["la caries", "кариес"], ["la resina", "пломба (композитная)"], ["la anestesia", "анестезия"], ["la limpieza", "чистка (зубов)"]]
  },
  {
    id: "moveout", title: "Выезд и возврат залога", place: "Entrega del departamento", other: "Dueña",
    role: "хозяйка квартиры, принимающая квартиру при выезде жильца",
    lines: [
      ["me", "Buenos días, señora Lupita. Ya saqué todas mis cosas.", "Доброе утро, сеньора Лупита. Я уже вывез все вещи."],
      ["other", "Muy bien. Vamos a revisar el departamento juntos.", "Хорошо. Давайте вместе осмотрим квартиру."],
      ["other", "Las paredes están bien. Pero aquí hay una mancha en el piso.", "Стены в порядке. Но вот здесь пятно на полу."],
      ["me", "Esa mancha ya estaba cuando llegué. Tengo fotos del primer día.", "Это пятно было, когда я въехал. У меня есть фото с первого дня."],
      ["other", "Ah, es cierto, no me acordaba. ¿Y la llave del baño que goteaba?", "А, точно, я забыла. А кран в ванной, который капал?"],
      ["me", "La arregló el plomero el mes pasado. Aquí está el recibo.", "Его починил сантехник в прошлом месяце. Вот квитанция."],
      ["other", "Perfecto. ¿Ya pagó el último recibo de luz?", "Отлично. Последний счёт за свет вы уже оплатили?"],
      ["me", "Sí, aquí está el comprobante. ¿Cuándo me regresa el depósito?", "Да, вот подтверждение. Когда вы вернёте залог?"],
      ["other", "Se lo transfiero completo esta semana. Fue un gusto tenerlo de inquilino.", "Переведу вам всю сумму на этой неделе. Было приятно иметь такого жильца."],
      ["me", "Igualmente. Aquí están las llaves. ¡Muchas gracias por todo!", "Взаимно. Вот ключи. Большое спасибо за всё!"]
    ],
    vocab: [["la mancha", "пятно"], ["gotear", "капать, протекать"], ["el comprobante", "подтверждение, квитанция"], ["regresar el depósito", "вернуть залог"], ["fue un gusto", "было приятно"]]
  },
  {
    id: "dinner", title: "Ужин у коллеги", place: "Cena en casa", other: "Compañero",
    role: "коллега по работе, пригласивший к себе домой на ужин",
    lines: [
      ["other", "¡Qué bueno que viniste! Pásale, estás en tu casa.", "Как здорово, что ты пришёл! Проходи, будь как дома."],
      ["me", "Gracias por la invitación. Traje un vino y un postre.", "Спасибо за приглашение. Я принёс вино и десерт."],
      ["other", "¡No te hubieras molestado! Te presento a mi esposa, Carmen.", "Не стоило беспокоиться! Познакомься, это моя жена Кармен."],
      ["me", "Mucho gusto, Carmen. Qué bonita casa tienen.", "Очень приятно, Кармен. У вас очень красивый дом."],
      ["other", "Gracias. Siéntate. ¿Ya probaste el pozole?", "Спасибо. Садись. Ты уже пробовал посоле?"],
      ["me", "No, nunca. ¿Qué lleva?", "Нет, ни разу. Что в нём?"],
      ["other", "Maíz, carne de cerdo y chile. Le pones lechuga, rábano y limón al gusto.", "Кукуруза, свинина и чили. Сверху кладёшь салат, редиску и лайм по вкусу."],
      ["me", "¡Está delicioso! ¿Me pasas la sal, por favor?", "Очень вкусно! Передашь соль, пожалуйста?"],
      ["other", "Claro. Oye, ¿y qué es lo que más extrañas de Rusia?", "Конечно. Слушай, а по чему ты больше всего скучаешь в России?"],
      ["me", "A mi familia, y el invierno con nieve. Pero aquí me siento muy a gusto.", "По семье и по снежной зиме. Но здесь мне очень хорошо."],
      ["other", "¡Salud por eso! Aquí ya tienes amigos.", "За это и выпьем! Здесь у тебя уже есть друзья."]
    ],
    vocab: [["estás en tu casa", "будь как дома"], ["no te hubieras molestado", "не стоило беспокоиться"], ["el pozole", "посоле — мексиканский суп с кукурузой"], ["al gusto", "по вкусу"], ["¿Me pasas…?", "передашь…?"], ["sentirse a gusto", "чувствовать себя комфортно"]]
  }
]);
