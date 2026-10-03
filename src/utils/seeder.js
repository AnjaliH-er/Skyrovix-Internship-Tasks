const db = require('../config/database');

const sampleBooks = [
  {
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    isbn: '978-0132350884',
    category: 'Computer Science',
    total_copies: 5,
    available_copies: 4,
    published_year: 2008,
    publisher: 'Prentice Hall',
    shelf_location: 'CS-A1-04',
    cover_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=400&auto=format&fit=crop&q=80',
    description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees. A must-read for professional developers.'
  },
  {
    title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
    author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
    isbn: '978-0201633610',
    category: 'Computer Science',
    total_copies: 4,
    available_copies: 3,
    published_year: 1994,
    publisher: 'Addison-Wesley',
    shelf_location: 'CS-A2-12',
    cover_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    description: 'Capturing a wealth of experience about the design of object-oriented software, four top-notch designers present a catalog of simple and succinct solutions to common design problems.'
  },
  {
    title: 'The Pragmatic Programmer: Your Journey To Mastery',
    author: 'David Thomas, Andrew Hunt',
    isbn: '978-0135957059',
    category: 'Computer Science',
    total_copies: 6,
    available_copies: 5,
    published_year: 2019,
    publisher: 'Addison-Wesley Professional',
    shelf_location: 'CS-B1-02',
    cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80',
    description: 'A classic that cuts through the increasing specialization and technicalities of modern software development to examine the core process.'
  },
  {
    title: 'Introduction to Algorithms (CLRS)',
    author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
    isbn: '978-0262033848',
    category: 'Computer Science',
    total_copies: 4,
    available_copies: 2,
    published_year: 2009,
    publisher: 'MIT Press',
    shelf_location: 'CS-C3-15',
    cover_url: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=400&auto=format&fit=crop&q=80',
    description: 'Comprehensive textbook on algorithms covering breadth and depth in a rigorous, yet accessible manner.'
  },
  {
    title: 'Artificial Intelligence: A Modern Approach',
    author: 'Stuart Russell, Peter Norvig',
    isbn: '978-0136042594',
    category: 'Computer Science',
    total_copies: 3,
    available_copies: 2,
    published_year: 2020,
    publisher: 'Pearson',
    shelf_location: 'CS-D2-08',
    cover_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
    description: 'The leading textbook in Artificial Intelligence, offering the most comprehensive, up-to-date introduction to the theory and practice of AI.'
  },
  {
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    isbn: '978-0553380163',
    category: 'Science',
    total_copies: 4,
    available_copies: 4,
    published_year: 1998,
    publisher: 'Bantam Books',
    shelf_location: 'SCI-A1-01',
    cover_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80',
    description: 'Hawking explores profound questions about the universe: How did it begin? What makes its expansion possible? Does time always flow forward?'
  },
  {
    title: 'Cosmos',
    author: 'Carl Sagan',
    isbn: '978-0345539434',
    category: 'Science',
    total_copies: 5,
    available_copies: 4,
    published_year: 1980,
    publisher: 'Random House',
    shelf_location: 'SCI-A2-07',
    cover_url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&auto=format&fit=crop&q=80',
    description: 'Carl Sagan traces 15 billion years of cosmic evolution, shedding light on the origin of life, the human brain, and future space exploration.'
  },
  {
    title: 'The Selfish Gene',
    author: 'Richard Dawkins',
    isbn: '978-0199291151',
    category: 'Science',
    total_copies: 3,
    available_copies: 3,
    published_year: 2006,
    publisher: 'Oxford University Press',
    shelf_location: 'SCI-B3-11',
    cover_url: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=400&auto=format&fit=crop&q=80',
    description: 'An imaginative, powerful, and stylistically brilliant work of evolutionary biology that revolutionized how we look at natural selection.'
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    isbn: '978-0062316097',
    category: 'History',
    total_copies: 6,
    available_copies: 4,
    published_year: 2014,
    publisher: 'Harper',
    shelf_location: 'HIST-A1-03',
    cover_url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&auto=format&fit=crop&q=80',
    description: 'Harari spans the whole of human history, from the very first humans to walk the earth to the radical breakthroughs of the Cognitive, Agricultural, and Scientific Revolutions.'
  },
  {
    title: 'Guns, Germs, and Steel: The Fates of Human Societies',
    author: 'Jared Diamond',
    isbn: '978-0393317558',
    category: 'History',
    total_copies: 3,
    available_copies: 3,
    published_year: 1997,
    publisher: 'W. W. Norton & Company',
    shelf_location: 'HIST-B2-09',
    cover_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=80',
    description: 'Examines why Eurasian and North African civilizations have survived and conquered others, arguing against biological superiority.'
  },
  {
    title: '1984',
    author: 'George Orwell',
    isbn: '978-0451524935',
    category: 'Literature & Fiction',
    total_copies: 7,
    available_copies: 6,
    published_year: 1949,
    publisher: 'Secker & Warburg',
    shelf_location: 'LIT-A1-14',
    cover_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=80',
    description: 'A dystopian social science fiction novel and cautionary tale about totalitarianism, mass surveillance, and repressive regimentation.'
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '978-0060935467',
    category: 'Literature & Fiction',
    total_copies: 5,
    available_copies: 5,
    published_year: 1960,
    publisher: 'J. B. Lippincott & Co.',
    shelf_location: 'LIT-A3-02',
    cover_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&auto=format&fit=crop&q=80',
    description: 'A masterpiece of American literature exploring racial injustice and the destruction of innocence in the deep South.'
  },
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '978-0743273565',
    category: 'Literature & Fiction',
    total_copies: 4,
    available_copies: 4,
    published_year: 1925,
    publisher: 'Charles Scribner\'s Sons',
    shelf_location: 'LIT-B1-05',
    cover_url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&auto=format&fit=crop&q=80',
    description: 'An exquisite portrait of the Jazz Age, obsessed with wealth, love, betrayal, and the illusion of the American Dream.'
  },
  {
    title: 'Dune',
    author: 'Frank Herbert',
    isbn: '978-0441172719',
    category: 'Literature & Fiction',
    total_copies: 5,
    available_copies: 4,
    published_year: 1965,
    publisher: 'Chilton Books',
    shelf_location: 'LIT-C2-11',
    cover_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=80',
    description: 'Set on the desert planet Arrakis, Dune tells the story of Paul Atreides and is widely considered the greatest science fiction epic ever written.'
  },
  {
    title: 'Meditations',
    author: 'Marcus Aurelius',
    isbn: '978-0812968255',
    category: 'Philosophy',
    total_copies: 4,
    available_copies: 3,
    published_year: 2002,
    publisher: 'Modern Library',
    shelf_location: 'PHIL-A1-06',
    cover_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&auto=format&fit=crop&q=80',
    description: 'Personal writings of the Roman Emperor Marcus Aurelius recording his private notes to himself on Stoic philosophy.'
  },
  {
    title: 'Beyond Good and Evil',
    author: 'Friedrich Nietzsche',
    isbn: '978-0140449235',
    category: 'Philosophy',
    total_copies: 3,
    available_copies: 3,
    published_year: 1886,
    publisher: 'Penguin Classics',
    shelf_location: 'PHIL-B2-01',
    cover_url: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400&auto=format&fit=crop&q=80',
    description: 'Nietzsche accuses past philosophers of lacking critical sense and blindly accepting dogmatic premises in their consideration of morality.'
  },
  {
    title: 'Zero to One: Notes on Startups, or How to Build the Future',
    author: 'Peter Thiel, Blake Masters',
    isbn: '978-0804139298',
    category: 'Business & Economics',
    total_copies: 5,
    available_copies: 4,
    published_year: 2014,
    publisher: 'Crown Business',
    shelf_location: 'BUS-A1-08',
    cover_url: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&auto=format&fit=crop&q=80',
    description: 'The great secret of our time is that there are still uncharted frontiers to explore and new inventions to create. An indispensable guide on creating new things.'
  },
  {
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    isbn: '978-0374533557',
    category: 'Psychology',
    total_copies: 6,
    available_copies: 5,
    published_year: 2011,
    publisher: 'Farrar, Straus and Giroux',
    shelf_location: 'PSY-A2-10',
    cover_url: 'https://images.unsplash.com/photo-1507842229451-7f01be8610ce?w=400&auto=format&fit=crop&q=80',
    description: 'Explores the two systems that drive the way we think: System 1 is fast, intuitive, and emotional; System 2 is slower, more deliberative, and more logical.'
  },
  {
    title: 'Atomic Habits: An Easy & Proven Way to Build Good Habits',
    author: 'James Clear',
    isbn: '978-0735211292',
    category: 'Self-Help',
    total_copies: 8,
    available_copies: 7,
    published_year: 2018,
    publisher: 'Avery',
    shelf_location: 'SH-A1-02',
    cover_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&auto=format&fit=crop&q=80',
    description: 'No matter your goals, Atomic Habits offers a proven framework for improving every day with small, compounding changes.'
  },
  {
    title: 'Deep Work: Rules for Focused Success in a Distracted World',
    author: 'Cal Newport',
    isbn: '978-1455586691',
    category: 'Business & Economics',
    total_copies: 4,
    available_copies: 4,
    published_year: 2016,
    publisher: 'Grand Central Publishing',
    shelf_location: 'BUS-B3-04',
    cover_url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&auto=format&fit=crop&q=80',
    description: 'Deep work is the ability to focus without distraction on a cognitively demanding task. A guide on how to thrive in an economy full of distractions.'
  }
];

