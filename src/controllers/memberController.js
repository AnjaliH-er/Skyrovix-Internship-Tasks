const db = require('../config/database');

const memberController = {
  // GET /api/members
  getAllMembers: (req, res) => {
    try {
      const { search, type, status } = req.query;

      let sql = `
        SELECT m.*, 
          (SELECT COUNT(*) FROM loans l WHERE l.member_id = m.id AND l.status IN ('Active', 'Overdue')) as current_loans_count,
          (SELECT COALESCE(SUM(l.fine_amount), 0) FROM loans l WHERE l.member_id = m.id AND l.fine_paid = 0) as unpaid_fines
        FROM members m
        WHERE 1=1
      `;
      const params = [];

      if (search && search.trim() !== '') {
        sql += ' AND (m.name LIKE ? OR m.email LIKE ? OR m.member_code LIKE ?)';
        const queryTerm = `%${search.trim()}%`;
        params.push(queryTerm, queryTerm, queryTerm);
      }

      if (type && type !== 'All') {
        sql += ' AND m.membership_type = ?';
        params.push(type);
      }

      if (status && status !== 'All') {
        sql += ' AND m.status = ?';
        params.push(status);
      }

      sql += ' ORDER BY m.created_at DESC';

      const members = db.all(sql, params);
      res.json({ success: true, count: members.length, data: members });
    } catch (err) {
      console.error('Error fetching members:', err);
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  },

  // GET /api/members/:id
  getMemberById: (req, res) => {
    try {
      const { id } = req.params;
      const member = db.get(`
        SELECT m.*,
          (SELECT COUNT(*) FROM loans l WHERE l.member_id = m.id AND l.status IN ('Active', 'Overdue')) as current_loans_count,
          (SELECT COALESCE(SUM(l.fine_amount), 0) FROM loans l WHERE l.member_id = m.id AND l.fine_paid = 0) as unpaid_fines
        FROM members m
        WHERE m.id = ?
      `, [id]);

      if (!member) {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }

      // Fetch all loans history for this member
      const loans = db.all(`
        SELECT l.*, b.title as book_title, b.author as book_author, b.isbn, b.cover_url
        FROM loans l
        JOIN books b ON l.book_id = b.id
        WHERE l.member_id = ?
        ORDER BY l.issue_date DESC
      `, [id]);

      res.json({ success: true, data: { ...member, loans } });
    } catch (err) {
      console.error('Error fetching member details:', err);
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  },

  // POST /api/members
  createMember: (req, res) => {
    try {
      const { name, email, phone, membership_type = 'Standard', max_books_allowed } = req.body;

      if (!name || !email) {
        return res.status(400).json({ success: false, message: 'Name and email are required.' });
      }

      // Check duplicate email
      const existing = db.get('SELECT id FROM members WHERE email = ?', [email.trim()]);
      if (existing) {
        return res.status(409).json({ success: false, message: 'A member with this email already exists.' });
      }

      // Determine default max_books_allowed
      let limit = parseInt(max_books_allowed, 10);
      if (isNaN(limit) || limit < 1) {
        switch (membership_type) {
          case 'Faculty': limit = 10; break;
          case 'Premium': limit = 6; break;
          case 'Student': limit = 4; break;
          default: limit = 3; break;
        }
      }

      // Generate unique member code
      const lastMember = db.get('SELECT id FROM members ORDER BY id DESC LIMIT 1');
      const nextId = (lastMember ? lastMember.id : 0) + 1001;
      const memberCode = `MEM-${nextId}`;

      const result = db.run(`
        INSERT INTO members (member_code, name, email, phone, membership_type, max_books_allowed, status)
        VALUES (?, ?, ?, ?, ?, ?, 'Active')
      `, [
        memberCode,
        name.trim(),
        email.trim(),
        phone ? phone.trim() : null,
        membership_type,
        limit
      ]);

      const newMember = db.get('SELECT * FROM members WHERE id = ?', [result.lastInsertRowid]);
      res.status(201).json({ success: true, message: 'Member registered successfully', data: newMember });
    } catch (err) {
      console.error('Error creating member:', err);
      res.status(500).json({ success: false, message: 'Server error creating member', error: err.message });
    }
  },

  // PUT /api/members/:id
  updateMember: (req, res) => {
    try {
      const { id } = req.params;
      const existing = db.get('SELECT * FROM members WHERE id = ?', [id]);

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }

      const { name, email, phone, membership_type, max_books_allowed, status } = req.body;

      if (!name || !email) {
        return res.status(400).json({ success: false, message: 'Name and email are required.' });
      }

      // Check email uniqueness if changed
      if (email.trim() !== existing.email) {
        const duplicate = db.get('SELECT id FROM members WHERE email = ? AND id != ?', [email.trim(), id]);
        if (duplicate) {
          return res.status(409).json({ success: false, message: 'Another member already uses this email.' });
        }
      }

      const limit = parseInt(max_books_allowed, 10) || existing.max_books_allowed;

      db.run(`
        UPDATE members
        SET name = ?, email = ?, phone = ?, membership_type = ?, max_books_allowed = ?, status = ?
        WHERE id = ?
      `, [
        name.trim(),
        email.trim(),
        phone ? phone.trim() : null,
        membership_type || existing.membership_type,
        limit,
        status || existing.status,
        id
      ]);

      const updated = db.get('SELECT * FROM members WHERE id = ?', [id]);
      res.json({ success: true, message: 'Member updated successfully', data: updated });
    } catch (err) {
      console.error('Error updating member:', err);
      res.status(500).json({ success: false, message: 'Server error updating member', error: err.message });
    }
  },

  // DELETE /api/members/:id
  deleteMember: (req, res) => {
    try {
      const { id } = req.params;
      const member = db.get('SELECT * FROM members WHERE id = ?', [id]);

      if (!member) {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }

      const activeLoans = db.get(`
        SELECT COUNT(*) as count FROM loans WHERE member_id = ? AND status IN ('Active', 'Overdue')
      `, [id]);

      if (activeLoans.count > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete member. Member currently has ${activeLoans.count} book(s) issued. Please return them first.`
        });
      }

      db.run('DELETE FROM members WHERE id = ?', [id]);
      res.json({ success: true, message: 'Member deleted successfully' });
    } catch (err) {
      console.error('Error deleting member:', err);
      res.status(500).json({ success: false, message: 'Server error deleting member', error: err.message });
    }
  }
};

module.exports = memberController;
