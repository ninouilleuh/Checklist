let draggedItem = null;
// Get DOM elements
const taskInput = document.getElementById('taskInput');
const addTaskButton = document.getElementById('addTask');
const taskList = document.getElementById('taskList');

// Load tasks from local storage
function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    tasks.forEach(task => createTaskElement(task));
}

// Save tasks to local storage
function saveTasks() {
    const tasks = Array.from(taskList.children).map(taskItem => {
        const task = {
            text: taskItem.querySelector('.task-text').textContent,
            completed: taskItem.querySelector('input[type="checkbox"]').checked,
            subtasks: []
        };
        // Collect subtasks
        const subtaskList = taskItem.querySelector('.subtask-list');
        if (subtaskList) {
            task.subtasks = Array.from(subtaskList.children).map(subtaskItem => ({
                text: subtaskItem.querySelector('.task-text').textContent,
                completed: subtaskItem.querySelector('input[type="checkbox"]').checked
            }));
        }
        // Add due date if exists
        const dueDateSpan = taskItem.querySelector('.due-date');
        if (dueDateSpan && dueDateSpan.textContent) {
            const dateText = dueDateSpan.textContent.replace('Due: ', '');
            task.dueDate = new Date(dateText).toISOString();
        }

        return task;
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Create a new task element
function createTaskElement(task) {
    const li = document.createElement('li');
    li.classList.add('task-item');

    // Add drag and drop attributes and events
    li.setAttribute('draggable', 'true');
    li.addEventListener('dragstart', (e) => {
        draggedItem = li;
        e.dataTransfer.effectAllowed = 'move';
        li.classList.add('dragging');
    });
    li.addEventListener('dragend', () => {
        draggedItem = null;
        li.classList.remove('dragging');
        saveTasks();
    });

    li.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });

    li.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedItem !== li) {
            const items = Array.from(taskList.children);
            const draggedIndex = items.indexOf(draggedItem);
            const targetIndex = items.indexOf(li);
            if (draggedIndex < targetIndex) {
                taskList.insertBefore(draggedItem, li.nextSibling);
            } else {
                taskList.insertBefore(draggedItem, li);
            }
        }
    });
    // Task content wrapper
    const taskContent = document.createElement('div');
    taskContent.classList.add('task-content');

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed || false;

    // Task text
    const taskText = document.createElement('span');
    taskText.textContent = task.text;
    taskText.classList.add('task-text');
    /////////////////////////////////////////////////////////////////////
    // Add subtask button
    const addSubtaskBtn = document.createElement('button');
    addSubtaskBtn.textContent = '➕ Subtask';
    addSubtaskBtn.classList.add('add-subtask-btn');
    addSubtaskBtn.addEventListener('click', () => addSubtask(li));
    
    // Subtask list
    const subtaskList = document.createElement('ul');
    subtaskList.classList.add('subtask-list');

    // Render existing subtasks if any
    if (task.subtasks && task.subtasks.length) {
        task.subtasks.forEach(subtask => {
            const subtaskItem = createSubtaskElement(subtask);
            subtaskList.appendChild(subtaskItem);
        });
    }
// Checkbox change event with subtask handling
    checkbox.addEventListener('change', () => {
        updateTaskCompletion(li, checkbox);
        
        // Toggle all subtasks when main task is completed
        const subtasks = subtaskList.querySelectorAll('input[type="checkbox"]');
        subtasks.forEach(subtaskCheckbox => {
            subtaskCheckbox.checked = checkbox.checked;
            subtaskCheckbox.dispatchEvent(new Event('change'));
        });
    });

    // Append elements
    taskContent.appendChild(checkbox);
    taskContent.appendChild(taskText);
    taskContent.appendChild(addSubtaskBtn);

    li.appendChild(taskContent);
    li.appendChild(subtaskList);