const sampleMembers = [
  {
    member_code: 'MEM-1001',
    name: 'Dr. Sarah Mitchell',
    email: 'sarah.mitchell@university.edu',
    phone: '+1 (555) 234-5678',
    membership_type: 'Faculty',
    max_books_allowed: 10,
    status: 'Active',
    joined_date: '2023-01-15'
  },
  {
    member_code: 'MEM-1002',
    name: 'Alexander Chen',
    email: 'alex.chen@student.tech.edu',
    phone: '+1 (555) 345-6789',
    membership_type: 'Student',
    max_books_allowed: 4,
    status: 'Active',
    joined_date: '2023-09-01'
  },
  {
    member_code: 'MEM-1003',
    name: 'Elena Rostova',
    email: 'elena.rostova@readinghub.org',
    phone: '+1 (555) 456-7890',
    membership_type: 'Premium',
    max_books_allowed: 6,
    status: 'Active',
    joined_date: '2023-03-20'
  },
  {
    member_code: 'MEM-1004',
    name: 'Marcus Vance',
    email: 'marcus.v@coderslab.io',
    phone: '+1 (555) 567-8901',
    membership_type: 'Standard',
    max_books_allowed: 3,
    status: 'Active',
    joined_date: '2023-11-10'
  },
  {
    member_code: 'MEM-1005',
    name: 'Amina Al-Mansoor',
    email: 'amina.mansoor@research.gov',
    phone: '+1 (555) 678-9012',
    membership_type: 'Faculty',
    max_books_allowed: 10,
    status: 'Active',
    joined_date: '2022-08-14'
  },
  {
    member_code: 'MEM-1006',
    name: 'Lucas Silva',
    email: 'lucas.silva@alumni.org',
    phone: '+1 (555) 789-0123',
    membership_type: 'Standard',
    max_books_allowed: 3,
    status: 'Suspended',
    joined_date: '2023-05-18'
  },
  {
    member_code: 'MEM-1007',
    name: 'Priya Sharma',
    email: 'priya.sharma@inst.edu',
    phone: '+1 (555) 890-1234',
    membership_type: 'Student',
    max_books_allowed: 4,
    status: 'Active',
    joined_date: '2024-02-05'
  },
  {
    member_code: 'MEM-1008',
    name: 'Jordan Miller',
    email: 'jordan.m@communityreader.net',
    phone: '+1 (555) 901-2345',
    membership_type: 'Standard',
    max_books_allowed: 3,
    status: 'Active',
    joined_date: '2024-01-12'
  }
];

