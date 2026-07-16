/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Horse, Kosek, Vaccination, FatteningRecord, CullRecord } from './types';

export const INITIAL_HORSES: Horse[] = [
  // Жеребцы-производители (Stallions)
  {
    id: 'h-stallion-1',
    name: 'Кокжал',
    coat: 'Вороная',
    birthDate: '2018-04-12',
    gender: 'stallion',
    sireId: 'h-stallion-5',
    sireName: 'Арлан',
    damId: 'h-mare-ancestor-1',
    damName: 'Актоты',
    owner: 'ТОО Кулагер',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1501472312651-726afd116ff1?w=800&auto=format&fit=crop&q=80',
    kosekId: 'k-1',
    notes: 'Элитный жеребец-производитель новоалтайской породы. Лидер косяка №1. Отличная выносливость.'
  },
  {
    id: 'h-stallion-2',
    name: 'Барон',
    coat: 'Гнедая',
    birthDate: '2016-05-20',
    gender: 'stallion',
    sireId: null,
    damId: null,
    owner: 'ИП Усенов',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1598974357801-cbca100e6563?w=800&auto=format&fit=crop&q=80',
    kosekId: 'k-2',
    notes: 'Чистокровный гнедой жеребец, завезен из Алтая. Лидер косяка №2.'
  },
  {
    id: 'h-stallion-3',
    name: 'Тайфун',
    coat: 'Серая',
    birthDate: '2020-03-15',
    gender: 'stallion',
    sireId: null,
    damId: null,
    owner: 'ТОО Кулагер',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=800&auto=format&fit=crop&q=80',
    kosekId: 'k-3',
    notes: 'Молодой серый жеребец, лидер формирующегося косяка №3.'
  },
  {
    id: 'h-stallion-4',
    name: 'Султан',
    coat: 'Буланая',
    birthDate: '2021-06-01',
    gender: 'stallion',
    sireId: null,
    damId: null,
    owner: 'ТОО Кулагер',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=800&auto=format&fit=crop&q=80',
    kosekId: null,
    notes: 'Резервный жеребец, временно без косяка.'
  },

  // Предки для демонстрации древа родословной (Ancestors)
  {
    id: 'h-stallion-5',
    name: 'Арлан',
    coat: 'Рыжая',
    birthDate: '2010-05-10',
    gender: 'stallion',
    sireId: null,
    damId: null,
    owner: 'ТОО Кулагер',
    status: 'active', // Или на пенсии, главное активен в БД предков
    kosekId: null,
    notes: 'Чемпион породы 2015 года. Отец Кокжала.'
  },
  {
    id: 'h-mare-ancestor-1',
    name: 'Актоты',
    coat: 'Серая',
    birthDate: '2008-04-05',
    gender: 'mare',
    sireId: null,
    damId: null,
    owner: 'ТОО Кулагер',
    status: 'active',
    kosekId: null,
    notes: 'Мать Кокжала, дала выдающееся потомство.'
  },

  // Кобылы (Mares) - Косяк 1 (Кокжал)
  {
    id: 'h-mare-1',
    name: 'Шолпан',
    coat: 'Гнедая',
    birthDate: '2020-05-15',
    gender: 'mare',
    sireId: 'h-stallion-2', // Барон
    sireName: 'Барон',
    damId: 'h-mare-5',      // Жулдыз
    damName: 'Жулдыз',
    owner: 'ТОО Кулагер',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500&auto=format&fit=crop&q=80',
    kosekId: 'k-1',
    isPregnant: false,
    lastFoalingDate: '2026-07-05',
    notes: 'Кобыла в косяке Кокжала. Благополучно ожеребилась 5 июля 2026 г.'
  },
  {
    id: 'h-mare-2',
    name: 'Алтынай',
    coat: 'Вороная',
    birthDate: '2021-04-02',
    gender: 'mare',
    sireId: null,
    damId: null,
    owner: 'ТОО Кулагер',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=500&auto=format&fit=crop&q=80',
    kosekId: 'k-1',
    isPregnant: false,
    lastFoalingDate: '2026-07-01',
    notes: 'Молодая кобыла с отличным экстерьером. Благополучно ожеребилась 1 июля 2026 г.'
  },
  {
    id: 'h-mare-3',
    name: 'Куралай',
    coat: 'Серая',
    birthDate: '2019-06-18',
    gender: 'mare',
    sireId: null,
    damId: null,
    owner: 'ТОО Кулагер',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=500&auto=format&fit=crop&q=80',
    kosekId: 'k-1',
    isPregnant: false,
    notes: 'Привела здорового жеребенка в мае.'
  },

  // Кобылы - Косяк 2 (Барон)
  {
    id: 'h-mare-4',
    name: 'Айсулу',
    coat: 'Рыжая',
    birthDate: '2018-05-11',
    gender: 'mare',
    sireId: null,
    damId: null,
    owner: 'ИП Усенов',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500&auto=format&fit=crop&q=80',
    kosekId: 'k-2',
    isPregnant: true,
    pregnancyDate: '2025-10-15',
    pregnancyDueDate: '2026-09-15',
    notes: 'Стабильная репродуктивная кобыла.'
  },
  {
    id: 'h-mare-5',
    name: 'Жулдыз',
    coat: 'Саврасая',
    birthDate: '2017-07-22',
    gender: 'mare',
    sireId: null,
    damId: null,
    owner: 'ТОО Кулагер',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=500&auto=format&fit=crop&q=80',
    kosekId: 'k-2',
    isPregnant: false,
    notes: 'Мать Шолпан. Выносливая кобыла.'
  },
  {
    id: 'h-mare-6',
    name: 'Раушан',
    coat: 'Буланая',
    birthDate: '2021-05-25',
    gender: 'mare',
    sireId: null,
    damId: null,
    owner: 'ТОО Кулагер',
    status: 'active',
    kosekId: 'k-2',
    isPregnant: false,
    notes: 'Молодая кобыла с золотистым окрасом.'
  },

  // Кобылы - Косяк 3 (Тайфун)
  {
    id: 'h-mare-7',
    name: 'Баян',
    coat: 'Гнедая',
    birthDate: '2022-04-18',
    gender: 'mare',
    sireId: null,
    damId: null,
    owner: 'ТОО Кулагер',
    status: 'active',
    kosekId: 'k-3',
    isPregnant: false,
    notes: 'Переведена в косяк Тайфуна для первого покрытия.'
  },

  // Молодняк и мерины (Youngsters & Geldings)
  {
    id: 'h-young-1',
    name: 'Тулпар',
    coat: 'Вороная',
    birthDate: '2024-05-01', // 2 года
    gender: 'gelding',
    sireId: 'h-stallion-1', // Кокжал
    sireName: 'Кокжал',
    damId: 'h-mare-1',      // Шолпан
    damName: 'Шолпан',
    owner: 'ТОО Кулагер',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1538681105587-85640961bf8b?w=500&auto=format&fit=crop&q=80',
    kosekId: null,
    notes: 'Перспективный молодой жеребчик с чистой родословной.'
  },
  {
    id: 'h-young-2',
    name: 'Арман',
    coat: 'Рыжая',
    birthDate: '2023-06-12', // 3 года
    gender: 'gelding',
    sireId: 'h-stallion-2', // Барон
    sireName: 'Барон',
    damId: 'h-mare-4',      // Айсулу
    damName: 'Айсулу',
    owner: 'ИП Усенов',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500&auto=format&fit=crop&q=80',
    kosekId: null,
    notes: 'Активный, крепкого телосложения.'
  },
  {
    id: 'h-foal-kulan',
    name: 'Кулан',
    coat: 'Буланая',
    birthDate: '2026-07-05', // Новорожденный жеребенок
    gender: 'stallion', // жеребчик
    sireId: 'h-stallion-1', // Кокжал
    sireName: 'Кокжал',
    damId: 'h-mare-1', // Шолпан
    damName: 'Шолпан',
    owner: 'ТОО Кулагер',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=500&auto=format&fit=crop&q=80',
    kosekId: 'k-1', // В косяке Кокжала вместе с матерью
    notes: 'Новорожденный жеребчик (Құлын) от Шолпан.'
  },
  {
    id: 'h-foal-aisapy',
    name: 'Айсапы',
    coat: 'Вороная',
    birthDate: '2026-07-01', // Новорожденный жеребенок
    gender: 'mare', // кобылка
    sireId: 'h-stallion-1', // Кокжал
    sireName: 'Кокжал',
    damId: 'h-mare-2', // Алтынай
    damName: 'Алтынай',
    owner: 'ТОО Кулагер',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80',
    kosekId: 'k-1', // В косяке Кокжала вместе с матерью
    notes: 'Новорожденная кобылка (Құлын) от Алтынай.'
  },

  // Лошади на откорме (Fattening Horses)
  {
    id: 'h-fattening-1',
    name: 'Тулпар-II',
    coat: 'Гнедая',
    birthDate: '2022-05-20',
    gender: 'gelding',
    sireId: null,
    damId: null,
    owner: 'ТОО Кулагер',
    status: 'fattening',
    imageUrl: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=500&auto=format&fit=crop&q=80',
    kosekId: null,
    notes: 'Поставлен на интенсивный нажировочный откорм.'
  },
  {
    id: 'h-fattening-2',
    name: 'Карагер',
    coat: 'Вороная',
    birthDate: '2021-04-10',
    gender: 'gelding',
    sireId: null,
    damId: null,
    owner: 'ИП Усенов',
    status: 'fattening',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80',
    kosekId: null,
    notes: 'На откорме зерновыми смесями.'
  }
];