/////////////////////////////////////////////////////////////


    // Task actions wrapper
    const taskActions = document.createElement('div');
    taskActions.classList.add('task-actions');

    // Edit button
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.classList.add('btn', 'edit-btn');
    editButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent task toggle
        startEditing(li);
    });

    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('btn', 'delete-btn');
    deleteButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent task toggle
        taskList.removeChild(li);
        saveTasks();
    });

    // Due Date Element
    const dueDateSpan = document.createElement('span');
    dueDateSpan.classList.add('due-date');
    // Add due date if exists
    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        updateDueDateDisplay(dueDateSpan, dueDate);
    }
    // Add due date picker
    const dueDateInput = document.createElement('input');
    dueDateInput.type = 'date';
    dueDateInput.style.display = 'none';
    dueDateInput.addEventListener('change', () => {
        const selectedDate = new Date(dueDateInput.value);
        updateDueDateDisplay(dueDateSpan, selectedDate);
        saveTasks();
    });

    // Add due date button
    const addDueDateBtn = document.createElement('button');
    addDueDateBtn.textContent = '📅';
    addDueDateBtn.classList.add('btn', 'due-date-btn');
    addDueDateBtn.addEventListener('click', () => {
        dueDateInput.showPicker();
    });

    // Append due date elements
    taskActions.appendChild(addDueDateBtn);
    taskActions.appendChild(dueDateInput);
    taskContent.appendChild(dueDateSpan);

    // Toggle complete on entire task item click xxx
    li.addEventListener('click', (e) => {
    // Check if click is directly on the task content, not on buttons or checkbox
        if (e.target.closest('.task-content') && 
        !e.target.closest('.task-actions') && 
        e.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
            updateTaskCompletion(li, checkbox);
        }
    });

    // Checkbox change event
    checkbox.addEventListener('change', () => {
        updateTaskCompletion(li, checkbox);
    });

            // Append elements
            taskContent.appendChild(checkbox);
            taskContent.appendChild(taskText);
            
            taskActions.appendChild(editButton);
            taskActions.appendChild(deleteButton);

            li.appendChild(taskContent);
            li.appendChild(taskActions);

            // Set initial completed state
            if (task.completed) {
                li.classList.add('completed');
                checkbox.checked = true;
            }

            taskList.appendChild(li);
        }

// Create subtask element
function createSubtaskElement(subtask) {
    const subtaskLi = document.createElement('li');
    subtaskLi.classList.add('subtask-item');

    // Subtask checkbox
    const subtaskCheckbox = document.createElement('input');
    subtaskCheckbox.type = 'checkbox';
    subtaskCheckbox.checked = subtask.completed || false;

    // Subtask text
    const subtaskText = document.createElement('span');
    subtaskText.textContent = subtask.text;
    subtaskText.classList.add('task-text');

    // Delete subtask button
    const deleteSubtaskBtn = document.createElement('button');
    deleteSubtaskBtn.textContent = '🗑️';
    deleteSubtaskBtn.classList.add('btn', 'delete-btn');
    deleteSubtaskBtn.addEventListener('click', () => {
        subtaskLi.remove();
        saveTasks();
    });

    // Subtask checkbox change event
    subtaskCheckbox.addEventListener('change', () => {
        subtaskLi.classList.toggle('completed', subtaskCheckbox.checked);
        updateParentTaskCompletion(subtaskLi);
        saveTasks();
    });

    subtaskLi.appendChild(subtaskCheckbox);
    subtaskLi.appendChild(subtaskText);
    subtaskLi.appendChild(deleteSubtaskBtn);

    return subtaskLi;
}

// Add subtask to a task
function addSubtask(taskItem) {
    const subtaskText = prompt('Enter subtask description:');
    if (subtaskText && subtaskText.trim() !== '') {
        const subtaskList = taskItem.querySelector('.subtask-list') || 
            (() => {
                const newSubtaskList = document.createElement('ul');
                newSubtaskList.classList.add('subtask-list');
                taskItem.appendChild(newSubtaskList);
                return newSubtaskList;
            })();
        
        const newSubtask = createSubtaskElement({
            text: subtaskText.trim(),
            completed: false
        });
        subtaskList.appendChild(newSubtask);
        saveTasks();
    }
}