function seedDatabase(force = false) {
  const existingBooks = db.get('SELECT COUNT(*) as count FROM books');
  
  if (existingBooks.count > 0 && !force) {
    console.log(`Database already populated (${existingBooks.count} books found). Skipping initial seed.`);
    return;
  }

  console.log('Seeding library database with initial data...');

  // Reset if force
  if (force) {
    db.exec(`
      DELETE FROM loans;
      DELETE FROM members;
      DELETE FROM books;
      DELETE FROM sqlite_sequence WHERE name IN ('loans', 'members', 'books');
    `);
  }

  // Insert books
  const insertBook = db.db.prepare(`
    INSERT INTO books (title, author, isbn, category, total_copies, available_copies, published_year, publisher, shelf_location, cover_url, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const b of sampleBooks) {
    insertBook.run(
      b.title,
      b.author,
      b.isbn,
      b.category,
      b.total_copies,
      b.available_copies,
      b.published_year,
      b.publisher,
      b.shelf_location,
      b.cover_url,
      b.description
    );
  }

  // Insert members
  const insertMember = db.db.prepare(`
    INSERT INTO members (member_code, name, email, phone, membership_type, max_books_allowed, status, joined_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const m of sampleMembers) {
    insertMember.run(
      m.member_code,
      m.name,
      m.email,
      m.phone,
      m.membership_type,
      m.max_books_allowed,
      m.status,
      m.joined_date
    );
  }

  // Insert initial loan transactions
  // Sample helper dates:
  const now = new Date();
  const format = (d) => d.toISOString().split('T')[0];

  const dMinus25 = new Date(now.getTime() - 25 * 86400000);
  const dMinus11 = new Date(now.getTime() - 11 * 86400000);
  const dMinus5 = new Date(now.getTime() - 5 * 86400000);
  const dPlus9 = new Date(now.getTime() + 9 * 86400000);
  const dMinus30 = new Date(now.getTime() - 30 * 86400000);
  const dMinus16 = new Date(now.getTime() - 16 * 86400000);
  const dMinus2 = new Date(now.getTime() - 2 * 86400000);

  const insertLoan = db.db.prepare(`
    INSERT INTO loans (book_id, member_id, issue_date, due_date, return_date, status, fine_amount, fine_paid, renewal_count, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Active Loan 1: Clean Code to Alexander Chen (On time)
  insertLoan.run(1, 2, format(dMinus5), format(dPlus9), null, 'Active', 0.0, 0, 0, 'First time borrow');
  // Active Loan 2: Intro to Algorithms to Elena Rostova (On time)
  insertLoan.run(4, 3, format(dMinus5), format(dPlus9), null, 'Active', 0.0, 0, 0, 'Class reference');
  // Active Loan 3: Sapiens to Alexander Chen (On time)
  insertLoan.run(9, 2, format(dMinus5), format(dPlus9), null, 'Active', 0.0, 0, 0, 'History reading');
  // Active Loan 4: Dune to Marcus Vance (On time)
  insertLoan.run(14, 4, format(dMinus5), format(dPlus9), null, 'Active', 0.0, 0, 0, 'Sci-Fi club');
  // Active Loan 5: Thinking Fast & Slow to Priya Sharma (On time)
  insertLoan.run(18, 7, format(dMinus5), format(dPlus9), null, 'Active', 0.0, 0, 0, 'Psychology course');
  // Active Loan 6: Atomic Habits to Lucas Silva (On time)
  insertLoan.run(19, 6, format(dMinus5), format(dPlus9), null, 'Active', 0.0, 0, 0, 'General interest');

  // Overdue Loan 1: Design Patterns to Lucas Silva (11 days overdue -> $11.00 fine)
  insertLoan.run(2, 6, format(dMinus25), format(dMinus11), null, 'Overdue', 11.00, 0, 0, 'Second overdue reminder sent');
  // Overdue Loan 2: Intro to Algorithms to Jordan Miller (11 days overdue -> $11.00 fine)
  insertLoan.run(4, 8, format(dMinus25), format(dMinus11), null, 'Overdue', 11.00, 0, 0, 'Notice emailed');

  // Returned Loan 1: Sapiens by Dr. Sarah Mitchell (Returned on time)
  insertLoan.run(9, 1, format(dMinus30), format(dMinus16), format(dMinus16), 'Returned', 0.0, 1, 0, 'Returned in pristine condition');
  // Returned Loan 2: Meditations by Amina Al-Mansoor (Returned with fine paid)
  insertLoan.run(15, 5, format(dMinus30), format(dMinus16), format(dMinus2), 'Returned', 14.00, 1, 0, 'Fine paid via card');

  console.log('Seeding completed successfully!');
}

module.exports = {
  seedDatabase,
  sampleBooks,
  sampleMembers
};