export const INITIAL_KOSEKS: Kosek[] = [
  {
    id: 'k-1',
    name: 'Косяк Кокжала',
    stallionId: 'h-stallion-1',
    location: 'Пастбище "Сарыарка" (Восточный сектор)',
    description: 'Основной племенной табунный косяк. Включает элитных кобыл новоалтайской породы.'
  },
  {
    id: 'k-2',
    name: 'Косяк Барона',
    stallionId: 'h-stallion-2',
    location: 'Пастбище "Жайлау" (Северный сектор)',
    description: 'Второй косяк, специализирующийся на спортивном и верховом направлении.'
  },
  {
    id: 'k-3',
    name: 'Косяк Тайфуна',
    stallionId: 'h-stallion-3',
    location: 'Пастбище "Шалкар" (Около озера)',
    description: 'Новый косяк из молодых кобыл для увеличения поголовья.'
  }
];

export const INITIAL_VACCINATIONS: Vaccination[] = [
  {
    id: 'v-foal-kulan-1',
    horseId: 'h-foal-kulan',
    horseName: 'Кулан',
    disease: 'Мыт (Strangles)',
    date: '2026-07-05',
    nextDueDate: '2027-01-05', // 6 months from birth
    veterinarian: 'Д-р Ахметов К. С.',
    status: 'planned'
  },
  {
    id: 'v-foal-aisapy-1',
    horseId: 'h-foal-aisapy',
    horseName: 'Айсапы',
    disease: 'Мыт (Strangles)',
    date: '2026-07-01',
    nextDueDate: '2027-01-01', // 6 months from birth
    veterinarian: 'Д-р Ахметов К. С.',
    status: 'planned'
  },
  {
    id: 'v-1',
    horseId: 'h-stallion-1',
    horseName: 'Кокжал',
    disease: 'Сибирская язва',
    date: '2026-05-10',
    nextDueDate: '2027-05-10',
    veterinarian: 'Д-р Ахметов К. С.',
    status: 'completed'
  },
  {
    id: 'v-2',
    horseId: 'h-mare-1',
    horseName: 'Шолпан',
    disease: 'Грипп лошадей',
    date: '2026-06-15',
    nextDueDate: '2026-12-15',
    veterinarian: 'Д-р Ахметов К. С.',
    status: 'completed'
  },
  {
    id: 'v-3',
    horseId: 'h-mare-2',
    horseName: 'Алтынай',
    disease: 'Сап (Malleus)',
    date: '2025-07-20',
    nextDueDate: '2026-07-20', // Скоро просрочится или просрочена
    veterinarian: 'Д-р Ахметов К. С.',
    status: 'planned'
  },
  {
    id: 'v-4',
    horseId: 'h-young-1',
    horseName: 'Тулпар',
    disease: 'Мыт (Strangles)',
    date: '2026-01-10',
    nextDueDate: '2026-07-10', // Просрочена!
    veterinarian: 'Д-р Сериков А. Б.',
    status: 'overdue'
  },
  {
    id: 'v-5',
    horseId: 'h-stallion-2',
    horseName: 'Барон',
    disease: 'Сибирская язва',
    date: '2026-05-12',
    nextDueDate: '2027-05-12',
    veterinarian: 'Д-р Ахметов К. С.',
    status: 'completed'
  }
];