// Update parent task completion based on subtasks
function updateParentTaskCompletion(subtaskItem) {
    const subtaskList = subtaskItem.closest('.subtask-list');
    const parentTaskItem = subtaskList.closest('.task-item');
    
    if (!parentTaskItem) return;

    const parentCheckbox = parentTaskItem.querySelector('input[type="checkbox"]');
    const subtasks = subtaskList.querySelectorAll('input[type="checkbox"]');
    
    // Check if all subtasks are completed
    const allSubtasksCompleted = Array.from(subtasks).every(
        subtask => subtask.checked
    );

    parentCheckbox.checked = allSubtasksCompleted;
    parentCheckbox.dispatchEvent(new Event('change'));
}


function updateDueDateDisplay(dueDateSpan, dueDate) {
    if (!dueDate || isNaN(dueDate.getTime())) {
        dueDateSpan.textContent = '';
        dueDateSpan.classList.remove('overdue', 'due-soon');
        return;
    }

    const today = new Date();
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    dueDateSpan.textContent = `Due: ${dueDate.toLocaleDateString()}`;
    dueDateSpan.classList.remove('overdue', 'due-soon');

    if (daysDiff < 0) {
        dueDateSpan.classList.add('overdue');
        dueDateSpan.textContent += ' (Overdue)';
    } else if (daysDiff <= 3) {
        dueDateSpan.classList.add('due-soon');
    }
}

// Reminder functionality
function checkReminders() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const today = new Date();

    tasks.forEach(task => {
        if (task.dueDate && !task.completed) {
            const dueDate = new Date(task.dueDate);
            const timeDiff = dueDate.getTime() - today.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

            // Check if due date is today or in the next 3 days
            if (daysDiff <= 3 && daysDiff >= 0) {
                // Browser notification
                if (Notification.permission === 'granted') {
                    new Notification(`Task Due Soon: ${task.text}`, {
                        body: `Due in ${daysDiff} day(s)`,
                        icon: 'path/to/icon.png' // Optional: add an icon
                    });
                }
            }
        }
    });
}

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission();
    }
}

