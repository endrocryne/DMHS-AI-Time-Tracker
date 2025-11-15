class GeminiChatbot {
    constructor(app) {
        this.app = app;
        this.apiKey = localStorage.getItem('geminiApiKey') || '';
        this.isLoading = false;
        this.model = 'gemini-2.5-flash-lite';

        this.initializeElements();
        this.attachEventListeners();
        this.loadChatHistory();
    }

    initializeElements() {
        this.chatContainer = document.getElementById('ai-chat-container');
        this.messagesContainer = document.getElementById('ai-messages');
        this.messageInput = document.getElementById('ai-message-input');
        this.sendBtn = document.getElementById('ai-send-btn');
        this.listenBtn = document.getElementById('ai-listen-btn');
        this.clearBtn = document.getElementById('clearChatBtn');
        this.chatHistory = [];
    }

    attachEventListeners() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.listenBtn.addEventListener('click', () => this.startListening());
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clearChat());
        }
    }

    async sendMessage() {
        if (this.isLoading) return;
        const message = this.messageInput.value.trim();
        if (!message) return;
        this.apiKey = localStorage.getItem('geminiApiKey') || '';
        if (!this.apiKey) {
            this.addMessage('Please set your Gemini API key in settings first.', 'bot');
            return;
        }

        this.isLoading = true;
        this.updateSendButton();
        this.addMessage(message, 'user');
        this.messageInput.value = '';

        try {
            const response = await this.callGeminiAPI(message);
            this.addMessage(response, 'bot');
        } catch (error) {
            console.error('Error:', error);
            this.addMessage(`Sorry, there was an error: ${error.message}`, 'bot');
        } finally {
            this.isLoading = false;
            this.updateSendButton();
        }
    }

    async callGeminiAPI(message) {
        const tools = [
            {
                "functionDeclarations": [
                    {
                        "name": "add_employee",
                        "description": "Adds a new employee to the system.",
                        "parameters": {
                            "type": "OBJECT",
                            "properties": {
                                "name": {
                                    "type": "STRING",
                                    "description": "The name of the employee."
                                }
                            },
                            "required": ["name"]
                        }
                    },
                    {
                        "name": "remove_employee",
                        "description": "Removes an employee from the system.",
                        "parameters": {
                            "type": "OBJECT",
                            "properties": {
                                "name": {
                                    "type": "STRING",
                                    "description": "The name of the employee to remove."
                                }
                            },
                            "required": ["name"]
                        }
                    },
                    {
                        "name": "delete_time_entry",
                        "description": "Deletes a time entry for an employee on a specific date.",
                        "parameters": {
                            "type": "OBJECT",
                            "properties": {
                                "employeeName": {
                                    "type": "STRING",
                                    "description": "The name of the employee."
                                },
                                "date": {
                                    "type": "STRING",
                                    "description": "The date of the time entry to delete in YYYY-MM-DD format."
                                }
                            },
                            "required": ["employeeName", "date"]
                        }
                    },
                    {
                        "name": "log_hours",
                        "description": "Logs work hours for an employee.",
                        "parameters": {
                            "type": "OBJECT",
                            "properties": {
                                "employeeName": {
                                    "type": "STRING",
                                    "description": "The name of the employee."
                                },
                                "date": {
                                    "type": "STRING",
                                    "description": "The date of the work in YYYY-MM-DD format."
                                },
                                "startTime": {
                                    "type": "STRING",
                                    "description": "The start time of the work in HH:MM format."
                                },
                                "endTime": {
                                    "type": "STRING",
                                    "description": "The end time of the work in HH:MM format."
                                }
                            },
                            "required": ["employeeName", "date", "startTime", "endTime"]
                        }
                    }
                ]
            }
        ];

        const MAX_HISTORY_MESSAGES = 20;
        const recent = (this.chatHistory || []).slice(-MAX_HISTORY_MESSAGES);
        const convoText = recent.map(m => (m.sender === 'user' ? `User: ${m.text}` : `Assistant: ${m.text}`)).join('\n');
        const lastInHistory = recent.length ? recent[recent.length - 1] : null;
        let promptBody = '';
        if (convoText) promptBody += convoText + '\n';
        promptBody += `User: ${message}\nAssistant:`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
        const requestBody = { "contents": [{ "parts": [{ "text": promptBody }] }], tools };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const functionCall = data.candidates[0].content.parts[0].functionCall;

        if (functionCall) return this.handleFunctionCall(functionCall);
        return data.candidates[0].content.parts[0].text;
    }

    handleFunctionCall(functionCall) {
        const { name, args } = functionCall;
        if (name === 'add_employee') {
            const newEmployee = { id: Date.now().toString(), name: args.name };
            this.app.Store.addEmployee(newEmployee);
            this.app.displayEmployees();
            this.app.populateEmployeeSelect();
            return `Employee "${args.name}" has been added.`;
        } else if (name === 'remove_employee') {
            const employee = this.app.Store.getEmployees().find(emp => emp.name.toLowerCase() === args.name.toLowerCase());
            if (employee) {
                this.app.Store.removeEmployee(employee.id);
                this.app.displayEmployees();
                this.app.populateEmployeeSelect();
                this.app.renderCalendar(new Date());
                return `Employee "${args.name}" has been removed.`;
            } else {
                return `Employee "${args.name}" not found.`;
            }
        } else if (name === 'delete_time_entry') {
            const employee = this.app.Store.getEmployees().find(emp => emp.name.toLowerCase() === args.employeeName.toLowerCase());
            if (employee) {
                const entriesToDelete = this.app.Store.getTimeEntries().filter(entry => entry.employeeId === employee.id && entry.date === args.date);
                if (entriesToDelete.length > 0) {
                    entriesToDelete.forEach(entry => this.app.Store.removeTimeEntry(entry.id));
                    const [year, month, day] = args.date.split('-').map(Number);
                    const entryDate = new Date(year, month - 1, day);
                    this.app.currentDate = entryDate;
                    this.app.renderCalendar(this.app.currentDate);
                    return `Deleted ${entriesToDelete.length} time entry(s) for ${args.employeeName} on ${args.date}.`;
                } else {
                    return `No time entries found for ${args.employeeName} on ${args.date}.`;
                }
            } else {
                return `Employee "${args.employeeName}" not found.`;
            }
        } else if (name === 'log_hours') {
            const employee = this.app.Store.getEmployees().find(emp => emp.name.toLowerCase() === args.employeeName.toLowerCase());
            if (employee) {
                const newTimeEntry = { id: Date.now().toString(), employeeId: employee.id, date: args.date, startTime: args.startTime, endTime: args.endTime };
                this.app.Store.addTimeEntry(newTimeEntry);
                this.app.renderCalendar(new Date());
                return `Logged hours for ${args.employeeName} on ${args.date} from ${args.startTime} to ${args.endTime}.`;
            } else {
                return `Employee "${args.employeeName}" not found.`;
            }
        }
        return "Unknown function call.";
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.textContent = text;
        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

        try {
            this.chatHistory.push({ sender, text, ts: Date.now() });
            localStorage.setItem('aiMessages', JSON.stringify(this.chatHistory));
        } catch (e) {
            console.warn('Could not save chat history', e);
        }

        if (sender === 'bot') this.speak(text);
    }

    loadChatHistory() {
        try {
            const raw = localStorage.getItem('aiMessages');
            const arr = raw ? JSON.parse(raw) : [];
            this.chatHistory = Array.isArray(arr) ? arr : [];
            this.messagesContainer.innerHTML = '';
            this.chatHistory.forEach(m => {
                const div = document.createElement('div');
                div.className = `message ${m.sender}-message`;
                div.textContent = m.text;
                this.messagesContainer.appendChild(div);
            });
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        } catch (e) {
            console.warn('Failed to load chat history', e);
        }
    }

    clearChat() {
        this.chatHistory = [];
        localStorage.removeItem('aiMessages');
        if (this.messagesContainer) this.messagesContainer.innerHTML = '';
        if (this.messagesContainer) {
            const notice = document.createElement('div');
            notice.className = 'message bot-message';
            notice.textContent = 'Chat cleared.';
            this.messagesContainer.appendChild(notice);
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            setTimeout(() => {
                if (notice.parentNode) notice.parentNode.removeChild(notice);
            }, 1500);
        }
    }

    updateSendButton() {
        this.sendBtn.disabled = this.isLoading;
        this.sendBtn.textContent = this.isLoading ? '...' : 'Send';
    }

    startListening() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.addMessage("Sorry, your browser doesn't support speech recognition.", 'bot');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        this.listenBtn.textContent = '...';
        this.listenBtn.disabled = true;

        recognition.start();

        recognition.onresult = (event) => {
            const speechResult = event.results[0][0].transcript;
            this.messageInput.value = speechResult;
            this.sendMessage();
        };

        recognition.onspeechend = () => {
            recognition.stop();
            this.listenBtn.textContent = 'mic';
            this.listenBtn.disabled = false;
        };

        recognition.onerror = (event) => {
            this.addMessage(`Error during speech recognition: ${event.error}`, 'bot');
            this.listenBtn.textContent = 'mic';
            this.listenBtn.disabled = false;
        };
    }

    speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
    }
}