export const INITIAL_FATTENING_RECORDS: FatteningRecord[] = [
  {
    id: 'fr-1',
    horseId: 'h-fattening-1',
    horseName: 'Тулпар-II',
    startDate: '2026-06-01',
    durationDays: 90,
    endDate: '2026-08-30',
    startWeight: 420,
    currentWeight: 465,
    notes: 'Плановое увеличение веса перед осенней реализацией. Хороший аппетит, корма клевер/овес.'
  },
  {
    id: 'fr-2',
    horseId: 'h-fattening-2',
    horseName: 'Карагер',
    startDate: '2026-06-15',
    durationDays: 60,
    endDate: '2026-08-14',
    startWeight: 395,
    currentWeight: 430,
    notes: 'Короткий интенсивный нагул на естественном травостое и ячмене.'
  }
];

// Лог ушедших на забой (Culled Horses History)
// Эти лошади ИЗНАЧАЛЬНО вычтены из активных, но хранятся в архиве забоя
export const INITIAL_CULL_RECORDS: CullRecord[] = [
  {
    id: 'cr-1',
    horseId: 'h-archive-1',
    horseName: 'Актос',
    coat: 'Серая',
    gender: 'gelding',
    cullDate: '2026-06-30',
    weight: 480,
    meatYield: 260,
    reason: 'Возрастное списание и плановый забой на согым',
    revenue: 350000
  },
  {
    id: 'cr-2',
    horseId: 'h-archive-2',
    horseName: 'Скат',
    coat: 'Гнедая',
    gender: 'gelding',
    cullDate: '2026-05-15',
    weight: 510,
    meatYield: 285,
    reason: 'Травма конечности, несовместимая со службой',
    revenue: 380000
  }
];
