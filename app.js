const dayNames = ['Pzr', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        
        let schedules = {
            1: [
                { id: 1, time: '09:45', label: 'Günlük Toplantı', type: 'meeting', duration: 20 },
                { id: 2, time: '10:15', label: 'Teknik Toplantı', type: 'meeting', duration: 45 },
                { id: 3, time: '11:00', label: 'Sabah Molası', type: 'break', duration: 10 },
                { id: 4, time: '12:30', label: 'Öğle Yemeği', type: 'break', duration: 45 },
                { id: 5, time: '15:00', label: 'Öğleden Sonra Molası', type: 'break', duration: 10 }
            ],
            2: [
                { id: 1, time: '09:45', label: 'Günlük Toplantı', type: 'meeting', duration: 20 },
                { id: 6, time: '10:05', label: 'Sabah Molası', type: 'break', duration: 10 },
                { id: 4, time: '12:30', label: 'Öğle Yemeği', type: 'break', duration: 45 },
                { id: 5, time: '15:00', label: 'Öğleden Sonra Molası', type: 'break', duration: 10 }
            ],
            3: [
                { id: 1, time: '09:45', label: 'Günlük Toplantı', type: 'meeting', duration: 20 },
                { id: 6, time: '10:05', label: 'Sabah Molası', type: 'break', duration: 10 },
                { id: 4, time: '12:30', label: 'Öğle Yemeği', type: 'break', duration: 45 },
                { id: 5, time: '15:00', label: 'Öğleden Sonra Molası', type: 'break', duration: 10 }
            ],
            4: [
                { id: 1, time: '09:45', label: 'Günlük Toplantı', type: 'meeting', duration: 20 },
                { id: 2, time: '10:15', label: 'Teknik Toplantı', type: 'meeting', duration: 45 },
                { id: 3, time: '11:00', label: 'Sabah Molası', type: 'break', duration: 10 },
                { id: 4, time: '12:30', label: 'Öğle Yemeği', type: 'break', duration: 45 },
                { id: 5, time: '15:00', label: 'Öğleden Sonra Molası', type: 'break', duration: 10 }
            ],
            5: [
                { id: 1, time: '09:45', label: 'Günlük Toplantı', type: 'meeting', duration: 20 },
                { id: 6, time: '10:05', label: 'Sabah Molası', type: 'break', duration: 10 },
                { id: 4, time: '12:30', label: 'Öğle Yemeği', type: 'break', duration: 45 },
                { id: 5, time: '15:00', label: 'Öğleden Sonra Molası', type: 'break', duration: 10 }
            ]
        };

        let settings = {
            notificationTime: 1
        };

        let notificationPermission = false;
        let lastNotifiedBreak = null;
        let selectedDay = new Date().getDay();
        let editingEventId = null;
        let nextEventId = 100;
        
        // Pomodoro durumu
        let pomodoroActive = false;
        let pomodoroTimer = null;
        let pomodoroEndTime = null;
        let pomodoroStats = {
            count: 0,
            workTime: 0,
            breakTime: 0,
            lastReset: new Date().toDateString()
        };
        
        // Mola uzatma ve atlama
        let extendedBreakTime = 0;
        let skippedBreaks = new Set();
        let postponedBreaks = {};
        
        // Toplantı notları
        let meetingNotes = {};
        let currentMeetingKey = null;

        function showAlert(message) {
            const alertEl = document.getElementById('alertMessage');
            alertEl.textContent = message;
            alertEl.classList.add('show');
            setTimeout(() => {
                alertEl.classList.remove('show');
            }, 3000);
        }

        function loadSettings() {
            const saved = localStorage.getItem('molaSettings');
            if (saved) {
                settings = JSON.parse(saved);
                document.getElementById('notificationTime').value = settings.notificationTime;
            }
            
            const savedSchedules = localStorage.getItem('molaSchedules');
            if (savedSchedules) {
                schedules = JSON.parse(savedSchedules);
            }

            const savedNextId = localStorage.getItem('molaNextId');
            if (savedNextId) {
                nextEventId = parseInt(savedNextId);
            }
            
            const savedPomodoro = localStorage.getItem('pomodoroStats');
            if (savedPomodoro) {
                pomodoroStats = JSON.parse(savedPomodoro);
                if (pomodoroStats.lastReset !== new Date().toDateString()) {
                    pomodoroStats = {
                        count: 0,
                        workTime: 0,
                        breakTime: 0,
                        lastReset: new Date().toDateString()
                    };
                }
            }
            updatePomodoroStats();
            
            const savedNotes = localStorage.getItem('meetingNotes');
            if (savedNotes) {
                meetingNotes = JSON.parse(savedNotes);
            }
        }

        function saveSettings() {
            settings.notificationTime = parseInt(document.getElementById('notificationTime').value);
            localStorage.setItem('molaSettings', JSON.stringify(settings));
            hideSettings();
        }

        function saveSchedules() {
            localStorage.setItem('molaSchedules', JSON.stringify(schedules));
            localStorage.setItem('molaNextId', nextEventId.toString());
        }
        
        function savePomodoroStats() {
            localStorage.setItem('pomodoroStats', JSON.stringify(pomodoroStats));
        }
        
        function updatePomodoroStats() {
            document.getElementById('pomodoroCount').textContent = pomodoroStats.count;
            document.getElementById('totalWorkTime').textContent = pomodoroStats.workTime + 'dk';
            document.getElementById('totalBreakTime').textContent = pomodoroStats.breakTime + 'dk';
        }
        
        function togglePomodoro() {
            if (pomodoroActive) {
                stopPomodoro();
            } else {
                startPomodoro();
            }
        }
        
        function startPomodoro() {
            pomodoroActive = true;
            pomodoroEndTime = new Date(Date.now() + 25 * 60 * 1000);
            document.getElementById('pomodoroBtn').textContent = '⏹️ Pomodoro Durdur';
            document.getElementById('pomodoroStats').style.display = 'flex';
            showAlert('🍅 Pomodoro başladı! 25 dakika çalışma zamanı');
        }
        
        function stopPomodoro() {
            pomodoroActive = false;
            pomodoroEndTime = null;
            document.getElementById('pomodoroBtn').textContent = '🍅 Pomodoro Başlat';
            showAlert('⏹️ Pomodoro durduruldu');
        }
        
        function extendBreak(minutes) {
            extendedBreakTime += minutes;
            showAlert(`⏱️ Mola ${minutes} dakika uzatıldı`);
        }
        
        function skipBreak() {
            extendedBreakTime = -999;
            showAlert('⏭️ Mola/Toplantı atlandı');
        }
        
        function postponeNextBreak() {
            const next = getNextBreak();
            if (!next || next.isActive) {
                showAlert('⚠️ Şu anda ertelenecek bir mola yok');
                return;
            }
            
            const key = `${next.item.time}-${next.item.label}`;
            postponedBreaks[key] = 5;
            showAlert('⏸️ Bir sonraki mola 5 dakika ertelendi');
        }
        
        function skipNextBreak() {
            const next = getNextBreak();
            if (!next || next.isActive) {
                showAlert('⚠️ Şu anda atlanacak bir mola yok');
                return;
            }
            
            const key = `${next.item.time}-${next.item.label}-${new Date().toDateString()}`;
            skippedBreaks.add(key);
            showAlert('⏭️ Bir sonraki mola atlandı');
        }
        
        function importFromOutlook(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const icsContent = e.target.result;
                parseICS(icsContent);
            };
            reader.readAsText(file);
        }
        
        function parseICS(icsContent) {
            const lines = icsContent.split('\n');
            let inEvent = false;
            let currentEvent = {};
            let importedCount = 0;
            let duplicateCount = 0;
            
            for (let line of lines) {
                line = line.trim();
                
                if (line === 'BEGIN:VEVENT') {
                    inEvent = true;
                    currentEvent = {};
                } else if (line === 'END:VEVENT' && inEvent) {
                    if (currentEvent.summary && currentEvent.dtstart) {
                        const added = addEventFromICS(currentEvent);
                        if (added) {
                            importedCount++;
                        } else {
                            duplicateCount++;
                        }
                    }
                    inEvent = false;
                } else if (inEvent) {
                    if (line.startsWith('SUMMARY:')) {
                        currentEvent.summary = line.substring(8);
                    } else if (line.startsWith('DTSTART')) {
                        const match = line.match(/(\d{8}T\d{6})/);
                        if (match) {
                            currentEvent.dtstart = match[1];
                        }
                    } else if (line.startsWith('DTEND')) {
                        const match = line.match(/(\d{8}T\d{6})/);
                        if (match) {
                            currentEvent.dtend = match[1];
                        }
                    }
                }
            }
            
            saveSchedules();
            renderDaySelector();
            renderSchedule(selectedDay);
            
            let message = `✅ ${importedCount} toplantı içe aktarıldı!`;
            if (duplicateCount > 0) {
                message += ` (${duplicateCount} toplantı zaten mevcut, atlandı)`;
            }
            showAlert(message);
            
            event.target.value = '';
        }
        
        function addEventFromICS(icsEvent) {
            const startDate = parseICSDate(icsEvent.dtstart);
            const endDate = parseICSDate(icsEvent.dtend);
            
            if (!startDate || !endDate) return;
            
            const dayOfWeek = startDate.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) return;
            
            const hours = String(startDate.getHours()).padStart(2, '0');
            const minutes = String(startDate.getMinutes()).padStart(2, '0');
            const time = `${hours}:${minutes}`;
            
            const duration = Math.round((endDate - startDate) / 60000);
            
            const newEvent = {
                id: nextEventId++,
                time: time,
                label: icsEvent.summary.replace(/^(📋|☕)\s*/, ''),
                type: 'meeting',
                duration: duration
            };
            
            if (!schedules[dayOfWeek]) {
                schedules[dayOfWeek] = [];
            }
            
            // Duplicate kontrolü - aynı gün, aynı saat ve aynı isimde etkinlik varsa ekleme
            const exists = schedules[dayOfWeek].some(e => 
                e.time === newEvent.time && 
                e.label === newEvent.label &&
                e.duration === newEvent.duration
            );
            
            if (!exists) {
                schedules[dayOfWeek].push(newEvent);
                schedules[dayOfWeek].sort((a, b) => a.time.localeCompare(b.time));
                return true; // Eklendi
            }
            return false; // Duplicate, eklenmedi
        }
        
        function parseICSDate(icsDateStr) {
            if (!icsDateStr || icsDateStr.length < 15) return null;
            
            const year = parseInt(icsDateStr.substring(0, 4));
            const month = parseInt(icsDateStr.substring(4, 6)) - 1;
            const day = parseInt(icsDateStr.substring(6, 8));
            const hour = parseInt(icsDateStr.substring(9, 11));
            const minute = parseInt(icsDateStr.substring(11, 13));
            
            return new Date(year, month, day, hour, minute);
        }
        
        function autoSaveNotes() {
            if (currentMeetingKey) {
                const notes = document.getElementById('meetingNotes').value;
                meetingNotes[currentMeetingKey] = {
                    content: notes,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem('meetingNotes', JSON.stringify(meetingNotes));
            }
        }
        
        function showMeetingNotes(item) {
            const notesSection = document.getElementById('notesSection');
            const notesTextarea = document.getElementById('meetingNotes');
            
            if (item && item.type === 'meeting') {
                currentMeetingKey = `${item.time}-${item.label}-${new Date().toDateString()}`;
                notesSection.style.display = 'block';
                
                const savedNote = meetingNotes[currentMeetingKey];
                notesTextarea.value = savedNote ? savedNote.content : '';
            } else {
                notesSection.style.display = 'none';
                currentMeetingKey = null;
            }
        }
        

            const icsContent = generateICS();
            const blob = new Blob([icsContent], { type: 'text/calendar' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mola-takvimi.ics';
            a.click();
            URL.revokeObjectURL(url);
            
            calendarConnected = true;
            document.getElementById('calendarBtn').classList.add('connected');
            document.getElementById('calendarBtn').innerHTML = '✅ Takvim Dosyası İndirildi';
            document.getElementById('exportBtn').style.display = 'block';
            
            showAlert('✅ ICS dosyası indirildi! Google Calendar\'da "Ayarlar → İçe Aktar" ile ekleyebilirsin');
        }
        
        function exportToCalendar() {
            connectCalendar();
        }
        
        function generateICS() {
            const now = new Date();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay() + 1);
            
            let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Mola Takip//TR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Mola ve Toplantı Programı
X-WR-TIMEZONE:Europe/Istanbul
X-WR-CALDESC:Otomatik oluşturulan mola ve toplantı takvimi
BEGIN:VTIMEZONE
TZID:Europe/Istanbul
BEGIN:STANDARD
DTSTART:19701025T040000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
TZOFFSETFROM:+0300
TZOFFSETTO:+0200
END:STANDARD
BEGIN:DAYLIGHT
DTSTART:19700329T030000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
TZOFFSETFROM:+0200
TZOFFSETTO:+0300
END:DAYLIGHT
END:VTIMEZONE
`;
            
            for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
                const currentDate = new Date(weekStart);
                currentDate.setDate(weekStart.getDate() + dayOffset);
                const dayNum = currentDate.getDay();
                
                if (dayNum === 0 || dayNum === 6) continue;
                
                const daySchedule = schedules[dayNum] || [];
                
                daySchedule.forEach(item => {
                    const [hours, minutes] = item.time.split(':');
                    const startTime = new Date(currentDate);
                    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    
                    const endTime = new Date(startTime);
                    endTime.setMinutes(endTime.getMinutes() + item.duration);
                    
                    const uid = `${item.id}-${dayNum}-${startTime.getTime()}@molatakip`;
                    const emoji = item.type === 'break' ? '☕' : '📋';
                    
                    ics += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatICSDate(now)}
DTSTART;TZID=Europe/Istanbul:${formatICSDate(startTime)}
DTEND;TZID=Europe/Istanbul:${formatICSDate(endTime)}
SUMMARY:${emoji} ${item.label}
DESCRIPTION:${item.type === 'break' ? 'Mola zamanı' : 'Toplantı'} - ${item.duration} dakika
LOCATION:Mola Takip Uygulaması
STATUS:CONFIRMED
TRANSP:OPAQUE
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:${item.label} başlıyor
TRIGGER:-PT${settings.notificationTime}M
END:VALARM
END:VEVENT
`;
                });
            }
            
            ics += 'END:VCALENDAR';
            return ics;
        }
        
        function formatICSDate(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}${month}${day}T${hours}${minutes}${seconds}`;
        }
        
        function updateTimerControls(isActive, item) {
            const controls = document.getElementById('timerControls');
            
            if (isActive && item) {
                controls.innerHTML = `
                    <button class="timer-btn extend" onclick="extendBreak(5)">➕ 5 Dakika Uzat</button>
                    <button class="timer-btn skip" onclick="skipBreak()">⏭️ ${item.type === 'break' ? 'Molayı' : 'Toplantıyı'} Bitir</button>
                `;
            } else {
                const nextBreak = getNextBreak();
                if (nextBreak && !nextBreak.isActive) {
                    controls.innerHTML = `
                        <button class="timer-btn postpone" onclick="postponeNextBreak()">⏸️ 5 Dakika Ertele</button>
                        <button class="timer-btn skip-next" onclick="skipNextBreak()">⏭️ Bir Sonrakini Atla</button>
                    `;
                } else {
                    controls.innerHTML = '';
                }
            }
        }

        function showSettings() {
            document.getElementById('settingsModal').classList.add('show');
        }

        function hideSettings() {
            document.getElementById('settingsModal').classList.remove('show');
        }

        function showAddModal() {
            editingEventId = null;
            document.getElementById('eventModalTitle').textContent = '➕ Yeni Etkinlik';
            document.getElementById('eventName').value = '';
            document.getElementById('eventTime').value = '';
            document.getElementById('eventDuration').value = '10';
            document.getElementById('eventType').value = 'break';
            document.getElementById('deleteEventBtn').style.display = 'none';
            
            for (let i = 1; i <= 5; i++) {
                document.getElementById(`day${i}`).checked = true;
            }
            
            document.getElementById('eventModal').classList.add('show');
        }

        function showEditModal(eventId) {
            editingEventId = eventId;
            document.getElementById('eventModalTitle').textContent = '✏️ Etkinliği Düzenle';
            
            let eventData = null;
            const activeDays = [];
            
            for (let day = 1; day <= 5; day++) {
                const event = schedules[day]?.find(e => e.id === eventId);
                if (event) {
                    eventData = event;
                    activeDays.push(day);
                }
            }
            
            if (eventData) {
                document.getElementById('eventName').value = eventData.label;
                document.getElementById('eventTime').value = eventData.time;
                document.getElementById('eventDuration').value = eventData.duration;
                document.getElementById('eventType').value = eventData.type;
                
                for (let i = 1; i <= 5; i++) {
                    document.getElementById(`day${i}`).checked = activeDays.includes(i);
                }
                
                document.getElementById('deleteEventBtn').style.display = 'block';
            }
            
            document.getElementById('eventModal').classList.add('show');
        }

        function hideEventModal() {
            document.getElementById('eventModal').classList.remove('show');
            editingEventId = null;
        }

        function saveEvent() {
            const name = document.getElementById('eventName').value.trim();
            const time = document.getElementById('eventTime').value;
            const duration = parseInt(document.getElementById('eventDuration').value);
            const type = document.getElementById('eventType').value;
            
            if (!name || !time) {
                showAlert('⚠️ Lütfen tüm alanları doldurun');
                return;
            }

            const selectedDays = [];
            for (let i = 1; i <= 5; i++) {
                if (document.getElementById(`day${i}`).checked) {
                    selectedDays.push(i);
                }
            }

            if (selectedDays.length === 0) {
                showAlert('⚠️ En az bir gün seçmelisiniz');
                return;
            }

            if (editingEventId !== null) {
                for (let day = 1; day <= 5; day++) {
                    if (!schedules[day]) continue;
                    schedules[day] = schedules[day].filter(e => e.id !== editingEventId);
                }
            }

            const eventId = editingEventId || nextEventId++;
            const newEvent = { id: eventId, time, label: name, type, duration };
            
            for (let day of selectedDays) {
                if (!schedules[day]) schedules[day] = [];
                schedules[day].push({...newEvent});
                schedules[day].sort((a, b) => a.time.localeCompare(b.time));
            }
            
            saveSchedules();
            hideEventModal();
            renderDaySelector();
            renderSchedule(selectedDay);
        }

        function confirmDelete() {
            if (confirm('Bu etkinliği tüm günlerden silmek istediğinize emin misiniz?')) {
                for (let day = 1; day <= 5; day++) {
                    if (!schedules[day]) continue;
                    schedules[day] = schedules[day].filter(e => e.id !== editingEventId);
                }
                saveSchedules();
                hideEventModal();
                renderDaySelector();
                renderSchedule(selectedDay);
                showAlert('✅ Etkinlik silindi');
            }
        }

        function getTodaySchedule(day = new Date().getDay()) {
            return schedules[day] || [];
        }

        function parseTime(timeStr) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            return date;
        }

        function formatTime(date) {
            return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        }

        function updateCurrentTime() {
            const now = new Date();
            document.getElementById('currentTime').textContent = 
                now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }) + 
                ' - ' + formatTime(now);
        }

        function getNextBreak() {
            const now = new Date();
            const schedule = getTodaySchedule();
            const today = new Date().toDateString();
            
            for (let item of schedule) {
                const key = `${item.time}-${item.label}-${today}`;
                
                // Atlanan molayı kontrol et
                if (skippedBreaks.has(key)) {
                    continue;
                }
                
                let breakTime = parseTime(item.time);
                
                // Ertelenen molayı kontrol et
                const postponeKey = `${item.time}-${item.label}`;
                if (postponedBreaks[postponeKey]) {
                    breakTime = new Date(breakTime.getTime() + postponedBreaks[postponeKey] * 60000);
                    if (now >= breakTime) {
                        delete postponedBreaks[postponeKey];
                    }
                }
                
                const endTime = new Date(breakTime.getTime() + item.duration * 60000);
                
                if (now < breakTime) {
                    return { item, breakTime, isActive: false };
                }
                if (now >= breakTime && now < endTime) {
                    return { item, breakTime, isActive: true, endTime };
                }
            }
            return null;
        }

        function updateCountdown() {
            const now = new Date();
            
            // Pomodoro kontrolü
            if (pomodoroActive && pomodoroEndTime) {
                const diff = pomodoroEndTime - now;
                
                if (diff <= 0) {
                    pomodoroStats.count++;
                    pomodoroStats.workTime += 25;
                    savePomodoroStats();
                    updatePomodoroStats();
                    
                    stopPomodoro();
                    showAlert('🎉 Pomodoro tamamlandı! 5 dakika mola zamanı');
                    
                    if (notificationPermission) {
                        showNotification({
                            label: 'Pomodoro tamamlandı',
                            type: 'break',
                            duration: 5
                        });
                    }
                    
                    pomodoroEndTime = new Date(Date.now() + 5 * 60 * 1000);
                    document.getElementById('pomodoroBtn').textContent = '🍅 Pomodoro Başlat';
                    return;
                }
                
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                
                document.getElementById('countdownLabel').textContent = 'Pomodoro bitiyor';
                document.getElementById('countdownTime').textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                document.getElementById('nextBreak').textContent = '25 dakika çalışma süresi';
                document.getElementById('currentStatus').textContent = '🍅 Pomodoro Aktif';
                document.getElementById('currentStatus').className = 'status pomodoro';
                updateTimerControls(false, null);
                return;
            }
            
            const next = getNextBreak();
            
            if (!next) {
                document.getElementById('countdownTime').textContent = 'Gün Bitti';
                document.getElementById('nextBreak').textContent = 'Güzel çalıştın! 🎉';
                document.getElementById('currentStatus').textContent = 'İş Saati Dışı';
                document.getElementById('currentStatus').className = 'status work';
                updateTimerControls(false, null);
                return;
            }

            const { item, breakTime, isActive, endTime } = next;
            
            if (isActive) {
                const adjustedEndTime = new Date(endTime.getTime() + extendedBreakTime * 60000);
                
                if (extendedBreakTime === -999 || now >= adjustedEndTime) {
                    extendedBreakTime = 0;
                }
                
                const diff = adjustedEndTime - now;
                
                if (diff <= 0) {
                    if (item.type === 'break') {
                        pomodoroStats.breakTime += Math.floor((adjustedEndTime - breakTime) / 60000);
                        savePomodoroStats();
                        updatePomodoroStats();
                    }
                    return;
                }
                
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                
                document.getElementById('countdownLabel').textContent = 
                    item.type === 'meeting' ? 'Toplantı bitiyor' : 'Mola bitiyor';
                document.getElementById('countdownTime').textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                document.getElementById('nextBreak').textContent = item.label;
                document.getElementById('currentStatus').textContent = 
                    item.type === 'break' ? '☕ Mola Zamanı' : '📋 Toplantıdasın';
                document.getElementById('currentStatus').className = `status ${item.type}`;
                updateTimerControls(true, item);
                showMeetingNotes(item);
            } else {
                const diff = breakTime - now;
                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                
                document.getElementById('countdownLabel').textContent = 'Bir sonraki';
                document.getElementById('countdownTime').textContent = 
                    hours > 0 
                        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                        : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                document.getElementById('nextBreak').textContent = item.label + ' - ' + item.time;
                document.getElementById('currentStatus').textContent = '💼 Çalışma Zamanı';
                document.getElementById('currentStatus').className = 'status work';
                updateTimerControls(false, null);
                showMeetingNotes(null);
                
                const notifTime = settings.notificationTime * 60000;
                if (notificationPermission && diff <= notifTime && diff > (notifTime - 5000)) {
                    const key = `${item.time}-${item.label}-${new Date().toDateString()}`;
                    if (lastNotifiedBreak !== key) {
                        showNotification(item);
                        lastNotifiedBreak = key;
                    }
                }
            }
        }

        function showNotification(item) {
            if (!notificationPermission) return;
            
            try {
                const msg = settings.notificationTime > 0 
                    ? `${settings.notificationTime} dakika sonra ${item.label} başlıyor`
                    : `${item.label} başlıyor`;
                
                const notification = new Notification('⏰ Mola Zamanı!', {
                    body: msg + ` (${item.duration} dk)`,
                    requireInteraction: false,
                    silent: false,
                    tag: 'mola-notification-' + Date.now(),
                    vibrate: [200, 100, 200]
                });
                
                notification.onclick = function() {
                    window.focus();
                    notification.close();
                };
                
                setTimeout(() => notification.close(), 10000);
                
                console.log('Bildirim gönderildi:', msg);
            } catch (e) {
                console.error('Bildirim gösterilemedi:', e);
            }
        }

        function renderSchedule(day) {
            selectedDay = day;
            const now = new Date();
            const currentDay = now.getDay();
            const schedule = getTodaySchedule(day);
            const scheduleEl = document.getElementById('schedule');
            
            if (schedule.length === 0) {
                scheduleEl.innerHTML = '<p style="text-align: center; color: #9ca3af;">Bu gün için etkinlik yok</p>';
                return;
            }
            
            scheduleEl.innerHTML = schedule.map((item) => {
                const itemTime = parseTime(item.time);
                const endTime = new Date(itemTime.getTime() + item.duration * 60000);
                const isPassed = day === currentDay && now > endTime;
                const isActive = day === currentDay && now >= itemTime && now < endTime;
                
                const icon = item.type === 'break' ? '☕' : '📋';
                
                return `
                    <div class="schedule-item ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}">
                        <span class="icon">${icon}</span>
                        <span class="schedule-time">${item.time}</span>
                        <span class="schedule-label" onclick="showEditModal(${item.id})">${item.label} (${item.duration} dk)</span>
                        <div class="action-btns">
                            <button class="edit-btn" onclick="showEditModal(${item.id})">✏️</button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderDaySelector() {
            const selector = document.getElementById('daySelector');
            const today = new Date().getDay();
            
            selector.innerHTML = [1, 2, 3, 4, 5].map(day => {
                const isToday = day === today;
                const hasSchedule = schedules[day] && schedules[day].length > 0;
                return `
                    <button class="day-btn ${day === selectedDay ? 'active' : ''}" 
                            onclick="renderSchedule(${day})">
                        ${dayNames[day]} ${isToday ? '(Bugün)' : ''} ${hasSchedule ? `(${schedules[day].length})` : ''}
                    </button>
                `;
            }).join('');
        }

        function requestNotificationPermission() {
            if (!('Notification' in window)) {
                showAlert('⚠️ Tarayıcınız bildirimleri desteklemiyor');
                return;
            }
            
            console.log('Mevcut bildirim durumu:', Notification.permission);
            
            if (Notification.permission === 'granted') {
                notificationPermission = true;
                document.getElementById('notificationBtn').textContent = '✅ Bildirimler Açık';
                showAlert('✅ Bildirimler zaten açık!');
                return;
            }
            
            if (Notification.permission === 'denied') {
                showAlert('⚠️ Bildirimler engellenmiş. Tarayıcı ayarlarından manuel olarak "İzin ver" seçmelisiniz.');
                return;
            }
            
            Notification.requestPermission().then(permission => {
                console.log('Yeni izin durumu:', permission);
                if (permission === 'granted') {
                    notificationPermission = true;
                    document.getElementById('notificationBtn').textContent = '✅ Bildirimler Açık';
                    document.getElementById('notificationBtn').disabled = true;
                    
                    try {
                        new Notification('Harika! 🎉', {
                            body: 'Bildirimler başarıyla açıldı!'
                        });
                    } catch (e) {
                        console.log('Test bildirimi gönderilemedi:', e);
                        showAlert('✅ Bildirimler açıldı!');
                    }
                } else if (permission === 'denied') {
                    showAlert('❌ Bildirim izni reddedildi.');
                } else {
                    showAlert('⚠️ Bildirim izni beklemede.');
                }
            }).catch(err => {
                console.error('Bildirim izni hatası:', err);
                showAlert('⚠️ Hata: ' + err.message);
            });
        }

        async function testNotification() {
            console.log('Test bildirimi gönderiliyor...');
            console.log('Notification.permission:', Notification.permission);
            console.log('notificationPermission:', notificationPermission);
            
            try {
                if (Notification.permission !== 'granted') {
                    showAlert('⚠️ Önce bildirimleri açmalısınız');
                    return;
                }
                
                const notification = new Notification('🧪 Test Bildirimi', {
                    body: 'Bildirimler çalışıyor! Bu bir test mesajıdır.',
                    vibrate: [200, 100, 200],
                    tag: 'test-' + Date.now()
                });
                
                notification.onclick = function() {
                    window.focus();
                    notification.close();
                };
                
                showAlert('✅ Test bildirimi gönderildi!');
                console.log('Test bildirimi başarılı');
            } catch (e) {
                console.error('Test bildirimi hatası:', e);
                showAlert('❌ Hata: ' + e.message);
            }
        }

        loadSettings();
        renderDaySelector();
        renderSchedule(selectedDay);
        updateCurrentTime();
        updateCountdown();
        
        setInterval(updateCurrentTime, 1000);
        setInterval(updateCountdown, 1000);
        setInterval(() => {
            const today = new Date().getDay();
            if (selectedDay === today) {
                renderSchedule(today);
            }
        }, 60000);

        if ('Notification' in window) {
            console.log('Tarayıcı bildirimleri destekliyor');
            console.log('İzin durumu:', Notification.permission);
            
            if (Notification.permission === 'granted') {
                notificationPermission = true;
                document.getElementById('notificationBtn').textContent = '✅ Bildirimler Açık';
                document.getElementById('notificationBtn').disabled = true;
                console.log('Bildirimler hazır, izin: granted');
            } else if (Notification.permission === 'denied') {
                document.getElementById('notificationBtn').textContent = '⚠️ İzin Engellendi';
                console.log('Bildirimler engellendi - tarayıcı ayarlarından "İzin ver" seçmelisiniz');
            } else {
                console.log('Bildirim izni henüz verilmedi, butona tıklayın');
            }
        } else {
            console.log('Tarayıcı bildirimleri desteklemiyor');
        }
}
