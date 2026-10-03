const db = require('../config/database');

const FINE_PER_DAY = 1.00; // $1.00 per day overdue

// Helper: sync overdue status and fines dynamically
function syncOverdueLoans() {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Find all active loans whose due_date is before today
  const overdueCandidates = db.all(`
    SELECT id, due_date FROM loans 
    WHERE status = 'Active' AND due_date < ?
  `, [todayStr]);

  for (const loan of overdueCandidates) {
    const dueDate = new Date(loan.due_date);
    const today = new Date(todayStr);
    const diffDays = Math.max(0, Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24)));
    const fine = diffDays * FINE_PER_DAY;

    db.run(`
      UPDATE loans 
      SET status = 'Overdue', fine_amount = ? 
      WHERE id = ?
    `, [fine, loan.id]);
  }
}

const loanController = {
  // GET /api/loans
  getAllLoans: (req, res) => {
    try {
      // Sync overdue statuses first
      syncOverdueLoans();

      const { status, search } = req.query;

      let sql = `
        SELECT 
          l.*,
          b.title as book_title,
          b.author as book_author,
          b.isbn as book_isbn,
          b.cover_url as book_cover,
          b.shelf_location as book_shelf,
          m.name as member_name,
          m.member_code,
          m.email as member_email,
          m.phone as member_phone
        FROM loans l
        JOIN books b ON l.book_id = b.id
        JOIN members m ON l.member_id = m.id
        WHERE 1=1
      `;
      const params = [];

      if (status && status !== 'All') {
        sql += ' AND l.status = ?';
        params.push(status);
      }

      if (search && search.trim() !== '') {
        sql += ` AND (
          b.title LIKE ? OR 
          b.author LIKE ? OR 
          b.isbn LIKE ? OR 
          m.name LIKE ? OR 
          m.member_code LIKE ?
        )`;
        const term = `%${search.trim()}%`;
        params.push(term, term, term, term, term);
      }

      sql += ' ORDER BY l.id DESC';

      const loans = db.all(sql, params);
      res.json({ success: true, count: loans.length, data: loans });
    } catch (err) {
      console.error('Error fetching loans:', err);
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  },

  // POST /api/loans/issue
  issueBook: (req, res) => {
    try {
      const { book_id, member_id, loan_days = 14, notes = '' } = req.body;

      if (!book_id || !member_id) {
        return res.status(400).json({ success: false, message: 'Both book and member must be selected.' });
      }

      // Check member eligibility
      const member = db.get('SELECT * FROM members WHERE id = ?', [member_id]);
      if (!member) {
        return res.status(404).json({ success: false, message: 'Member not found.' });
      }

      if (member.status === 'Suspended') {
        return res.status(400).json({
          success: false,
          message: 'Member account is currently suspended. Resolve fines or account issues first.'
        });
      }

      // Check active loan limit for member
      const activeCount = db.get(`
        SELECT COUNT(*) as count FROM loans 
        WHERE member_id = ? AND status IN ('Active', 'Overdue')
      `, [member_id]);

      if (activeCount.count >= member.max_books_allowed) {
        return res.status(400).json({
          success: false,
          message: `Member has reached maximum borrowing limit (${member.max_books_allowed} books).`
        });
      }

      // Check book availability
      const book = db.get('SELECT * FROM books WHERE id = ?', [book_id]);
      if (!book) {
        return res.status(404).json({ success: false, message: 'Book not found.' });
      }

      if (book.available_copies <= 0) {
        return res.status(400).json({
          success: false,
          message: `No copies of "${book.title}" are currently available.`
        });
      }

      // Check if member already has this exact book borrowed
      const alreadyBorrowed = db.get(`
        SELECT id FROM loans 
        WHERE book_id = ? AND member_id = ? AND status IN ('Active', 'Overdue')
      `, [book_id, member_id]);

      if (alreadyBorrowed) {
        return res.status(400).json({
          success: false,
          message: 'Member already has an active copy of this book issued.'
        });
      }

      // Calculate dates
      const now = new Date();
      const issueDateStr = now.toISOString().split('T')[0];
      const dueDate = new Date(now.getTime() + parseInt(loan_days, 10) * 86400000);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      // Perform transaction: Insert loan and decrement available_copies
      db.exec('BEGIN TRANSACTION;');
      try {
        const result = db.run(`
          INSERT INTO loans (book_id, member_id, issue_date, due_date, status, notes)
          VALUES (?, ?, ?, ?, 'Active', ?)
        `, [book_id, member_id, issueDateStr, dueDateStr, notes ? notes.trim() : '']);

        db.run('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?', [book_id]);
        db.exec('COMMIT;');

        const newLoan = db.get(`
          SELECT l.*, b.title as book_title, m.name as member_name
          FROM loans l
          JOIN books b ON l.book_id = b.id
          JOIN members m ON l.member_id = m.id
          WHERE l.id = ?
        `, [result.lastInsertRowid]);

        res.status(201).json({
          success: true,
          message: `Book "${book.title}" successfully issued to ${member.name}.`,
          data: newLoan
        });
      } catch (txError) {
        db.exec('ROLLBACK;');
        throw txError;
      }
    } catch (err) {
      console.error('Error issuing book:', err);
      res.status(500).json({ success: false, message: 'Server error issuing book', error: err.message });
    }
  },

  // POST /api/loans/:id/return
  returnBook: (req, res) => {
    try {
      const { id } = req.params;
      const { fine_paid = true, notes } = req.body;

      const loan = db.get('SELECT * FROM loans WHERE id = ?', [id]);
      if (!loan) {
        return res.status(404).json({ success: false, message: 'Loan record not found.' });
      }

      if (loan.status === 'Returned') {
        return res.status(400).json({ success: false, message: 'This book has already been returned.' });
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const returnDate = new Date(todayStr);
      const dueDate = new Date(loan.due_date);

      let fine = 0.00;
      if (returnDate > dueDate) {
        const overdueDays = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
        fine = overdueDays * FINE_PER_DAY;
      }

      // Execute transaction: mark loan returned and increment available_copies
      db.exec('BEGIN TRANSACTION;');
      try {
        db.run(`
          UPDATE loans 
          SET status = 'Returned', 
              return_date = ?, 
              fine_amount = ?, 
              fine_paid = ?,
              notes = COALESCE(?, notes)
          WHERE id = ?
        `, [
          todayStr, 
          fine, 
          fine_paid ? 1 : 0, 
          notes ? notes.trim() : null, 
          id
        ]);

        db.run('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?', [loan.book_id]);
        db.exec('COMMIT;');

        const updatedLoan = db.get(`
          SELECT l.*, b.title as book_title, m.name as member_name
          FROM loans l
          JOIN books b ON l.book_id = b.id
          JOIN members m ON l.member_id = m.id
          WHERE l.id = ?
        `, [id]);

        res.json({
          success: true,
          message: `Book "${updatedLoan.book_title}" returned successfully.${fine > 0 ? ` Overdue fine: $${fine.toFixed(2)}.` : ''}`,
          data: updatedLoan
        });
      } catch (txErr) {
        db.exec('ROLLBACK;');
        throw txErr;
      }
    } catch (err) {
      console.error('Error returning book:', err);
      res.status(500).json({ success: false, message: 'Server error returning book', error: err.message });
    }
  },

  // POST /api/loans/:id/renew
  renewLoan: (req, res) => {
    try {
      const { id } = req.params;
      const loan = db.get('SELECT * FROM loans WHERE id = ?', [id]);

      if (!loan) {
        return res.status(404).json({ success: false, message: 'Loan record not found.' });
      }

      if (loan.status === 'Returned') {
        return res.status(400).json({ success: false, message: 'Cannot renew a returned loan.' });
      }

      if (loan.renewal_count >= 2) {
        return res.status(400).json({
          success: false,
          message: 'Maximum renewal limit reached (maximum 2 renewals allowed per issue).'
        });
      }

      // Extend due date by 14 days from current due date
      const currentDue = new Date(loan.due_date);
      const newDue = new Date(currentDue.getTime() + 14 * 86400000);
      const newDueStr = newDue.toISOString().split('T')[0];

      db.run(`
        UPDATE loans 
        SET due_date = ?, 
            renewal_count = renewal_count + 1,
            status = CASE WHEN ? >= DATE('now') THEN 'Active' ELSE 'Overdue' END
        WHERE id = ?
      `, [newDueStr, newDueStr, id]);

      const updated = db.get('SELECT * FROM loans WHERE id = ?', [id]);
      res.json({
        success: true,
        message: `Loan renewed. New due date is ${newDueStr} (Renewal ${updated.renewal_count}/2).`,
        data: updated
      });
    } catch (err) {
      console.error('Error renewing loan:', err);
      res.status(500).json({ success: false, message: 'Server error renewing loan', error: err.message });
    }
  },

  // POST /api/loans/:id/pay-fine
  payFine: (req, res) => {
    try {
      const { id } = req.params;
      const loan = db.get('SELECT * FROM loans WHERE id = ?', [id]);

      if (!loan) {
        return res.status(404).json({ success: false, message: 'Loan not found.' });
      }

      if (loan.fine_amount <= 0) {
        return res.status(400).json({ success: false, message: 'No fine is owed on this loan.' });
      }

      db.run('UPDATE loans SET fine_paid = 1 WHERE id = ?', [id]);
      res.json({ success: true, message: `Fine of $${loan.fine_amount.toFixed(2)} marked as paid.` });
    } catch (err) {
      console.error('Error paying fine:', err);
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  }
};

module.exports = loanController;
