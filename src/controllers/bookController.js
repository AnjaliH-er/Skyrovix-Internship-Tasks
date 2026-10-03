const db = require('../config/database');

const bookController = {
  // GET /api/books
  getAllBooks: (req, res) => {
    try {
      const { search, category, availability, sortBy = 'created_at', order = 'DESC' } = req.query;

      let sql = 'SELECT * FROM books WHERE 1=1';
      const params = [];

      if (search && search.trim() !== '') {
        sql += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)';
        const queryTerm = `%${search.trim()}%`;
        params.push(queryTerm, queryTerm, queryTerm);
      }

      if (category && category !== 'All') {
        sql += ' AND category = ?';
        params.push(category);
      }

      if (availability === 'available') {
        sql += ' AND available_copies > 0';
      } else if (availability === 'out_of_stock') {
        sql += ' AND available_copies = 0';
      }

      // Safe column sorting
      const allowedSortColumns = ['title', 'author', 'published_year', 'total_copies', 'available_copies', 'created_at'];
      const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
      const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      sql += ` ORDER BY ${sortColumn} ${sortOrder}`;

      const books = db.all(sql, params);
      res.json({ success: true, count: books.length, data: books });
    } catch (err) {
      console.error('Error fetching books:', err);
      res.status(500).json({ success: false, message: 'Server error fetching books', error: err.message });
    }
  },

  // GET /api/books/:id
  getBookById: (req, res) => {
    try {
      const { id } = req.params;
      const book = db.get('SELECT * FROM books WHERE id = ?', [id]);

      if (!book) {
        return res.status(404).json({ success: false, message: 'Book not found' });
      }

      // Fetch active/overdue loans for this book
      const activeLoans = db.all(`
        SELECT l.*, m.name as member_name, m.member_code, m.email as member_email
        FROM loans l
        JOIN members m ON l.member_id = m.id
        WHERE l.book_id = ? AND l.status IN ('Active', 'Overdue')
        ORDER BY l.due_date ASC
      `, [id]);

      res.json({ success: true, data: { ...book, activeLoans } });
    } catch (err) {
      console.error('Error fetching book details:', err);
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  },

  // POST /api/books
  createBook: (req, res) => {
    try {
      const {
        title,
        author,
        isbn,
        category,
        total_copies = 1,
        published_year,
        publisher,
        shelf_location,
        cover_url,
        description
      } = req.body;

      if (!title || !author || !isbn || !category) {
        return res.status(400).json({
          success: false,
          message: 'Title, Author, ISBN, and Category are required.'
        });
      }

      const copies = parseInt(total_copies, 10);
      if (isNaN(copies) || copies < 1) {
        return res.status(400).json({ success: false, message: 'Total copies must be at least 1.' });
      }

      // Check existing ISBN
      const existing = db.get('SELECT id FROM books WHERE isbn = ?', [isbn.trim()]);
      if (existing) {
        return res.status(409).json({ success: false, message: 'A book with this ISBN already exists.' });
      }

      const defaultCover = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80';

      const result = db.run(`
        INSERT INTO books (title, author, isbn, category, total_copies, available_copies, published_year, publisher, shelf_location, cover_url, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        title.trim(),
        author.trim(),
        isbn.trim(),
        category.trim(),
        copies,
        copies, // initially available = total
        published_year ? parseInt(published_year, 10) : null,
        publisher ? publisher.trim() : null,
        shelf_location ? shelf_location.trim() : 'General Shelf',
        cover_url && cover_url.trim() ? cover_url.trim() : defaultCover,
        description ? description.trim() : ''
      ]);

      const newBook = db.get('SELECT * FROM books WHERE id = ?', [result.lastInsertRowid]);
      res.status(201).json({ success: true, message: 'Book created successfully', data: newBook });
    } catch (err) {
      console.error('Error creating book:', err);
      res.status(500).json({ success: false, message: 'Server error creating book', error: err.message });
    }
  },

  // PUT /api/books/:id
  updateBook: (req, res) => {
    try {
      const { id } = req.params;
      const existing = db.get('SELECT * FROM books WHERE id = ?', [id]);

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Book not found' });
      }

      const {
        title,
        author,
        isbn,
        category,
        total_copies,
        published_year,
        publisher,
        shelf_location,
        cover_url,
        description
      } = req.body;

      if (!title || !author || !isbn || !category) {
        return res.status(400).json({ success: false, message: 'Title, Author, ISBN, and Category are required.' });
      }

      // Check ISBN uniqueness if changed
      if (isbn.trim() !== existing.isbn) {
        const duplicate = db.get('SELECT id FROM books WHERE isbn = ? AND id != ?', [isbn.trim(), id]);
        if (duplicate) {
          return res.status(409).json({ success: false, message: 'Another book already uses this ISBN.' });
        }
      }

      const newTotal = parseInt(total_copies, 10);
      if (isNaN(newTotal) || newTotal < 1) {
        return res.status(400).json({ success: false, message: 'Total copies must be at least 1.' });
      }

      const loanedCopies = existing.total_copies - existing.available_copies;
      if (newTotal < loanedCopies) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce total copies below ${loanedCopies} because ${loanedCopies} copies are currently borrowed.`
        });
      }

      const newAvailable = existing.available_copies + (newTotal - existing.total_copies);

      db.run(`
        UPDATE books
        SET title = ?, author = ?, isbn = ?, category = ?, total_copies = ?, available_copies = ?,
            published_year = ?, publisher = ?, shelf_location = ?, cover_url = ?, description = ?
        WHERE id = ?
      `, [
        title.trim(),
        author.trim(),
        isbn.trim(),
        category.trim(),
        newTotal,
        newAvailable,
        published_year ? parseInt(published_year, 10) : null,
        publisher ? publisher.trim() : null,
        shelf_location ? shelf_location.trim() : null,
        cover_url ? cover_url.trim() : existing.cover_url,
        description ? description.trim() : existing.description,
        id
      ]);

      const updated = db.get('SELECT * FROM books WHERE id = ?', [id]);
      res.json({ success: true, message: 'Book updated successfully', data: updated });
    } catch (err) {
      console.error('Error updating book:', err);
      res.status(500).json({ success: false, message: 'Server error updating book', error: err.message });
    }
  },

  // DELETE /api/books/:id
  deleteBook: (req, res) => {
    try {
      const { id } = req.params;
      const book = db.get('SELECT * FROM books WHERE id = ?', [id]);

      if (!book) {
        return res.status(404).json({ success: false, message: 'Book not found' });
      }

      // Check for active or overdue loans
      const activeLoan = db.get(`
        SELECT COUNT(*) as count FROM loans WHERE book_id = ? AND status IN ('Active', 'Overdue')
      `, [id]);

      if (activeLoan.count > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete book. There are ${activeLoan.count} active or overdue loan(s) for this book. Please return them first.`
        });
      }

      db.run('DELETE FROM books WHERE id = ?', [id]);
      res.json({ success: true, message: 'Book deleted successfully' });
    } catch (err) {
      console.error('Error deleting book:', err);
      res.status(500).json({ success: false, message: 'Server error deleting book', error: err.message });
    }
  }
};

module.exports = bookController;
