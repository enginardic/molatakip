// Checklist
let checklist = [];

function loadChecklist() {
    const saved = localStorage.getItem('checklist');
    if (saved) {
        checklist = JSON.parse(saved);
    }
    renderChecklist();
}

function saveChecklist() {
    localStorage.setItem('checklist', JSON.stringify(checklist));
}

function addTask() {
    const input = document.getElementById('newTaskInput');
    const text = input.value.trim();
    
    if (!text) {
        showAlert('⚠️ Görev boş olamaz');
        return;
    }
    
    checklist.push({
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    });
    
    input.value = '';
    saveChecklist();
    renderChecklist();
}

function toggleTask(id) {
    const task = checklist.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveChecklist();
        renderChecklist();
    }
}

function deleteTask(id) {
    checklist = checklist.filter(t => t.id !== id);
    saveChecklist();
    renderChecklist();
}

function clearCompleted() {
    const completedCount = checklist.filter(t => t.completed).length;
    if (completedCount === 0) {
        showAlert('⚠️ Tamamlanmış görev yok');
        return;
    }
    
    if (confirm(`${completedCount} tamamlanmış görevi silmek istediğinize emin misiniz?`)) {
        checklist = checklist.filter(t => !t.completed);
        saveChecklist();
        renderChecklist();
        showAlert('✅ Tamamlanan görevler temizlendi');
    }
}

function renderChecklist() {
    const container = document.getElementById('checklistItems');
    const total = checklist.length;
    const completed = checklist.filter(t => t.completed).length;
    
    // Progress güncelle
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    document.getElementById('progressFill').style.width = percentage + '%';
    document.getElementById('progressText').textContent = `${completed} / ${total} tamamlandı`;
    
    // Liste render
    if (checklist.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 20px;">Henüz görev yok. Yukarıdan ekle!</p>';
        return;
    }
    
    container.innerHTML = checklist.map(task => `
        <div class="checklist-item ${task.completed ? 'completed' : ''}">
            <input type="checkbox" 
                   class="checklist-checkbox" 
                   ${task.completed ? 'checked' : ''} 
                   onchange="toggleTask(${task.id})">
            <span class="checklist-text">${task.text}</span>
            <button class="checklist-delete" onclick="deleteTask(${task.id})">×</button>
        </div>
    `).join('');
}

// Sayfa yüklendiğinde checklist'i yükle
loadChecklist();
