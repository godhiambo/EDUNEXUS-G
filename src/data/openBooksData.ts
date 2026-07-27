export interface OpenBookChapter {
  title: string;
  content: string;
}

export interface OpenBook {
  id: string;
  title: string;
  author: string;
  category: 'Literature & Classics' | 'STEM & Textbooks' | 'Children & Multilingual' | 'History & Social Sciences' | 'Philosophy & Thought';
  subject: string;
  gradeLevel: string;
  coverBg: string;
  coverEmoji: string;
  summary: string;
  language: string;
  pageCount: number;
  downloadFormats: string[];
  license: string;
  gutenbergId?: number;
  openStaxUrl?: string;
  externalUrl: string;
  chapters: OpenBookChapter[];
}

export const OPEN_BOOKS_CATALOG: OpenBook[] = [
  {
    id: 'book-alice-in-wonderland',
    title: "Alice's Adventures in Wonderland",
    author: 'Lewis Carroll',
    category: 'Literature & Classics',
    subject: 'English Literature',
    gradeLevel: 'Primary & Secondary',
    coverBg: 'from-amber-500 via-rose-500 to-purple-600',
    coverEmoji: '🐇',
    summary: 'A classic 1865 fantasy novel about a young girl named Alice who falls through a rabbit hole into a subterranean fantasy world populated by peculiar, anthropomorphic creatures.',
    language: 'English',
    pageCount: 192,
    downloadFormats: ['EPUB', 'PDF', 'Plain Text'],
    license: 'Public Domain (Project Gutenberg)',
    gutenbergId: 11,
    externalUrl: 'https://www.gutenberg.org/ebooks/11',
    chapters: [
      {
        title: 'Chapter I: Down the Rabbit-Hole',
        content: `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice 'without pictures or conversations?'

So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.

There was nothing so VERY remarkable in that; nor did Alice think it so VERY much out of the way to hear the Rabbit say to itself, 'Oh dear! Oh dear! I shall be late!' (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually TOOK A WATCH OUT OF ITS WASTECOAT-POCKET, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.`
      },
      {
        title: 'Chapter II: The Pool of Tears',
        content: `'Curiouser and curiouser!' cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English); 'now I'm opening out like the largest telescope that ever was! Good-bye, feet!' (for when she looked down at her feet, they seemed to be almost out of sight, they were getting so far off).

'Oh, my poor little feet, I wonder who will put on your shoes and stockings for you now, dears? I'm sure I shan't be able! I shall be a great deal too far off to trouble myself about you: you must manage the best way you can; — but I must be kind to them,' thought Alice, 'or perhaps they won't walk the way I want to go! Let me see: I'll give them a new pair of boots every Christmas.'`
      }
    ]
  },
  {
    id: 'book-openstax-algebra',
    title: 'College Algebra 2e (OpenStax)',
    author: 'Jay Abramson et al. (OpenStax)',
    category: 'STEM & Textbooks',
    subject: 'Mathematics',
    gradeLevel: 'Secondary & University',
    coverBg: 'from-blue-600 via-indigo-600 to-[#5f6f52]',
    coverEmoji: '📐',
    summary: 'Comprehensive, peer-reviewed open textbook covering equations, functions, linear models, polynomial and rational functions, exponential and logarithmic functions.',
    language: 'English',
    pageCount: 890,
    downloadFormats: ['PDF', 'Web Reader', 'EPUB'],
    license: 'CC BY 4.0 (OpenStax)',
    openStaxUrl: 'https://openstax.org/details/books/college-algebra-2e',
    externalUrl: 'https://openstax.org/details/books/college-algebra-2e',
    chapters: [
      {
        title: 'Chapter 1: Prerequisites and Fundamental Algebra',
        content: `Algebraic principles form the foundation of higher mathematics, physics, engineering, and data science. In this chapter, we review fundamental properties of real numbers, exponents, radical expressions, and polynomials.

1.1 Real Numbers: Algebra Essentials
The set of real numbers consists of rational numbers (fractions and terminating/repeating decimals) and irrational numbers (such as pi and sqrt(2)).
Properties of Real Numbers:
- Commutative Property of Addition: a + b = b + a
- Associative Property of Multiplication: (a * b) * c = a * (b * c)
- Distributive Property: a * (b + c) = a*b + a*c

1.2 Exponents and Scientific Notation
Exponents simplify repeated multiplication.
Rules of Exponents:
- Product Rule: x^a * x^b = x^(a + b)
- Quotient Rule: x^a / x^b = x^(a - b)
- Power Rule: (x^a)^b = x^(a * b)
- Negative Exponent Rule: x^(-n) = 1 / (x^n)`
      },
      {
        title: 'Chapter 2: Linear Equations and Functions',
        content: `A linear equation in one variable is an equation that can be written in the form ax + b = 0, where a and b are real numbers and a is not equal to zero.

Solving Linear Equations:
1. Simplify both sides by clearing parentheses and combining like terms.
2. Use addition or subtraction properties to isolate variable terms on one side.
3. Use multiplication or division properties to solve for the unknown variable.

Slope-Intercept Form of a Line:
y = mx + b
where m is the slope (rise over run) and b is the y-intercept (0, b).`
      }
    ]
  },
  {
    id: 'book-openstax-biology',
    title: 'Concepts of Biology (OpenStax)',
    author: 'Samantha Fowler et al. (OpenStax)',
    category: 'STEM & Textbooks',
    subject: 'Biology & Life Sciences',
    gradeLevel: 'Secondary & High School',
    coverBg: 'from-emerald-600 via-teal-600 to-cyan-700',
    coverEmoji: '🧬',
    summary: 'An introductory biology textbook designed for non-science majors, covering cell structure, photosynthesis, genetics, evolution, and ecological biodiversity.',
    language: 'English',
    pageCount: 620,
    downloadFormats: ['PDF', 'Web Reader', 'EPUB'],
    license: 'CC BY 4.0 (OpenStax)',
    openStaxUrl: 'https://openstax.org/details/books/concepts-biology',
    externalUrl: 'https://openstax.org/details/books/concepts-biology',
    chapters: [
      {
        title: 'Chapter 1: Introduction to Biology and the Process of Science',
        content: `Biology is the study of life. What does it mean to be alive? Living organisms share key characteristics: order, sensitivity or response to stimuli, reproduction, adaptation, growth and development, regulation/homeostasis, and energy processing.

The Scientific Method:
Science is a systematic process of acquiring knowledge about the natural world through empirical observation and experimentation.
1. Make an observation.
2. Formulate a testable hypothesis.
3. Design and conduct a controlled experiment.
4. Analyze data and draw evidence-based conclusions.`
      },
      {
        title: 'Chapter 2: Cells and Cellular Structure',
        content: `The cell is the smallest fundamental unit of structure and function in living organisms.

Prokaryotes vs. Eukaryotes:
- Prokaryotic cells (Bacteria and Archaea) lack a membrane-bound nucleus or membrane-bound organelles.
- Eukaryotic cells (Plants, Animals, Fungi, Protists) possess a true nucleus containing DNA enclosed by a nuclear membrane and specialized organelles such as mitochondria, endoplasmic reticulum, and Golgi apparatus.`
      }
    ]
  },
  {
    id: 'book-hadithi-swahili',
    title: 'Hadithi Za Kiswahili Na Masimulizi',
    author: 'Tuzo Za Fasihi Na Elimu Afrika (CBC Reader)',
    category: 'Children & Multilingual',
    subject: 'Kiswahili',
    gradeLevel: 'Primary (Grade 1-6)',
    coverBg: 'from-orange-500 via-amber-600 to-yellow-600',
    coverEmoji: '🦁',
    summary: 'Kitabu cha hadithi za kuvutia za watoto kikiwa na maadili, nahau, na misemo ya Kiswahili kwa ajili ya wanafunzi wa shule za msingi.',
    language: 'Kiswahili',
    pageCount: 84,
    downloadFormats: ['PDF', 'Plain Text'],
    license: 'Open Access (UNESCO OER / African Storybook)',
    externalUrl: 'https://www.africanstorybook.org',
    chapters: [
      {
        title: 'Sura ya 1: Sungura Mpenda Haki Na Simba Mtawala',
        content: `Hapo zamani za kale katika msitu wa Amani, wanyama wote waliishi kwa utulivu. Hata hivyo, mfalme Simba alipoanza kuchukua chakula chote bila kuwajali wenzake, wanyama walianza kulia na kuteseka.

Sungura aliyekuwa mwerevu sana aliamua kumfundisha Simba somo la busara. Alimwendea Simba na kumwambia: "Mfalme mkuu, kuna simba mwingine katika kisima cha mbali anayedai kwamba yeye ndiye mfalme mkuu wa msitu huu!"

Simba alisikia hasira kubwa. Alikimbilia kisimani na alipochungulia ndani, aliona kivuli chake mwenyewe. Akifikiri ni adui, aliruka ndani ya kisima na kuingia majini!`
      },
      {
        title: 'Sura ya 2: Umuhimu Wa Kusoma Na Kuelimika',
        content: `Amina alikuwa msichana mdogo aliyependa kusoma vitabu kila jioni baada ya kusaidia kazi za nyumbani. Wenzake walipokuwa wakicheza mtaani, Amina alikaa chini ya mti wa mwembe akisoma kuhusu sayansi, hesabu, na jiografia.

Siku moja, shule yao ilitembelea maktaba kuu ya jiji. Katika mashindano ya chemsha bongo, Amina alijibu maswali yote kwa ufasaha na kujishindia tuzo ya kompyuta mpakato ya shule yake!`
      }
    ]
  },
  {
    id: 'book-pride-and-prejudice',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    category: 'Literature & Classics',
    subject: 'English Literature',
    gradeLevel: 'Secondary & High School',
    coverBg: 'from-pink-600 via-rose-600 to-purple-700',
    coverEmoji: '📖',
    summary: 'Jane Austen\'s celebrated romantic novel following Elizabeth Bennet as she deals with issues of manners, upbringing, morality, education, and marriage in Regency England.',
    language: 'English',
    pageCount: 384,
    downloadFormats: ['EPUB', 'PDF', 'Plain Text'],
    license: 'Public Domain (Project Gutenberg)',
    gutenbergId: 1342,
    externalUrl: 'https://www.gutenberg.org/ebooks/1342',
    chapters: [
      {
        title: 'Chapter I',
        content: `It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.

However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.

'My dear Mr. Bennet,' said his lady to him one day, 'have you heard that Netherfield Park is let at last?'
Mr. Bennet replied that he had not.
'But it is,' returned she; 'for Mrs. Long has just been here, and she told me all about it.'
Mr. Bennet made no answer.`
      },
      {
        title: 'Chapter II',
        content: `Mr. Bennet was among the earliest of those who waited on Mr. Bingley. He had always intended to visit him, though to the last always assuring his wife that he should not go; and till the evening after the visit was paid she had no knowledge of it. It was then disclosed in the following manner. Observing his second daughter employed in trimming a hat, he suddenly addressed her with:

'I hope Mr. Bingley will like it, Lizzy.'
'We are not in a position to know what Mr. Bingley likes,' said her mother resentfully, 'since we are not to visit.'`
      }
    ]
  },
  {
    id: 'book-sherlock-holmes',
    title: 'The Adventures of Sherlock Holmes',
    author: 'Arthur Conan Doyle',
    category: 'Literature & Classics',
    subject: 'English & Mystery Literature',
    gradeLevel: 'Secondary & General',
    coverBg: 'from-slate-700 via-slate-800 to-zinc-900',
    coverEmoji: '🔍',
    summary: 'A collection of twelve short stories featuring the famous consulting detective Sherlock Holmes and his companion Dr. John Watson, utilizing forensic logic and deductive reasoning.',
    language: 'English',
    pageCount: 307,
    downloadFormats: ['EPUB', 'PDF', 'Plain Text'],
    license: 'Public Domain (Project Gutenberg)',
    gutenbergId: 1661,
    externalUrl: 'https://www.gutenberg.org/ebooks/1661',
    chapters: [
      {
        title: 'A Scandal in Bohemia',
        content: `To Sherlock Holmes she is always THE woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler. All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind.

He was, I take it, the most perfect reasoning and observing machine that the world has seen, but as a lover he would have placed himself in a false position. He never spoke of the softer passions, save with a gibe and a sneer.

One night—it was on the twentieth of March, 1888—I was returning from a journey to a patient (for I had now returned to civil practice), when my way led me through Baker Street.`
      }
    ]
  },
  {
    id: 'book-art-of-war',
    title: 'The Art of War',
    author: 'Sun Tzu (Trans. Lionel Giles)',
    category: 'Philosophy & Thought',
    subject: 'History & Strategic Thinking',
    gradeLevel: 'Secondary & University',
    coverBg: 'from-red-700 via-amber-800 to-stone-900',
    coverEmoji: '⚔️',
    summary: 'An ancient Chinese military treatise attributed to Sun Tzu, composed of 13 chapters devoted to various aspects of strategic planning, leadership, situational assessment, and conflict resolution.',
    language: 'English',
    pageCount: 112,
    downloadFormats: ['EPUB', 'PDF', 'Plain Text'],
    license: 'Public Domain (Project Gutenberg)',
    gutenbergId: 132,
    externalUrl: 'https://www.gutenberg.org/ebooks/132',
    chapters: [
      {
        title: 'I. Laying Plans',
        content: `Sun Tzu said: The art of war is of vital importance to the State. It is a matter of life and death, a road either to safety or to ruin. Hence it is a subject of inquiry which can on no account be neglected.

The art of war, then, is governed by five constant factors, to be taken into account in one's deliberations, when seeking to determine the conditions obtaining in the field.

These are: (1) The Moral Law; (2) Heaven; (3) Earth; (4) The Commander; (5) Method and discipline.

The Moral Law causes the people to be in complete accord with their ruler, so that they will follow him regardless of their lives, undismayed by any danger.`
      }
    ]
  },
  {
    id: 'book-frederick-douglass',
    title: 'Narrative of the Life of Frederick Douglass',
    author: 'Frederick Douglass',
    category: 'History & Social Sciences',
    subject: 'History & Human Rights',
    gradeLevel: 'Secondary & High School',
    coverBg: 'from-yellow-700 via-amber-800 to-stone-900',
    coverEmoji: '📜',
    summary: 'An 1845 memoir and treatise on abolition written by the famous orator and former enslaved African American Frederick Douglass. A seminal text in civil rights history.',
    language: 'English',
    pageCount: 125,
    downloadFormats: ['EPUB', 'PDF', 'Plain Text'],
    license: 'Public Domain (Project Gutenberg)',
    gutenbergId: 23,
    externalUrl: 'https://www.gutenberg.org/ebooks/23',
    chapters: [
      {
        title: 'Chapter I',
        content: `I was born in Tuckahoe, near Hillsborough, and about twelve miles from Easton, in Talbot county, Maryland. I have no accurate knowledge of my age, never having seen any authentic record containing it. By far the larger part of the slaves know as little of their ages as horses know of theirs, and it is the wish of most masters within my knowledge to keep their slaves thus ignorant.

I do not remember to have ever met a slave who could tell of his birthday. They seldom come nearer to it than planting-time, harvest-time, cherry-time, spring-time, or fall-time.

My mother was named Harriet Bailey. She was the daughter of Isaac and Betsey Bailey, both colored, and quite advanced in life.`
      }
    ]
  },
  {
    id: 'book-openstax-physics',
    title: 'University Physics Volume 1 (OpenStax)',
    author: 'Samuel J. Ling et al. (OpenStax)',
    category: 'STEM & Textbooks',
    subject: 'Physics',
    gradeLevel: 'Secondary & University',
    coverBg: 'from-cyan-700 via-blue-800 to-indigo-900',
    coverEmoji: '⚡',
    summary: 'A three-volume collection covering mechanics, sound, oscillations, thermodynamics, electricity, magnetism, optics, and modern quantum physics.',
    language: 'English',
    pageCount: 970,
    downloadFormats: ['PDF', 'Web Reader', 'EPUB'],
    license: 'CC BY 4.0 (OpenStax)',
    openStaxUrl: 'https://openstax.org/details/books/university-physics-volume-1',
    externalUrl: 'https://openstax.org/details/books/university-physics-volume-1',
    chapters: [
      {
        title: 'Chapter 1: Units and Measurement',
        content: `Physics is the most fundamental of the sciences, attempting to describe the nature of space, time, matter, and energy.

The International System of Units (SI Units):
- Length: Meter (m)
- Mass: Kilogram (kg)
- Time: Second (s)
- Electric Current: Ampere (A)
- Temperature: Kelvin (K)

Dimensional Analysis:
Every physical equation must be dimensionally consistent. For example, in the kinematic equation x = x0 + v*t + (1/2)*a*t^2, each term has dimensions of length [L].`
      }
    ]
  },
  {
    id: 'book-republic-plato',
    title: 'The Republic',
    author: 'Plato (Trans. Benjamin Jowett)',
    category: 'Philosophy & Thought',
    subject: 'Philosophy & Civics',
    gradeLevel: 'University & Secondary',
    coverBg: 'from-stone-700 via-amber-900 to-zinc-900',
    coverEmoji: '🏛️',
    summary: 'A Socratic dialogue concerning justice, the order and character of the just city-state, and the just man. Features the famous Allegory of the Cave.',
    language: 'English',
    pageCount: 416,
    downloadFormats: ['EPUB', 'PDF', 'Plain Text'],
    license: 'Public Domain (Project Gutenberg)',
    gutenbergId: 1497,
    externalUrl: 'https://www.gutenberg.org/ebooks/1497',
    chapters: [
      {
        title: 'Book VII: The Allegory of the Cave',
        content: `And now, I said, let me show in a figure how far our nature is enlightened or unenlightened: — Behold! human beings living in an underground den, which has a mouth open towards the light and reaching all along the den; here they have been from their childhood, and have their legs and necks chained so that they cannot move, and can only see before them, being prevented by the chains from turning round their heads.

Above and behind them a fire is blazing at a distance, and between the fire and the prisoners there is a raised way; and you will see, if you look, a low wall built along the way, like the screen which marionette players have in front of them, over which they show the puppets.`
      }
    ]
  },
  {
    id: 'book-cbc-environmental',
    title: 'Primary Science & Environmental Reader',
    author: 'EduNexus Open Pedagogy Initiative',
    category: 'Children & Multilingual',
    subject: 'Environmental Science',
    gradeLevel: 'Primary (Grade 4-7)',
    coverBg: 'from-teal-600 via-emerald-600 to-green-700',
    coverEmoji: '🌱',
    summary: 'An open educational reader for primary students explaining ecosystems, soil conservation, water purification, renewable energy, and climate action.',
    language: 'English',
    pageCount: 96,
    downloadFormats: ['PDF', 'Plain Text'],
    license: 'CC BY 4.0 (Open Educational Resource)',
    externalUrl: 'https://unesdoc.unesco.org',
    chapters: [
      {
        title: 'Chapter 1: Caring For Our Local Ecosystem',
        content: `An ecosystem is a community of living organisms (plants, animals, microorganisms) interacting with non-living elements (air, water, sunlight, soil).

Why Soil Conservation Matters:
Topsoil contains crucial nutrients for growing crops. Methods to prevent soil erosion:
1. Terracing on steep hillsides.
2. Planting cover crops and trees (Agroforestry).
3. Mulching to preserve moisture and prevent wind wash.`
      }
    ]
  }
];
