/**
 * Main Single Page Application (SPA) Controller
 */

const App = {
  state: {
    activeTab: 'dashboard',
    books: [],
    members: [],
    loans: [],
    stats: {},
    categories: [],
    bookViewMode: 'grid', // 'grid' | 'table'
    activeLoanFilter: 'All',
    bookSearchTerm: '',
    bookCategoryFilter: 'All',
    bookAvailabilityFilter: 'all',
    memberSearchTerm: '',
    memberTypeFilter: 'All',
    editingBookId: null,
    editingMemberId: null,
    currentReturnLoan: null
  },

  // Initialize Application
  async init() {
    this.bindEvents();
    await this.refreshData();
    this.navigateTo('dashboard');
    lucide.createIcons();
  },

  // Refresh all core data from API
  async refreshData() {
    try {
      await Promise.all([
        this.fetchStats(),
        this.fetchBooks(),
        this.fetchMembers(),
        this.fetchLoans(),
        this.fetchCategories()
      ]);
      this.updateBadges();
      this.renderCurrentView();
    } catch (err) {
      this.showToast('Failed to load library data', 'error');
    }
  },

  // --- API Calls ---
  async fetchStats() {
    const res = await fetch('/api/stats');
    const json = await res.json();
    if (json.success) this.state.stats = json.data;
  },

  async fetchBooks() {
    const params = new URLSearchParams();
    if (this.state.bookSearchTerm) params.append('search', this.state.bookSearchTerm);
    if (this.state.bookCategoryFilter && this.state.bookCategoryFilter !== 'All') {
      params.append('category', this.state.bookCategoryFilter);
    }
    if (this.state.bookAvailabilityFilter && this.state.bookAvailabilityFilter !== 'all') {
      params.append('availability', this.state.bookAvailabilityFilter);
    }

    const res = await fetch(`/api/books?${params.toString()}`);
    const json = await res.json();
    if (json.success) this.state.books = json.data;
  },

  async fetchMembers() {
    const params = new URLSearchParams();
    if (this.state.memberSearchTerm) params.append('search', this.state.memberSearchTerm);
    if (this.state.memberTypeFilter && this.state.memberTypeFilter !== 'All') {
      params.append('type', this.state.memberTypeFilter);
    }

    const res = await fetch(`/api/members?${params.toString()}`);
    const json = await res.json();
    if (json.success) this.state.members = json.data;
  },

  async fetchLoans() {
    const params = new URLSearchParams();
    if (this.state.activeLoanFilter && this.state.activeLoanFilter !== 'All') {
      params.append('status', this.state.activeLoanFilter);
    }

    const res = await fetch(`/api/loans?${params.toString()}`);
    const json = await res.json();
    if (json.success) this.state.loans = json.data;
  },

  async fetchCategories() {
    const res = await fetch('/api/categories');
    const json = await res.json();
    if (json.success) this.state.categories = json.data;
  },

  // --- Navigation & Views ---
  navigateTo(tab) {
    this.state.activeTab = tab;

    // Update sidebar active states
    document.querySelectorAll('.nav-item').forEach(el => {
      if (el.dataset.tab === tab) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Hide all view panels, show current
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.add('hidden');
    });

    const activePanel = document.getElementById(`view-${tab}`);
    if (activePanel) {
      activePanel.classList.remove('hidden');
    }

    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.renderCurrentView();
  },

  renderCurrentView() {
    switch (this.state.activeTab) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'books':
        this.renderBooks();
        break;
      case 'members':
        this.renderMembers();
        break;
      case 'circulation':
        this.renderCirculation();
        break;
      case 'reports':
        this.renderReports();
        break;
      case 'settings':
        this.renderSettings();
        break;
    }
    lucide.createIcons();
  },

  updateBadges() {
    const stats = this.state.stats;
    if (!stats || !stats.books) return;

    const bookBadge = document.getElementById('badge-total-books');
    if (bookBadge) bookBadge.textContent = stats.books.total_titles || 0;

    const memberBadge = document.getElementById('badge-total-members');
    if (memberBadge) memberBadge.textContent = stats.members.total_members || 0;

    const overdueBadge = document.getElementById('badge-overdue-loans');
    if (overdueBadge) {
      const count = stats.loans.overdue_loans || 0;
      overdueBadge.textContent = count;
      if (count > 0) {
        overdueBadge.classList.remove('hidden');
      } else {
        overdueBadge.classList.add('hidden');
      }
    }
  },

  // --- View Renderers ---
  renderDashboard() {
    const statsContainer = document.getElementById('dashboard-metrics');
    if (statsContainer) {
      statsContainer.innerHTML = Components.renderMetricCards(this.state.stats);
    }

    const activityContainer = document.getElementById('dashboard-recent-activity');
    if (activityContainer && this.state.stats.recentActivity) {
      activityContainer.innerHTML = Components.renderRecentActivity(this.state.stats.recentActivity);
    }

    const categoryContainer = document.getElementById('dashboard-categories');
    if (categoryContainer && this.state.stats.categories) {
      categoryContainer.innerHTML = Components.renderCategoryBreakdown(this.state.stats.categories);
    }
  },

  renderBooks() {
    const container = document.getElementById('books-container');
    if (!container) return;

    if (this.state.bookViewMode === 'grid') {
      container.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
      container.innerHTML = Components.renderBookGrid(this.state.books);
    } else {
      container.className = 'w-full';
      container.innerHTML = Components.renderBookTable(this.state.books);
    }

    // Populate category dropdown
    const catSelect = document.getElementById('book-filter-category');
    if (catSelect && catSelect.options.length <= 1) {
      this.state.categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.category;
        opt.textContent = `${c.category} (${c.book_count})`;
        catSelect.appendChild(opt);
      });
    }
  },

  renderMembers() {
    const container = document.getElementById('members-container');
    if (container) {
      container.innerHTML = Components.renderMemberCards(this.state.members);
    }
  },

  renderCirculation() {
    const container = document.getElementById('loans-container');
    if (container) {
      container.innerHTML = Components.renderLoansTable(this.state.loans);
    }
  },

  renderReports() {
    const container = document.getElementById('reports-container');
    if (container) {
      container.innerHTML = Components.renderReportsView(this.state.stats);
    }
  },

  renderSettings() {
    const container = document.getElementById('settings-info');
    if (container) {
      container.innerHTML = `
        <div class="space-y-3 text-sm text-slate-600">
          <div class="flex justify-between py-2 border-b border-slate-100">
            <span class="font-medium text-slate-400">Database Engine:</span>
            <span class="font-semibold text-slate-800">Node.js 24 Native SQLite (node:sqlite DatabaseSync)</span>
          </div>
          <div class="flex justify-between py-2 border-b border-slate-100">
            <span class="font-medium text-slate-400">Database Location:</span>
            <span class="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">data/library.db</span>
          </div>
          <div class="flex justify-between py-2 border-b border-slate-100">
            <span class="font-medium text-slate-400">Backend Server:</span>
            <span class="font-semibold text-slate-800">Express 5.2.1 REST API</span>
          </div>
          <div class="flex justify-between py-2 border-b border-slate-100">
            <span class="font-medium text-slate-400">Frontend Architecture:</span>
            <span class="font-semibold text-slate-800">Dynamic SPA (Tailwind CSS + Lucide Icons)</span>
          </div>
          <div class="flex justify-between py-2">
            <span class="font-medium text-slate-400">System Status:</span>
            <span class="inline-flex items-center text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-bold">
              ● Online & Healthy
            </span>
          </div>
        </div>
      `;
    }
  },

  // --- Modals & Actions ---

  // 1. Issue Book Modal
  openIssueBookModal(preselectedBookId = null) {
    const modal = document.getElementById('modal-issue-book');
    const bookSelect = document.getElementById('issue-book-select');
    const memberSelect = document.getElementById('issue-member-select');

    // Populate Books (Only available ones)
    bookSelect.innerHTML = '<option value="">-- Choose Book to Issue --</option>';
    this.state.books.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = `${b.title} (${b.available_copies} available)`;
      if (b.available_copies <= 0) opt.disabled = true;
      if (preselectedBookId && b.id === preselectedBookId) opt.selected = true;
      bookSelect.appendChild(opt);
    });

    // Populate Members (Active only)
    memberSelect.innerHTML = '<option value="">-- Choose Member --</option>';
    this.state.members.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `${m.name} (${m.member_code}) - ${m.membership_type}`;
      if (m.status === 'Suspended') opt.disabled = true;
      memberSelect.appendChild(opt);
    });

    document.getElementById('issue-duration').value = '14';
    document.getElementById('issue-notes').value = '';

    modal.classList.add('open');
    lucide.createIcons();
  },

  async handleIssueBookSubmit(e) {
    e.preventDefault();
    const bookId = document.getElementById('issue-book-select').value;
    const memberId = document.getElementById('issue-member-select').value;
    const duration = document.getElementById('issue-duration').value;
    const notes = document.getElementById('issue-notes').value;

    if (!bookId || !memberId) {
      this.showToast('Please select both a book and a member', 'error');
      return;
    }

    try {
      const res = await fetch('/api/loans/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: bookId, member_id: memberId, loan_days: duration, notes })
      });
      const data = await res.json();

      if (data.success) {
        this.showToast(data.message, 'success');
        this.closeModal('modal-issue-book');
        await this.refreshData();
      } else {
        this.showToast(data.message, 'error');
      }
    } catch (err) {
      this.showToast('Failed to issue book', 'error');
    }
  },

  // 2. Return Book Modal
  openReturnModal(loanId) {
    const loan = this.state.loans.find(l => l.id === loanId);
    if (!loan) return;

    this.state.currentReturnLoan = loan;
    const modal = document.getElementById('modal-return-book');

    document.getElementById('return-book-title').textContent = loan.book_title;
    document.getElementById('return-member-name').textContent = `${loan.member_name} (${loan.member_code})`;
    document.getElementById('return-due-date').textContent = loan.due_date;

    const todayStr = new Date().toISOString().split('T')[0];
    const returnDate = new Date(todayStr);
    const dueDate = new Date(loan.due_date);

    let fine = 0.00;
    let overdueDays = 0;
    if (returnDate > dueDate) {
      overdueDays = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
      fine = overdueDays * 1.00;
    }

    const fineContainer = document.getElementById('return-fine-details');
    if (fine > 0) {
      fineContainer.classList.remove('hidden');
      document.getElementById('return-overdue-days').textContent = `${overdueDays} days`;
      document.getElementById('return-fine-amount').textContent = `$${fine.toFixed(2)}`;
    } else {
      fineContainer.classList.add('hidden');
    }

    document.getElementById('return-fine-paid-checkbox').checked = true;
    modal.classList.add('open');
    lucide.createIcons();
  },

  async handleReturnBookSubmit() {
    if (!this.state.currentReturnLoan) return;

    const loanId = this.state.currentReturnLoan.id;
    const finePaid = document.getElementById('return-fine-paid-checkbox').checked;

    try {
      const res = await fetch(`/api/loans/${loanId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fine_paid: finePaid })
      });
      const data = await res.json();

      if (data.success) {
        this.showToast(data.message, 'success');
        this.closeModal('modal-return-book');
        await this.refreshData();
      } else {
        this.showToast(data.message, 'error');
      }
    } catch (err) {
      this.showToast('Failed to process return', 'error');
    }
  },

  // 3. Renew Loan
  async renewLoan(loanId) {
    try {
      const res = await fetch(`/api/loans/${loanId}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (data.success) {
        this.showToast(data.message, 'success');
        await this.refreshData();
      } else {
        this.showToast(data.message, 'error');
      }
    } catch (err) {
      this.showToast('Failed to renew loan', 'error');
    }
  },

  // 4. Add / Edit Book Modal
  openAddBookModal() {
    this.state.editingBookId = null;
    document.getElementById('modal-book-title').textContent = 'Add New Book to Catalog';
    document.getElementById('form-book').reset();
    document.getElementById('book-copies').value = '3';
    document.getElementById('book-cover-preview').src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400';
    document.getElementById('modal-book').classList.add('open');
    lucide.createIcons();
  },

  openEditBookModal(bookId) {
    const book = this.state.books.find(b => b.id === bookId);
    if (!book) return;

    this.state.editingBookId = bookId;
    document.getElementById('modal-book-title').textContent = 'Edit Book Details';

    document.getElementById('book-title').value = book.title;
    document.getElementById('book-author').value = book.author;
    document.getElementById('book-isbn').value = book.isbn;
    document.getElementById('book-category').value = book.category;
    document.getElementById('book-copies').value = book.total_copies;
    document.getElementById('book-year').value = book.published_year || '';
    document.getElementById('book-publisher').value = book.publisher || '';
    document.getElementById('book-shelf').value = book.shelf_location || '';
    document.getElementById('book-cover').value = book.cover_url || '';
    document.getElementById('book-desc').value = book.description || '';
    document.getElementById('book-cover-preview').src = book.cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400';

    document.getElementById('modal-book').classList.add('open');
    lucide.createIcons();
  },

  async handleBookSubmit(e) {
    e.preventDefault();
    const payload = {
      title: document.getElementById('book-title').value,
      author: document.getElementById('book-author').value,
      isbn: document.getElementById('book-isbn').value,
      category: document.getElementById('book-category').value,
      total_copies: document.getElementById('book-copies').value,
      published_year: document.getElementById('book-year').value,
      publisher: document.getElementById('book-publisher').value,
      shelf_location: document.getElementById('book-shelf').value,
      cover_url: document.getElementById('book-cover').value,
      description: document.getElementById('book-desc').value
    };

    const isEdit = !!this.state.editingBookId;
    const url = isEdit ? `/api/books/${this.state.editingBookId}` : '/api/books';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        this.showToast(data.message, 'success');
        this.closeModal('modal-book');
        await this.refreshData();
      } else {
        this.showToast(data.message, 'error');
      }
    } catch (err) {
      this.showToast('Failed to save book', 'error');
    }
  },

  confirmDeleteBook(bookId, encodedTitle) {
    const title = decodeURIComponent(encodedTitle);
    if (confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      this.deleteBook(bookId);
    }
  },

  async deleteBook(bookId) {
    try {
      const res = await fetch(`/api/books/${bookId}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        this.showToast(data.message, 'success');
        await this.refreshData();
      } else {
        this.showToast(data.message, 'error');
      }
    } catch (err) {
      this.showToast('Failed to delete book', 'error');
    }
  },

  // 5. Add / Edit Member Modal
  openAddMemberModal() {
    this.state.editingMemberId = null;
    document.getElementById('modal-member-title').textContent = 'Register New Library Member';
    document.getElementById('form-member').reset();
    document.getElementById('member-status-group').classList.add('hidden');
    document.getElementById('modal-member').classList.add('open');
    lucide.createIcons();
  },

  openEditMemberModal(memberId) {
    const member = this.state.members.find(m => m.id === memberId);
    if (!member) return;

    this.state.editingMemberId = memberId;
    document.getElementById('modal-member-title').textContent = 'Edit Member Profile';

    document.getElementById('member-name').value = member.name;
    document.getElementById('member-email').value = member.email;
    document.getElementById('member-phone').value = member.phone || '';
    document.getElementById('member-type').value = member.membership_type;
    document.getElementById('member-limit').value = member.max_books_allowed;

    const statusGroup = document.getElementById('member-status-group');
    statusGroup.classList.remove('hidden');
    document.getElementById('member-status').value = member.status;

    document.getElementById('modal-member').classList.add('open');
    lucide.createIcons();
  },

  async handleMemberSubmit(e) {
    e.preventDefault();
    const payload = {
      name: document.getElementById('member-name').value,
      email: document.getElementById('member-email').value,
      phone: document.getElementById('member-phone').value,
      membership_type: document.getElementById('member-type').value,
      max_books_allowed: document.getElementById('member-limit').value,
      status: document.getElementById('member-status')?.value || 'Active'
    };

    const isEdit = !!this.state.editingMemberId;
    const url = isEdit ? `/api/members/${this.state.editingMemberId}` : '/api/members';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        this.showToast(data.message, 'success');
        this.closeModal('modal-member');
        await this.refreshData();
      } else {
        this.showToast(data.message, 'error');
      }
    } catch (err) {
      this.showToast('Failed to save member', 'error');
    }
  },

  confirmDeleteMember(memberId, encodedName) {
    const name = decodeURIComponent(encodedName);
    if (confirm(`Are you sure you want to delete member ${name}?`)) {
      this.deleteMember(memberId);
    }
  },

  async deleteMember(memberId) {
    try {
      const res = await fetch(`/api/members/${memberId}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        this.showToast(data.message, 'success');
        await this.refreshData();
      } else {
        this.showToast(data.message, 'error');
      }
    } catch (err) {
      this.showToast('Failed to delete member', 'error');
    }
  },

  // 6. View Member History Modal
  async viewMemberDetails(memberId) {
    try {
      const res = await fetch(`/api/members/${memberId}`);
      const data = await res.json();
      if (!data.success) return;

      const member = data.data;
      const modal = document.getElementById('modal-member-history');

      document.getElementById('history-member-name').textContent = member.name;
      document.getElementById('history-member-meta').textContent = `${member.member_code} • ${member.membership_type} Member • Joined ${member.joined_date}`;

      const historyList = document.getElementById('history-loans-list');
      if (!member.loans || member.loans.length === 0) {
        historyList.innerHTML = '<p class="text-sm text-slate-400 py-6 text-center">No borrowing history on record.</p>';
      } else {
        historyList.innerHTML = member.loans.map(loan => `
          <div class="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <img src="${loan.cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}" 
                   class="w-9 h-12 rounded object-cover shadow-sm bg-slate-100 flex-shrink-0"
                   onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'">
              <div>
                <h4 class="font-bold text-slate-800 text-sm">${loan.book_title}</h4>
                <p class="text-xs text-slate-400">Issued: ${loan.issue_date} • Due: ${loan.due_date}</p>
                ${loan.return_date ? `<p class="text-[11px] text-emerald-600 font-medium">Returned on: ${loan.return_date}</p>` : ''}
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs font-bold px-2 py-0.5 rounded-full ${loan.status === 'Returned' ? 'bg-emerald-100 text-emerald-700' : loan.status === 'Overdue' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}">
                ${loan.status}
              </span>
              ${loan.fine_amount > 0 ? `<div class="text-xs font-bold text-rose-600 mt-1">Fine: $${loan.fine_amount.toFixed(2)}</div>` : ''}
            </div>
          </div>
        `).join('');
      }

      modal.classList.add('open');
      lucide.createIcons();
    } catch (err) {
      this.showToast('Failed to load member loan history', 'error');
    }
  },

  // 7. Reset & Re-seed Database
  async confirmResetDatabase() {
    if (confirm('Are you sure you want to reset the database? All records will be refreshed with authentic seed catalog data.')) {
      try {
        const res = await fetch('/api/seed/reset', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          this.showToast(data.message, 'success');
          await this.refreshData();
          this.navigateTo('dashboard');
        }
      } catch (err) {
        this.showToast('Failed to reset database', 'error');
      }
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  },

  // --- Toast Notifications ---
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold max-w-sm pointer-events-auto ${
      type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-indigo-600'
    }`;

    const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';
    toast.innerHTML = `
      <i data-lucide="${iconName}" class="w-5 h-5 flex-shrink-0"></i>
      <span class="flex-1">${message}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  },

  // --- Event Bindings ---
  bindEvents() {
    // Navigation clicks
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = btn.dataset.tab;
        if (tab) this.navigateTo(tab);
      });
    });

    // Books Search Debounce
    let bookSearchTimeout;
    const bookSearchInput = document.getElementById('book-search-input');
    if (bookSearchInput) {
      bookSearchInput.addEventListener('input', (e) => {
        clearTimeout(bookSearchTimeout);
        bookSearchTimeout = setTimeout(() => {
          this.state.bookSearchTerm = e.target.value;
          this.fetchBooks().then(() => this.renderBooks());
        }, 300);
      });
    }

    // Book Filters
    const bookCategoryFilter = document.getElementById('book-filter-category');
    if (bookCategoryFilter) {
      bookCategoryFilter.addEventListener('change', (e) => {
        this.state.bookCategoryFilter = e.target.value;
        this.fetchBooks().then(() => this.renderBooks());
      });
    }

    const bookAvailabilityFilter = document.getElementById('book-filter-availability');
    if (bookAvailabilityFilter) {
      bookAvailabilityFilter.addEventListener('change', (e) => {
        this.state.bookAvailabilityFilter = e.target.value;
        this.fetchBooks().then(() => this.renderBooks());
      });
    }

    // Book View Mode Toggle
    const btnGridView = document.getElementById('btn-view-grid');
    const btnTableView = document.getElementById('btn-view-table');
    if (btnGridView && btnTableView) {
      btnGridView.addEventListener('click', () => {
        this.state.bookViewMode = 'grid';
        btnGridView.classList.add('bg-indigo-600', 'text-white');
        btnGridView.classList.remove('bg-white', 'text-slate-600');
        btnTableView.classList.remove('bg-indigo-600', 'text-white');
        btnTableView.classList.add('bg-white', 'text-slate-600');
        this.renderBooks();
      });

      btnTableView.addEventListener('click', () => {
        this.state.bookViewMode = 'table';
        btnTableView.classList.add('bg-indigo-600', 'text-white');
        btnTableView.classList.remove('bg-white', 'text-slate-600');
        btnGridView.classList.remove('bg-indigo-600', 'text-white');
        btnGridView.classList.add('bg-white', 'text-slate-600');
        this.renderBooks();
      });
    }

    // Member Search
    let memberSearchTimeout;
    const memberSearchInput = document.getElementById('member-search-input');
    if (memberSearchInput) {
      memberSearchInput.addEventListener('input', (e) => {
        clearTimeout(memberSearchTimeout);
        memberSearchTimeout = setTimeout(() => {
          this.state.memberSearchTerm = e.target.value;
          this.fetchMembers().then(() => this.renderMembers());
        }, 300);
      });
    }

    // Member Type Filter
    const memberTypeFilter = document.getElementById('member-filter-type');
    if (memberTypeFilter) {
      memberTypeFilter.addEventListener('change', (e) => {
        this.state.memberTypeFilter = e.target.value;
        this.fetchMembers().then(() => this.renderMembers());
      });
    }

    // Loan Status Tab Filter
    document.querySelectorAll('.loan-status-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.loan-status-btn').forEach(b => {
          b.classList.remove('bg-indigo-600', 'text-white');
          b.classList.add('bg-white', 'text-slate-600');
        });
        btn.classList.add('bg-indigo-600', 'text-white');
        btn.classList.remove('bg-white', 'text-slate-600');
        this.state.activeLoanFilter = btn.dataset.status;
        this.fetchLoans().then(() => this.renderCirculation());
      });
    });

    // Global Search Bar in Header
    const globalSearchInput = document.getElementById('global-search-input');
    if (globalSearchInput) {
      globalSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.state.bookSearchTerm = e.target.value;
          this.navigateTo('books');
          if (bookSearchInput) bookSearchInput.value = e.target.value;
          this.fetchBooks().then(() => this.renderBooks());
        }
      });
    }

    // Modal Close buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = btn.closest('.modal-backdrop');
        if (modal) modal.classList.remove('open');
      });
    });

    // Close modal on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    });

    // Form Submissions
    const formBook = document.getElementById('form-book');
    if (formBook) formBook.addEventListener('submit', (e) => this.handleBookSubmit(e));

    const formMember = document.getElementById('form-member');
    if (formMember) formMember.addEventListener('submit', (e) => this.handleMemberSubmit(e));

    const formIssue = document.getElementById('form-issue');
    if (formIssue) formIssue.addEventListener('submit', (e) => this.handleIssueBookSubmit(e));

    const btnConfirmReturn = document.getElementById('btn-confirm-return');
    if (btnConfirmReturn) btnConfirmReturn.addEventListener('click', () => this.handleReturnBookSubmit());

    // Cover image live preview in book form
    const bookCoverInput = document.getElementById('book-cover');
    const bookCoverPreview = document.getElementById('book-cover-preview');
    if (bookCoverInput && bookCoverPreview) {
      bookCoverInput.addEventListener('input', (e) => {
        bookCoverPreview.src = e.target.value || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400';
      });
    }
  }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
