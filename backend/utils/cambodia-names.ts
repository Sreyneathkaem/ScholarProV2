/**
 * Authentic Cambodian names database and generation utilities.
 * Surnames (Family Names) and Given Names (Male, Female)
 * with English transliteration and Khmer script.
 */

export interface NamePair {
  en: string;
  kh: string;
}

export const CAMBODIAN_SURNAMES: NamePair[] = [
  { en: "Chan", kh: "ចាន់" },
  { en: "Chea", kh: "ជា" },
  { en: "Chhay", kh: "ឆាយ" },
  { en: "Chhim", kh: "ឈឹម" },
  { en: "Chhum", kh: "ឈុំ" },
  { en: "Chou", kh: "ជូ" },
  { en: "Chuon", kh: "ជួន" },
  { en: "Dam", kh: "ដាំ" },
  { en: "Dy", kh: "ឌី" },
  { en: "Em", kh: "អែម" },
  { en: "Hang", kh: "ហង្ស" },
  { en: "Heng", kh: "ហេង" },
  { en: "Hong", kh: "ហុង" },
  { en: "Huot", kh: "ហួត" },
  { en: "Im", kh: "អ៊ឹម" },
  { en: "In", kh: "អ៊ិន" },
  { en: "Kang", kh: "កាំង" },
  { en: "Keo", kh: "កែវ" },
  { en: "Khiev", kh: "ខៀវ" },
  { en: "Khim", kh: "ឃឹម" },
  { en: "Kim", kh: "គីម" },
  { en: "Kong", kh: "គង់" },
  { en: "Kov", kh: "កូវ" },
  { en: "Kuy", kh: "គុយ" },
  { en: "Lay", kh: "ឡាយ" },
  { en: "Lim", kh: "លីម" },
  { en: "Liv", kh: "លីវ" },
  { en: "Long", kh: "ឡុង" },
  { en: "Lor", kh: "ល័រ" },
  { en: "Ly", kh: "លី" },
  { en: "Mam", kh: "ម៉ម" },
  { en: "Mao", kh: "ម៉ៅ" },
  { en: "Meas", kh: "មាស" },
  { en: "Meng", kh: "ម៉េង" },
  { en: "Mom", kh: "មុំ" },
  { en: "Muong", kh: "មឿង" },
  { en: "Ney", kh: "ណី" },
  { en: "Ngeth", kh: "ង៉ែត" },
  { en: "Nou", kh: "នូ" },
  { en: "Nov", kh: "ណុប" },
  { en: "Ouk", kh: "អ៊ុក" },
  { en: "Pen", kh: "ប៉ែន" },
  { en: "Phan", kh: "ផាន់" },
  { en: "Phat", kh: "ផាត់" },
  { en: "Phon", kh: "ផុន" },
  { en: "Phoung", kh: "ភឿង" },
  { en: "Pich", kh: "ពេជ្រ" },
  { en: "Prak", kh: "ប្រាក់" },
  { en: "Prum", kh: "ព្រំ" },
  { en: "Ros", kh: "រស់" },
  { en: "Sam", kh: "សំ" },
  { en: "San", kh: "សាន" },
  { en: "Sar", kh: "សារ" },
  { en: "Say", kh: "សាយ" },
  { en: "Seng", kh: "សេង" },
  { en: "Sin", kh: "ស៊ីន" },
  { en: "So", kh: "សូ" },
  { en: "Sok", kh: "សុខ" },
  { en: "Som", kh: "សោម" },
  { en: "Song", kh: "សុង" },
  { en: "Suon", kh: "សួន" },
  { en: "Taing", kh: "តាំង" },
  { en: "Tep", kh: "ទេព" },
  { en: "Thai", kh: "ថៃ" },
  { en: "Tiv", kh: "ទីវ" },
  { en: "Toch", kh: "តូច" },
  { en: "Touch", kh: "ទូច" },
  { en: "Tuy", kh: "ទុយ" },
  { en: "Ty", kh: "ទី" },
  { en: "Um", kh: "អ៊ុំ" },
  { en: "Ung", kh: "អ៊ឹង" },
  { en: "Van", kh: "វ៉ាន់" },
  { en: "Vong", kh: "វង្ស" },
  { en: "Yim", kh: "យឹម" },
  { en: "Yin", kh: "យិន" },
  { en: "Yov", kh: "យូវ" },
];

