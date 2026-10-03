/**
 * Components module for rendering dynamic UI templates
 */

const Components = {
  // 1. Metric Stat Cards
  renderMetricCards(stats) {
    if (!stats || !stats.books) return '';

    const books = stats.books;
    const members = stats.members;
    const loans = stats.loans;

    const cards = [
      {
        title: 'Total Titles & Copies',
        value: `${books.total_titles} Titles`,
        subtext: `${books.total_copies} total physical books`,
        icon: 'book-open',
        color: 'from-blue-600 to-indigo-600',
        bgLight: 'bg-blue-50 text-blue-600',
        action: 'books'
      },
      {
        title: 'Available Copies',
        value: books.available_copies,
        subtext: `${books.borrowed_copies} currently borrowed`,
        icon: 'check-circle-2',
        color: 'from-emerald-600 to-teal-600',
        bgLight: 'bg-emerald-50 text-emerald-600',
        action: 'books'
      },
      {
        title: 'Active Loans',
        value: loans.active_loans,
        subtext: `Issued to ${members.active_members} active members`,
        icon: 'repeat',
        color: 'from-amber-500 to-orange-500',
        bgLight: 'bg-amber-50 text-amber-600',
        action: 'circulation'
      },
      {
        title: 'Overdue Books',
        value: loans.overdue_loans,
        subtext: loans.overdue_loans > 0 ? 'Requires immediate attention' : 'All loans on time',
        icon: 'alert-circle',
        color: 'from-rose-600 to-red-600',
        bgLight: 'bg-rose-50 text-rose-600',
        badge: loans.overdue_loans > 0 ? 'Action Needed' : null,
        action: 'circulation'
      },
      {
        title: 'Unpaid Overdue Fines',
        value: `$${Number(loans.unpaid_fines).toFixed(2)}`,
        subtext: `$${Number(loans.fines_collected).toFixed(2)} collected to date`,
        icon: 'banknote',
        color: 'from-purple-600 to-violet-600',
        bgLight: 'bg-purple-50 text-purple-600',
        action: 'circulation'
      }
    ];

    return cards.map(c => `
      <div onclick="App.navigateTo('${c.action}')" class="glass-card glass-card-hover p-6 rounded-2xl cursor-pointer relative overflow-hidden group">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs font-bold tracking-wider text-slate-400 uppercase">${c.title}</span>
          <div class="w-12 h-12 rounded-xl flex items-center justify-center ${c.bgLight} group-hover:scale-110 transition-transform">
            <i data-lucide="${c.icon}" class="w-6 h-6"></i>
          </div>
        </div>
        <div class="flex items-baseline space-x-2">
          <h3 class="text-3xl font-extrabold text-slate-800">${c.value}</h3>
          ${c.badge ? `<span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-pulse">${c.badge}</span>` : ''}
        </div>
        <p class="text-xs text-slate-500 mt-2 font-medium">${c.subtext}</p>
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${c.color} opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
    `).join('');
  },

  // 2. Category Distribution Breakdown
  renderCategoryBreakdown(categories) {
    if (!categories || categories.length === 0) {
      return '<p class="text-sm text-slate-400">No categories found.</p>';
    }

    const totalBooks = categories.reduce((sum, c) => sum + c.book_count, 0);

    const colors = [
      'bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 
      'bg-amber-500', 'bg-rose-500', 'bg-purple-500', 'bg-teal-500'
    ];

    return `
      <div class="space-y-4">
        ${categories.map((cat, idx) => {
          const pct = Math.round((cat.book_count / totalBooks) * 100);
          const barColor = colors[idx % colors.length];
          return `
            <div>
              <div class="flex justify-between items-center text-xs font-semibold mb-1">
                <span class="text-slate-700 flex items-center space-x-1.5">
                  <span class="w-2.5 h-2.5 rounded-full ${barColor} inline-block"></span>
                  <span>${cat.category}</span>
                </span>
                <span class="text-slate-500">${cat.book_count} books (${pct}%)</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div class="${barColor} h-2 rounded-full transition-all duration-700" style="width: ${pct}%"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // 3. Recent Activity Stream
  renderRecentActivity(activities) {
    if (!activities || activities.length === 0) {
      return `
        <div class="text-center py-8 text-slate-400">
          <i data-lucide="clock" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
          <p class="text-sm">No recent circulation activity recorded.</p>
        </div>
      `;
    }

    return `
      <div class="divide-y divide-slate-100">
        ${activities.map(act => {
          let badgeClass = 'bg-blue-100 text-blue-700';
          let icon = 'arrow-right-circle';
          if (act.status === 'Returned') {
            badgeClass = 'bg-emerald-100 text-emerald-700';
            icon = 'check-circle';
          } else if (act.status === 'Overdue') {
            badgeClass = 'bg-rose-100 text-rose-700';
            icon = 'alert-triangle';
          }

          return `
            <div class="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
              <div class="flex items-center space-x-3.5 min-w-0">
                <div class="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200 shadow-sm">
                  <img src="${act.book_cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}" 
                       alt="cover" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'">
                </div>
                <div class="min-w-0">
                  <h4 class="text-sm font-bold text-slate-800 truncate">${act.book_title}</h4>
                  <p class="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5">
                    <span>${act.member_name}</span>
                    <span class="text-slate-300">•</span>
                    <span class="font-mono text-[11px] text-slate-400">${act.member_code}</span>
                  </p>
                </div>
              </div>
              <div class="text-right flex-shrink-0 pl-3">
                <span class="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClass}">
                  ${act.status}
                </span>
                <p class="text-[11px] text-slate-400 mt-1">Due: ${act.due_date}</p>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // 4. Book Grid View
  renderBookGrid(books) {
    if (!books || books.length === 0) {
      return `
        <div class="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
          <i data-lucide="book-x" class="w-12 h-12 mx-auto text-slate-300 mb-3"></i>
          <h3 class="text-lg font-bold text-slate-700">No books found</h3>
          <p class="text-sm text-slate-400 mt-1">Try adjusting your search criteria or add a new book to the library.</p>
          <button onclick="App.openAddBookModal()" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md">
            + Add New Book
          </button>
        </div>
      `;
    }

    return books.map(book => {
      const isAvailable = book.available_copies > 0;
      const availabilityBadge = isAvailable
        ? `<span class="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1">
             <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
             <span>${book.available_copies} of ${book.total_copies} Available</span>
           </span>`
        : `<span class="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1">
             <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
             <span>Out of Stock</span>
           </span>`;

      return `
        <div class="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col justify-between border border-slate-200 group">
          <div class="p-5">
            <!-- Cover & Badges -->
            <div class="flex space-x-4 mb-4">
              <div class="w-24 h-36 rounded-xl overflow-hidden shadow-md flex-shrink-0 bg-slate-100 book-cover-container">
                <img src="${book.cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'}" 
                     alt="${book.title}" 
                     class="w-full h-full object-cover book-cover-img"
                     onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'">
              </div>
              <div class="flex-1 min-w-0">
                <span class="inline-block bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider mb-1.5">
                  ${book.category}
                </span>
                <h3 class="font-bold text-slate-800 text-base leading-snug line-clamp-2 title="${book.title}">
                  ${book.title}
                </h3>
                <p class="text-xs text-slate-500 font-medium mt-1">${book.author}</p>
                <div class="mt-3 flex items-center text-xs text-slate-400 font-mono">
                  <span>ISBN: ${book.isbn}</span>
                </div>
              </div>
            </div>

            <!-- Details -->
            <div class="bg-slate-50/80 rounded-xl p-3 text-xs text-slate-600 space-y-1.5 border border-slate-100 mb-3">
              <div class="flex justify-between">
                <span class="text-slate-400">Shelf Location:</span>
                <span class="font-semibold text-slate-700">${book.shelf_location || 'General Shelf'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Publication:</span>
                <span class="font-semibold text-slate-700">${book.published_year || 'N/A'} • ${book.publisher || 'N/A'}</span>
              </div>
            </div>

            <div class="flex justify-between items-center mb-1">
              ${availabilityBadge}
            </div>
          </div>

          <!-- Card Actions Footer -->
          <div class="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div class="flex space-x-1.5">
              <button onclick="App.openEditBookModal(${book.id})" title="Edit Details" 
                      class="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button onclick="App.confirmDeleteBook(${book.id}, '${encodeURIComponent(book.title)}')" title="Delete Book"
                      class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
            
            <button onclick="App.openIssueBookModal(${book.id})" 
                    ${!isAvailable ? 'disabled' : ''}
                    class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5
                    ${isAvailable 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'}">
              <i data-lucide="send" class="w-3.5 h-3.5"></i>
              <span>Issue Book</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  // 5. Book Table View
  renderBookTable(books) {
    if (!books || books.length === 0) {
      return Components.renderBookGrid(books);
    }

    return `
      <div class="glass-card rounded-2xl overflow-hidden border border-slate-200">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-600">
            <thead class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th class="px-6 py-4 font-bold">Book Title & Author</th>
                <th class="px-6 py-4 font-bold">Category</th>
                <th class="px-6 py-4 font-bold">ISBN</th>
                <th class="px-6 py-4 font-bold">Shelf</th>
                <th class="px-6 py-4 font-bold">Stock</th>
                <th class="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${books.map(b => `
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center space-x-3">
                      <img src="${b.cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}" 
                           alt="cover" class="w-9 h-12 rounded object-cover shadow-sm bg-slate-100 flex-shrink-0"
                           onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'">
                      <div>
                        <div class="font-bold text-slate-800">${b.title}</div>
                        <div class="text-xs text-slate-400">${b.author}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                      ${b.category}
                    </span>
                  </td>
                  <td class="px-6 py-4 font-mono text-xs text-slate-500">${b.isbn}</td>
                  <td class="px-6 py-4 text-xs font-medium text-slate-700">${b.shelf_location || 'N/A'}</td>
                  <td class="px-6 py-4">
                    <span class="font-bold ${b.available_copies > 0 ? 'text-emerald-600' : 'text-rose-600'}">
                      ${b.available_copies}
                    </span>
                    <span class="text-xs text-slate-400">/ ${b.total_copies}</span>
                  </td>
                  <td class="px-6 py-4 text-right space-x-2">
                    <button onclick="App.openIssueBookModal(${b.id})" 
                            ${b.available_copies <= 0 ? 'disabled' : ''}
                            class="px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none">
                      Issue
                    </button>
                    <button onclick="App.openEditBookModal(${b.id})" class="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg">
                      <i data-lucide="edit" class="w-4 h-4 inline"></i>
                    </button>
                    <button onclick="App.confirmDeleteBook(${b.id}, '${encodeURIComponent(b.title)}')" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg">
                      <i data-lucide="trash-2" class="w-4 h-4 inline"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 6. Member Cards
  renderMemberCards(members) {
    if (!members || members.length === 0) {
      return `
        <div class="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
          <i data-lucide="users" class="w-12 h-12 mx-auto text-slate-300 mb-3"></i>
          <h3 class="text-lg font-bold text-slate-700">No members found</h3>
          <p class="text-sm text-slate-400 mt-1">Register new students, faculty, or readers to the library.</p>
          <button onclick="App.openAddMemberModal()" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md">
            + Register Member
          </button>
        </div>
      `;
    }

    return members.map(m => {
      const typeColors = {
        Faculty: 'bg-purple-100 text-purple-700 border-purple-200',
        Student: 'bg-blue-100 text-blue-700 border-blue-200',
        Premium: 'bg-amber-100 text-amber-700 border-amber-200',
        Standard: 'bg-slate-100 text-slate-700 border-slate-200'
      };
      const badgeStyle = typeColors[m.membership_type] || typeColors.Standard;

      const initials = m.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      return `
        <div class="glass-card glass-card-hover rounded-2xl p-6 border border-slate-200 flex flex-col justify-between">
          <div>
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-3.5">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-extrabold flex items-center justify-center text-base shadow-md">
                  ${initials}
                </div>
                <div>
                  <h3 class="font-bold text-slate-800 text-base leading-snug">${m.name}</h3>
                  <span class="text-xs font-mono text-slate-400">${m.member_code}</span>
                </div>
              </div>
              <span class="text-xs font-bold px-2.5 py-1 rounded-full border ${badgeStyle}">
                ${m.membership_type}
              </span>
            </div>

            <div class="space-y-2 text-xs text-slate-500 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 mb-4">
              <div class="flex items-center space-x-2">
                <i data-lucide="mail" class="w-3.5 h-3.5 text-slate-400"></i>
                <span class="truncate">${m.email}</span>
              </div>
              <div class="flex items-center space-x-2">
                <i data-lucide="phone" class="w-3.5 h-3.5 text-slate-400"></i>
                <span>${m.phone || 'No phone provided'}</span>
              </div>
              <div class="flex items-center space-x-2">
                <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400"></i>
                <span>Joined ${m.joined_date}</span>
              </div>
            </div>

            <!-- Borrow stats -->
            <div class="grid grid-cols-2 gap-2 text-center mb-4">
              <div class="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
                <span class="text-lg font-black text-indigo-700">${m.current_loans_count}</span>
                <span class="block text-[11px] font-semibold text-indigo-500">Active Loans / ${m.max_books_allowed}</span>
              </div>
              <div class="p-2.5 rounded-xl ${m.unpaid_fines > 0 ? 'bg-rose-50 border border-rose-200' : 'bg-slate-50 border border-slate-100'}">
                <span class="text-lg font-black ${m.unpaid_fines > 0 ? 'text-rose-600' : 'text-slate-700'}">
                  $${Number(m.unpaid_fines).toFixed(2)}
                </span>
                <span class="block text-[11px] font-semibold text-slate-400">Fines Owed</span>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button onclick="App.viewMemberDetails(${m.id})" 
                    class="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
              <i data-lucide="history" class="w-3.5 h-3.5"></i>
              <span>Loan History</span>
            </button>
            <div class="flex space-x-1">
              <button onclick="App.openEditMemberModal(${m.id})" title="Edit Member" class="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg">
                <i data-lucide="edit" class="w-4 h-4"></i>
              </button>
              <button onclick="App.confirmDeleteMember(${m.id}, '${encodeURIComponent(m.name)}')" title="Delete Member" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // 7. Circulation Loans Table
  renderLoansTable(loans) {
    if (!loans || loans.length === 0) {
      return `
        <div class="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
          <i data-lucide="repeat" class="w-12 h-12 mx-auto text-slate-300 mb-3"></i>
          <h3 class="text-lg font-bold text-slate-700">No circulation records found</h3>
          <p class="text-sm text-slate-400 mt-1">Issue books to members to begin tracking borrowing activity.</p>
          <button onclick="App.openIssueBookModal()" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md">
            + Issue Book
          </button>
        </div>
      `;
    }

    return `
      <div class="glass-card rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-600">
            <thead class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th class="px-6 py-4 font-bold">Book Info</th>
                <th class="px-6 py-4 font-bold">Borrower Member</th>
                <th class="px-6 py-4 font-bold">Issue / Due Date</th>
                <th class="px-6 py-4 font-bold">Status</th>
                <th class="px-6 py-4 font-bold">Fine</th>
                <th class="px-6 py-4 font-bold text-right">Circulation Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${loans.map(loan => {
                let statusBadge = '';
                const today = new Date().toISOString().split('T')[0];

                if (loan.status === 'Returned') {
                  statusBadge = `
                    <span class="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-full">
                      <i data-lucide="check" class="w-3 h-3"></i>
                      <span>Returned</span>
                    </span>
                  `;
                } else if (loan.status === 'Overdue' || loan.due_date < today) {
                  statusBadge = `
                    <span class="inline-flex items-center space-x-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-2.5 py-1 rounded-full pulse-badge pl-4">
                      <span>Overdue</span>
                    </span>
                  `;
                } else {
                  statusBadge = `
                    <span class="inline-flex items-center space-x-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-2.5 py-1 rounded-full">
                      <i data-lucide="clock" class="w-3 h-3"></i>
                      <span>Active</span>
                    </span>
                  `;
                }

                return `
                  <tr class="hover:bg-slate-50/70 transition-colors">
                    <!-- Book -->
                    <td class="px-6 py-4">
                      <div class="flex items-center space-x-3">
                        <img src="${loan.book_cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}" 
                             alt="cover" class="w-9 h-12 rounded object-cover shadow-sm bg-slate-100 flex-shrink-0"
                             onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'">
                        <div>
                          <div class="font-bold text-slate-800 line-clamp-1">${loan.book_title}</div>
                          <div class="text-xs text-slate-400 font-mono">ISBN: ${loan.book_isbn}</div>
                        </div>
                      </div>
                    </td>

                    <!-- Member -->
                    <td class="px-6 py-4">
                      <div class="font-bold text-slate-800">${loan.member_name}</div>
                      <div class="text-xs text-slate-400 flex items-center space-x-1">
                        <span class="font-mono">${loan.member_code}</span>
                      </div>
                    </td>

                    <!-- Dates -->
                    <td class="px-6 py-4">
                      <div class="text-xs text-slate-700 font-medium">Issued: ${loan.issue_date}</div>
                      <div class="text-xs font-bold ${loan.status !== 'Returned' && loan.due_date < today ? 'text-rose-600' : 'text-slate-500'}">
                        Due: ${loan.due_date}
                      </div>
                      ${loan.return_date ? `<div class="text-[11px] text-emerald-600">Returned: ${loan.return_date}</div>` : ''}
                    </td>

                    <!-- Status -->
                    <td class="px-6 py-4">
                      ${statusBadge}
                    </td>

                    <!-- Fine -->
                    <td class="px-6 py-4">
                      ${loan.fine_amount > 0 ? `
                        <div class="font-bold text-xs ${loan.fine_paid ? 'text-emerald-600 line-through' : 'text-rose-600'}">
                          $${Number(loan.fine_amount).toFixed(2)}
                        </div>
                        <span class="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${loan.fine_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
                          ${loan.fine_paid ? 'Paid' : 'Unpaid'}
                        </span>
                      ` : `
                        <span class="text-xs text-slate-400">$0.00</span>
                      `}
                    </td>

                    <!-- Actions -->
                    <td class="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      ${loan.status !== 'Returned' ? `
                        <button onclick="App.openReturnModal(${loan.id})" 
                                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all">
                          Return Book
                        </button>
                        <button onclick="App.renewLoan(${loan.id})" 
                                title="Renew for 14 days (Max 2 renewals)"
                                class="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-xl text-xs font-semibold transition-all">
                          Renew (${loan.renewal_count || 0}/2)
                        </button>
                      ` : `
                        <span class="text-xs text-slate-400 font-medium">Completed</span>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 8. Analytics & Reports View
  renderReportsView(stats) {
    if (!stats || !stats.loans) return '';

    return `
      <div class="space-y-8">
        <!-- Export Data Cards -->
        <div>
          <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <i data-lucide="download" class="w-5 h-5 text-indigo-600"></i>
            <span>Export Library Records (CSV)</span>
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div class="glass-card p-5 rounded-2xl flex items-center justify-between border border-slate-200">
              <div class="flex items-center space-x-3.5">
                <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <i data-lucide="book" class="w-5 h-5"></i>
                </div>
                <div>
                  <h4 class="font-bold text-slate-800 text-sm">Books Catalog</h4>
                  <p class="text-xs text-slate-400">All titles, copies & ISBNs</p>
                </div>
              </div>
              <a href="/api/export/books" download class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors">
                Export CSV
              </a>
            </div>

            <div class="glass-card p-5 rounded-2xl flex items-center justify-between border border-slate-200">
              <div class="flex items-center space-x-3.5">
                <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <i data-lucide="users" class="w-5 h-5"></i>
                </div>
                <div>
                  <h4 class="font-bold text-slate-800 text-sm">Members Directory</h4>
                  <p class="text-xs text-slate-400">Membership tiers & info</p>
                </div>
              </div>
              <a href="/api/export/members" download class="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors">
                Export CSV
              </a>
            </div>

            <div class="glass-card p-5 rounded-2xl flex items-center justify-between border border-slate-200">
              <div class="flex items-center space-x-3.5">
                <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <i data-lucide="repeat" class="w-5 h-5"></i>
                </div>
                <div>
                  <h4 class="font-bold text-slate-800 text-sm">Circulation History</h4>
                  <p class="text-xs text-slate-400">All loan transactions & fines</p>
                </div>
              </div>
              <a href="/api/export/loans" download class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors">
                Export CSV
              </a>
            </div>
          </div>
        </div>

        <!-- Top Borrowed Books -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="glass-card p-6 rounded-2xl border border-slate-200">
            <h3 class="text-base font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <i data-lucide="trending-up" class="w-5 h-5 text-indigo-600"></i>
              <span>Most Popular Books</span>
            </h3>
            <div class="divide-y divide-slate-100">
              ${(stats.topBooks || []).map((b, idx) => `
                <div class="py-3 flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <span class="w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center">
                      #${idx + 1}
                    </span>
                    <img src="${b.cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}" 
                         alt="cover" class="w-8 h-10 rounded object-cover shadow-sm bg-slate-100"
                         onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'">
                    <div>
                      <h4 class="text-xs font-bold text-slate-800">${b.title}</h4>
                      <p class="text-[11px] text-slate-400">${b.author} • <span class="text-indigo-600 font-medium">${b.category}</span></p>
                    </div>
                  </div>
                  <span class="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                    ${b.borrow_count} loans
                  </span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Category Breakdown & Stats Overview -->
          <div class="glass-card p-6 rounded-2xl border border-slate-200">
            <h3 class="text-base font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <i data-lucide="pie-chart" class="w-5 h-5 text-indigo-600"></i>
              <span>Genre Distribution</span>
            </h3>
            ${Components.renderCategoryBreakdown(stats.categories)}
          </div>
        </div>
      </div>
    `;
  }
};
