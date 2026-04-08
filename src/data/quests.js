export const BIRTHDAY_GATE = {
  time: '23-00',
  date: '08-04-2005',
  dollarRates: ['27', '28']
}

export const QUESTS = [
  {
    id: 'q1',
    title: 'Что-то пришло?!',
    question: 'Кто же ты, Илья? Проверь почтовый ящик, там тебя ждет что то, что положит начало чему то неебическому.',
    answers: ['именинник', 'долбоёб'],
    completionCard: {
      imagePath: 'quest-images/friends/photo_2026-04-07_19-50-14.jpg',
      caption: 'Пацаны ждут на следующей точке'
    }
  },
  {
    id: 'q2',
    title: 'Не 🤨, а говно',
    question: 'Назови место где ты можешь находится до 23:00',
    answers: ['общага', 'общежитие', 'дрочильня'],
    followUp: {
      imagePath: 'quest-images/photo_2026-04-07_23-03-21.jpg',
      coordinates: '55.998424, 37.224491',
      prompt: 'Напиши здесь то, что там найдешь',
      answers: ['человек паук', 'человеку пук', 'человекпаук', 'человек-паук']
    },
    completionCard: {
      imagePath: 'quest-images/friends/photo_2026-04-07_19-50-21.jpg',
      caption: 'Отлично. Двигайся дальше'
    }
  },
  {
    id: 'q3',
    title: 'Похуй опоздали',
    question: 'Назови район где находятся самые большие часы в Зеленограде',
    answers: ['мжк', 'молодежный жилой комплекс', 'молодёжный жилой комплекс', 'хуй знает'],
    followUp: {
      imagePath: 'quest-images/photo_2026-04-07_23-03-26.jpg',
      coordinates: '55.992318, 37.248618',
      prompt: 'Напиши здесь то, что там найдешь',
      answers: ['гитара', 'гитару', 'гитарка']
    },
    completionCard: {
      imagePath: 'quest-images/friends/photo_2026-04-07_19-50-51.jpg',
      caption: 'Квест закрыт, красавчик'
    }
  },
  {
    id: 'q4',
    title: 'Любит, не любит',
    question: 'Я люблю ... (не человека, а что?)',
    answers: ['колю', 'зеленоград', 'члены', 'сосать хуи'],
    followUp: {
      imagePath: 'quest-images/photo_2026-04-07_23-03-30.jpg',
      coordinates: '55.987789, 37.229150',
      prompt: 'Напиши здесь то, что там найдешь',
      answers: ['кофе', 'кофеин', 'кофейня']
    },
    completionCard: {
      imagePath: 'quest-images/friends/photo_2026-04-07_19-51-36.jpg',
      caption: 'Ещё немного до финала'
    }
  },
  {
    id: 'q5',
    title: 'Просто парк',
    question: 'Одноименнное место в Костроме',
    answers: ['парк победы', 'пп'],
    followUp: {
      imagePath: 'quest-images/photo_2026-04-07_23-03-33.jpg',
      coordinates: '55.984966, 37.224913',
      prompt: 'Напиши здесь то, что там найдешь',
      answers: ['граф', 'пёс', 'граф пёс', 'графпёс']
    },
    completionCard: {
      imagePath: 'quest-images/friends/photo_2026-04-07_20-25-26.jpg',
      caption: 'Котики, осталось совсем чуть-чуть'
    }
  },
  {
    id: 'q6',
    title: 'Пора домой',
    question: 'Тебе уже 100% пора на...',
    answers: ['вокзал', 'к насте', 'к пацанам', 'домой', 'жд вокзал'],
    followUp: {
      imagePath: 'quest-images/yaroslavskij-vokzal-165409big.jpg',
      coordinates: '55.777616, 37.657203',
      prompt: 'Напиши здесь то, что Настя тебе передаст',
      answers: ['ярославль', 'ярик', 'ярославский вокзал']
    },
    completionCard: {
      imagePath: 'quest-images/friends/photo_2026-04-07_20-23-52.jpg',
      caption: 'Зайки'
    }
  },
  {
    id: 'q7',
    title: 'Пацанов не судят',
    question: 'Угадай число от 1 до 1000000 (можно спросить у пацанов лично, но они не обязаны отвечать)',
    answers: ['842005']
  }
]