export const CAMBODIAN_MALE_GIVEN_NAMES: NamePair[] = [
  { en: "Borey", kh: "បុរី" },
  { en: "Bunrith", kh: "ប៊ុនរិទ្ធ" },
  { en: "Bunrong", kh: "ប៊ុនរ៉ុង" },
  { en: "Chamroeun", kh: "ចំរើន" },
  { en: "Chanarith", kh: "ច័ន្ទណារិទ្ធ" },
  { en: "Channarith", kh: "ចាន់ណារិទ្ធ" },
  { en: "Chanthy", kh: "ចាន់ធី" },
  { en: "Chetra", kh: "ចេត្រា" },
  { en: "Dara", kh: "តារា" },
  { en: "Heng", kh: "ហេង" },
  { en: "Khemara", kh: "ខេមរា" },
  { en: "Kimlong", kh: "គីមឡុង" },
  { en: "Kiri", kh: "គិរី" },
  { en: "Kosal", kh: "កុសល" },
  { en: "Makara", kh: "មករា" },
  { en: "Mengly", kh: "ម៉េងលី" },
  { en: "Mony", kh: "មុនី" },
  { en: "Muny", kh: "មុនី" },
  { en: "Narith", kh: "ណារិទ្ធ" },
  { en: "Oudom", kh: "ឧត្តម" },
  { en: "Panha", kh: "បញ្ញា" },
  { en: "Pheakdey", kh: "ភក្តី" },
  { en: "Phirun", kh: "ភិរុណ" },
  { en: "Piseth", kh: "ពិសិដ្ឋ" },
  { en: "Ponlok", kh: "ពន្លក" },
  { en: "Ratanak", kh: "រតនៈ" },
  { en: "Rith", kh: "រិទ្ធ" },
  { en: "Rithy", kh: "រិទ្ធី" },
  { en: "Roth", kh: "រ័ត្ន" },
  { en: "Sambath", kh: "សម្បត្តិ" },
  { en: "Samnang", kh: "សំណាង" },
  { en: "Sarath", kh: "សារ៉ាត់" },
  { en: "Sengly", kh: "សេងលី" },
  { en: "Serey", kh: "សេរី" },
  { en: "Seyha", kh: "សីហា" },
  { en: "Socheat", kh: "សុជាតិ" },
  { en: "Sokha", kh: "សុខា" },
  { en: "Sopheak", kh: "សុភ័ក្ត្រ" },
  { en: "Sovann", kh: "សុវណ្ណ" },
  { en: "Sovannarith", kh: "សុវណ្ណារិទ្ធ" },
  { en: "Theara", kh: "ធារ៉ា" },
  { en: "Vanna", kh: "វណ្ណា" },
  { en: "Vannak", kh: "វណ្ណៈ" },
  { en: "Veasna", kh: "វាសនា" },
  { en: "Vibol", kh: "វិបុល" },
  { en: "Vicheka", kh: "វិច្ឆិកា" },
  { en: "Virak", kh: "វីរៈ" },
  { en: "Visal", kh: "វិសាល" },
  { en: "Viseth", kh: "វិសេស" },
];

export const CAMBODIAN_FEMALE_GIVEN_NAMES: NamePair[] = [
  { en: "Bopha", kh: "បុប្ផា" },
  { en: "Botum", kh: "បទុម" },
  { en: "Channary", kh: "ច័ន្ទណារី" },
  { en: "Chantrea", kh: "ចន្ទ្រា" },
  { en: "Chenda", kh: "ចិន្តា" },
  { en: "Dalin", kh: "ដាលីន" },
  { en: "Daneth", kh: "ដានិត" },
  { en: "Dany", kh: "ដានី" },
  { en: "Devi", kh: "ទេវី" },
  { en: "Kalyan", kh: "កល្យាណ" },
  { en: "Kannitha", kh: "កន្និដ្ឋា" },
  { en: "Kanya", kh: "កញ្ញា" },
  { en: "Kolab", kh: "កុលាប" },
  { en: "Kunthea", kh: "គន្ធា" },
  { en: "Leakhena", kh: "លក្ខិណា" },
  { en: "Malis", kh: "ម្លិះ" },
  { en: "Mealea", kh: "មាលា" },
  { en: "Monirath", kh: "មុនីរ័ត្ន" },
  { en: "Morokot", kh: "មរកត" },
  { en: "Neary", kh: "នារី" },
  { en: "Nisay", kh: "និស្ស័យ" },
  { en: "Phalla", kh: "ផល្លា" },
  { en: "Pich", kh: "ពេជ្រ" },
  { en: "Rachana", kh: "រចនា" },
  { en: "Rath", kh: "រ័ត្ន" },
  { en: "Romdoul", kh: "រំដួល" },
  { en: "Socheata", kh: "សុជាតា" },
  { en: "Sokha", kh: "សុខា" },
  { en: "Sokunthea", kh: "សុគន្ធា" },
  { en: "Sophea", kh: "សុភា" },
  { en: "Sophy", kh: "សុភី" },
  { en: "Sothea", kh: "សុធា" },
  { en: "Sreymom", kh: "ស្រីមុំ" },
  { en: "Sreyneang", kh: "ស្រីនាង" },
  { en: "Sreypov", kh: "ស្រីពៅ" },
  { en: "Tep", kh: "ទេព" },
  { en: "Theavy", kh: "ទេវី" },
  { en: "Thida", kh: "ធីតា" },
  { en: "Thyda", kh: "ធីតា" },
  { en: "Vanny", kh: "វ៉ាន់នី" },
  { en: "Vatana", kh: "វឌ្ឍនា" },
];