// Add to your initialization
document.addEventListener('DOMContentLoaded', () => {
    // Request notification permission
    requestNotificationPermission();

    // Check reminders every hour
    setInterval(checkReminders, 3600000);

    // Initial reminder check
    checkReminders();
});

        // Update task completion status
        function updateTaskCompletion(taskItem, checkbox) {
            taskItem.classList.toggle('completed', checkbox.checked);
            saveTasks();
        }

        // Start editing a task
        function startEditing(taskItem) {
            // Get current task text
            const taskText = taskItem.querySelector('.task-text');
            const currentText = taskText.textContent;

            // Create edit input
            const editInput = document.createElement('input');
            editInput.type = 'text';
            editInput.value = currentText;
            editInput.classList.add('edit-input');

            // Save button
            const saveButton = document.createElement('button');
            saveButton.textContent = 'Save';
            saveButton.classList.add('btn', 'save-btn');
            saveButton.addEventListener('click', () => saveEdit(taskItem, editInput));

            // Cancel button
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancel';
            cancelButton.classList.add('btn', 'cancel-btn');
            cancelButton.addEventListener('click', () => cancelEdit(taskItem, currentText));

            // Hide edit and delete buttons
            const editButton = taskItem.querySelector('.edit-btn');
            const deleteButton = taskItem.querySelector('.delete-btn');
            editButton.style.display = 'none';
            deleteButton.style.display = 'none';

            // Replace task text with input
            taskText.replaceWith(editInput);
            
            // Add save and cancel buttons
            const taskActions = taskItem.querySelector('.task-actions');
            taskActions.appendChild(saveButton);
            taskActions.appendChild(cancelButton);

            // Focus on input
            editInput.focus();

            // Allow saving with Enter key
            editInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveEdit(taskItem, editInput);
                }
            });
        }

        // Save edited task
        function saveEdit(taskItem, editInput) {
            const newText = editInput.value.trim();
            
            if (newText) {
                // Create new task text element
                const taskText = document.createElement('span');
                taskText.textContent = newText;
                taskText.classList.add('task-text');

                // Restore original buttons
                const editButton = taskItem.querySelector('.edit-btn');
                const deleteButton = taskItem.querySelector('.delete-btn');
                editButton.style.display = '';
                deleteButton.style.display = '';

                // Replace input with task text
                editInput.replaceWith(taskText);

                // Remove save and cancel buttons
                const taskActions = taskItem.querySelector('.task-actions');
                taskActions.removeChild(taskActions.lastChild);
                taskActions.removeChild(taskActions.lastChild);

                // Save updated tasks
                saveTasks();
            }
        }

        // Cancel editing
        function cancelEdit(taskItem, originalText) {
            // Create new task text element
            const taskText = document.createElement('span');
            taskText.textContent = originalText;
            taskText.classList.add('task-text');

            // Restore original buttons
            const editButton = taskItem.querySelector('.edit-btn');
            const deleteButton = taskItem.querySelector('.delete-btn');
            editButton.style.display = '';
            deleteButton.style.display = '';

            // Replace input with original task text
            const editInput = taskItem.querySelector('.edit-input');
            editInput.replaceWith(taskText);

            // Remove save and cancel buttons
            const taskActions = taskItem.querySelector('.task-actions');
            taskActions.removeChild(taskActions.lastChild);
            taskActions.removeChild(taskActions.lastChild);
        }

        // Add a new task
        function addTask() {
            const taskText = taskInput.value.trim();
            if (taskText) {
                createTaskElement({ text: taskText, completed: false });
                taskInput.value = '';
                saveTasks();
            }
        }

        // Event listeners
        addTaskButton.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTask();
            }
        });

        // Load existing tasks on page load
        loadTasks();

        // Add these functions to your existing script

// Export to CSV
function exportToCSV() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    
    // Create CSV content
    const csvContent = [
        "Task,Completed", // Header
        ...tasks.map(task => 
            `"${task.text.replace(/"/g, '""')}",${task.completed}`
        )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "checklist_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Export to TXT
function exportToTXT() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    
    // Create TXT content
    const txtContent = tasks.map(task => 
        `${task.completed ? '[x]' : '[ ]'} ${task.text}`
    ).join('\n');

    // Create and download file
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "checklist_export.txt");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Import tasks
function importTasks(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        let importedTasks = [];

        // Detect file type and parse accordingly
        if (file.name.endsWith('.csv')) {
            // Parse CSV
            const rows = content.split('\n').slice(1); // Skip header
            importedTasks = rows
                .filter(row => row.trim() !== '')
                .map(row => {
                    const [text, completed] = row.split(',');
                    return {
                        text: text.replace(/^"|"$/g, ''), // Remove quotes
                        completed: completed.trim() === 'true'
                    };
                });
        } else if (file.name.endsWith('.txt')) {
            // Parse TXT
            importedTasks = content.split('\n')
                .filter(row => row.trim() !== '')
                .map(row => {
                    const completed = row.startsWith('[x]');
                    const text = row.replace(/^$$[ x]$$\s*/, '');
                    return { text, completed };
                });
        }

        // Clear existing tasks and add imported tasks
        taskList.innerHTML = '';
        importedTasks.forEach(task => createTaskElement(task));
        saveTasks();
    };
    reader.readAsText(file);
}

// Add event listeners
document.getElementById('exportCSV').addEventListener('click', exportToCSV);
document.getElementById('exportTXT').addEventListener('click', exportToTXT);
document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
});
document.getElementById('importFile').addEventListener('change', importTasks);