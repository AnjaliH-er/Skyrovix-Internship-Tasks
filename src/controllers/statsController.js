const db = require('../config/database');
const { seedDatabase } = require('../utils/seeder');

const statsController = {
  // GET /api/stats
  getDashboardStats: (req, res) => {
    try {
      // Books stats
      const booksSummary = db.get(`
        SELECT 
          COUNT(*) as total_titles,
          COALESCE(SUM(total_copies), 0) as total_copies,
          COALESCE(SUM(available_copies), 0) as available_copies,
          (COALESCE(SUM(total_copies), 0) - COALESCE(SUM(available_copies), 0)) as borrowed_copies
        FROM books
      `);

      // Members stats
      const membersSummary = db.get(`
        SELECT 
          COUNT(*) as total_members,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_members,
          SUM(CASE WHEN status = 'Suspended' THEN 1 ELSE 0 END) as suspended_members
        FROM members
      `);

      // Loans stats
      const loansSummary = db.get(`
        SELECT 
          COUNT(*) as total_loans,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_loans,
          SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) as overdue_loans,
          SUM(CASE WHEN status = 'Returned' THEN 1 ELSE 0 END) as returned_loans,
          COALESCE(SUM(CASE WHEN fine_paid = 1 THEN fine_amount ELSE 0 END), 0) as fines_collected,
          COALESCE(SUM(CASE WHEN fine_paid = 0 THEN fine_amount ELSE 0 END), 0) as unpaid_fines
        FROM loans
      `);

      // Category breakdown
      const categoriesBreakdown = db.all(`
        SELECT category, COUNT(*) as book_count, SUM(total_copies) as total_copies
        FROM books
        GROUP BY category
        ORDER BY book_count DESC
      `);

      // Recent activity
      const recentActivity = db.all(`
        SELECT 
          l.id,
          l.status,
          l.issue_date,
          l.due_date,
          l.return_date,
          l.fine_amount,
          b.title as book_title,
          b.cover_url as book_cover,
          m.name as member_name,
          m.member_code
        FROM loans l
        JOIN books b ON l.book_id = b.id
        JOIN members m ON l.member_id = m.id
        ORDER BY l.id DESC
        LIMIT 6
      `);

      // Top borrowed books
      const topBooks = db.all(`
        SELECT b.id, b.title, b.author, b.category, b.cover_url, COUNT(l.id) as borrow_count
        FROM books b
        LEFT JOIN loans l ON b.id = l.book_id
        GROUP BY b.id
        ORDER BY borrow_count DESC
        LIMIT 5
      `);

      res.json({
        success: true,
        data: {
          books: booksSummary,
          members: membersSummary,
          loans: loansSummary,
          categories: categoriesBreakdown,
          recentActivity,
          topBooks
        }
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  },

  // GET /api/categories
  getCategories: (req, res) => {
    try {
      const categories = db.all(`
        SELECT category, COUNT(*) as book_count
        FROM books
        GROUP BY category
        ORDER BY category ASC
      `);
      res.json({ success: true, data: categories });
    } catch (err) {
      console.error('Error fetching categories:', err);
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  },

  // GET /api/export/:type
  exportData: (req, res) => {
    try {
      const { type } = req.params; // 'books', 'members', 'loans'
      let rows = [];
      let filename = `library_${type}_${new Date().toISOString().split('T')[0]}.csv`;

      if (type === 'books') {
        rows = db.all(`
          SELECT id, title, author, isbn, category, total_copies, available_copies, published_year, publisher, shelf_location
          FROM books
          ORDER BY id ASC
        `);
      } else if (type === 'members') {
        rows = db.all(`
          SELECT id, member_code, name, email, phone, membership_type, max_books_allowed, status, joined_date
          FROM members
          ORDER BY id ASC
        `);
      } else if (type === 'loans') {
        rows = db.all(`
          SELECT 
            l.id, b.title as book_title, b.isbn, m.name as member_name, m.member_code,
            l.issue_date, l.due_date, l.return_date, l.status, l.fine_amount, l.fine_paid
          FROM loans l
          JOIN books b ON l.book_id = b.id
          JOIN members m ON l.member_id = m.id
          ORDER BY l.id DESC
        `);
      } else {
        return res.status(400).json({ success: false, message: 'Invalid export type. Must be books, members, or loans.' });
      }

      if (rows.length === 0) {
        return res.status(404).send('No data available to export.');
      }

      // Generate CSV
      const headers = Object.keys(rows[0]);
      const csvLines = [
        headers.join(','),
        ...rows.map(row => 
          headers.map(h => {
            const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
            return `"${val.replace(/"/g, '""')}"`;
          }).join(',')
        )
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvLines.join('\n'));
    } catch (err) {
      console.error('Error exporting data:', err);
      res.status(500).json({ success: false, message: 'Export error', error: err.message });
    }
  },

  // POST /api/seed/reset
  resetDatabase: (req, res) => {
    try {
      seedDatabase(true);
      res.json({ success: true, message: 'Database reset and re-seeded with realistic catalog data!' });
    } catch (err) {
      console.error('Error resetting database:', err);
      res.status(500).json({ success: false, message: 'Reset error', error: err.message });
    }
  }
};

module.exports = statsController;