export interface GeneratedCambodianName {
  nameEn: string;
  nameKh: string;
  surnameEn: string;
  surnameKh: string;
  givenNameEn: string;
  givenNameKh: string;
}

/**
 * Generate a realistic Cambodian name with English and Khmer versions.
 * In Cambodia, official format is typically [Surname] [Given Name]
 * e.g. "Chan Sokha" (ចាន់ សុខា), "Heng Dara" (ហេង តារា), "Chea Bopha" (ជា បុប្ផា).
 */
export function generateCambodianName(
  gender?: "male" | "female",
  seedIndex?: number
): GeneratedCambodianName {
  const isFemale =
    gender === "female" ||
    (gender === undefined &&
      (seedIndex !== undefined ? seedIndex % 2 === 1 : Math.random() < 0.5));

  const givenPool = isFemale
    ? CAMBODIAN_FEMALE_GIVEN_NAMES
    : CAMBODIAN_MALE_GIVEN_NAMES;

  let surname: NamePair;
  let given: NamePair;

  if (seedIndex !== undefined) {
    surname = CAMBODIAN_SURNAMES[seedIndex % CAMBODIAN_SURNAMES.length];
    given = givenPool[Math.floor(seedIndex / CAMBODIAN_SURNAMES.length) % givenPool.length];
  } else {
    surname = CAMBODIAN_SURNAMES[Math.floor(Math.random() * CAMBODIAN_SURNAMES.length)];
    given = givenPool[Math.floor(Math.random() * givenPool.length)];
  }

  return {
    nameEn: `${surname.en} ${given.en}`,
    nameKh: `${surname.kh} ${given.kh}`,
    surnameEn: surname.en,
    surnameKh: surname.kh,
    givenNameEn: given.en,
    givenNameKh: given.kh,
  };
}

/**
 * Generate realistic email based on Cambodian English name.
 */
export function generateCambodianEmail(
  givenNameEn: string,
  surnameEn: string,
  id: number | string
): string {
  const cleanGiven = givenNameEn.toLowerCase().replace(/[^a-z]/g, "");
  const cleanSurname = surnameEn.toLowerCase().replace(/[^a-z]/g, "");
  const domains = ["gmail.com", "gmail.com", "yahoo.com", "outlook.com"];
  const domain = domains[Number(id) % domains.length];
  return `${cleanGiven}.${cleanSurname}${id}@${domain}`;
}

/**
 * Generate Cambodian parent/guardian name matching student's surname.
 */
export function generateCambodianParentName(
  studentSurnameEn: string,
  relationship: string = "Father",
  seedIndex?: number
): string {
  const isMother = relationship.toLowerCase().includes("mother");
  const givenPool = isMother ? CAMBODIAN_FEMALE_GIVEN_NAMES : CAMBODIAN_MALE_GIVEN_NAMES;
  
  let given: NamePair;
  if (seedIndex !== undefined) {
    given = givenPool[seedIndex % givenPool.length];
  } else {
    given = givenPool[Math.floor(Math.random() * givenPool.length)];
  }

  return `${studentSurnameEn} ${given.en}`;
}
