document.addEventListener('DOMContentLoaded', () => {
    class App {
        constructor() {
            this.Store = Store;
            this.initialize();
        }

        initialize() {
            const settingsBtn = document.getElementById('settingsBtn');
            const settingsModal = document.getElementById('settingsModal');
            const closeSettingsBtn = document.getElementById('closeSettings');
            const saveSettingsBtn = document.getElementById('saveSettings');
            const themeSelect = document.getElementById('themeSelect');
            const styleSelect = document.getElementById('styleSelect');
            const accentColorInput = document.getElementById('accentColorInput');
            const fontSizeSlider = document.getElementById('fontSizeSlider');
            const highContrastToggle = document.getElementById('highContrastToggle');

            window.openTab = (evt, tabName) => {
                const tabContents = document.getElementsByClassName('tab-content');
                for (let i = 0; i < tabContents.length; i++) tabContents[i].style.display = 'none';
                const tabLinks = document.getElementsByClassName('tab-link');
                for (let i = 0; i < tabLinks.length; i++) tabLinks[i].className = tabLinks[i].className.replace(' active', '');

                document.getElementById(tabName).style.display = 'block';
                evt.currentTarget.className += ' active';
                if (tabName === 'ai-assistant') document.body.classList.add('ai-fullscreen'); else document.body.classList.remove('ai-fullscreen');
            };

            settingsBtn.addEventListener('click', () => settingsModal.style.display = 'block');
            closeSettingsBtn.addEventListener('click', () => settingsModal.style.display = 'none');
            window.addEventListener('click', (event) => { if (event.target === settingsModal) settingsModal.style.display = 'none'; });

            saveSettingsBtn.addEventListener('click', () => {
                const apiKey = document.getElementById('apiKeyInput').value;
                localStorage.setItem('geminiApiKey', apiKey);
                const theme = themeSelect.value;
                localStorage.setItem('theme', theme);
                document.body.setAttribute('data-theme', theme);
                const style = styleSelect.value;
                localStorage.setItem('style', style);
                document.body.className = style;
                const accentColor = accentColorInput.value;
                localStorage.setItem('accentColor', accentColor);
                this.setAccentColor(accentColor);
                const fontSize = fontSizeSlider.value;
                localStorage.setItem('fontSize', fontSize);
                document.documentElement.style.fontSize = `${fontSize}px`;
                const highContrast = highContrastToggle.checked;
                localStorage.setItem('highContrast', highContrast);
                if (highContrast) document.body.setAttribute('data-theme', 'high-contrast'); else document.body.setAttribute('data-theme', theme);
                settingsModal.style.display = 'none';
                this.updateLiquidGlassUI();
            });

            this.addEmployeeForm = document.getElementById('add-employee-form');
            this.employeeNameInput = document.getElementById('employee-name');
            this.employeeListDiv = document.getElementById('employee-list');
            this.employeeSelect = document.getElementById('employee-select');
            this.logHoursForm = document.getElementById('log-hours-form');
            this.dateInput = document.getElementById('date');
            this.startTimeInput = document.getElementById('start-time');
            this.endTimeInput = document.getElementById('end-time');
            this.calendarContainer = document.getElementById('calendar-container');
            this.dailySummaryDiv = document.getElementById('daily-summary');
            this.currentDate = new Date();

            this.addEmployeeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = this.employeeNameInput.value.trim();
                if (name) {
                    const newEmployee = { id: Date.now().toString(), name: name };
                    Store.addEmployee(newEmployee);
                    this.displayEmployees();
                    this.populateEmployeeSelect();
                    this.employeeNameInput.value = '';
                }
            });

            this.employeeListDiv.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-employee-btn')) {
                    const id = e.target.getAttribute('data-id');
                    Store.removeEmployee(id);
                    this.displayEmployees();
                    this.populateEmployeeSelect();
                }
            });

            this.logHoursForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const employeeId = this.employeeSelect.value;
                const date = this.dateInput.value;
                const startTime = this.startTimeInput.value;
                const endTime = this.endTimeInput.value;
                if (employeeId && date && startTime && endTime) {
                    const employee = Store.getEmployees().find(emp => emp.id === employeeId);
                    const confirmationText = `Log hours for ${employee.name} on ${date} from ${startTime} to ${endTime}?`;
                    this.speakAndConfirm(confirmationText, () => {
                        const newTimeEntry = { id: Date.now().toString(), employeeId, date, startTime, endTime };
                        Store.addTimeEntry(newTimeEntry);
                        this.renderCalendar(this.currentDate);
                        this.logHoursForm.reset();
                    });
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                    e.preventDefault();
                    document.querySelector('.tab-link[onclick*="log-hours"]').click();
                    this.employeeSelect.focus();
                }
            });

            this.dailySummaryDiv.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-entry-btn')) {
                    const id = e.target.getAttribute('data-id');
                    const entry = Store.getTimeEntries().find(entry => entry.id === id);
                    const employee = Store.getEmployees().find(emp => emp.id === entry.employeeId);
                    const confirmationText = `Are you sure you want to delete the time entry for ${employee.name} on ${entry.date} from ${entry.startTime} to ${entry.endTime}?`;
                    this.speakAndConfirm(confirmationText, () => {
                        Store.removeTimeEntry(id);
                        this.renderCalendar(this.currentDate);
                        this.showDailySummary(entry.date);
                    });
                } else if (e.target.classList.contains('edit-entry-btn')) {
                    const id = e.target.getAttribute('data-id');
                    const entry = Store.getTimeEntries().find(entry => entry.id === id);
                    this.openEditModal(entry);
                }
            });

            const editEntryModal = document.getElementById('editEntryModal');
            const closeEditModalBtn = document.getElementById('closeEditModal');
            const editEntryForm = document.getElementById('edit-entry-form');
            const editEntryIdInput = document.getElementById('edit-entry-id');
            const editDateInput = document.getElementById('edit-date');
            const editStartTimeInput = document.getElementById('edit-start-time');
            const editEndTimeInput = document.getElementById('edit-end-time');

            closeEditModalBtn.addEventListener('click', () => { editEntryModal.style.display = 'none'; });
            window.addEventListener('click', (event) => { if (event.target === editEntryModal) editEntryModal.style.display = 'none'; });

            editEntryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const updatedEntry = {
                    id: editEntryIdInput.value,
                    date: editDateInput.value,
                    startTime: editStartTimeInput.value,
                    endTime: editEndTimeInput.value,
                    employeeId: Store.getTimeEntries().find(entry => entry.id === editEntryIdInput.value).employeeId
                };

                const confirmationText = `Save changes to time entry on ${updatedEntry.date} from ${updatedEntry.startTime} to ${updatedEntry.endTime}?`;
                this.speakAndConfirm(confirmationText, () => {
                    Store.updateTimeEntry(updatedEntry);
                    editEntryModal.style.display = 'none';
                    this.renderCalendar(this.currentDate);
                    this.showDailySummary(updatedEntry.date);
                });
            });

            this.loadSettings();
            this.displayEmployees();
            this.populateEmployeeSelect();
            this.renderCalendar(this.currentDate);
        }

        loadSettings() {
            const apiKey = localStorage.getItem('geminiApiKey');
            if (apiKey) document.getElementById('apiKeyInput').value = apiKey;
            const theme = localStorage.getItem('theme') || 'light';
            document.getElementById('themeSelect').value = theme;
            document.body.setAttribute('data-theme', theme);
            const style = localStorage.getItem('style') || 'liquid-glass';
            document.getElementById('styleSelect').value = style;
            document.body.className = style;
            const accentColor = localStorage.getItem('accentColor') || (theme === 'dark' ? '#bb86fc' : '#1976d2');
            document.getElementById('accentColorInput').value = accentColor;
            this.setAccentColor(accentColor);
            const fontSize = localStorage.getItem('fontSize') || '16';
            document.getElementById('fontSizeSlider').value = fontSize;
            document.documentElement.style.fontSize = `${fontSize}px`;
            const highContrast = localStorage.getItem('highContrast') === 'true';
            document.getElementById('highContrastToggle').checked = highContrast;
            if (highContrast) document.body.setAttribute('data-theme', 'high-contrast');
            this.updateLiquidGlassUI();
        }

        updateLiquidGlassUI() {
            const settingsBtn = document.getElementById('settingsBtn');
            const tabs = document.querySelector('.tabs');
            const controls = document.querySelector('.header .controls');
            if (!settingsBtn || !tabs || !controls) return;

            if (document.body.classList.contains('liquid-glass')) {
                if (!tabs.contains(settingsBtn)) {
                    settingsBtn.classList.add('settings-tab-btn');
                    tabs.appendChild(settingsBtn);
                }
            } else {
                if (!controls.contains(settingsBtn)) {
                    settingsBtn.classList.remove('settings-tab-btn');
                    controls.appendChild(settingsBtn);
                }
            }
        }

        setAccentColor(color) {
            const root = document.documentElement;
            root.style.setProperty('--primary', color);
            root.style.setProperty('--primary-variant', this.darkenColor(color, 15));
            const rgb = this.hexToRgb(color);
            if (rgb) root.style.setProperty('--primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
        }

        darkenColor(hex, percent) {
            const p = percent / 100;
            let [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
            r = Math.floor(r * (1 - p));
            g = Math.floor(g * (1 - p));
            b = Math.floor(b * (1 - p));
            return `#${[r,g,b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
        }

        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
        }

        populateEmployeeSelect() {
            const employees = Store.getEmployees();
            this.employeeSelect.innerHTML = '<option value="">Select Employee</option>';
            employees.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.id;
                option.textContent = employee.name;
                this.employeeSelect.appendChild(option);
            });
        }

        displayEmployees() {
            const employees = Store.getEmployees();
            this.employeeListDiv.innerHTML = '<h5>Employees:</h5>';
            if (employees.length === 0) {
                this.employeeListDiv.innerHTML += '<p>No employees added yet.</p>';
                return;
            }
            employees.forEach(employee => {
                const employeeDiv = document.createElement('div');
                employeeDiv.classList.add('employee-item');
                employeeDiv.innerHTML = `<span>${employee.name}</span><button class="remove-employee-btn" data-id="${employee.id}">&times;</button>`;
                this.employeeListDiv.appendChild(employeeDiv);
            });
        }

        renderCalendar(date) {
            this.calendarContainer.innerHTML = '';
            const month = date.getMonth();
            const year = date.getFullYear();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const daysInMonth = lastDay.getDate();
            const timeEntries = Store.getTimeEntries();

            let html = `
                <div class="calendar-header">
                    <button id="prev-month">&lt;</button>
                    <h3>${date.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                    <button id="next-month">&gt;</button>
                </div>
                <table>
                    <thead><tr><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr></thead>
                    <tbody>`;

            let day = 1;
            for (let i = 0; i < 6; i++) {
                let weekTotal = 0;
                html += '<tr>';
                for (let j = 0; j < 7; j++) {
                    if (i === 0 && j < firstDay.getDay() || day > daysInMonth) {
                        html += '<td></td>';
                    } else {
                        const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dailyEntries = timeEntries.filter(entry => entry.date === currentDateStr);
                        let dailyTotal = 0;
                        dailyEntries.forEach(entry => {
                            const start = new Date(`1970-01-01T${entry.startTime}`);
                            const end = new Date(`1970-01-01T${entry.endTime}`);
                            dailyTotal += (end - start) / (1000 * 60 * 60);
                        });
                        weekTotal += dailyTotal;
                        html += `<td class="calendar-day" data-date="${currentDateStr}">${day}<br><small>${dailyTotal > 0 ? dailyTotal.toFixed(1) + 'h' : ''}</small></td>`;
                        day++;
                    }
                }
                html += `<td class="week-total">${weekTotal.toFixed(1)}h</td></tr>`;
            }
            this.calendarContainer.innerHTML = html;

            document.getElementById('prev-month').addEventListener('click', () => { this.currentDate.setMonth(this.currentDate.getMonth() - 1); this.renderCalendar(this.currentDate); });
            document.getElementById('next-month').addEventListener('click', () => { this.currentDate.setMonth(this.currentDate.getMonth() + 1); this.renderCalendar(this.currentDate); });
            document.querySelectorAll('.calendar-day').forEach(dayCell => { dayCell.addEventListener('click', () => this.showDailySummary(dayCell.dataset.date)); });
        }

        showDailySummary(dateStr) {
            const timeEntries = Store.getTimeEntries().filter(entry => entry.date === dateStr);
            this.dailySummaryDiv.innerHTML = `<h4>Summary for ${dateStr}</h4>`;
            if (timeEntries.length === 0) {
                this.dailySummaryDiv.innerHTML += '<p>No hours logged for this day.</p>';
                return;
            }
            timeEntries.forEach(entry => {
                const employee = Store.getEmployees().find(emp => emp.id === entry.employeeId);
                this.dailySummaryDiv.innerHTML += `
                    <div class="daily-entry">
                        <p><strong>${employee.name}:</strong> ${entry.startTime} - ${entry.endTime}</p>
                        <button class="edit-entry-btn" data-id="${entry.id}">Edit</button>
                        <button class="delete-entry-btn" data-id="${entry.id}">Delete</button>
                    </div>`;
            });
        }

        speakAndConfirm(text, callback) {
            const utterance = new SpeechSynthesisUtterance(text);
            speechSynthesis.speak(utterance);
            if (confirm(text)) callback();
        }

        openEditModal(entry) {
            document.getElementById('edit-entry-id').value = entry.id;
            document.getElementById('edit-date').value = entry.date;
            document.getElementById('edit-start-time').value = entry.startTime;
            document.getElementById('edit-end-time').value = entry.endTime;
            document.getElementById('editEntryModal').style.display = 'block';
        }
    }

    class Store {
        static getEmployees() { return JSON.parse(localStorage.getItem('employees') || '[]'); }
        static addEmployee(employee) { const employees = Store.getEmployees(); employees.push(employee); localStorage.setItem('employees', JSON.stringify(employees)); }
        static removeEmployee(id) { let employees = Store.getEmployees(); employees = employees.filter(employee => employee.id !== id); localStorage.setItem('employees', JSON.stringify(employees)); }
        static getTimeEntries() { return JSON.parse(localStorage.getItem('timeEntries') || '[]'); }
        static addTimeEntry(timeEntry) { const timeEntries = Store.getTimeEntries(); timeEntries.push(timeEntry); localStorage.setItem('timeEntries', JSON.stringify(timeEntries)); }
        static updateTimeEntry(updatedTimeEntry) { let timeEntries = Store.getTimeEntries(); timeEntries = timeEntries.map(entry => entry.id === updatedTimeEntry.id ? updatedTimeEntry : entry); localStorage.setItem('timeEntries', JSON.stringify(timeEntries)); }
        static removeTimeEntry(id) { let timeEntries = Store.getTimeEntries(); timeEntries = timeEntries.filter(entry => entry.id !== id); localStorage.setItem('timeEntries', JSON.stringify(timeEntries)); }
    }

    const app = new App();
    const chatbot = new GeminiChatbot(app);
});
