class ToDoList {
    constructor() {
        this.initDemoAccount();
        this.initPage();
    }

    // === DEMO ACCOUNT (UNTUK GITHUB) ===
    initDemoAccount() {
        let users = JSON.parse(localStorage.getItem('users') || '{}');

        if (!users['demo']) {
            users['demo'] = btoa('1234');
            localStorage.setItem('users', JSON.stringify(users));
        }
    }

    // === DETEKSI HALAMAN ===
    initPage() {
        if (document.getElementById('loginForm')) {
            this.loginPage();
        } else if (document.getElementById('registerForm')) {
            this.registerPage();
        } else {
            this.checkLogin();
        }
    }

    // === LOGIN ===
    loginPage() {
        document.getElementById('loginForm').onsubmit = (e) => {
            e.preventDefault();

            const user = document.getElementById('loginUsername').value.trim();
            const pass = document.getElementById('loginPassword').value;

            const users = JSON.parse(localStorage.getItem('users') || '{}');

            if (!users[user]) {
                alert('Akun tidak ditemukan! Gunakan demo / daftar dulu.');
                return;
            }

            if (users[user] !== btoa(pass)) {
                alert('Password salah!');
                return;
            }

            localStorage.setItem('currentUser', user);
            window.location.href = 'index.html';
        };
    }

    // === REGISTER ===
    registerPage() {
        document.getElementById('registerForm').onsubmit = (e) => {
            e.preventDefault();

            const user = document.getElementById('registerUsername').value.trim();
            const pass = document.getElementById('registerPassword').value;

            if (!user || pass.length < 4) {
                alert('Username & password minimal 4 karakter!');
                return;
            }

            let users = JSON.parse(localStorage.getItem('users') || '{}');

            if (users[user]) {
                alert('Username sudah terdaftar!');
                return;
            }

            users[user] = btoa(pass);
            localStorage.setItem('users', JSON.stringify(users));

            alert('Berhasil daftar, silakan login.');
            window.location.href = 'login.html';
        };
    }

    // === CEK LOGIN ===
    checkLogin() {
        const user = localStorage.getItem('currentUser');
        const users = JSON.parse(localStorage.getItem('users') || '{}');

        if (!user || !users[user]) {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
            return;
        }

        this.initApp(user);
    }

    // === MAIN APP ===
    initApp(user) {
        this.user = user;
        this.tasks = JSON.parse(localStorage.getItem(`tasks_${user}`) || '[]');
        this.filter = 'all';

        document.getElementById('username').textContent = user;

        document.getElementById('addTaskForm').onsubmit = this.addTask.bind(this);

        document.getElementById('logoutBtn').onclick = () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        };

        document.querySelectorAll('.tab').forEach(tab => {
            tab.onclick = (e) => this.setFilter(e, tab.dataset.filter);
        });

        document.getElementById('closeModal').onclick = this.closeModal.bind(this);
        document.getElementById('editForm').onsubmit = this.saveEdit.bind(this);
        document.getElementById('deleteTaskBtn').onclick = this.deleteCurrentTask.bind(this);

        document.getElementById('editModal').onclick = (e) => {
            if (e.target.id === 'editModal') this.closeModal();
        };

        this.render();
        this.updateStats();
    }

    // === TAMBAH TASK ===
    addTask(e) {
        e.preventDefault();

        const title = document.getElementById('newTask').value.trim();
        if (!title) return;

        const task = {
            id: Date.now(),
            title,
            priority: document.getElementById('isPriority').checked,
            dueDate: document.getElementById('dueDate').value,
            done: false
        };

        this.tasks.unshift(task);
        this.saveTasks();

        e.target.reset();
        this.render();
        this.updateStats();
    }

    // === FILTER ===
    setFilter(e, filter) {
        this.filter = filter;

        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');

        this.render();
    }

    getFiltered() {
        if (this.filter === 'done') return this.tasks.filter(t => t.done);
        if (this.filter === 'priority') return this.tasks.filter(t => !t.done && t.priority);

        if (this.filter === 'today') {
            const today = new Date().toISOString().split('T')[0];
            return this.tasks.filter(t => !t.done && t.dueDate === today);
        }

        return this.tasks.filter(t => !t.done);
    }

    // === RENDER ===
    render() {
        const container = document.getElementById('tasksList');
        const data = this.getFiltered();

        if (!data.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <h2>Tidak ada tugas</h2>
                </div>
            `;
            return;
        }

        container.innerHTML = data.map(task => `
            <div class="task-card ${task.priority ? 'priority' : ''} ${task.done ? 'done' : ''}">
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                </div>
                <div class="task-actions">
                    <button onclick="todo.edit(${task.id})">✏️</button>
                    <button onclick="todo.remove(${task.id})">🗑️</button>
                    <button onclick="todo.toggle(${task.id})">
                        ${task.done ? '↶' : '✅'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    // === AKSI ===
    toggle(id) {
        const task = this.tasks.find(t => t.id == id);
        if (!task) return;

        task.done = !task.done;
        this.saveTasks();
        this.render();
        this.updateStats();
    }

    remove(id) {
        if (!confirm('Hapus tugas?')) return;

        this.tasks = this.tasks.filter(t => t.id != id);
        this.saveTasks();
        this.render();
        this.updateStats();
    }

    edit(id) {
        const task = this.tasks.find(t => t.id == id);
        if (!task) return;

        document.getElementById('editTitle').value = task.title;
        document.getElementById('editPriority').checked = task.priority;
        document.getElementById('editDueDate').value = task.dueDate;

        document.getElementById('editModal').classList.add('active');
        window.editTaskId = id;
    }

    saveEdit(e) {
        e.preventDefault();

        const task = this.tasks.find(t => t.id == window.editTaskId);
        if (!task) return;

        task.title = document.getElementById('editTitle').value.trim();
        task.priority = document.getElementById('editPriority').checked;
        task.dueDate = document.getElementById('editDueDate').value;

        this.saveTasks();
        this.render();
        this.updateStats();
        this.closeModal();
    }

    deleteCurrentTask() {
        if (!window.editTaskId) return;
        this.remove(window.editTaskId);
        this.closeModal();
    }

    closeModal() {
        document.getElementById('editModal').classList.remove('active');
        window.editTaskId = null;
    }

    // === STATS ===
    updateStats() {
        document.getElementById('totalCount').textContent = this.tasks.filter(t => !t.done).length;
        document.getElementById('priorityCount').textContent = this.tasks.filter(t => t.priority && !t.done).length;
        document.getElementById('doneCount').textContent = this.tasks.filter(t => t.done).length;
    }

    saveTasks() {
        localStorage.setItem(`tasks_${this.user}`, JSON.stringify(this.tasks));
    }
}

// INIT
const todo = new ToDoList();